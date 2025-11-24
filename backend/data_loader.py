import pandas as pd
import random
import json
from datetime import datetime, timedelta

# --- Mock Product Data (Based on your JSON schema) ---
def generate_mock_products():
    """
    Creates a dictionary of products indexed by SKU.
    Mimics the complex JSON structure you provided.
    """
    # We create a few "Seeed-like" products to simulate the catalog
    base_products = [
        ("102010469", "Seeed Studio XIAO nRF52840 Sense", "Microcontroller"),
        ("104030087", "Round Display for XIAO", "Display"),
        ("110010004", "Seeed Studio XIAO SAMD21 (3PCS)", "Microcontroller"),
        ("114992825", "Grove - Vision AI Module V2", "AI Sensor"),
        ("101020083", "Grove - Wio-E5 LoRaWAN", "Communication"),
        ("103030276", "SenseCAP M1 LoRaWAN Indoor Gateway", "IoT Device"),
    ]
    
    products_map = {}
    
    for sku, name, category in base_products:
        # Mimicking your provided JSON structure
        product_obj = {
            "document": {
                "id": str(random.randint(4000, 9000)),
                "product_id": str(random.randint(4000, 9000)),
                "sku": sku, # Key field
                "name": name,
                "image_url": "https://media-cdn.seeedstudio.com/media/catalog/product/cache/bb49d3b4e0ec60fa2e4f44a36d699452/w/i/wio-e5_mini_1.jpg", # Placeholder
                "price": {"USD": {"default_formated": f"${random.uniform(5, 50):.2f}"}},
                "category": [category, "Seeed Studio"]
            }
        }
        products_map[sku] = product_obj
        
    return products_map

# --- Mock Transaction Data (Based on your SQL schema) ---
def generate_mock_transactions(products_map, n_rows=1000):
    """
    Generates a DataFrame matching columns: 
    [id, BillNO, BillDate, MaterialNumber, MaterialName, QTY, Email]
    """
    skus = list(products_map.keys())
    data = []
    
    # We need to simulate "Bundles" so SAR finds patterns.
    # Rule: People who buy XIAO (102010469) often buy Round Display (104030087)
    
    users = [f"user{i}@example.com" for i in range(50)]
    start_date = datetime(2024, 1, 1)

    for i in range(n_rows):
        bill_no = 6000000000 + i
        user = random.choice(users)
        date = start_date + timedelta(days=random.randint(0, 300))
        bill_date_str = date.strftime("%Y-%m-%d")
        
        # Pick a main item
        main_sku = random.choice(skus)
        
        # Add Main Item
        data.append({
            "id": i * 10 + 1,
            "BillNO": str(bill_no),
            "BillDate": bill_date_str,
            "MaterialNumber": main_sku,
            "MaterialName": products_map[main_sku]["document"]["name"],
            "QTY": random.randint(1, 5),
            "Email": user
        })
        
        # 70% Chance to add a "Correlated" item (Logic for SAR to learn)
        if main_sku == "102010469" and random.random() < 0.7:  # If buying XIAO
            # Add Round Display with slightly different time to avoid duplicates
            date_with_time = start_date + timedelta(days=random.randint(0, 300), hours=random.randint(0, 23))
            data.append({
                "id": i * 10 + 2,
                "BillNO": str(bill_no), # Same BillNO = Bought Together
                "BillDate": date_with_time.strftime("%Y-%m-%d"),
                "MaterialNumber": "104030087", 
                "MaterialName": "Round Display for XIAO",
                "QTY": 8,
                "Email": user
            })
    
    df = pd.DataFrame(data)
    return df

def get_data():
    """
    Public Interface for main.py
    """
    p_map = generate_mock_products()
    t_df = generate_mock_transactions(p_map)
    return t_df, p_map
