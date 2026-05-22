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

# Sentiment Analysis Engine
sentiment_pipeline = pipeline(
    "sentiment-analysis", 
    model="cardiffnlp/twitter-roberta-base-sentiment-latest", 
    device=-1
)

# Zero-Shot Topic Classification Engine
classifier_pipeline = pipeline(
    "zero-shot-classification", 
    model="facebook/bart-large-mnli", 
    device=-1
)

# Standard Behavioral Classification Labels
CANDIDATE_LABELS = [
    "Seeking Advice", 
    "Ranting", 
    "Sharing News", 
    "Technical Discussion", 
    "Community Discussion",
    "Political Discussion",
    "Legal Discussion",
    "Spam & Self-Promotion",
]

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
    if dynamic_ignored_words is None:
        dynamic_ignored_words = set()
    words = word_tokenize(text.lower())
    sw = set(stopwords.words('english')).union(dynamic_ignored_words)
    clean = [lemmatizer.lemmatize(w) for w in words if w.isalnum() and w not in sw]
    return dict(Counter(clean))

def classify_topics(text: str) -> dict:
    """
    Runs text through BART-large-MNLI to map content into abstract behavioral buckets.
    Returns a structured dictionary matching the required frontend analytical state.
    """
    truncated = text[:1024]  # BART accepts up to 1024 tokens safely
    if not truncated.strip():
        return {"labels": [], "scores": [], "primary_topic": "Community Discussion"}
        
    result = classifier_pipeline(truncated, candidate_labels=CANDIDATE_LABELS)
    
    return {
        "labels": result["labels"],
        "scores": [round(score, 3) for score in result["scores"]],
        "primary_topic": result["labels"][0] # Highest confidence classification choice
    }