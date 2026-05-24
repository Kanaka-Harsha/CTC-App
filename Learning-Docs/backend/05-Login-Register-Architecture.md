# 🏗️ Backend Learning: Current Login & Register Architecture

## How Everything Connects
This document outlines how the Frontend (React) and Backend (FastAPI) talk to each other to make Registration and Login happen in your app right now.

---

## 📝 1. Registration Process

### Frontend Flow (`Register.jsx`)
1. User types in their `name`, `phone_no`, and `aadhaar_hash`.
2. React takes these and sends an HTTP `POST` request to `http://127.0.0.1:8000/users/register`.
3. It passes the data as **query parameters** in the URL.

### Backend Flow (`main.py` -> `register_user`)
1. **Receive:** FastAPI gets the request at `/users/register`.
2. **Database:** Opens a connection to PostgreSQL and runs an `INSERT INTO users...` statement.
3. **Handle Errors:** If the phone number already exists, it catches the `psycopg2.IntegrityError` and sends back a `400 Bad Request`.
4. **Success:** If it works, it sends the newly created user data back to React.

---

## 🔐 2. Login Process (Two-Step Verification)

As discussed in the previous lesson, we use a Two-Step OTP Flow. Here is how it is currently implemented in your code:

### Step 1: Requesting the OTP
**Frontend (`Login.jsx` - Step 1):**
- The user enters their phone number.
- React sends a `POST` request to `http://127.0.0.1:8000/user/login?phone_no=...`.

**Backend (`main.py` -> `login_user`):**
1. Checks the PostgreSQL `users` table to see if the user exists.
2. If yes, it generates a random 6-digit OTP using Python's `secrets` module.
3. **Storage:** It stores the OTP in a temporary dictionary in memory called `otp_cache`.
4. **SMS Delivery:** It calls `send_sms_via_aws()` (from `utils.py`) to physically text the OTP to the user's phone via AWS SNS.

### Step 2: Verifying the OTP
**Frontend (`Login.jsx` - Step 2):**
- The user types in the 6-digit code from their phone.
- React sends a `POST` request to `http://127.0.0.1:8000/user/login_check?phone_no=...&otp=...`.

**Backend (`main.py` -> `login_verify`):**
1. Checks the `otp_cache` dictionary to see if the OTP matches the one generated earlier.
2. If it matches, the OTP is deleted from `otp_cache` so it can't be used again (preventing replay attacks).
3. FastAPI responds with `{"message": "Login successful!"}`.

---

## ⚠️ Important Areas for Improvement

Your current setup works perfectly for development, but there are a few things you will want to upgrade for production:

1. **In-Memory Cache:** You are using `otp_cache = {}` which is stored in FastAPI's memory. If the server restarts or if you run multiple server instances, all OTPs are lost or disjointed. Consider moving this to **Redis** or a PostgreSQL `otps` table (like we discussed in lesson 04).
2. **Missing JWT:** After a successful login, the backend currently just says `"Login successful!"`. It needs to generate a **JWT Token** and give it to React, so React can securely prove who the user is on their next request (e.g., when uploading evidence).
3. **CORS:** We recently added `CORSMiddleware` to `main.py`. This is what allows your React app running on port `5173` to talk to FastAPI on port `8000` without the browser throwing a security error!
