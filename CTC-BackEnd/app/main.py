import psycopg2
import boto3
import logging
import secrets
import hashlib
import os
import uuid
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from dotenv import load_dotenv
from fastapi import FastAPI,HTTPException,Request
from fastapi.middleware.cors import CORSMiddleware
from app.core.database import get_db_connection
# from app.otp_services.phno_otp_sns import send_sms_via_aws
from app.otp_services.email_utils import send_email_otp, send_confirm_email


load_dotenv()
AADHAAR_SALT = os.getenv("AADHAAR_SALT", "super_secret_default_salt_123!")

logging.basicConfig(
    filename='server.log',
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)


from botocore.config import Config

app=FastAPI()
s3_client=boto3.client('s3', region_name='ap-south-1', endpoint_url='https://s3.ap-south-1.amazonaws.com', config=Config(signature_version='s3v4'))
bucket_name=os.getenv("AWS_VIDEO_BUCKET_NAME")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

otp_cache={}

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

@app.post("/users/register")
def register_user(name:str, phone_no:str, email:str, aadhaar_hash:str):
    logging.info(f"Received registration request for user: {email}")
    
    salted_string = aadhaar_hash + AADHAAR_SALT
    final_aadhaar_hash = hashlib.sha256(salted_string.encode('utf-8')).hexdigest()

    conn=get_db_connection()
    cursor=conn.cursor()
    try:
        query="""
        INSERT INTO users(name, phone_no, email, aadhaar_hash)
        VALUES (%s, %s, %s, %s)
        RETURNING id, name, email, phone_no;
        """

        cursor.execute(query,(name, phone_no, email, final_aadhaar_hash))
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
        cursor.close()
        conn.close()

# Phone No. OTP is replaced with Email OTP
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



@app.get("/report/presigned-url")
def get_presigned_url(filename:str, content_type:str):
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
def add_report(user_email: str, incident_ts: str, incident_location: str, incident_type: str, description: str, video_link: str):
    logging.info(f"Uploading User Report.")
    try:
        conn=get_db_connection()
        cursor=conn.cursor()
        check_query="SELECT * FROM users WHERE email=%s"
        cursor.execute(check_query,(user_email,))
        user=cursor.fetchone()
        if not user:
            raise HTTPException(status_code=404, detail="User Not Found..")
        user_id=user['id']
        query = """
        INSERT INTO reports (user_id, incident_ts, incident_location, incident_type, description, video_link)
        VALUES (%s, %s, %s, %s, %s, %s)
        RETURNING id;
        """
        cursor.execute(query,(user_id, incident_ts, incident_location, incident_type, description, video_link))
        new_report_id=cursor.fetchone()['id']
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
