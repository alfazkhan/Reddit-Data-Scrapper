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

# Determine execution environment context
IS_PRODUCTION = os.getenv("APP_ENV") == "production"
headless_mode = True if IS_PRODUCTION else False

async def get_post_id(post):
    try:
        return await post.get_attribute("id")
    except Exception:
        return None

async def get_active_subreddits():
    """Queries the database for all subreddits marked for active updates."""
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch("SELECT name FROM subreddits WHERE keep_updated = TRUE")
        return [row['name'] for row in rows]

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
        
        # Production Stealth Context Override to prevent anti-bot blocks
        context = await browser.new_context(
            storage_state=AUTH_FILE if os.path.exists(AUTH_FILE) else None,
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            viewport={"width": 1920, "height": 1080},
            locale="en-US",
            timezone_id="America/New_York"
        )
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
            logging.info(f"Finished exhaustive scan for r/{subreddit}. Discovered {total_discovered} new tasks.")
        finally:
            await browser.close()

async def scan_multiple_feeds(subreddit_list, headless=False):
    """
    Iterates through a list of subreddits and runs the scan for each.
    """
    logging.info(f"Batch scan initiated for: {', '.join(subreddit_list)}")
    for sub in subreddit_list:
        try:
            await scan_entire_feed(sub, headless=headless)
        except Exception as e:
            logging.error(f"Failed to scan r/{sub}: {e}")
        await asyncio.sleep(5)
    logging.info("All requested subreddit scans are complete.")

async def main():
    try:
        logging.info("Fetching active target list from database...")
        subreddits = await get_active_subreddits()
    except Exception as e:
        logging.error(f"Database error while resolving tracking list: {e}")
        return

    if not subreddits:
        logging.warning("No subreddits found with keep_updated = TRUE inside database tables.")
        return

    await scan_multiple_feeds(subreddits, headless=headless_mode)

if __name__ == "__main__":
    asyncio.run(main())