# CTC App: Comprehensive Architecture Document

This document provides an end-to-end overview of the Citizen Traffic Camera (CTC) Application's architecture, including the codebase structure, endpoints, cloud infrastructure, and the core system design concepts implemented.

## 1. System Design Concepts Utilized

- **Event-Driven Architecture:** The AI video analysis pipeline is fully asynchronous and event-driven. An upload to S3 triggers an event notification to an SQS queue, which then invokes a serverless Lambda function. This decouples the heavy video processing from the user-facing web server.
- **Offloaded File Storage (Pre-signed URLs):** To prevent the backend server from bottlenecking during large video uploads, the frontend asks the backend for a secure AWS S3 Pre-signed URL. The frontend then streams the heavy multipart file directly to the S3 bucket, completely bypassing the backend server's memory and bandwidth limits.
- **Serverless Computing:** Background processing is handled by AWS Lambda, ensuring that we only pay for the exact compute time used while processing videos, and can infinitely scale during traffic spikes.
- **State Segregation:** We segregate application state across layers:
  - Relational Data: Stored in a heavily normalized AWS RDS PostgreSQL instance.
  - Object/Blob Data: Stored in AWS S3.
  - Session/Auth Data: Stateless JWT tokens managed via localStorage on the client.

---

## 2. Codebase Breakdown

### 💻 A. Frontend Architecture (`CTC-FrontEnd`)

Built with **React, Vite, and TailwindCSS**. It serves as the primary interface for citizens to upload evidence and view their reports.

#### Key Components & Files
* **`src/pages/UploadEvidence.jsx`**
  * **Role:** Handles the incident reporting form and video upload process.
  * **Flow:**
    1. Grabs user's GPS coordinates using `navigator.geolocation` and reverse-geocodes it via Nominatim.
    2. Requests a Pre-signed URL from the backend.
    3. Uploads the raw video directly to AWS S3.
    4. Submits the form metadata (and the resulting S3 link) to the backend database.
  * **Features:** Robust error handling, non-technical user-friendly toast notifications, and `[DEV]` console logging for easy debugging.

* **`src/pages/ReportHistory.jsx`**
  * **Role:** Displays the user's past reports and the results of the AI analysis.
  * **Flow:** Fetches data from the backend. Parses the `ai_report` JSON field to display structured accident/theft details.
  * **Features:** Contains the **Delete Report** functionality which calls the backend to remove both the database row and the S3 video file.

* **`src/pages/Login.jsx` & `Register.jsx`**
  * **Role:** Handles stateless JWT-based authentication.

---

### ⚙️ B. Backend Architecture (`CTC-BackEnd/app/main.py`)

Built with **Python and FastAPI**. Acts as the orchestration layer between the database, the frontend, and AWS S3 security.

#### Database Connection
Utilizes `psycopg2` to connect to an **AWS RDS PostgreSQL** instance. Connection strings are injected via environment variables (`DB_HOST`, `DB_USER`, etc.).

#### Key API Endpoints
* **`POST /user/register` & `POST /user/login_check`**
  * Handles secure user onboarding and generates JWT tokens.
  
* **`GET /report/presigned-url`**
  * **Role:** Security gateway for S3 uploads.
  * **Logic:** Uses `boto3.client('s3').generate_presigned_url()` to create a temporary, secure upload link for the frontend to use.
  
* **`POST /report/submit`**
  * **Role:** Persists the incident metadata.
  * **Logic:** Inserts a new row into the `reports` table with default AI statuses (`PENDING`).
  
* **`GET /report/history`**
  * **Role:** Retrieves reports.
  * **Logic:** Queries the `reports` table by user email and returns a JSON array of historical incidents and AI analysis strings.

* **`GET /report/history/delete?report_id={id}`**
  * **Role:** Permanently deletes a report.
  * **Logic:** First queries the DB to find the specific AWS S3 `video_link`. It then executes a `DELETE` SQL statement, and finally uses `boto3` to delete the physical video file from the S3 bucket to prevent zombie storage costs.

---

### ☁️ C. Cloud Infrastructure & AI Pipeline (`CTC-Cloud_Infra/ctc-ai-analyser.py`)

This is the core of the automated evidence processing system. It runs purely on AWS infrastructure without interfering with the FastAPI backend.

#### Architecture Flow
1. **AWS S3 Bucket:** Receives the direct video upload from the frontend.
2. **AWS SQS Queue:** S3 fires an `ObjectCreated` event which buffers into an SQS Queue. This ensures that massive spikes in uploads don't crash the system; messages are processed sequentially.
3. **AWS Lambda (`ctc-ai-analyser.py`):** Polling the SQS queue, it executes the following logic:

#### The Lambda Script Logic
* **Step 1: Download:** Uses `boto3` to download the video file from S3 into the Lambda's temporary `/tmp` storage.
* **Step 2: AI Processing:** Initializes the Google `genai.Client`. It uploads the video directly to the **Gemini API** and issues a strict prompt requiring a JSON-structured analysis focusing on 5 categories: Accidents, Theft, Harassment, Kidnapping, and Suspicious Activities.
* **Step 3: Database Update:** Once Gemini returns the JSON analysis, the Lambda function directly connects to the **RDS PostgreSQL Database**. It executes an `UPDATE` query matching the S3 `video_link`, changing `ai_status` to `COMPLETED` and saving the raw JSON into the `ai_report` column.

#### Cloud Networking Strategy
The RDS instance is set to **Publicly Accessible**, with a highly restricted Security Group allowing inbound PostgreSQL traffic. The Lambda function runs **outside the VPC**. This specific architectural choice eliminates the need for an expensive AWS NAT Gateway, granting the Lambda function simultaneous access to the public internet (for Gemini API calls) and the public-facing RDS database.
