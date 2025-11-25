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
from data_loader import get_data
from recommender_engine import SAREngine

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
    top_k: int = 5

@app.on_event("startup")
async def startup_event():
    global product_metadata
    print("--- SYSTEM STARTUP ---")
    
    # 1. Load Data (Mocking SQL/JSON)
    df_transactions, products_map = get_data()
    product_metadata = products_map
    print(f"Loaded {len(df_transactions)} transactions and {len(products_map)} products.")
    
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
        # Lookup details in our product map
        details = product_metadata.get(sku, {})
        doc = details.get("document", {})
        
        enriched_recs.append({
            "sku": sku,
            "score": rec['score'],
            "name": doc.get("name", "Unknown Product"),
            "image": doc.get("image_url", ""),
            "price": doc.get("price", {}).get("USD", {}).get("default_formated", "N/A")
        })
        
    return {
        "input": payload.skus,
        "recommendations": enriched_recs
    }