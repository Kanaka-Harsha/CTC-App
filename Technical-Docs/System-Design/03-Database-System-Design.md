# Database System Design Concepts

The CTC platform utilizes **PostgreSQL** (AWS RDS) to ensure data integrity, complex querying capabilities, and strict ACID compliance for incident reporting.

## 1. Relational Data Modeling & ACID Compliance
PostgreSQL provides strong consistency. This guarantees that when an incident is reported and linked to a user, the transaction is completely secure and atomic, avoiding orphaned records or partial data writes.

## 2. Master/Read Replica Architecture
To handle scalability, the database architecture supports **Read Replicas** (as noted in the architecture overview).
- **Master Node**: Handles all `INSERT` and `UPDATE` queries (e.g., new user registrations, submitting new reports).
- **Read Replicas**: Handle `SELECT` queries (e.g., authorities viewing incident dashboards). This separates the write-heavy traffic from the read-heavy traffic, preventing database locks and slow response times.

## 3. JSONB for Schema Flexibility
Traffic incidents have unpredictable metadata (e.g., varying AI labels from Rekognition/YOLO like vehicle type, color, license plate). Instead of creating dozens of nullable columns, the database uses PostgreSQL's `JSONB` data type (`ai_labels`). This provides the flexibility of a NoSQL database while maintaining relational integrity.

## 4. Spatial Data Types (PostGIS)
The `Incidents` table uses the `POINT` spatial data type for `gps_metadata`. This allows the system to perform highly efficient geographical queries (e.g., "Find all accidents within a 5km radius of this intersection"), which is crucial for traffic analysis dashboards.

## 5. Data Normalization
The database is highly normalized (separating `Users` and `Incidents` using foreign keys like `user_id`). This eliminates data redundancy, ensuring that user information (like an updated phone number) only needs to be changed in one place.
