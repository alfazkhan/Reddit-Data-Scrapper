# Reddit BI Dashboard & Streaming Scraper

A real-time, full-stack Business Intelligence pipeline that tracks public sentiment, city pulse, and keyword trends across Reddit communities. 

Unlike traditional batch-scraping scripts, this project utilizes a **True Streaming Architecture**. It fetches, analyzes, and streams live Reddit data to a React dashboard in milliseconds, while silently archiving historical data in the background to ensure a continuous dataset.

## 🚀 Key Features

* **True Streaming Pipeline:** Scrapes and pushes data to the UI individually via WebSockets the moment a post is found, eliminating load-time bottlenecks.
* **Transformer-Based Sentiment:** Uses the `RoBERTa` transformer model (via Hugging Face) for context-aware sentiment analysis (Positive, Neutral, Negative) rather than outdated keyword-matching algorithms.
* **Intelligent Gap-Filling:** Automatically detects the time gap between your current session and your last saved cache. It prioritizes the newest posts for the UI, then silently scrolls back to fill the historical gap in the background.
* **Interactive UI:** A decoupled React frontend featuring real-time progress tracking, clickable sentiment distribution cards, and paginated data grids (powered by TanStack Table).
* **Automated NLP:** Performs on-the-fly tokenization, stop-word removal, and lemmatization (via NLTK) to generate accurate keyword frequency maps.

## 🛠️ Architecture

1. **Frontend (React):** Acts as a "dumb" view layer. Requests data, listens to the WebSocket, and dynamically recalculates UI states (Sentiment & Keywords) based on the incoming raw `posts` array.
2. **WebSocket Server (Python):** The orchestrator. Manages the connection and routes Playwright tasks.
3. **Headless Browser (Playwright):** Navigates Reddit dynamically to bypass standard API limitations.
4. **Local Cache Engine:** Persists all scraped data instantly to local JSON files (`cache/{subreddit}.json`), preventing data loss during kernel crashes.

## 💻 Tech Stack

* **Frontend:** React, Vite, TanStack Table, Custom CSS
* **Backend:** Python 3.12+, `websockets`, `asyncio`
* **Scraping:** Playwright (Async API)
* **Machine Learning / NLP:** `transformers` (PyTorch), NLTK (Natural Language Toolkit)

## ⚙️ Installation & Setup

### 1. Backend (Python)
Navigate to your backend directory and set up the virtual environment:
```bash
# Create and activate virtual environment
python -m venv .venv
# Windows:
.\.venv\Scripts\activate
# Mac/Linux:
source .venv/bin/activate

# Install dependencies
pip install websockets playwright transformers torch nltk

# Install Playwright browser binaries
playwright install

Note: The script expects a local Brave browser installation path (or standard Chromium) for scraping.

2. Frontend (React)
Navigate to your frontend directory:

npm install
npm run dev

🏃‍♂️ Usage
Start the Python Backend: Run the WebSocket server script (e.g., your Jupyter Notebook Scrapping_7.ipynb or a compiled .py file). It will listen on ws://localhost:8765.

Open the Dashboard: Navigate to your local React dev server (usually http://localhost:5173).

Query: Enter a Subreddit (e.g., mumbai, munich, BoycottIsrael) and a Post Count limit.

Analyze: Click "Start Scraping." The dashboard will instantly populate with the latest data while the backend secures the historical gap in the background.

🗺️ Future Roadmap
Topic Modeling (LDA): Grouping posts into automated themes (e.g., "Housing", "Traffic", "Politics").

CSV/Excel Export: Adding a one-click export button for downstream analysis in Tableau or Power BI.

Time-Series Analysis: Visualizing sentiment changes throughout the time of day.