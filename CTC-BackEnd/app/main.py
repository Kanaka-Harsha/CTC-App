import psycopg2
import boto3
import logging
import secrets
import hashlib
from fastapi import FastAPI,HTTPException
from fastapi.middleware.cors import CORSMiddleware
from app.core.database import get_db_connection
# from app.otp_services.phno_otp_sns import send_sms_via_aws
from app.otp_services.email_utils import send_email_otp, send_confirm_email


logging.basicConfig(
    filename='server.log',
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

app=FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

otp_cache={}

@app.post("/users/register")
def register_user(name:str, phone_no:str, email:str, aadhaar_hash:str):
    logging.info(f"Received registration request for user: {email}")
    conn=get_db_connection()
    cursor=conn.cursor()
    try:
        query="""
        INSERT INTO users(name, phone_no, email, aadhaar_hash)
        VALUES (%s, %s, %s, %s)
        RETURNING id, name, email, phone_no;
        """

        cursor.execute(query,(name, phone_no, email, aadhaar_hash))
        new_user=cursor.fetchone()
        conn.commit()
        send_confirm_email(email)
        return {
            "message":"User Has Been Created Succesfully",
            "user": new_user
        }
    except psycopg2.IntegrityError:
        conn.rollback()
        raise HTTPException(status_code=400, detail="Duplicate Phone Number")
    finally:
        cursor.close()
        conn.close()

# Phone Number OTP replaced with email otp
@app.post("/user/login")
def login_user(email:str):
    logging.info(f"Received login request for user: {email}")
    try:
        conn=get_db_connection()
        cursor=conn.cursor()
        # query="SELECT id,name FROM users WHERE phone_no=%s;`"
        query="SELECT id,name FROM users WHERE email=%s;"
        cursor.execute(query,(email,))
        user=cursor.fetchone()
        if not user:
            raise HTTPException(status_code=404, detail="User Not Found, Register New User.")
            
        otp=''.join(secrets.choice('0123456789') for _ in range(6))
        otp_cache[email]=otp
        # send_sms_via_aws(email,otp)
        send_email_otp(email,otp)
        return {
            "message":"OTP Sent Succesfully",
            "email":email,
            "expires_in":"5 Miniutes"
        }
    except psycopg2.Error as e:
        raise HTTPException(status_code=500, detail="Internal Server Error, Please Retry Later..")
    finally:
        cursor.close()
        conn.close()

@app.post("/user/login_check")
def login_verify(email:str, otp:str):
    logging.info(f"Verifying OTP for user: {email}")
    if email not in otp_cache:
        raise HTTPException(status_code=400, detail="OTP expired or not requested.")
    if otp_cache[email] == otp:
        del otp_cache[email]
        return {"message": "Login successful!"}
    else:
        raise HTTPException(status_code=401, detail="Invalid OTP.")
