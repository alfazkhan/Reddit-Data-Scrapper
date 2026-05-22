import asyncio
import logging
import os
import json
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from scraper_v2 import process_queue_batch
from nlp_processor import get_sentiment, extract_keywords, extract_entities, classify_topics

# Domain-specific explicit database module assignments
from database.subreddits import db_get_all_subreddits
from database.posts import (
    get_archived_ids, get_post_content_for_reanalysis, 
    get_post_keywords_for_cleaning, update_post_nlp_data, update_post_keywords_only
)
from database.queue_manager import force_requeue_posts
from database.ignored_words import get_all_ignored_words

router = APIRouter()

IS_PRODUCTION = os.getenv("APP_ENV") == "production"
headless_mode = True if IS_PRODUCTION else True

class ReanalysisSession:
    """Manages the lifecycle state of an active reanalysis process over WebSockets."""
    def __init__(self):
        self.active_task = None
        self.stop_event = asyncio.Event()
        self.pause_event = asyncio.Event()
        self.pause_event.set()

async def run_dictionary_purge_fastlane(subreddit: str, websocket: WebSocket, ignored_words: set, session: ReanalysisSession):
    """
    FAST LANE: Instantly drops matching dictionary keys directly out of 
    stored JSON datasets in memory without invoking heavy ML/NLP text tokenizers.
    """
    msg_init = f"r/{subreddit} | Resolving cached records for dictionary fast-lane purge..."
    logging.info(msg_init)
    await websocket.send_json({"type": "status", "subreddit": subreddit, "message": msg_init})

    posts = await get_post_keywords_for_cleaning(subreddit)
    total_posts = len(posts)
    if not total_posts:
        msg_empty = f"r/{subreddit} | No cached records discovered to purge."
        logging.info(msg_empty)
        await websocket.send_json({"type": "info", "subreddit": subreddit, "message": msg_empty})
        return

    msg_start = f"r/{subreddit} | Starting dictionary fast-lane purge for {total_posts} entries..."
    logging.info(msg_start)
    await websocket.send_json({
        "type": "start", 
        "subreddit": subreddit, 
        "total": total_posts, 
        "message": msg_start
    })

    for count, row in enumerate(posts, 1):
        if session.stop_event.is_set():
            break
        await session.pause_event.wait()

        pid = row['id']
        try:
            current_keywords = json.loads(row['keywords']) if isinstance(row['keywords'], str) else row['keywords'] or {}
        except Exception:
            current_keywords = {}

        cleaned_keywords = {k: v for k, v in current_keywords.items() if k not in ignored_words}
        await update_post_keywords_only(pid, cleaned_keywords)

        #### REAL-TIME PROGRESS TRACKING ####
        # This executes on every iteration (every single post)
        percent = round((count / total_posts) * 100, 1)
        msg_prog = f"r/{subreddit} | Fast-Lane Purge Progress: {count}/{total_posts} ({percent}%)"
        
        logging.info(msg_prog)
        await websocket.send_json({
            "type": "progress", 
            "subreddit": subreddit, 
            "processed": count, 
            "total": total_posts, 
            "percent": percent,
            "message": msg_prog
        })

        if count % 250 == 0:
            await asyncio.sleep(0)

async def run_full_text_reanalysis(subreddit: str, websocket: WebSocket, ignored_words: set, session: ReanalysisSession):
    """
    FULL SUITE: Re-tokenizes natural language fields across your complete analytical 
    pipeline layers including Sentiment, Entities, and Zero-Shot Topic Classification.
    """
    msg_init = f"r/{subreddit} | Loading historical records from disk for full reprocessing..."
    logging.info(msg_init)
    await websocket.send_json({"type": "status", "subreddit": subreddit, "message": msg_init})

    posts = await get_post_content_for_reanalysis(subreddit)
    total_posts = len(posts)
    if not total_posts:
        msg_empty = f"r/{subreddit} | No textual data records found for re-indexing."
        logging.info(msg_empty)
        await websocket.send_json({"type": "info", "subreddit": subreddit, "message": msg_empty})
        return

    msg_start = f"r/{subreddit} | Starting full text NLP & Topic Classification pipeline for {total_posts} entries..."
    logging.info(msg_start)
    await websocket.send_json({
        "type": "start", 
        "subreddit": subreddit, 
        "total": total_posts, 
        "message": msg_start
    })

    for count, row in enumerate(posts, 1):
        if session.stop_event.is_set():
            break
        await session.pause_event.wait()

        pid = row['id']
        combined_text = f"{row['title'] or ''} {row['body'] or ''}"
        
        sentiment = get_sentiment(combined_text)
        raw_keywords = extract_keywords(combined_text, ignored_words)
        keywords = list(raw_keywords) if isinstance(raw_keywords, set) else raw_keywords
        entities = extract_entities(combined_text)
        topics = classify_topics(combined_text)
        
        await update_post_nlp_data(pid, sentiment, keywords, entities, topics)
        
        #### REAL-TIME PROGRESS TRACKING ####
        # This executes on every iteration (every single post)
        percent = round((count / total_posts) * 100, 1)
        msg_prog = f"r/{subreddit} | Full Reprocessing Progress: {count}/{total_posts} ({percent}%)"
        
        logging.info(msg_prog)
        await websocket.send_json({
            "type": "progress", 
            "subreddit": subreddit, 
            "processed": count, 
            "total": total_posts, 
            "percent": percent,
            "message": msg_prog
        })
        
        # Give control back to the loop on every single item to maintain WebSocket responsiveness
        await asyncio.sleep(0.01)

async def run_network_reanalysis(subreddit: str, websocket: WebSocket, session: ReanalysisSession):
    """NETWORK ROUTE: Forces recorded records back to pending status for dynamic browser scraping updates."""
    msg_init = f"r/{subreddit} | Resolving archived post indexes for browser queue mapping..."
    logging.info(msg_init)
    await websocket.send_json({"type": "status", "subreddit": subreddit, "message": msg_init})

    archived_ids = await get_archived_ids(subreddit)
    if not archived_ids:
        msg_empty = f"r/{subreddit} | No historical entries matched for network scraper jobs."
        logging.info(msg_empty)
        await websocket.send_json({"type": "info", "subreddit": subreddit, "message": msg_empty})
        return
        
    msg_requeue = f"r/{subreddit} | Resetting queue state flags for {len(archived_ids)} historical entries..."
    logging.info(msg_requeue)
    await websocket.send_json({"type": "status", "subreddit": subreddit, "message": msg_requeue})
    await force_requeue_posts(list(archived_ids), subreddit)
    
    batch_size = 15
    total_batches = (len(archived_ids) // batch_size) + 1
    
    msg_start = f"r/{subreddit} | Commencing browser network sync operations over {total_batches} worker batches..."
    logging.info(msg_start)
    await websocket.send_json({
        "type": "start",
        "subreddit": subreddit,
        "total": total_batches,
        "message": msg_start
    })
    
    for i in range(total_batches):
        if session.stop_event.is_set():
            break
        await session.pause_event.wait()

        current_batch = i + 1
        msg_batch = f"r/{subreddit} | Launching automated stealth browser instance for batch {current_batch}/{total_batches}..."
        logging.info(msg_batch)
        await websocket.send_json({"type": "status", "subreddit": subreddit, "message": msg_batch})

        await process_queue_batch(subreddit, limit=batch_size, status='pending', headless=headless_mode)
        
        percent = round((current_batch / total_batches) * 100, 1)
        msg_prog = f"r/{subreddit} | Browser Sync Progress: Batch {current_batch}/{total_batches} parsed successfully ({percent}%)"
        
        logging.info(msg_prog)
        await websocket.send_json({
            "type": "progress", 
            "subreddit": subreddit, 
            "processed": current_batch, 
            "total": total_batches, 
            "percent": percent,
            "message": msg_prog
        })
        await asyncio.sleep(2)

async def pipeline_worker(websocket: WebSocket, open_page: bool, keywords_only: bool, session: ReanalysisSession):
    """Asynchronous orchestrator decoupling heavy operations from main WebSocket frame reception listeners."""
    try:
        logging.info("Pipeline Worker Thread: Initializing processing tasks...")
        
        all_subs = await db_get_all_subreddits()
        subreddits = [sub['name'] for sub in all_subs if sub.get('is_active') is True]
        
        if not subreddits:
            msg_err = "Pipeline Worker Thread Blocked: No active subreddits found inside tracking tables."
            logging.error(msg_err)
            await websocket.send_json({"type": "error", "message": msg_err})
            return

        logging.info(f"Pipeline Worker Thread: Compiling task queue for targets: {', '.join(subreddits)}")
        ignored_words = await get_all_ignored_words()

        for sub in subreddits:
            if session.stop_event.is_set():
                msg_stop = f"Pipeline Worker Thread: Received termination flag. Aborting r/{sub} iterations."
                logging.warning(msg_stop)
                await websocket.send_json({"type": "warning", "message": msg_stop})
                break
            
            if open_page:
                await run_network_reanalysis(sub, websocket, session)
            elif keywords_only:
                await run_dictionary_purge_fastlane(sub, websocket, ignored_words, session)
            else:
                await run_full_text_reanalysis(sub, websocket, ignored_words, session)

        if not session.stop_event.is_set():
            msg_fin = "Pipeline Worker Thread: All subreddits processed. Execution sequence completed successfully."
            logging.info(msg_fin)
            await websocket.send_json({"type": "complete", "message": msg_fin})
            
    except Exception as e:
        msg_fail = f"Pipeline Worker Thread Crashed: Structural failure down operations path: {str(e)}"
        logging.error(msg_fail)
        await websocket.send_json({"type": "error", "message": msg_fail})

@router.websocket("/ws/reanalyze")
async def reanalyze_endpoint(websocket: WebSocket):
    await websocket.accept()
    logging.info("WebSocket Link: Frontend client connected successfully to reanalysis node channel.")
    session = ReanalysisSession()
    
    try:
        while True:
            data = await websocket.receive_json()
            action = data.get("action")
            
            if action == "start":
                if session.active_task and not session.active_task.done():
                    msg_busy = "WebSocket Channel Conflict: Start request dropped. An active background worker job is currently executing."
                    logging.warning(msg_busy)
                    await websocket.send_json({"type": "error", "message": msg_busy})
                    continue
                    
                open_page = data.get("open_page", False)
                keywords_only = data.get("keywords_only", False)
                
                mode = "NETWORK SCRAPE" if open_page else ("LOCAL PURGE (Fast-Lane)" if keywords_only else "LOCAL RE-INDEX (Full NLP)")
                msg_trigger = f"WebSocket Action Triggered: Initiating intelligence data reanalysis job. Mode context string: [{mode}]"
                
                logging.info(msg_trigger)
                await websocket.send_json({"type": "status", "message": msg_trigger})
                
                session.stop_event.clear()
                session.pause_event.set()
                session.active_task = asyncio.create_task(pipeline_worker(websocket, open_page, keywords_only, session))
                
            elif action == "pause":
                session.pause_event.clear()
                msg_pause = "WebSocket Action Triggered: Job thread suspension requested. Intercepting worker loop execution loops..."
                logging.info(msg_pause)
                await websocket.send_json({"type": "status", "message": msg_pause})
                
            elif action == "resume":
                session.pause_event.set()
                msg_resume = "WebSocket Action Triggered: Job thread execution resumption requested. Re-engaging operational pipelines..."
                logging.info(msg_resume)
                await websocket.send_json({"type": "status", "message": msg_resume})
                
            elif action == "stop":
                session.stop_event.set()
                session.pause_event.set() 
                msg_stop = "WebSocket Action Triggered: Force shutdown signal received. Safely evicting worker from background threads..."
                logging.info(msg_stop)
                await websocket.send_json({"type": "status", "message": msg_stop})
                
    except WebSocketDisconnect:
        logging.warning("WebSocket Link: Frontend client dropped socket connection frame unexpectedly. Terminating orphaned loops.")
        session.stop_event.set()
        session.pause_event.set()
    except Exception as e:
        logging.error(f"WebSocket Channel Exception: Runtime connection pipeline snapped: {e}")