import asyncio
import websockets
import json
import logging
import sys
from datetime import datetime
from config import SCRAPE_INTERVAL
from database import (
    get_cache_summary, get_db_pool, load_posts_from_db, 
    get_last_post_timestamp, is_subreddit_bootstrapped
)
from scraper import discover_subreddit_posts_v2, run_queue_worker

logging.basicConfig(
    level=logging.INFO, format='[%(asctime)s] %(levelname)s: %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S', handlers=[logging.StreamHandler(sys.stdout)], force=True
)

is_scraping = asyncio.Lock()
background_subreddits = ["Mumbai", "India", "Munich", "AskIndianWomen", "LegalAdviceIndia", "BoycottIsrael"]

async def background_worker():
    """Smart Worker updated to use the more aggressive Stop-at-Known logic."""
    while True:
        logging.info("Worker: Starting background cycle.")
        for sub in background_subreddits:
            async with is_scraping:
                try:
                    # 1. RETRY FAILED
                    await run_queue_worker(sub, limit=50, status='failed', headless=False)
                    
                    # 2. DISCOVERY
                    is_booted = await is_subreddit_bootstrapped(sub)
                    last_ts = await get_last_post_timestamp(sub)
                    gap = (datetime.now() - last_ts).total_seconds() if last_ts else 3601
                    
                    if not is_booted:
                        logging.info(f"Worker: FIRST RUN for r/{sub}. Bootstrap scan.")
                        # REPLACED CALL: Points to v2 logic
                        await discover_subreddit_posts_v2(sub, stop_mode='bootstrap', headless=False)
                    elif gap > 3600:
                        logging.info(f"Worker: Routine update for r/{sub} (Gap: {int(gap/60)}m).")
                        # REPLACED CALL: Points to v2 logic
                        await discover_subreddit_posts_v2(sub, stop_mode='routine', headless=False)
                    
                    # 3. PENDING
                    await run_queue_worker(sub, limit=15, status='pending', headless=False)
                except Exception as e: 
                    logging.error(f"Worker Error r/{sub}: {e}")
            await asyncio.sleep(10)
        await asyncio.sleep(SCRAPE_INTERVAL)

async def handler(websocket):
    logging.info("Server: UI Connected.")
    try:
        summary = await get_cache_summary()
        await websocket.send(json.dumps({"type": "cache_summary", "message": summary}))
        async for message in websocket:
            data = json.loads(message)
            if data.get('type') == 'start_scrape':
                sub, count, use_cache = data.get('subreddit'), data.get('count', 10), data.get('useOnlyCache', False)
                if use_cache:
                    posts = await load_posts_from_db(sub, count)
                    await websocket.send(json.dumps({"type": "final_data", "posts": sorted(posts.values(), key=lambda x: x['timestamp'] or '', reverse=True)[:count]}))
                    continue
                async with is_scraping:
                    # UI priority also clears failures and runs discovery
                    await run_queue_worker(sub, limit=30, status='failed', headless=False)
                    #await discover_subreddit_posts(sub, stop_mode='routine', headless=False)
                    await discover_subreddit_posts_v2(sub, stop_mode='routine', headless=False)
                    await run_queue_worker(sub, limit=count, websocket=websocket, headless=False)
    except Exception as e: logging.error(f"Server Error: {e}")

async def main():
    server = websockets.serve(handler, "192.168.0.246", 8765)
    await asyncio.gather(server, background_worker())

if __name__ == "__main__":
    asyncio.run(main())