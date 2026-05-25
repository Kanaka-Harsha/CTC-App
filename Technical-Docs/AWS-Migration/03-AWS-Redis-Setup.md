# AWS Redis Setup Guide (ElastiCache)

To make your backend ready for production scaling, you need to replace the local Python dictionary (`otp_cache = {}`) with a centralized Redis memory store. This ensures that if you have multiple backend servers running on AWS, they all share the same OTP data.

---

## 1. Setting up Local Redis (For Testing)
Before migrating to AWS, you should test Redis locally.

Since you are on Windows, the easiest way to run Redis locally is using Docker or WSL:
- **Using Docker (Recommended):** Run `docker run -d --name redis-ctc -p 6379:6379 redis` in your terminal.
- Add this to your `.env` file: `REDIS_URL=redis://localhost:6379/0`

---

## 2. Setting up AWS ElastiCache (For Production)

1. Go to the **AWS Console** and search for **ElastiCache**.
2. Click **Redis clusters** on the left menu, then click **Create Redis cluster**.
3. **Deployment option**: Choose **Serverless** (easier/auto-scaling) OR **Design your own cluster** (choose `cache.t3.micro` to save costs).
4. **Name**: `ctc-redis-cache`
5. **Subnet group / VPC**: Choose the default VPC (Make sure it is the *same VPC* where you will deploy your FastAPI backend!).
6. **Security**: 
   - **Important**: Redis on AWS is highly secure and is intentionally **NOT accessible from the public internet**. It can only be accessed by backend servers running inside your AWS VPC (like an EC2 instance or AWS App Runner).
7. Click **Create**.
8. Once the cluster is created (takes about 5-10 minutes), click on it and copy the **Primary Endpoint** URL.
9. In your AWS production `.env` file, set: `REDIS_URL=redis://YOUR_ELASTICACHE_ENDPOINT:6379/0`

---

## 3. Updating Your Python Backend

Once your Redis server (local or AWS) is running, you need to update `main.py`.

### Step A: Install the Redis package
Open your backend terminal and run:
```bash
pip install redis
```
*(Don't forget to add `redis` to your `requirements.txt`!)*

### Step B: Connect to Redis in `main.py`
Add these imports and the connection code at the top of your `main.py`:

```python
import redis
import os

# Connect to Redis (Defaults to localhost if not found in .env)
redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
try:
    redis_client = redis.Redis.from_url(redis_url, decode_responses=True)
    redis_client.ping() # Test the connection
    logging.info("Successfully connected to Redis!")
except Exception as e:
    logging.error(f"Failed to connect to Redis: {e}")

# DELETE THIS LINE: otp_cache = {}
```

### Step C: Update the `/user/login` endpoint
Find where you generate the OTP and replace the `otp_cache` logic with this:

```python
        otp = ''.join(secrets.choice('0123456789') for _ in range(6))
        
        # Save OTP to Redis with an automatic expiration of 300 seconds (5 minutes!)
        redis_client.setex(email, 300, otp)
        
        send_email_otp(email, otp)
```

### Step D: Update the `/user/login_check` endpoint
Find your OTP verification logic and update it to read from Redis:

```python
@app.post("/user/login_check")
def login_verify(email: str, otp: str):
    logging.info(f"Verifying OTP for user: {email}")
    
    # Fetch the OTP from Redis
    stored_otp = redis_client.get(email)
    
    if not stored_otp:
        raise HTTPException(status_code=400, detail="OTP expired or not requested.")
        
    if stored_otp == otp:
        # Delete it from Redis so it can't be used again
        redis_client.delete(email)
        return {"message": "Login successful!"}
    else:
        raise HTTPException(status_code=401, detail="Invalid OTP.")
```

---

### Why this is better:
1. **Scalability:** You can now run 10 backend servers at the same time, and they will all read from the same Redis OTP database.
2. **Auto-Expiry:** `setex(email, 300, otp)` automatically deletes the OTP from memory after 5 minutes, saving you from having to write complex expiration code!
