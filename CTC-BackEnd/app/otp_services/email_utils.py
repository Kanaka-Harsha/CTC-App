import smtplib
import os
from email.message import EmailMessage
from fastapi import HTTPException
import logging

def send_email_otp(email: str, otp: str):
    smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
    smtp_port = int(os.getenv("SMTP_PORT", 587))
    smtp_password = os.getenv("SMTP_PASSWORD")
    smtp_user = os.getenv("SMTP_USER")

    if not smtp_user or not smtp_password:
        logging.error("SMTP credentials not configured.")
        raise HTTPException(status_code=500, detail="Email service misconfigured.")

    msg = EmailMessage()
    text_content = f"""
Hello,

Your One-Time Password (OTP) for the CTC App is: {otp}

Please use this code to securely log in. 
With the CTC App, you can securely view your incident reports and submit new evidence.

If you did not request this OTP, please ignore this email.

Best regards,
The CTC App Team
"""
    msg.set_content(text_content)

    html_content = f"""
    <html>
      <body style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
        <h2 style="color: #2c3e50;">CTC App Verification</h2>
        <p>Hello,</p>
        <p>Your One-Time Password (OTP) for the CTC App is:</p>
        <h1 style="color: #3498db; letter-spacing: 2px;">{otp}</h1>
        <p>Please use this code to securely log in. With the CTC App, you can securely view your incident reports and submit new evidence.</p>
        <p style="color: #7f8c8d; font-size: 0.9em;">If you did not request this OTP, please ignore this email.</p>
        <br>
        <p>Best regards,<br><strong>The CTC App Team</strong></p>
      </body>
    </html>
    """
    msg.add_alternative(html_content, subtype='html')
    msg['Subject'] = 'Your OTP for CTC App'
    msg['From'] = smtp_user
    msg['To'] = email

    try:
        with smtplib.SMTP(smtp_server, smtp_port) as server:
            server.starttls()
            server.login(smtp_user, smtp_password)
            server.send_message(msg)
        logging.info(f"OTP email sent to {email}")
    except Exception as e:
        logging.error(f"Failed to send email to {email}: {e}")
        raise HTTPException(status_code=502, detail="Failed to dispatch email.")

# send_email_otp("megaharsha203@gmail.com", "123456")
def send_confirm_email(email: str):
    smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
    smtp_port = int(os.getenv("SMTP_PORT", 587))
    smtp_password = os.getenv("SMTP_PASSWORD")
    smtp_user = os.getenv("SMTP_USER")

    if not smtp_user or not smtp_password:
        logging.error("SMTP credentials not configured.")
        raise HTTPException(status_code=500, detail="Email service misconfigured.")

    msg = EmailMessage()
    text_content = f"""
Hello user,

Your account has been created successfully.
With the CTC App, you can securely view your incident reports and submit new evidence.

Best regards,
The CTC App Team
"""
    msg.set_content(text_content)

    html_content = f"""
    <html>
      <body style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
        <h2 style="color: #2c3e50;">CTC App Verification</h2>
        <p>Hello,</p>
        <p>Your account has been created successfully.</p>
        <p style="color: #7f8c8d; font-size: 0.9em;">You can now login and access your account using OTP.</p>
        <br>
        <p>Best regards,<br><strong>The CTC App Team</strong><br>Helping Save Lives...</p>
      </body>
    </html>
    """
    msg.add_alternative(html_content, subtype='html')
    msg['Subject'] = 'Your account has been created successfully'
    msg['From'] = smtp_user
    msg['To'] = email

    try:
        with smtplib.SMTP(smtp_server, smtp_port) as server:
            server.starttls()
            server.login(smtp_user, smtp_password)
            server.send_message(msg)
        logging.info(f"Confirmation email sent to {email}")
    except Exception as e:
        logging.error(f"Failed to send confirmation email to {email}: {e}")
        raise HTTPException(status_code=502, detail="Failed to dispatch email.")
    