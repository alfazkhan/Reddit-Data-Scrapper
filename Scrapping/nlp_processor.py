import spacy
import logging
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

def extract_keywords(text: str, ignore_list: set) -> dict:
    words = word_tokenize(text.lower())
    sw = set(stopwords.words('english')).union(ignore_list)
    clean = [lemmatizer.lemmatize(w) for w in words if w.isalnum() and w not in sw]
    return dict(Counter(clean))