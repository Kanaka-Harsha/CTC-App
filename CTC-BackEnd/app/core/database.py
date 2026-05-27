import psycopg2
def get_db_connection():
    # Using exact hardcoded values to bypass .env entirely
    return psycopg2.connect(
        dbname="ctc_postgres",
        user="ctc_postgres",
        password="Password123",
        host="ctc-database.cp42a6gsihil.ap-south-1.rds.amazonaws.com",
        port="5432",
        sslmode="require"
    )



# import psycopg2
# from psycopg2.extras import RealDictCursor
# import os
# from dotenv import load_dotenv

# load_dotenv()

# db_url=os.getenv('RDS_DATABASE_URL')

# def get_db_connection():
#     try:
#         conn=psycopg2.connect(db_url,cursor_factory=RealDictCursor)
#         # print("OK")
#         return conn
#     except Exception as e:
#         print(f"Unable To Connect To The Database, Error -> {e}")
#         raise e 

# # get_db_connection()