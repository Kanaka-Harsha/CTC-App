import logging
import psycopg2
import boto3
import logging
import secrets
import hashlib
import os
import uuid
from dotenv import load_dotenv
from botocore.config import Config
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi import FastAPI,HTTPException,Request
from fastapi.middleware.cors import CORSMiddleware
from app.core.database import get_db_connection
from app.otp_services.email_utils import send_email_otp, send_confirm_email
# from app.otp_services.phno_otp_sns import send_sms_via_aws

# Basic Declaration For Server
load_dotenv()
app=FastAPI()
otp_cache={}

# Server Variables
AADHAAR_SALT = os.getenv("AADHAAR_SALT", "super_secret_default_salt_123!") # Backend Salt
s3_client=boto3.client('s3', region_name='ap-south-1', endpoint_url='https://s3.ap-south-1.amazonaws.com', config=Config(signature_version='s3v4'))
bucket_name=os.getenv("AWS_VIDEO_BUCKET_NAME")

# Logging Config
logging.basicConfig(
    filename='server.log',
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

# Enabling CORS, for cross origin comms, FE-BE
raw_origins = os.getenv("ALLOWED_ORIGINS", "*")
origins = [origin.strip() for origin in raw_origins.split(",") if origin.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rate Limiting Config
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

@app.get("/health")
def health_check():
    return {"status": "healthy"}


@app.post("/users/register")
@limiter.limit("3/minute")
def register_user(request: Request, name:str, phone_no:str, email:str, aadhaar_hash:str, user_location:str):
    logging.info(f"Received registration request for user: {email}")
    
    salted_string = aadhaar_hash + AADHAAR_SALT # Add Salt
    final_aadhaar_hash = hashlib.sha256(salted_string.encode('utf-8')).hexdigest() # 2nd Hash Of AAdhaar Number 

    conn=get_db_connection()
    cursor=conn.cursor()
    try:
        query="""
        INSERT INTO users(name, phone_no, email, aadhaar_hash, user_location)
        VALUES (%s, %s, %s, %s, %s)
        RETURNING id, name, email, phone_no;
        """

        cursor.execute(query,(name, phone_no, email, final_aadhaar_hash, user_location))
        new_user=cursor.fetchone()
        conn.commit()
        send_confirm_email(email)
        return {
            "message":"User Has Been Created Succesfully",
            "user": new_user
        }
    except psycopg2.IntegrityError as e:
        conn.rollback()
        error_msg = str(e).lower()
        if 'email' in error_msg:
            raise HTTPException(status_code=400, detail="An account with this Email already exists.")
        elif 'phone_no' in error_msg:
            raise HTTPException(status_code=400, detail="An account with this Phone Number already exists.")
        elif 'aadhaar_hash' in error_msg:
            raise HTTPException(status_code=400, detail="An account with this Aadhaar Number already exists.")
        else:
            raise HTTPException(status_code=400, detail="A user with these details already exists.")
    finally:
        if 'cursor' in locals() and cursor:
            cursor.close()
        if 'conn' in locals() and conn:
            conn.close()


@app.post("/user/login")
@limiter.limit("3/minute")
def login_user(request: Request, email: str):
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
        logging.error(f"Database error during login: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if 'cursor' in locals() and cursor:
            cursor.close()
        if 'conn' in locals() and conn:
            conn.close()


@app.post("/user/login_check")
@limiter.limit("3/minute")
def login_verify(request: Request, email:str, otp:str):
    logging.info(f"Verifying OTP for user: {email}")
    if email not in otp_cache:
        raise HTTPException(status_code=400, detail="OTP expired or not requested.")
    if otp_cache[email] == otp:
        del otp_cache[email]
        return {"message": "Login successful!"}
    else:
        raise HTTPException(status_code=401, detail="Invalid OTP.")


@app.get("/report/presigned-url")
@limiter.limit("3/minute")
def get_presigned_url(request: Request, filename:str, content_type:str):
    logging.info(f"Generating New Presigned URL for {filename}")
    unique_filename=f"{uuid.uuid4()}_{filename}"
    try:
        presigned_url=s3_client.generate_presigned_url(
            'put_object',
            Params={
                'Bucket':bucket_name, 
                'Key':unique_filename,
                'ContentType': content_type
            },
            ExpiresIn=3600
        )
        video_link = f"https://{bucket_name}.s3.ap-south-1.amazonaws.com/{unique_filename}"
        return {"presigned_url": presigned_url, "video_link": video_link}
    except Exception as e:
        logging.error(f"Error generating presigned URL: {e}")
        raise HTTPException(status_code=500, detail="Could not generate upload URL")


@app.post("/report/submit")
@limiter.limit("3/minute")
def add_report(request: Request, user_email: str, incident_ts: str, incident_location: str, incident_type: str, description: str, video_link: str):
    logging.info(f"Uploading User Report.")
    try:
        conn=get_db_connection()
        cursor=conn.cursor()
        check_query="SELECT * FROM users WHERE email=%s"
        cursor.execute(check_query,(user_email,))
        user=cursor.fetchone()
        if not user:
            raise HTTPException(status_code=404, detail="User Not Found..")
        user_id=user[0]
        query = """
        INSERT INTO reports (user_id, incident_ts, incident_location, incident_type, description, video_link)
        VALUES (%s, %s, %s, %s, %s, %s)
        RETURNING id;
        """
        cursor.execute(query,(user_id, incident_ts, incident_location, incident_type, description, video_link))
        new_report_id=cursor.fetchone()[0]
        conn.commit()
        return {"message": "Report submitted successfully!", "report_id": new_report_id}
    except psycopg2.Error as e:
        conn.rollback()
        logging.error(f"BD Upload Error: {e}")
        raise HTTPException(status_code=500, detail="Failed To Save Report")
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'conn' in locals():
            conn.close()


@app.get("/report/profile")
@limiter.limit("3/minute")
def get_profile(request: Request, email:str):
    logging.info(f"Fetching user profile for the user with email: {email}")
    conn=get_db_connection()
    cursor=conn.cursor()
    try:
        query="""
            SELECT id, name, phone_no, email, user_location FROM users
            WHERE email=%s;
        """
        cursor.execute(query,(email,))
        user=cursor.fetchone()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
            
        return {
            "user_id": f"USR-{user[0]}",
            "name": user[1],
            "phone_no": user[2],
            "email": user[3],
            "address": user[4] or "Address not updated"
        }
    except psycopg2.Error as e:
        logging.error(f"Database error during profile fetch: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch profile")
    finally:
        if 'cursor' in locals() and cursor:
            cursor.close()
        if 'conn' in locals() and conn:
            conn.close()


@app.get("/report/history")
@limiter.limit("3/minute")
def get_reports(request: Request, email:str):
    conn=get_db_connection()
    cursor=conn.cursor()
    try:
        query1="""
            SELECT id FROM users WHERE email=%s;
        """
        cursor.execute(query1,(email,))
        user=cursor.fetchone()
        if not user:
            raise HTTPException(status_code=404, detail="User Not Found")
        user_id=user[0]
        query2="""
            SELECT id, incident_type, incident_location, incident_ts, ai_status, ai_report, description
            FROM reports
            WHERE user_id=%s
            ORDER BY report_timestamp DESC;
        """
        cursor.execute(query2,(user_id,))
        reports=cursor.fetchall()
        history=[]
        for row in reports:
            history.append({
                "id": f"REP-{row[0]}",
                "incident_type": row[1],
                "incident_location": row[2],
                "incident_ts": row[3],
                "ai_status": row[4],
                "description": row[6],
                "ai_report": row[5]
            })
        return history
    except psycopg2.Error as e:
        logging.error(f"Database Failed To Fetch Report {e}")
        raise HTTPException(status_code=500, detail="Failed To Fetch Report From Database")
    finally:
        if 'cursor' in locals() and cursor:
            cursor.close()
        if 'conn' in locals() and conn:
            conn.close()


@app.get("/report/history/delete")
@limiter.limit("3/minute")
def delete_user_report(request: Request, rid:int):
    logging.info(f"Deleting Report For User: {rid}")
    conn=get_db_connection()
    cursor=conn.cursor()
    try:
        query="SELECT video_link FROM reports WHERE id=%s"
        cursor.execute(query,(rid,))
        result=cursor.fetchone()
        if not result:
            raise HTTPException(status_code=404, detail="Report Not Found")
        video_link=result[0]
        
        if video_link:
            try:
                object_key = video_link.split("/")[-1]
                s3_client.delete_object(Bucket=bucket_name, Key=object_key)
            except Exception as e:
                logging.error(f"Failed to delete video from S3: {e}")

        delete_query = "DELETE FROM reports WHERE id=%s"
        cursor.execute(delete_query, (rid,))
        conn.commit()
        
        return {"message": "Report deleted successfully"}
        
    except psycopg2.Error as e:
        conn.rollback()
        logging.error(f"Database Error Deleting Report {e}")
        raise HTTPException(status_code=500, detail="Failed To Delete Report From Database")
    finally:
        if 'cursor' in locals() and cursor:
            cursor.close()
        if 'conn' in locals() and conn:
            conn.close()
