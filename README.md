<div align="center">

# 📹 Citizen Traffic Camera (CTC)
### *A Case Study on Smart Traffic Incident Reporting & Automated AI Video Analysis*

  <p>
    <img src="https://img.shields.io/badge/Frontend-React-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React" />
    <img src="https://img.shields.io/badge/Backend-Python-3776AB?style=flat-square&logo=python&logoColor=white" alt="Python" />
    <img src="https://img.shields.io/badge/Database-PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white" alt="PostgreSQL" />
    <img src="https://img.shields.io/badge/Cloud-AWS-232F3E?style=flat-square&logo=amazon-aws&logoColor=white" alt="AWS" />
    <img src="https://img.shields.io/badge/AI-Rekognition%20%7C%20Gemini-FF6F00?style=flat-square" alt="AI/ML" />
  </p>
</div>

---

## 📜 Case Study

### 🌐 Context & Background

Road safety and traffic enforcement rely heavily on clear, trustworthy evidence. Every day, citizens record crucial evidence of traffic violations, accidents, hit-and-run incidents, and dangerous driving on their car dashcams, action cameras, or smartphones. However, traffic management authorities and citizens face major real-world hurdles:

1. **Slow & Unreliable Video Submissions:** Large video files are hard to send through standard websites. Submissions take forever, fail halfway through, or crash the platform during high-traffic times.
2. **Slow Manual Video Processing:** Police and traffic officers don't have time to manually watch hours of raw footage to figure out what violation occurred, where, and when.
3. **Citizen Privacy Concerns:** People want to report bad drivers and help their communities, but they fear submitting their personal ID numbers or phone numbers might leak or be misused.

---

### 🎯 Case Study Narrative

#### The Problem
When traffic violations occur, evidence often exists on citizen devices, but there is no simple, reliable, and privacy-safe way to get that evidence to traffic authorities. Existing reporting methods are slow, prone to upload failures, require manual video reviews by officers, and fail to reassure citizens about identity protection.

#### What Needed to be Solved
To make citizen traffic reporting effective and widespread, the platform needed to accomplish four major goals:
* **Effortless Video Uploads:** Allow users to submit heavy video files instantly from any browser without long waiting times or server crashes.
* **Instant Automated Incident Detection:** Automatically analyze uploaded videos to detect and categorize what happened (e.g., collisions, reckless driving, red-light violations) so authorities don't have to watch every minute manually.
* **Complete Citizen Privacy & Safety:** Ensure citizen identity and government ID details remain completely private and anonymized from end to end.
* **Smart Storage Management:** Store important evidence safely while automatically archiving older footage so operations remain affordable over time.

#### How I Solved It (What the App Does)
* **Direct High-Speed Media Ingestion:** I built a smart upload feature that streams video files directly to cloud storage in small pieces. Even if a user submits a massive HD dashcam video, it uploads smoothly without slowing down the platform for others.
* **Automated AI Video Assistant:** As soon as a video is uploaded, an intelligent AI engine instantly scans the footage, identifies key events (such as crashes or traffic violations), extracts incident details, and prepares a summarized report for officers.
* **Built-in Identity Shielding:** I implemented strict identity protection that scrambles citizen ID data into protected cryptographic codes. Authorities receive verified evidence without ever exposing citizen identities.
* **Automated Evidence Archival:** Old footage is automatically moved to long-term digital vault storage, keeping active systems fast and storage costs low while ensuring evidence remains available for legal reviews.

#### Real-World Impact & Results
* **Frictionless Citizen Reporting:** Video uploads succeed reliably on the first try, even for heavy video files.
* **Faster Response Times:** Traffic authorities receive pre-analyzed reports with key incident highlights in seconds instead of hours.
* **Guaranteed Identity Privacy:** Citizens can confidently report violations knowing their personal identity is anonymized and protected.
* **Long-Term Operational Efficiency:** Automated video processing and archival keep system maintenance simple, fast, and budget-friendly.

---

### 🏆 Key Outcomes Summary

| Goal | What the App Accomplishes | Real-World Impact |
| :--- | :--- | :--- |
| **Simple Video Submissions** | Direct media streaming to cloud storage | Fast, crash-free uploads for heavy dashcam videos |
| **Instant Incident Analysis** | Automatic AI scanning of video evidence | Pre-summarized violation reports delivered to officers in seconds |
| **Citizen Privacy** | Identity scrambling and encrypted verification | 100% anonymized reporting with protected personal identity |
| **Affordable Long-Term Storage** | Automatic archiving of older evidence | Low operating costs while preserving legal evidence records |

---

## 💻 Technical Implementation & System Details

### 📖 Overview

The **Citizen Traffic Camera (CTC)** platform addresses the compulsory report analysis of traffic authorities and prevents critical loss of incident data by providing a centralized, highly scalable cloud portal for citizens to submit dashcam and CCTV footage. It empowers authorities with actionable, AI-analyzed evidence to enhance road safety and enforce traffic regulations effectively.

### 🌟 Key Features

- **Direct-to-S3 Uploads:** Multipart uploads securely stream heavy evidence directly to S3 via Pre-signed URLs, bypassing the backend server entirely to ensure maximum scalability.
- **Automated Intelligence Pipeline:** An asynchronous, event-driven pipeline automatically extracts critical incident metadata (e.g., Accident, Theft, Harassment details) using the Gemini AI API via an S3 -> SQS -> AWS Lambda flow.
- **Secure Authentication:** Stateless JWT-based authentication paired with Email OTP for seamless access. Aadhaar data is stored with double salted hashes in the database for absolute privacy.
- **Scalable Infrastructure:** Designed with an event-driven architecture utilizing AWS S3, SQS, Lambda, EC2, and RDS to handle high traffic spikes seamlessly.
- **Comprehensive Reporting:** Users can view detailed histories of their submitted reports along with AI analysis results, and securely delete reports permanently from both the database and S3.
- **Cost-Optimized Storage:** S3 Lifecycle policies automatically transition aging evidence to Glacier Deep Archive.

---

## 🏗️ System Architecture

My cloud-native architecture is built for **resilience, high availability, and performance**. The frontend divides large video files into multiple parts and securely streams them directly to S3 via pre-signed URLs, bypassing the application backend. An event-driven pipeline then processes the evidence asynchronously.

### 📚 Technical Documentation & Deep Dives

To deeply understand the inner workings of this platform, please refer to my comprehensive technical documents:

- [📖 Master Comprehensive Architecture](./Technical-Docs/Comprehensive-Architecture.md) - End-to-end overview of the entire system.
- [🖥️ Frontend System Design](./Technical-Docs/System-Design/01-Frontend-System-Design.md)
- [⚙️ Backend System Design](./Technical-Docs/System-Design/02-Backend-System-Design.md)
- [🗄️ Database System Design](./Technical-Docs/System-Design/03-Database-System-Design.md)
- [☁️ AWS Cloud System Design](./Technical-Docs/System-Design/04-AWS-Cloud-System-Design.md)

```mermaid
graph TD
    classDef aws fill:#FF9900,stroke:#232F3E,stroke-width:2px,color:white;
    classDef frontend fill:#61DAFB,stroke:#282C34,stroke-width:2px,color:black;
    classDef backend fill:#3776AB,stroke:#FFD43B,stroke-width:2px,color:white;
    classDef db fill:#336791,stroke:#FFFFFF,stroke-width:2px,color:white;

    A[📱 React Frontend]:::frontend
    B(☁️ AWS S3 Storage):::aws
    C[🛡️ AWS ALB / WAF]:::aws
    D[⚙️ Python REST API]:::backend
    E[(🗄️ RDS PostgreSQL)]:::db
    F[📨 AWS SQS Buffer]:::aws
    G[⚡ AWS Lambda]:::aws
    H[🧠 AWS Rekognition / Gemini]:::aws

    %% Connections
    A -- "1. Request Pre-signed URL" --> C
    C -- "Routes to API" --> D
    D -- "Returns URL" --> A
    A -- "2. Direct Multipart Upload" --> B
    B -- "3. S3 Object Created Event" --> F
    F -- "4. Triggers Execution" --> G
    G -- "5. Analyze Footage" --> H
    H -- "6. Returns Metadata" --> G
    G -- "7. Updates Record" --> D
    D -- "8. Persists Data" --> E
```

---

## 🛠️ Technology Stack

| Domain | Technologies |
| :--- | :--- |
| **Frontend** | React, Vite, TailwindCSS, AWS CloudFront |
| **Backend** | Python (FastAPI/Flask), JWT, Boto3 |
| **Database** | AWS RDS PostgreSQL |
| **Cloud & Infrastructure** | AWS S3, SQS, Lambda, ALB, EC2, VPC |
| **AI / Machine Learning** | AWS Rekognition, Gemini API |

---

## 🗄️ Data Schema Overview

The database is heavily normalized to ensure data integrity and efficient querying.

### 👥 Users Table

| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID | Primary Key |
| `name` | VARCHAR | User's full name |
| `phone_no` | VARCHAR | Encrypted contact info |
| `email` | VARCHAR | User email address |
| `aadhaar_hash` | VARCHAR | Double-hashed national identifier |

### 📹 Reports Table

| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID | Primary Key |
| `user_id` | UUID | Foreign Key (Users) |
| `incident_ts` | TIMESTAMP | Timestamp of the incident |
| `incident_location` | VARCHAR | Geographical location / address |
| `incident_type` | VARCHAR | Type (e.g., Collision, Violation) |
| `description` | TEXT | Description of the incident |
| `video_link` | VARCHAR | Direct link to evidence |

---

## 🧗 Challenges & Learnings

Building a secure, cloud-native application comes with unique hurdles. Here are some of the key challenges I overcame:

### The AWS Networking "Catch-22"

**The Problem:** My AWS Lambda function required internet access to send videos to the Gemini AI API, but it also needed to update my private AWS RDS PostgreSQL database. Placing the Lambda inside the VPC allowed database access but severed internet access (unless I paid for an expensive NAT Gateway). Placing it outside the VPC granted internet access but broke the database connection.

**The Solution:** I architected a cost-effective workaround by making the RDS instance Publicly Accessible and keeping the Lambda outside the VPC. To maintain strict security, I locked down the RDS Security Group's inbound rules. I also had to correctly route the private database subnets to an Internet Gateway so the public IP could successfully return traffic to the Lambda function.

---

## 🚀 Getting Started

### Prerequisites

- Python (3.10+)
- PostgreSQL installed locally
- AWS CLI configured with appropriate IAM permissions

### Installation & Setup

1. **Clone the Repository**

   ```bash
   git clone https://github.com/Kanaka-Harsha/CTC-App.git
   cd CTC-App
   ```

2. **Environment Variables**
   Create a `.env` file in the root directory (reference the `.env.example` file if available).

   ```env
   DATABASE_URL=postgresql://user:password@localhost:5432/ctc_db
   AWS_ACCESS_KEY_ID=your_access_key
   AWS_SECRET_ACCESS_KEY=your_secret_key
   AWS_REGION=ap-south-1
   AWS_VIDEO_BUCKET_NAME=ctc-evidence-bucket
   AADHAAR_SALT=your_salt

   # More mentioned in the .env.example file
   ```

3. **Backend Setup**

   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   cd CTC-BackEnd
   fastapi dev app/main.py
   ```

4. **Frontend Setup**

   ```bash
   cd CTC-FrontEnd
   npm install
   npm run dev
   ```

---

<div align="center">
  <p>Built for the community, secured by the cloud. ☁️🛡️</p>
</div>
