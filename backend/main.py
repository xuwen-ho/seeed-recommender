from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from fastapi.middleware.cors import CORSMiddleware
import logging

# Configure logging to show INFO level messages
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s"
)

# Import our modules
from recommender_engine import SAREngine
from sql_data_loader import get_data_via_ssh

app = FastAPI(title="Seeed Studio RecSys (SAR)")

# CORS for Next.js
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Global State ---
rec_engine = SAREngine()
product_metadata = {} # Map for fast lookups of names/images

class RecRequest(BaseModel):
    skus: List[str]
    top_k: int = 10

@app.on_event("startup")
async def startup_event():
    global product_metadata
    print("--- SYSTEM STARTUP ---")
    
    # 1. Load Data (Mocking SQL/JSON)
    df_transactions = get_data_via_ssh()
    print(f"Loaded {len(df_transactions)} transactions")
    
    # 2. Train Model
    rec_engine.train(df_transactions)
    print("--- SYSTEM READY ---")

@app.get("/health")
def health():
    return {"status": "ok", "trained": rec_engine.is_trained}

@app.post("/recommend")
def get_recommendations(payload: RecRequest):
    """
    Input: List of SKUs in cart.
    Output: Recommended SKUs enriched with metadata (Name, Image, Price).
    """
    if not rec_engine.is_trained:
        raise HTTPException(status_code=503, detail="Model is training, please wait")
    
    # 1. Get Raw Recommendations (SKU + Score)
    raw_recs = rec_engine.get_item_similarity_scores(payload.skus, payload.top_k)
    
    # 2. Enrich with Metadata (Name, Image, etc.)
    enriched_recs = []
    for rec in raw_recs:
        sku = rec['sku']
        enriched_recs.append(sku)
        
    return {
        "input": payload.skus,
        "recommendations": enriched_recs
    }