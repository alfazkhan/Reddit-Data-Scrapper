import asyncio
import logging
import os
import json
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from database import (
    get_active_subreddits, get_archived_ids,
    get_post_content_for_reanalysis, update_post_nlp_data, force_requeue_posts,
    get_all_ignored_words
)
from scraper_v2 import process_queue_batch
from nlp_processor import get_sentiment, extract_keywords, extract_entities

router = APIRouter()

IS_PRODUCTION = os.getenv("APP_ENV") == "production"
headless_mode = True if IS_PRODUCTION else True

async def run_local_reanalysis(subreddit: str, websocket: WebSocket, ignored_words: set):
    posts = await get_post_content_for_reanalysis(subreddit)
    
    total_posts = len(posts)
    if not total_posts:
        await websocket.send_json({"type": "info", "message": f"r/{subreddit} | No posts found."})
        return

    log_interval = max(1, total_posts // 10)
    await websocket.send_json({"type": "start", "subreddit": subreddit, "total": total_posts})

    for count, row in enumerate(posts, 1):
        pid = row['id']
        combined_text = f"{row['title'] or ''} {row['body'] or ''}"
        
        sentiment = get_sentiment(combined_text)
        raw_keywords = extract_keywords(combined_text, ignored_words)
        keywords = list(raw_keywords) if isinstance(raw_keywords, set) else raw_keywords
        entities = extract_entities(combined_text)
        
        await update_post_nlp_data(pid, sentiment, keywords, entities)
        
        if count % log_interval == 0 or count == total_posts:
            percent = round((count / total_posts) * 100, 1)
            await websocket.send_json({
                "type": "progress", 
                "subreddit": subreddit, 
                "processed": count, 
                "total": total_posts, 
                "percent": percent
            })

async def run_network_reanalysis(subreddit: str, websocket: WebSocket):
    archived_ids = await get_archived_ids(subreddit)
    
    if not archived_ids:
        await websocket.send_json({"type": "info", "message": f"r/{subreddit} | No archived posts to scrape."})
        return
        
    await force_requeue_posts(list(archived_ids), subreddit)
    
    batch_size = 15
    total_batches = (len(archived_ids) // batch_size) + 1
    
    await websocket.send_json({
        "type": "info", 
        "message": f"r/{subreddit} | Pushed {len(archived_ids)} posts to network queue. Processing {total_batches} batches..."
    })
    
    for i in range(total_batches):
        await process_queue_batch(subreddit, limit=batch_size, status='pending', headless=headless_mode)
        await websocket.send_json({
            "type": "progress", 
            "subreddit": subreddit, 
            "batch": i + 1, 
            "total_batches": total_batches
        })
        await asyncio.sleep(2)

@router.websocket("/ws/reanalyze")
async def reanalyze_endpoint(websocket: WebSocket):
    await websocket.accept()
    logging.info("Frontend Client Connected to Native FastAPI Reanalysis Socket.")
    
    try:
        while True:
            # FastAPI natively parses the incoming JSON text
            data = await websocket.receive_json()
            
            if data.get("action") == "start":
                open_page = data.get("open_page", False)
                mode = "NETWORK SCRAPE" if open_page else "LOCAL CPU"
                
                await websocket.send_json({"type": "status", "message": f"Trigger received. Mode: {mode}"})

                subreddits = await get_active_subreddits()
                if not subreddits:
                    await websocket.send_json({"type": "error", "message": "No active subreddits found."})
                    continue

                ignored_words = await get_all_ignored_words()

                for sub in subreddits:
                    if open_page:
                        await run_network_reanalysis(sub, websocket)
                    else:
                        await run_local_reanalysis(sub, websocket, ignored_words)

                await websocket.send_json({"type": "complete", "message": "Reanalysis pipeline finished successfully."})
                
    except WebSocketDisconnect:
        logging.info("Frontend Client Disconnected from Reanalysis Socket.")
    except Exception as e:
        logging.error(f"Native WebSocket Error: {e}")