# AWS AI Video Analyzer Setup

This document outlines the architecture and deployment process for the AI-powered video analysis feature using AWS S3, SQS, AWS Lambda, and Google Gemini.

## Architecture Overview

The video analysis pipeline is completely event-driven and serverless:
1. **S3 Bucket (`ctc-videos-store-2026`)**: Users or backend services upload video files (e.g., MP4) to this bucket.
2. **S3 Event Notification**: S3 is configured to send `ObjectCreated:Put` events whenever a new video is uploaded.
3. **SQS Queue (`CTC-Video-Queue`)**: Acts as a buffer to receive the S3 upload events and triggers the Lambda function.
4. **AWS Lambda (`ctc-ai-analyser.py`)**: Consumes SQS messages, downloads the video, and processes it.
5. **Google Gemini (`gemini-2.5-flash`)**: Used for multimodal video analysis to generate a detailed incident report.

## Lambda Function Design

### Dependencies
- The Lambda function requires the **`google-genai`** package to communicate with the Gemini API.
- Since Lambda uses Amazon Linux, the package is installed using the `--platform manylinux2014_x86_64 --only-binary=:all:` flag.
- AWS SDK (`boto3`) is provided by the Lambda runtime by default.

### Execution Flow
1. SQS triggers the Lambda function with the S3 event details.
2. Lambda parses the event to extract the bucket name and object key.
3. The video is downloaded from S3 to the Lambda's ephemeral storage (`/tmp`).
4. The function initializes the Gemini client using the `GEMINI_API_KEY` environment variable.
5. The video is uploaded to Google's servers via the Gemini API.
6. The function waits (polling every 5 seconds) for Gemini to process the video.
7. Once processing is complete, a prompt is sent to `gemini-2.5-flash` requesting a strict JSON report detecting:
   - Accidents
   - Theft/Robbery
   - Harassment
   - Kidnapping
   - Suspicious Activities
8. The generated JSON report is captured, and the video file is cleaned up from both Google's servers and local `/tmp` storage.

## Deployment Steps

A `build.ps1` PowerShell script handles the packaging of the deployment ZIP.

1. **Build the Deployment Package:**
   Navigate to the `CTC-Cloud_Infra` directory and run the script:
   ```powershell
   .\build.ps1
   ```
   This script creates a build directory, installs `google-genai` for Linux, copies `ctc-ai-analyser.py` as `lambda_function.py`, and zips everything into `lambda_deployment.zip`.

2. **Upload to AWS Lambda:**
   - In the AWS Management Console, navigate to the Lambda function.
   - Under the "Code" tab, select "Upload from" > ".zip file" and upload `lambda_deployment.zip`.

3. **Configure Environment Variables:**
   - Navigate to Configuration > Environment variables.
   - Add `GEMINI_API_KEY` and set it to your Google AI Studio API key.

4. **Adjust Timeout:**
   - Navigate to Configuration > General configuration.
   - **Crucial:** Change the timeout from the default 3 seconds to at least **5 minutes**, as uploading and processing video files is a long-running operation.

## Error Handling & Retries

- **SQS Retries:** If the Lambda function crashes (e.g., due to a timeout or missing API keys), it will throw an Exception. This forces the message back into the SQS queue, which will retry the event once the visibility timeout expires. This guarantees no video events are lost.
- **Model Name Fallback:** Google occasionally updates model API versions. The script uses `gemini-2.5-flash` but includes a fallback block to query `client.models.list()` to dump available models into CloudWatch logs if a `404 Not Found` occurs.
