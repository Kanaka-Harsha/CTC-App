CREATE TABLE users (
	id SERIAL PRIMARY KEY UNIQUE NOT NULL,
	name VARCHAR(100) NOT NULL,
	phone_no VARCHAR(10) UNIQUE NOT NULL,
	email VARCHAR(50) NOT NULL,
	aadhaar_hash VARCHAR(300) UNIQUE NOT NULL,
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE reports (
	id SERIAL PRIMARY KEY UNIQUE NOT NULL,
	user_id INTEGER NOT NULL,
	CONSTRAINT fk_user FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,

	incident_ts TIMESTAMP NOT NULL,
	incident_location VARCHAR(200) NOT NULL,
	incident_type VARCHAR(50) NOT NULL,
	description TEXT,

	video_link TEXT NOT NULL,
	ai_status VARCHAR(50) DEFAULT 'PENDING',
	ai_report TEXT DEFAULT 'PENDING',

	report_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP	
);

DROP TABLE users CASCADE;
DROP TABLE reports CASCADE;

SELECT * FROM users;
SELECT * FROM reports;
DELETE FROM users;


ALTER TABLE users
ADD user_location VARCHAR(200);

psql -h ctc-database.cp42a6gsihil.ap-south-1.rds.amazonaws.com -p 5432 -U ctc_postgres -d ctc_postgres
# sudo systemctl restart ctc-backend
# sudo systemctl status ctc-backend
# ctc-backend