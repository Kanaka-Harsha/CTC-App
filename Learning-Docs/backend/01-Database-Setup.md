# 🗄️ Backend Learning: Database Setup (Raw SQL)

## Overview
Since you are currently learning SQL, skipping the ORM (Object Relational Mapper) and writing **Raw SQL** is a fantastic decision! It forces you to understand exactly how databases work under the hood.

To execute raw SQL queries from FastAPI, we will use a library called **`psycopg2`** (the most popular PostgreSQL adapter for Python). 

> **Security Warning**: When writing raw SQL, you must **never** concatenate strings directly (e.g., `f"SELECT * FROM users WHERE name = '{name}'"`). This leads to **SQL Injection**. Always use parameterized queries (shown below).

---

## 🛠️ Step 1: Local Prerequisites
1. Download and install **PostgreSQL** on your PC.
2. Open **pgAdmin**, create a new database called `ctc_db`.
3. Open the "Query Tool" in pgAdmin and manually run your `CREATE TABLE` scripts to set up the database structure.

**Example SQL to run in pgAdmin:**
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone_number VARCHAR(15) UNIQUE NOT NULL,
    aadhaar_hash VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🏗️ Step 2: The Connection File
Instead of complex SQLAlchemy configurations, we just need a simple function to connect to Postgres and execute queries. Create a file at `CTC-BackEnd/app/core/database.py`:

```python
import psycopg2
from psycopg2.extras import RealDictCursor
import os

# Grab this from your .env file
# Format: postgresql://<username>:<password>@<host>:<port>/<database_name>
DB_URL = "postgresql://postgres:yourpassword@localhost:5432/ctc_db"

def get_db_connection():
    """
    Creates a connection to the PostgreSQL database.
    Using RealDictCursor means your results come back as Python dictionaries 
    (e.g., row['phone_number']) instead of tuples (row[1]).
    """
    try:
        conn = psycopg2.connect(DB_URL, cursor_factory=RealDictCursor)
        return conn
    except Exception as error:
        print(f"Error connecting to the database: {error}")
        raise error
```

---

## 📝 Step 3: Writing Raw SQL in FastAPI
Here is an example of how you will use this connection in your API routes (`app/main.py`):

```python
from fastapi import FastAPI, HTTPException
from app.core.database import get_db_connection

app = FastAPI()

@app.post("/users/register")
def register_user(phone_number: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # ✅ THE RIGHT WAY: Parameterized query (Prevents SQL Injection)
        sql_query = """
            INSERT INTO users (phone_number) 
            VALUES (%s) 
            RETURNING id, phone_number, created_at;
        """
        
        # The variables must be passed as a tuple: (phone_number,)
        cursor.execute(sql_query, (phone_number,))
        
        # Fetch the newly created user
        new_user = cursor.fetchone()
        
        # Commit the transaction to save it permanently
        conn.commit()
        
        return {"message": "User registered successfully", "user": new_user}

    except psycopg2.IntegrityError:
        # Catch errors like trying to register an existing phone number
        conn.rollback()
        raise HTTPException(status_code=400, detail="Phone number already registered")
        
    finally:
        # Always close your cursor and connection!
        cursor.close()
        conn.close()
```

## Why this is a great way to learn:
1. **Full Control**: You see exactly what is being sent to the database.
2. **Performance**: Raw SQL is often slightly faster than an ORM because there is no translation layer.
3. **Transferable Skills**: The SQL you write here (`SELECT`, `INSERT`, `JOIN`) works exactly the same in Java, Go, Node.js, and data science tools.
