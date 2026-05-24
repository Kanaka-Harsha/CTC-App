# 📱 Backend Learning: OTP Login Architecture

## Is the Architecture Correct?
Yes! The flow you described is exactly how modern apps like WhatsApp, Uber, or Bank apps handle login. 

However, under the hood, it is actually a **Two-Step Process**. Because the backend is "stateless", it needs a place to temporarily "remember" the OTP it generated until the user types it in.

---

## 🏗️ The Two-Step OTP Flow

### Step 1: Requesting the OTP (`POST /user/request-otp`)
1. **Frontend**: Sends `{ "phone_no": "9876543210" }`.
2. **Backend**: Checks `SELECT id FROM users WHERE phone_no = '9876543210'`.
3. **Generate**: If the user exists, Python generates a random 6-digit number (e.g., `123456`).
4. **Temporary Storage**: The backend must save this OTP somewhere for the next 5 minutes. 
   - *Option A (Production)*: Save it in Redis (a fast, temporary database).
   - *Option B (Simpler)*: Create a small `otps` table in PostgreSQL (`phone_no`, `otp`, `expires_at`).
5. **Send SMS**: Python calls an SMS gateway (like Twilio or AWS SNS) to text the user. *(While coding locally, you can just `print(f"OTP for {phone_no} is {otp}")` to your terminal instead of paying for real SMS).*
6. **Response**: Backend tells Frontend -> `"OTP Sent Successfully"`.

### Step 2: Verifying the OTP (`POST /user/verify-otp`)
1. **Frontend**: The user types the code. Frontend sends `{ "phone_no": "9876543210", "otp": "123456" }`.
2. **Backend**: Checks the temporary storage (Redis or PostgreSQL). 
   - Does an unexpired OTP exist for this phone number?
   - Does it match `123456`?
3. **Success & JWT**: If it matches, the backend generates the **JWT Token** (from the previous lesson) and sends it back to the user.
4. **Cleanup**: The backend deletes the OTP from the temporary storage so it can't be reused.

---

## 💻 How to implement this locally (Without paying for SMS)

You don't need to buy a Twilio account just to test your logic. You can mock the SMS part.

### 1. Create the OTP Table (Run in pgAdmin)
```sql
CREATE TABLE otps (
    phone_no VARCHAR(10) PRIMARY KEY,
    otp VARCHAR(6) NOT NULL,
    expires_at TIMESTAMP NOT NULL
);
```

### 2. The Python Logic (Mocking the SMS)
```python
import random
from datetime import datetime, timedelta

@app.post("/user/request-otp")
def request_otp(phone_no: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # 1. Check if user exists
    cursor.execute("SELECT id FROM users WHERE phone_no = %s", (phone_no,))
    if not cursor.fetchone():
        raise HTTPException(status_code=404, detail="User not found")
        
    # 2. Generate OTP and Expiration Time (5 mins from now)
    otp = str(random.randint(100000, 999999))
    expires_at = datetime.utcnow() + timedelta(minutes=5)
    
    # 3. Save to database (Upsert: Update if exists, else insert)
    cursor.execute("""
        INSERT INTO otps (phone_no, otp, expires_at) 
        VALUES (%s, %s, %s)
        ON CONFLICT (phone_no) DO UPDATE SET otp = EXCLUDED.otp, expires_at = EXCLUDED.expires_at;
    """, (phone_no, otp, expires_at))
    conn.commit()
    
    # 4. MOCK SMS (Print to terminal instead of sending real SMS)
    print(f"========== SMS SENT ==========")
    print(f"To: {phone_no}")
    print(f"Your CTC App Login Code is: {otp}")
    print(f"==============================")
    
    return {"message": "OTP Sent successfully"}
```
