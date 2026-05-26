import psycopg2
from psycopg2.extras import RealDictCursor
import os
from dotenv import load_dotenv

load_dotenv()

db_url=os.getenv('LOCAL_DATABASE_URL')

def get_db_connection():
    try:
        conn=psycopg2.connect(db_url,cursor_factory=RealDictCursor)
        # print("OK")
        return conn
    except Exception as e:
        print(f"Unable To Connect To The Database, Error -> {e}")
        raise e 

# get_db_connection()