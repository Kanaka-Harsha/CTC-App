import psycopg2
from app.core.database import get_db_connection

def fix_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        # Check if the column exists
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='reports' and column_name='desctiption';
        """)
        if cursor.fetchone():
            print("Found typo column 'desctiption', renaming to 'description'...")
            cursor.execute("ALTER TABLE reports RENAME COLUMN desctiption TO description;")
            conn.commit()
            print("Successfully renamed!")
        else:
            print("No typo column found, it might already be 'description'.")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    fix_db()
