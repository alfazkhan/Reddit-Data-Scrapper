import os
import asyncio
import json
import logging
from playwright.async_api import async_playwright
from config import AUTH_FILE, semaphore
from database import (
    save_post_to_db, get_archived_ids, get_queued_ids, add_to_queue, 
    update_queue_status, get_queue_tasks_by_status, get_db_pool,
    get_oldest_post_id
)
from nlp_processor import get_sentiment, extract_keywords, extract_entities

async def get_post_metadata(post):
    try:
        pid = await post.get_attribute("id")
        time_loc = post.locator("time").first
        ts = await time_loc.get_attribute("datetime") if await time_loc.count() > 0 else ""
        return pid, ts
    except Exception: return None, ""

async def scrape_by_id(context, post_id, subreddit, websocket=None):
    """Deep-scrapes a post with full hydration waits to prevent [null] data."""
    async with semaphore:
        page = await context.new_page()
        clean_id = post_id.replace("t3_", "")
        url = f"https://www.reddit.com/r/{subreddit}/comments/{clean_id}"
        
        try:
            logging.info(f"Scraper: Opening {clean_id}...")
            await page.goto(url, wait_until="load", timeout=45000)
            
            # Wait for content rendering
            await page.wait_for_function(
                "() => document.querySelector('h1') && document.querySelector('h1').innerText.trim().length > 0",
                timeout=20000
            )

            title = await page.locator('h1').first.inner_text()
            if "reddit" in title.lower() and len(title) < 15:
                await update_queue_status(post_id, 'failed')
                return False

            # Ensure timestamp component is rendered
            await page.wait_for_selector("time[datetime]", timeout=10000)

            body_loc = page.locator('shreddit-post-text-body').first
            content = await body_loc.inner_text() if await body_loc.count() > 0 else ""
            time_loc = page.locator('time').first
            ts = await time_loc.get_attribute('datetime') if await time_loc.count() > 0 else ""

            post_entry = {
                "id": post_id, "timestamp": ts, "title": title, "body": content,
                "sentiment": get_sentiment(f"{title} {content}"),
                "keywords": extract_keywords(f"{title} {content}", set()),
                "entities": extract_entities(f"{title} {content}")
            }
            
            await save_post_to_db(post_entry, subreddit)
            await update_queue_status(post_id, 'completed')
            if websocket: await websocket.send(json.dumps({"type": "delta_update", "post": post_entry}))
            logging.info(f"Scraper: Archived ID {post_id}.")
            return True
        except Exception as e:
            logging.error(f"Scraper: Error processing {post_id}: {e}")
            await update_queue_status(post_id, 'failed')
            return False
        finally:
            if not page.is_closed(): await page.close()
            
async def discover_subreddit_posts_v2(subreddit, stop_mode='routine', headless=False):
    """
    New Discovery Logic: Stops immediately if it hits a post already in 
    the archive OR already in the queue.
   
    """
    archived_ids = await get_archived_ids(subreddit)
    queued_ids = await get_queued_ids(subreddit) # IDs in queue (pending, completed, or failed)
    oldest_id = await get_oldest_post_id(subreddit)
    
    # For Stop logic, we consider any ID we already 'know' as a boundary
    all_known_ids = archived_ids | queued_ids 

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(storage_state=AUTH_FILE if os.path.exists(AUTH_FILE) else None)
        page = await context.new_page()
        try:
            await page.goto(f"https://www.reddit.com/r/{subreddit}/new", wait_until="load")
            stop_scrolling = False
            
            while not stop_scrolling:
                posts = await page.locator('shreddit-post').all()
                scroll_new_ids = []
                
                for p_el in posts:
                    pid, _ = await get_post_metadata(p_el)
                    if not pid: continue
                    
                    # NEW STOP LOGIC: Stop if we hit ANYTHING already known (Archived or Queued)
                    if stop_mode == 'routine' and pid in all_known_ids:
                        logging.info(f"Discovery V2: Hit known boundary post {pid}. Stopping scroll.")
                        stop_scrolling = True
                        break
                    
                    # BOOTSTRAP STOP: Still stops at absolute oldest record
                    if stop_mode == 'bootstrap' and pid == oldest_id:
                        logging.info(f"Discovery V2: Reached historical boundary {pid}. Stopping.")
                        stop_scrolling = True
                        break
                        
                    if pid not in all_known_ids:
                        scroll_new_ids.append(pid)
                        all_known_ids.add(pid)
                
                if scroll_new_ids:
                    pool = await get_db_pool()
                    async with pool.acquire() as conn:
                        await add_to_queue(conn, scroll_new_ids, subreddit)

                if stop_scrolling: break
                
                js_scroll_safe = "(document.scrollingElement || document.documentElement || document.body || {scrollHeight: 0})"
                prev_h = await page.evaluate(f"{js_scroll_safe}.scrollHeight")
                await page.evaluate(f"window.scrollTo(0, {js_scroll_safe}.scrollHeight)")
                await asyncio.sleep(4)
                curr_h = await page.evaluate(f"{js_scroll_safe}.scrollHeight")
                if curr_h == prev_h: break
        finally:
            await browser.close()


async def run_queue_worker(subreddit, limit=15, status='pending', websocket=None, headless=False):
    tasks = await get_queue_tasks_by_status(subreddit, status, limit)
    if not tasks: return
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(storage_state=AUTH_FILE if os.path.exists(AUTH_FILE) else None)
        try:
            # Process sequentially for clear logs
            for t in tasks: await scrape_by_id(context, t['post_id'], subreddit, websocket)
        finally: await browser.close()