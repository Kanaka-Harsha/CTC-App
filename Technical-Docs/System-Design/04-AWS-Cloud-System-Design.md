# AWS Cloud System Design Concepts

The cloud infrastructure for the CTC platform follows a highly resilient, event-driven, and scalable microservices pattern.

## 1. Event-Driven Architecture (Decoupling)
The core of the video processing pipeline relies on an event-driven design:
- **S3 Event Notifications**: When a user uploads a video to S3, an event is automatically generated.
- **SQS (Simple Queue Service)**: The event is sent to a queue. This acts as a buffer. If thousands of videos are uploaded simultaneously, the system won't crash; the queue simply holds the messages.
- **AWS Lambda**: Serverless compute pulls from the SQS queue to process the videos asynchronously.

## 2. Cost-Optimized Storage (S3 Lifecycle Policies)
Video files consume massive amounts of storage. The system uses **AWS S3 Lifecycle Rules**:
- **Standard Tier**: Used for the first 30-90 days for quick access by authorities.
- **Glacier / Deep Archive**: Videos older than a specific threshold are automatically transitioned to cheaper, cold storage for legal compliance without incurring massive S3 Standard costs.

## 3. High Availability (ALB & ASG)
- **Application Load Balancer (ALB)**: Distributes incoming API traffic across multiple backend servers, preventing any single server from becoming overwhelmed.
- **Auto Scaling Groups (ASG)**: Automatically spins up new EC2 instances during high traffic periods and spins them down during off-hours to save costs.
- **Multi-AZ**: Resources are deployed across multiple Availability Zones to ensure the system survives data center failures.

## 4. Edge Security & Delivery (CloudFront & WAF)
- **CloudFront**: Serves the React frontend globally with low latency.
- **AWS WAF (Web Application Firewall)**: Sits in front of the ALB and CloudFront to block malicious traffic, SQL injection attempts, and excessive rate-limit abusers before they even reach the backend servers.

## 5. Managed AI/ML Services
Instead of managing complex ML infrastructure, the system utilizes **AWS Rekognition** alongside custom YOLO models on AWS. This provides scalable, on-demand compute for object detection (identifying vehicles, pedestrians, and license plates) without maintaining expensive, always-on GPU instances.
