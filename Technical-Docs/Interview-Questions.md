# Citizen Traffic Camera (CTC) - Interview Questions & Answers

This document contains 20 comprehensive interview questions and answers based on the architecture, technical decisions, and implementation details of the Citizen Traffic Camera (CTC) application.

## 1. System Architecture
**Q1: The CTC platform utilizes an event-driven architecture for processing videos. Can you explain the flow from the moment a user submits a video to when the AI report is available?**
**Answer:** The frontend directly uploads the video to an S3 bucket using a pre-signed URL. Upon successful upload, S3 triggers an event that sends a message to an SQS buffer. An AWS Lambda function polls this SQS queue, downloads the video, and sends it to the Gemini AI API for analysis. Once the analysis is complete, the Lambda updates the corresponding record in the PostgreSQL database with the AI report and status.

## 2. Pre-signed URLs
**Q2: Why did you choose to use S3 Pre-signed URLs for video uploads instead of routing the upload through the backend server?**
**Answer:** Routing heavy video uploads through the backend (FastAPI) would consume significant server memory and bandwidth, causing a bottleneck and limiting scalability. Using S3 Pre-signed URLs allows the client to stream multipart video uploads directly to S3, bypassing the backend server entirely, reducing load, and maximizing scalability.

## 3. Database Security
**Q3: How is sensitive PII like the user's Aadhaar number protected in the PostgreSQL database?**
**Answer:** The Aadhaar number is not stored in plaintext. It is concatenated with a backend secret salt (`AADHAAR_SALT`) and then hashed using the SHA-256 algorithm. This ensures that even if the database is compromised, the original Aadhaar numbers cannot be easily reverse-engineered.

## 4. AWS Networking
**Q4: You mentioned the "AWS Networking Catch-22" regarding the Lambda function, VPC, and RDS. What was the exact issue and how was it resolved?**
**Answer:** The Lambda function needed internet access to call the Gemini AI API and private access to update the RDS PostgreSQL database. Placing Lambda in a VPC gave database access but removed internet access (unless using a costly NAT Gateway). The solution was to place the Lambda outside the VPC (granting internet access) and make the RDS instance publicly accessible, but strictly locking down its Security Group inbound rules to ensure security.

## 5. Rate Limiting
**Q5: How do you protect the FastAPI backend from abuse, such as DDoS attacks or brute-forcing the login API?**
**Answer:** We implemented rate-limiting using the `slowapi` library. By wrapping critical endpoints with decorators like `@limiter.limit("3/minute")`, we restrict the number of requests a single IP address can make within a given time frame, preventing spam and brute-force attacks.

## 6. Authentication
**Q6: Can you explain the login mechanism implemented in the backend?**
**Answer:** The login is passwordless and relies on an Email OTP (One-Time Password) system. When a user requests to log in, the backend verifies their email exists in the database. If it does, a 6-digit OTP is generated, temporarily stored in an in-memory dictionary (`otp_cache`), and sent via email. The user then submits this OTP to the `/user/login_check` endpoint for verification.

## 7. AI Integration
**Q7: How does the Lambda function extract structured data from the Gemini AI analysis?**
**Answer:** The Lambda function sends the video to Gemini along with a highly specific prompt instructing the model to return the output *exclusively* as a structured JSON object. The prompt outlines specific categories (Accident, Theft, Harassment, etc.). The Lambda then cleans any markdown formatting from the response, parses the JSON, and updates the database.

## 8. SQS vs Direct Invocation
**Q8: Why use AWS SQS as a buffer between S3 and Lambda instead of having S3 directly trigger the Lambda function?**
**Answer:** SQS acts as a buffer or shock absorber. If traffic spikes and thousands of videos are uploaded simultaneously, direct triggers could overwhelm the database or exceed Lambda concurrency limits (or Gemini API rate limits). SQS queues the events, allowing Lambda to consume and process them at a controlled, sustainable rate.

## 9. Error Handling in the Database
**Q9: How does the backend handle a situation where a user tries to register with an email or phone number that already exists?**
**Answer:** The `users` table has unique constraints on fields like `email`, `phone_no`, and `aadhaar_hash`. If a duplicate is inserted, `psycopg2` throws an `IntegrityError`. The backend catches this error, rolls back the transaction to maintain data consistency, and parses the error message to return a specific, user-friendly 400 Bad Request error.

## 10. Data Deletion
**Q10: When a user deletes a report, how do you ensure there are no orphaned files left in the cloud?**
**Answer:** The deletion endpoint first retrieves the `video_link` from the database. It parses the S3 object key from this URL and uses the `boto3` client to explicitly delete the object from the S3 bucket. Only after the file is successfully deleted from S3 (or attempted) does the backend execute the `DELETE` SQL query to remove the record from the database.

## 11. CORS Configuration
**Q11: Why is CORSMiddleware implemented in the FastAPI application?**
**Answer:** CORS (Cross-Origin Resource Sharing) is a browser security feature. Since the React frontend and FastAPI backend run on different domains or ports (e.g., frontend on port 5173, backend on 8000), the browser blocks requests from the frontend by default. CORSMiddleware is configured to allow requests from specific origins (`ALLOWED_ORIGINS`), enabling frontend-backend communication.

## 12. Frontend Routing
**Q12: How is navigation handled in the React application?**
**Answer:** Client-side routing is handled using `react-router-dom`. The main `App.jsx` wraps the application in a `<BrowserRouter>` (aliased as `Router`) and defines `<Routes>` mapping specific paths (like `/login`, `/upload`, `/history`) to their corresponding React component pages, allowing seamless navigation without page reloads.

## 13. State Management in Lambda
**Q13: Given that AWS Lambda is stateless, how do you handle temporary files, such as downloading the video for Gemini processing?**
**Answer:** Lambda provides a temporary storage directory at `/tmp` with a limited capacity (up to 10GB). The script downloads the video from S3 into this `/tmp` directory, processes it with the Gemini SDK, and explicitly deletes the file (`os.remove(local_file_path)`) in a `finally` block to prevent the environment from running out of space during subsequent invocations.

## 14. Cost Optimization
**Q14: Videos can consume a lot of storage space. How is storage cost optimized over time?**
**Answer:** The S3 bucket is configured with Lifecycle policies. These policies automatically transition aging evidence files (which are rarely accessed after initial processing and viewing) to cheaper storage tiers, such as Glacier Deep Archive, significantly reducing long-term storage costs.

## 15. Handling Long-Running AI Processes
**Q15: The Gemini AI processing takes time. How does the Lambda script handle the wait state?**
**Answer:** The script uploads the video using the Google GenAI SDK and then enters a `while` loop, polling the file's state (`video_file.state.name`). It sleeps for 5 seconds between checks until the status changes from `PROCESSING` to either `ACTIVE` (ready for prompt generation) or `FAILED`.

## 16. React State and Notifications
**Q16: How do you handle user notifications (success/error messages) on the frontend?**
**Answer:** The frontend uses the `react-hot-toast` library. The `<Toaster />` component is placed at the root level (`App.jsx`), and components can trigger non-blocking, visually appealing pop-up notifications (toasts) when API requests succeed or fail.

## 17. Security of Pre-signed URLs
**Q17: If someone intercepts a pre-signed URL, can they upload infinite data and incur costs?**
**Answer:** Pre-signed URLs are intrinsically secure due to their temporary nature. When the backend generates the URL, it sets an `ExpiresIn` parameter (e.g., 3600 seconds/1 hour). After this window, the URL becomes invalid. Furthermore, the URL is tied strictly to a specific object key and bucket, limiting what can be altered.

## 18. Database Connection Lifecycle
**Q18: What is the best practice followed in the FastAPI endpoints for managing database connections?**
**Answer:** A new connection and cursor are instantiated for the request. After the database operations are performed, the connection is either committed (if successful) or rolled back (if an exception occurs). Crucially, the cursor and connection are always closed in a `finally` block to prevent resource leaks and connection pool exhaustion.

## 19. S3 Event Structure Handling
**Q19: How does the Lambda function distinguish between different S3 events (e.g., a file being uploaded vs. deleted) inside the SQS message?**
**Answer:** The Lambda function parses the JSON body of the SQS message. Inside, it iterates through the S3 records and checks the `eventName` field. It actively filters for events that start with `ObjectCreated` and ignores others (like `ObjectRemoved`), ensuring it only attempts to process newly uploaded videos.

## 20. Application Reliability
**Q20: What happens if the Gemini AI API returns an error or times out during Lambda execution?**
**Answer:** The Lambda function wraps the API call in a `try-except` block. If an exception occurs, it catches the error, updates the RDS database row for that specific video to `ai_status = 'FAILED'` and the `ai_report` to "Processing failed". Finally, it re-raises the exception so that SQS knows the processing failed (potentially moving it to a Dead Letter Queue for later analysis), and cleans up the `/tmp` directory.
