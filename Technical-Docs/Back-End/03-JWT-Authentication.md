# 🔐 Backend Learning: JWT Authentication

## What is a JWT?
JWT stands for **JSON Web Token**. It is an industry-standard, highly secure way to represent claims transferred between two parties. 

In simple terms: It is a digital VIP pass. 

Because our FastAPI backend is **stateless** (it does not remember who you are from one request to the next), the React frontend needs a way to prove who is logged in every time it asks the server to do something (like uploading a report).

## 🌊 The Login Flow
Here is exactly what happens when a user logs in:

1. **The Request**: The React frontend sends the user's `phone_no` (and an OTP or password) to your `POST /user/login` endpoint.
2. **The Verification**: Your Python code checks the database (`SELECT id FROM users WHERE phone_no = %s`). 
3. **The Generation**: If the user exists, your Python code generates a JWT string. This string contains a "payload" (usually just the user's `id`) and is cryptographically signed using a `SECRET_KEY` that only your backend knows.
4. **The Response**: The backend sends this JWT string back to the frontend.
5. **Storage**: The React frontend saves this string in the browser's `localStorage`.
6. **Future Requests**: Whenever the user tries to upload a report, the frontend attaches this JWT to the HTTP Headers (`Authorization: Bearer <your_jwt_token>`).
7. **The Validation**: FastAPI intercepts the request, reads the JWT, verifies the signature using the `SECRET_KEY`, and extracts the `user_id`. Now your backend knows exactly whose account to link the new report to!

---

## 🛠️ How to Implement it in Python

We will use the `python-jose` library (which is already in your `requirements.txt`).

### 1. Security Configuration
First, you need a secret key to sign the tokens. Add this to your `core/config.py` (or `.env`):
```python
SECRET_KEY = "your-super-secret-unguessable-key-goes-here"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 # Token expires in 1 hour
```

### 2. The Token Generator Function
You write a helper function to create the token. (Usually placed in a file like `core/security.py`):
```python
from datetime import datetime, timedelta
from jose import jwt

# Assume SECRET_KEY and ALGORITHM are imported from config.py

def create_access_token(data: dict):
    to_encode = data.copy()
    
    # Add an expiration time
    expire = datetime.utcnow() + timedelta(minutes=60)
    to_encode.update({"exp": expire})
    
    # Sign the JWT using your SECRET_KEY
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    
    return encoded_jwt
```

### 3. Your Login Endpoint
Back in your `main.py`, your login endpoint will look something like this:

```python
@app.post("/user/login")
def login_user(phone_no: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # 1. Check if user exists
        cursor.execute("SELECT id FROM users WHERE phone_no = %s", (phone_no,))
        user = cursor.fetchone()
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
            
        # Note: In a real app, you would verify an OTP or password here!

        # 2. Generate the JWT containing the user's ID
        access_token = create_access_token(data={"sub": str(user['id'])})
        
        # 3. Return the token to React
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "message": "Login successful"
        }
        
    finally:
        cursor.close()
        conn.close()
```

## Why this is secure:
Because the JWT is signed with your `SECRET_KEY`, a hacker cannot modify the token to change the `user_id` inside it. If they try, the cryptographic signature will become invalid, and FastAPI will instantly reject the token.
