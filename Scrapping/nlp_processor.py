import spacy
import logging
import os

# Suppress Hugging Face and TensorFlow initialization warnings
os.environ["TRANSFORMERS_VERBOSITY"] = "error"
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "3"

from nltk.tokenize import word_tokenize
from nltk.stem import WordNetLemmatizer
from nltk.corpus import stopwords
from transformers import pipeline
from collections import Counter

logging.info("NLP: Loading models and resources...")
nlp = spacy.load("en_core_web_sm")
lemmatizer = WordNetLemmatizer()
sentiment_pipeline = pipeline(
    "sentiment-analysis", 
    model="cardiffnlp/twitter-roberta-base-sentiment-latest", 
    device=-1
)
logging.info("NLP: Models ready.")

def get_sentiment(text: str) -> str:
    truncated = text[:512]
    result = sentiment_pipeline(truncated)[0]
    return result['label'].capitalize()

def extract_entities(text: str) -> list:
    doc = nlp(text)
    labels = ["PERSON", "ORG", "GPE", "LOC", "PRODUCT", "DATE", "MONEY"]
    return [{"text": ent.text, "label": ent.label_} for ent in doc.ents if ent.label_ in labels]

def extract_keywords(text: str, dynamic_ignored_words: set = None) -> dict:
    """
    Extracts keywords by filtering against NLTK defaults and the dynamically passed database list.
    """
    if dynamic_ignored_words is None:
        dynamic_ignored_words = set()
        
    words = word_tokenize(text.lower())
    
    # Union merges NLTK's list and the dynamic words passed at runtime
    sw = set(stopwords.words('english')).union(dynamic_ignored_words)
    
    clean = [lemmatizer.lemmatize(w) for w in words if w.isalnum() and w not in sw]
    return dict(Counter(clean))