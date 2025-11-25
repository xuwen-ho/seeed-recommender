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
        Uses get_item_based_topk which works for cold/new users (unseen during training).
        """
        if not self.is_trained:
            return []

        try:
            # Create DataFrame with cart items
            # get_item_based_topk expects a DataFrame with item column (and optionally rating)
            cart_data = []
            for sku in target_skus:
                cart_data.append({
                    'MaterialNumber': sku,
                    'QTY': 1.0  # Rating column (optional, defaults to 1 if not provided)
                })
            
            if not cart_data:
                return []
            
            cart_df = pd.DataFrame(cart_data)
            
            # Use get_item_based_topk for cold-user/new-user recommendations
            # This method uses item-item similarity to recommend items similar to the seed items
            # It works for users not seen during training (cold-start users)
            recommendations = self.model.get_item_based_topk(
                items=cart_df,
                top_k=top_k,
                sort_top_k=True
            )
            
            # Filter out items that are already in the cart
            recommendations = recommendations[~recommendations['MaterialNumber'].isin(target_skus)]
            
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