<h1>📹 Citizen Traffic Camera (CTC)</h1>
  <p><strong>A Cloud-Native Evidence Portal for Traffic Incident Reporting & Analysis</strong></p>

<p>
    <img src="https://img.shields.io/badge/Frontend-React-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React" />
    <img src="https://img.shields.io/badge/Backend-Python-3776AB?style=flat-square&logo=python&logoColor=white" alt="Python" />
    <img src="https://img.shields.io/badge/Database-PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white" alt="PostgreSQL" />
    <img src="https://img.shields.io/badge/Cloud-AWS-232F3E?style=flat-square&logo=amazon-aws&logoColor=white" alt="AWS" />
    <img src="https://img.shields.io/badge/AI-Rekognition%20%7C%20YOLO-FF6F00?style=flat-square" alt="AI/ML" />
  </p>
</div>

---

## 📖 Overview

The **Citizen Traffic Camera (CTC)** platform addresses the critical loss of incident data by providing a centralized, highly scalable portal for citizens to submit dashcam and CCTV footage. It empowers authorities with actionable, AI-analyzed evidence to enhance road safety and enforce traffic regulations effectively.

### 🌟 Key Features

- **Resilient Uploads:** Direct-to-cloud multipart uploads (5MB slices) ensure reliability even on shaky 3G/4G mobile networks.
- **Automated Intelligence:** Asynchronous event-driven pipelines automatically extract metadata (e.g., vehicle types, collision detection) using AWS Rekognition and custom YOLO models.
- **Secure Authentication:** Stateless JWT-based authentication paired with Mobile OTP for seamless and secure access.
- **Scalable Infrastructure:** Designed with an event-driven architecture utilizing AWS S3, SQS, and Lambda to handle high traffic spikes seamlessly.
- **Cost-Optimized Storage:** S3 Lifecycle policies automatically transition aging evidence to Glacier Deep Archive.

---

## 🏗️ System Architecture

Our cloud-native architecture is built for **resilience, high availability, and performance**. The frontend securely streams large video files directly to S3 via pre-signed URLs, bypassing the application backend. An event-driven pipeline then processes the evidence asynchronously.

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
    H[🧠 AWS Rekognition / YOLO]:::aws

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

| Domain                     | Technologies                                |
| :------------------------- | :------------------------------------------ |
| **Frontend**               | React, Vite, TailwindCSS, AWS CloudFront    |
| **Backend**                | Python (FastAPI/Flask), JWT, Boto3          |
| **Database**               | AWS RDS PostgreSQL (Master + Read Replicas) |
| **Cloud & Infrastructure** | AWS S3, SQS, Lambda, WAF, ALB, EC2          |
| **AI / Machine Learning**  | AWS Rekognition, Custom YOLO models         |

---

## 🗄️ Data Schema Overview

The database is heavily normalized to ensure data integrity and efficient querying.

### 👥 Users Table

| Column         | Type      | Description                  |
| :------------- | :-------- | :--------------------------- |
| `user_id`      | UUID      | Primary Key                  |
| `phone_number` | VARCHAR   | Encrypted contact info       |
| `aadhaar_hash` | VARCHAR   | Redacted national identifier |
| `created_at`   | TIMESTAMP | Account creation date        |

### 📹 Incidents Table

| Column          | Type    | Description                             |
| :-------------- | :------ | :-------------------------------------- |
| `incident_id`   | UUID    | Primary Key                             |
| `user_id`       | UUID    | Foreign Key (Users)                     |
| `incident_type` | VARCHAR | Type (e.g., Collision, Violation)       |
| `s3_uri`        | VARCHAR | Direct link to evidence                 |
| `gps_metadata`  | POINT   | Geographical coordinates                |
| `ai_labels`     | JSONB   | Extracted insights (Vehicle type, etc.) |

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v18+)
- Python (3.10+)
- PostgreSQL installed locally or via Docker
- AWS CLI configured with appropriate IAM permissions

### Installation & Setup

1. **Clone the Repository**

   ```bash
   git clone https://github.com/your-org/ctc_app.git
   cd ctc_app
   ```

2. **Environment Variables**
   Create a `.env` file in the root directory (reference the `.env.example` file if available).

   ```env
   DATABASE_URL=postgresql://user:password@localhost:5432/ctc_db
   AWS_ACCESS_KEY_ID=your_access_key
   AWS_SECRET_ACCESS_KEY=your_secret_key
   AWS_REGION=us-east-1
   S3_BUCKET_NAME=ctc-evidence-bucket
   JWT_SECRET=your_jwt_secret
   ```

3. **Backend Setup**

   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   python manage.py migrate
   python app.py
   ```

4. **Frontend Setup**

   ```bash
   cd frontend
   npm install
   npm run dev
   ```

---

<div align="center">
  <p>Built for the community, secured by the cloud. ☁️🛡️</p>
</div>
