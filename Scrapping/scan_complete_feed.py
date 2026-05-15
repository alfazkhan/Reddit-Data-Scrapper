import asyncio
import logging
import sys
import os
from playwright.async_api import async_playwright
from config import AUTH_FILE
from database import get_db_pool, get_archived_ids, get_queued_ids, add_to_queue

# Configure standalone logging
logging.basicConfig(
    level=logging.INFO,
    format='[%(asctime)s] DEEP_SCAN: %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S',
    handlers=[logging.StreamHandler(sys.stdout)]
)

async def get_post_id(post):
    try:
        return await post.get_attribute("id")
    except Exception:
        return None

async def scan_entire_feed(subreddit, headless=False):
    """
    Exhaustive discovery scan for a single subreddit. 
    """
    logging.info(f"Starting exhaustive feed scan for r/{subreddit}...")
    archived_ids = await get_archived_ids(subreddit)
    queued_ids = await get_queued_ids(subreddit)
    all_known_ids = archived_ids | queued_ids

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=headless)
        context = await browser.new_context(storage_state=AUTH_FILE if os.path.exists(AUTH_FILE) else None)
        page = await context.new_page()
        try:
            await page.goto(f"https://www.reddit.com/r/{subreddit}/new", wait_until="load")
            total_discovered = 0
            while True:
                posts = await page.locator('shreddit-post').all()
                scroll_new_ids = []
                for p_el in posts:
                    pid = await get_post_id(p_el)
                    if pid and pid not in all_known_ids:
                        scroll_new_ids.append(pid)
                        all_known_ids.add(pid)
                if scroll_new_ids:
                    total_discovered += len(scroll_new_ids)
                    pool = await get_db_pool()
                    async with pool.acquire() as conn:
                        await add_to_queue(conn, scroll_new_ids, subreddit)
                
                js_scroll_safe = "(document.scrollingElement || document.documentElement || document.body || {scrollHeight: 0})"
                prev_h = await page.evaluate(f"{js_scroll_safe}.scrollHeight")
                await page.evaluate(f"window.scrollTo(0, {js_scroll_safe}.scrollHeight)")
                await asyncio.sleep(4)
                if (await page.evaluate(f"{js_scroll_safe}.scrollHeight")) == prev_h:
                    break
        finally:
            await browser.close()

async def scan_multiple_feeds(subreddit_list, headless=False):
    """
    Iterates through a list of subreddits and runs the scan for each.
   
    """
    logging.info(f"Batch scan initiated for: {', '.join(subreddit_list)}")
    for sub in subreddit_list:
        try:
            # We call the existing function for each sub to ensure logic consistency
            await scan_entire_feed(sub, headless=headless)
        except Exception as e:
            logging.error(f"Failed to scan r/{sub}: {e}")
        # Short cooldown between subreddits to be polite to the CPU
        await asyncio.sleep(5)
    logging.info("All requested subreddit scans are complete.")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        asyncio.run(scan_multiple_feeds(sys.argv[1:], headless=False))
    else:
        print("Usage: python scan_complete_feed.py sub1 sub2 sub3 ...")