# AWS S3 Setup Guide

This guide walks you through creating the two necessary AWS S3 buckets for the CTC App.

## 1. The Frontend Bucket (Static Website Hosting)
This bucket will hold your built React application so users can access it over the internet.

### Steps to Create:
1. Go to the **S3 Console** in AWS.
2. Click **Create bucket**.
3. **Bucket name**: Choose a globally unique name (e.g., `ctc-frontend-app-2026`).
4. **AWS Region**: Select `ap-south-1` (Mumbai) to match your backend.
5. **Object Ownership**: Leave as ACLs disabled.
6. **Block Public Access settings**: 
   - **UNCHECK** "Block all public access". You want people to be able to see your website.
   - Acknowledge the warning.
7. Click **Create bucket**.

### Configuration:
1. Open your newly created bucket and go to the **Properties** tab.
2. Scroll to the very bottom to **Static website hosting** and click **Edit**.
3. Select **Enable**.
4. Set **Index document** to `index.html`.
5. Set **Error document** to `index.html` (important for React Router so refreshing doesn't break).
6. Click **Save changes**.

### Bucket Policy:
Go to the **Permissions** tab, scroll to **Bucket policy**, click **Edit**, and paste this (Make sure to replace `YOUR_BUCKET_NAME`):
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::YOUR_BUCKET_NAME/*"
        }
    ]
}
```

---

## 2. The Video Evidence Store
This bucket is where all the dashcam footage and images will be securely uploaded by the users.

### Steps to Create:
1. Go to the **S3 Console** and click **Create bucket**.
2. **Bucket name**: Choose a unique name (e.g., `ctc-video-evidence-store`). **Copy this exact name and put it in your backend `.env` file as `AWS_VIDEO_BUCKET_NAME`.**
3. **AWS Region**: Select `ap-south-1`.
4. **Block Public Access settings**: 
   - **LEAVE IT CHECKED** (Block *all* public access). You do not want strangers browsing through sensitive video evidence!
5. Click **Create bucket**.

### The Most Important Step: CORS Configuration
Because your frontend (running on `localhost` or your frontend bucket) needs to upload videos *directly* to this S3 bucket using Pre-signed URLs, you must tell S3 to accept cross-origin requests. Without this, your browser will block the upload.

1. Open your video bucket and go to the **Permissions** tab.
2. Scroll down to **Cross-origin resource sharing (CORS)** and click **Edit**.
3. Paste the following JSON:
```json
[
    {
        "AllowedHeaders": [
            "*"
        ],
        "AllowedMethods": [
            "PUT",
            "POST",
            "GET"
        ],
        "AllowedOrigins": [
            "*"
        ],
        "ExposeHeaders": []
    }
]
```
*(Note: For strict production security, you can change `"AllowedOrigins": ["*"]` to only allow your exact frontend URL, but `*` is best for testing and development).*

### How it Works:
- Your backend has your secure AWS credentials via `aws configure`.
- When a user uploads a video, the backend uses those credentials to generate a temporary secure URL for this highly private bucket.
- The CORS policy above simply allows your browser to physically push the video file into the bucket using that secure URL without being blocked by cross-origin policies.

---

## 3. CloudFront Setup (For HTTPS, Caching, and CDN)
AWS S3 static website hosting only supports `http://`. To serve your frontend securely over `https://` (which is required for the browser's Geolocation API to work properly), you must put CloudFront in front of it.

### Steps to Create the Distribution:
1. Go to the **CloudFront Console** in AWS.
2. Click **Create Distribution**.
3. **Origin Domain**: Select your Frontend S3 Bucket from the dropdown. 
   *(Important: If it asks to use the bucket endpoint or website endpoint, choose the S3 Website Endpoint!)*
4. **Origin path**: Leave blank.
5. **Viewer Protocol Policy**: Select **Redirect HTTP to HTTPS**.
6. **Allowed HTTP Methods**: Select `GET, HEAD`.
7. **Cache key and origin requests**: Leave as `Cache policy and origin request policy (recommended)` and select `CachingOptimized`.
8. **Web Application Firewall (WAF)**: Select "Do not enable security protections" (to save costs, unless you need it).
9. **Default root object**: Type `index.html`.
10. Click **Create Distribution**.

### Important: Fixing React Router (404 Errors)
Because this is a Single Page Application (SPA), if a user refreshes the page on `/upload`, CloudFront will look for an `upload.html` file in S3 and return a `404 Not Found`. You need to tell CloudFront to route all 404s back to `index.html`.

1. Open your new CloudFront Distribution.
2. Go to the **Error pages** tab and click **Create custom error response**.
3. **HTTP error code**: Select `403: Forbidden` (S3 often returns 403 instead of 404 for missing files).
4. **Customize error response**: Yes.
5. **Response page path**: `/index.html`
6. **HTTP Response code**: `200: OK`
7. Click **Create**.
8. **Repeat steps 2-7**, but this time select **HTTP error code**: `404: Not Found` and also map it to `/index.html` with a `200: OK`.

*Once deployed (which can take 5-10 minutes), use the provided CloudFront Domain Name (e.g., `d1234abcd.cloudfront.net`) to access your app securely!*
