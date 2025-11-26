import os
import pymysql
import pandas as pd
from sshtunnel import SSHTunnelForwarder
from dotenv import load_dotenv

load_dotenv()

def get_data_via_ssh():
    # 1. Open the Secure Tunnel (SSH)
    # We use 'with' so it automatically closes the tunnel when done
    with SSHTunnelForwarder(
        (os.getenv("SSH_HOST"), 22),  # Connect to Remote Server on Port 22
        ssh_username=os.getenv("SSH_USER"),
        ssh_password=os.getenv("SSH_PASSWORD"),
        # Where do we want to go once we are inside? -> The Database
        remote_bind_address=(os.getenv("DB_HOST"), 3306) 
    ) as tunnel:
        
        # 2. Establish the Database Connection through the tunnel
        # Note: We connect to the 'local_bind_port' of the tunnel, not the remote IP
        connection = pymysql.connect(
            host='127.0.0.1',
            user=os.getenv("DB_USER"),
            password=os.getenv("DB_PASSWORD"),
            database=os.getenv("DB_NAME"),
            port=tunnel.local_bind_port  # IMPORTANT: Connect to the tunnel's opening
        )

        # 3. Ask for Data
        query = "SELECT * FROM orders_db.order_items"
        df = pd.read_sql(query, connection)
        
        # 4. Close DB Connection (Tunnel closes automatically due to 'with')
        connection.close()
        
        return df
