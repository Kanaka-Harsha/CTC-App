# 🗄️ Backend Learning: Database Schema (SQL)

Here is the complete and corrected raw SQL script to generate both the `users` and `reports` tables for the CTC application.

## 1. The Users Table
*Note: We changed `INTEGER` to `SERIAL` so the database automatically increments the ID (1, 2, 3...) when a new user registers. We also fixed the typo `CURRENT_TIMWSTAMP`.*

```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    phone_no VARCHAR(10) UNIQUE NOT NULL,
    aadhaar_hash VARCHAR(300) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 2. The Reports (Incidents) Table
This table stores all the details captured by the frontend UI, plus a Foreign Key linking it back to the `users` table.

```sql
CREATE TABLE reports (
    id SERIAL PRIMARY KEY,
    
    -- Foreign Key: Links this report to the specific user who uploaded it
    user_id INTEGER NOT NULL,
    CONSTRAINT fk_user FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    -- Incident Details (from the frontend form)
    incident_date_time TIMESTAMP NOT NULL,
    location VARCHAR(255) NOT NULL,
    incident_type VARCHAR(50) NOT NULL, -- e.g., 'accident', 'redlight'
    description TEXT,
    
    -- Involved Parties
    vehicle_numbers VARCHAR(255),
    witness_details TEXT,
    
    -- System / AWS Details
    s3_media_url TEXT NOT NULL,         -- The link to the actual video in AWS S3
    ai_status VARCHAR(50) DEFAULT 'Pending', -- Can be updated later by the Lambda function
    
    -- When the report was actually submitted to our system
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## What is a Foreign Key (`FOREIGN KEY`)?
In the `reports` table, `user_id` is a Foreign Key. This tells PostgreSQL: "The number inside `user_id` MUST perfectly match an `id` that already exists in the `users` table." 

The `ON DELETE CASCADE` part means if a user deletes their account from the `users` table, all of their submitted reports are automatically deleted as well.
