import boto3
from botocore.config import Config
import os
from dotenv import load_dotenv

load_dotenv()
s3_client=boto3.client('s3', region_name='ap-south-1', endpoint_url='https://s3.ap-south-1.amazonaws.com', config=Config(signature_version='s3v4'))
bucket_name = os.getenv("AWS_VIDEO_BUCKET_NAME", "").strip()

url = s3_client.generate_presigned_url(
    'put_object',
    Params={
        'Bucket': bucket_name, 
        'Key': "test_file.mp4",
        'ContentType': "video/mp4"
    },
    ExpiresIn=3600
)
print("URL:", url)
