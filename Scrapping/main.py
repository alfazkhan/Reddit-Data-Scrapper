import asyncio
import websockets
import json
from config import SCRAPE_INTERVAL
from database import get_cache_summary
from scraper import run_scraper

# Lock to ensure only one browser process runs at a time
is_scraping = asyncio.Lock()
background_subreddits = ["Mumbai", "India", "Munich", "AskIndianWomen", "LegalAdviceIndia", "BoycottIsrael"]

async def background_worker():
    """Automatically updates the database for specific subreddits every 15 minutes."""
    while True:
        print("Worker: Starting background update cycle...")
        for sub in background_subreddits:
            if is_scraping.locked():
                print(f"Worker: UI task in progress, skipping r/{sub} for now.")
                await asyncio.sleep(60)
                continue
                
            async with is_scraping:
                print(f"Worker: Updating r/{sub}...")
                try:
                    await run_scraper(None, sub, 15)
                except Exception as e:
                    print(f"Worker Error on r/{sub}: {e}")
            await asyncio.sleep(10) # Cooling period
        
        print(f"Worker: Cycle complete. Sleeping for {SCRAPE_INTERVAL} seconds.")
        await asyncio.sleep(SCRAPE_INTERVAL)

async def handler(websocket):
    """Handles real-time commands from the UI via WebSockets."""
    print("Server: New UI client connected.")
    try:
        summary = await get_cache_summary()
        await websocket.send(json.dumps({"type": "cache_summary", "message": summary}))

        async for message in websocket:
            data = json.loads(message)
            if data.get('type') == 'start_scrape':
                sub = data.get('subreddit', 'unknown')
                print(f"Server: UI requested scrape for r/{sub}")
                async with is_scraping:
                    await run_scraper(websocket, sub, data['count'], data.get('useOnlyCache', False))
                print(f"Server: UI request for r/{sub} finished.")
    except websockets.exceptions.ConnectionClosed:
        print("Server: UI client disconnected.")
    except Exception as e:
        print(f"Server Error: {e}")

async def main():
    """Entry point to start the BI data pipeline."""
    print("Starting services...")
    server = websockets.serve(handler, "192.168.0.246", 8765)
    print("WebSocket server listening on ws://192.168.0.246:8765")
    
    # Run server and background worker concurrently
    await asyncio.gather(server, background_worker())

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("Shutdown requested by user.")