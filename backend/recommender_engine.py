import pandas as pd
import numpy as np
import logging

# Microsoft Recommenders Library
from recommenders.models.sar.sar_singlenode import SARSingleNode

class SAREngine:
    def __init__(self):
        self.model = None
        self.is_trained = False
        
    def train(self, df: pd.DataFrame):
        """
        Trains the SAR model using the provided DataFrame.
        Maps your SQL columns to SAR expected columns.
        """
        logging.info("Starting SAR Training...")
        
        # 1. Define Column Mapping
        # user_col: Who bought it? -> Email
        # item_col: What did they buy? -> MaterialNumber
        # rating_col: How much interest? -> QTY (Implicit rating)
        # time_col: When? -> BillDate
        
        # Ensure date is datetime type
        df['BillDate'] = pd.to_datetime(df['BillDate'])
        
        # Remove duplicates by aggregating: sum quantities for same (user, item, date)
        df = df.groupby(['Email', 'MaterialNumber', 'BillDate'], as_index=False).agg({'QTY': 'sum'})
        logging.info(f"After deduplication: {len(df)} unique transactions")
        
        # Convert datetime to Unix timestamp (numeric) for SAR's time decay calculation
        df['BillDate'] = df['BillDate'].astype('int64') // 10**9
        
        self.model = SARSingleNode(
            col_user="Email",
            col_item="MaterialNumber",
            col_rating="QTY",
            col_timestamp="BillDate",
            similarity_type="jaccard", 
            time_decay_coefficient=30, 
            timedecay_formula=True,
            normalize=True
        )
        
        # 2. Fit the model (Calculate Co-occurrence Matrix)
        self.model.fit(df)
        self.is_trained = True
        logging.info(f"SAR Training Complete. Matrix Shape: {self.model.item_similarity.shape}")

    def get_item_similarity_scores(self, target_skus: list, top_k=5):
        """
        Returns the most similar items to the input SKUs based on the trained matrix.
        """
        if not self.is_trained:
            return []

        # Use SAR's built-in recommend_k_items method instead of direct matrix access
        # This handles the internal data structures properly
        
        try:
            # Create a dummy user with the cart items
            # Format: user_id, item_id, rating (we use 1.0 as implicit feedback)
            cart_data = []
            for sku in target_skus:
                cart_data.append({
                    'Email': 'user5@example.com',
                    'MaterialNumber': sku,
                    'QTY': 1.0
                })
            
            if not cart_data:
                return []
            
            cart_df = pd.DataFrame(cart_data)
            
            # Get recommendations for this "user" with these items
            recommendations = self.model.recommend_k_items(
                cart_df,
                top_k=top_k,
                remove_seen=True
            )
            
            # Format results
            results = []
            for _, row in recommendations.iterrows():
                results.append({
                    "sku": row['MaterialNumber'],
                    "score": float(row['prediction'])
                })
            
            return results
            
        except Exception as e:
            logging.error(f"Error generating recommendations: {e}")
            return []