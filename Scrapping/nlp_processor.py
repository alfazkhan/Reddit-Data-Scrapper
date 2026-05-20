import spacy
import logging
from nltk.tokenize import word_tokenize
from nltk.stem import WordNetLemmatizer
from nltk.corpus import stopwords
from transformers import pipeline
from collections import Counter

# Import your database pool manager to fetch the stop words
from database import get_db_pool

logging.info("NLP: Loading models and resources...")
nlp = spacy.load("en_core_web_sm")
lemmatizer = WordNetLemmatizer()
sentiment_pipeline = pipeline(
    "sentiment-analysis", 
    model="cardiffnlp/twitter-roberta-base-sentiment-latest", 
    device=-1
)

# Global in-memory cache for high-speed lookups
_ignored_words_cache = set()

logging.info("NLP: Models ready.")

async def refresh_ignored_words_cache():
    """
    Hits the PostgreSQL database to rebuild the local memory cache.
    Call this on server startup and whenever a CRUD operation modifies the ignored_words table.
    """
    global _ignored_words_cache
    try:
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            rows = await conn.fetch("SELECT word FROM ignored_words")
            _ignored_words_cache = {row['word'] for row in rows}
        logging.info(f"NLP: Ignored words cache synchronized. Tracking {len(_ignored_words_cache)} words.")
    except Exception as e:
        logging.error(f"NLP: Failed to sync ignored words cache from database: {e}")

def get_sentiment(text: str) -> str:
    truncated = text[:512]
    result = sentiment_pipeline(truncated)[0]
    return result['label'].capitalize()

def extract_entities(text: str) -> list:
    doc = nlp(text)
    labels = ["PERSON", "ORG", "GPE", "LOC", "PRODUCT", "DATE", "MONEY"]
    return [{"text": ent.text, "label": ent.label_} for ent in doc.ents if ent.label_ in labels]

def extract_keywords(text: str, additional_ignore: set = None) -> dict:
    """
    Extracts keywords by filtering against NLTK defaults and the live global database cache.
    """
    if additional_ignore is None:
        additional_ignore = set()
        
    words = word_tokenize(text.lower())
    
    # Union merges NLTK's list, any local ad-hoc words, and your dynamic database cache
    sw = set(stopwords.words('english')).union(additional_ignore).union(_ignored_words_cache)
    
    clean = [lemmatizer.lemmatize(w) for w in words if w.isalnum() and w not in sw]
    return dict(Counter(clean))