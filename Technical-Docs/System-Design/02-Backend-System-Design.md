# Backend System Design Concepts

The Backend serves as the secure orchestration layer for the CTC application. It is intentionally kept lightweight, delegating heavy processing to cloud-native services.

## 1. High-Performance Asynchronous Framework
The backend uses **FastAPI** (Python). FastAPI is built on ASGI (Asynchronous Server Gateway Interface), allowing it to handle thousands of concurrent connections efficiently, which is critical for an application expecting burst traffic during peak commute hours.

## 2. API Rate Limiting (Throttling)
To protect the system from DDoS attacks, bot abuse, and brute-force OTP attempts, the backend implements rate limiting using `slowapi` (e.g., limiting login requests to `3/minute`). This ensures the API remains available for legitimate users.

## 3. Stateless Authentication
The system uses stateless authentication (JWT tokens / OTP). The backend does not need to store session states in memory or a database (like Redis) for every user. This makes the backend **horizontally scalable**—you can add more EC2 instances without worrying about sticky sessions.

## 4. Offloading Compute-Intensive Tasks
The backend does **NOT** process videos or run AI models directly. Its primary roles are:
- Validating users.
- Generating AWS Pre-signed URLs for S3.
- Saving metadata to the database.
By decoupling the video processing into an **Event-Driven Pipeline** (S3 -> SQS -> Lambda), the backend remains fast and responsive to HTTP requests.

## 5. Secure Data Hashing
Sensitive PII (Personally Identifiable Information) such as Aadhaar numbers are never stored in plain text. The backend hashes these values using `SHA-256` combined with a cryptographic salt (`AADHAAR_SALT`), ensuring that even if the database is compromised, user identities remain secure.
