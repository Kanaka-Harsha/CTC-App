import boto3
import json
import logging
from fastapi import HTTPException


def send_sms_via_aws(phone_no:str, otp:str):
    sns_client=boto3.client('sns',region_name='ap-south-1')
    try:
        response = sns_client.publish(
            PhoneNumber=phone_no,
            Message=f"Your OTP for login is {otp}",
            MessageAttributes={
                'AWS.SNS.SMS.SMSType': {
                    'DataType': 'String',
                    'StringValue': 'Transactional' # Crucial: Prioritizes delivery for OTPs
                }
            }
        )
        logging.info(f"SMS dispatched. Message ID: {response['MessageId']}")
    except Exception as e:
        logging.error(f"Failed to send SMS: {e}")
        # We don't necessarily raise an HTTP exception here if we want to fail gracefully,
        # but for a strict login flow, you might want to alert the user.
        raise HTTPException(status_code=502, detail="Failed to dispatch SMS gateway.")
