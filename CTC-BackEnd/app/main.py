import psycopg2
import boto3
import logging
import secrets
from fastapi import FastAPI,HTTPException
from core.database import get_db_connection
from aws.utils import send_sms_via_aws

app=FastAPI()
otp_cache={}

@app.post("/users/register")
def register_user(name:str, phone_no:str, aadhaar_hash:str):
    conn=get_db_connection()
    cursor=conn.cursor()
    try:
        query="""
        INSERT INTO users(name, phone_no, aadhaar_hash)
        VALUES (%s, %s, %s)
        RETURNING id, name, phone_no;
        """

        cursor.execute(query,(name, phone_no, aadhaar_hash))
        new_user=cursor.fetchone()
        conn.commit()
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

@app.post("/user/login")
def login_user(phone_no:str):
    try:
        conn=get_db_connection()
        cursor=conn.cursor()
        query="SELECT id,name FROM users WHERE phone_no=%s;"
        cursor.execute(query,(phone_no,))
        user=cursor.fetchone()
        if not user:
            raise HTTPException(status_code=404, detail="User Not Found, Register New User.")
            
        otp=''.join(secrets.choice('0123456789') for _ in range(6))
        otp_cache[phone_no]=otp
        send_sms_via_aws(phone_no,otp)
        return {
            "message":"OTP Sent Succesfully",
            "phone_no":phone_no,
            "expires_in":"5 Miniutes"
        }
    except psycopg2.Error as e:
        raise HTTPException(status_code=500, detail="Internal Server Error, Please Retry Later..")
    finally:
        cursor.close()
        conn.close()

@app.post("/user/login_check")
def login_verify(phone_no:str, otp:str):
    if phone_no not in otp_cache:
        raise HTTPException(status_code=400, detail="OTP expired or not requested.")
    if otp_cache[phone_no] == otp:
        del otp_cache[phone_no]
        return {"message": "Login successful!"}
    else:
        raise HTTPException(status_code=401, detail="Invalid OTP.")
