# AWS High Availability Backend and Database Migration Guide

Congratulations on migrating your frontend to AWS! The next step is to migrate your backend (FastAPI) and your PostgreSQL database into a robust, high-availability architecture on AWS. 

In this setup, we will use a Virtual Private Cloud (VPC) with Public and Private Subnets, an Application Load Balancer (ALB), an Auto Scaling Group (ASG), and RDS.

---

## 1. Network Architecture Setup (VPC & Subnets)

To ensure high security and availability, we separate public-facing resources from private backend resources.

1. **Create a VPC**: e.g., CIDR `10.0.0.0/16`.
2. **Create Subnets**:
   - **Public Subnets** (at least in 2 Availability Zones): For the ALB and NAT Gateway.
   - **Private Subnets** (at least in 2 Availability Zones): For the EC2 instances and the RDS database.
3. **Internet Gateway (IGW)**: Create and attach it to your VPC. Update the Public Route Table to point `0.0.0.0/0` to the IGW.
4. **NAT Gateway**: Create a NAT Gateway in one of the Public Subnets. Update the Private Route Table to point `0.0.0.0/0` to this NAT Gateway. This allows your private EC2 instances to download updates and packages from the internet without being publicly accessible.

---

## 2. Migrating PostgreSQL Database to AWS RDS (Private Subnet)

Your database should be completely hidden from the public internet.

1. **Create a DB Subnet Group**:
   - Navigate to RDS > Subnet groups.
   - Create a group and select your **Private Subnets**.
2. **Security Group for RDS**:
   - Create a Security Group (e.g., `rds-sg`).
   - Allow incoming traffic on port `5432` **only** from the Security Group attached to your EC2 instances (`ec2-sg`).
3. **Create Database**:
   - Engine: PostgreSQL.
   - Connectivity: Use your custom VPC, select the DB Subnet Group created above.
   - Public access: **No**.
   - VPC security groups: Attach `rds-sg`.
4. **Migrate Data**:
   - Since the RDS is private, you can't connect from your local laptop directly. You must spin up a temporary "Bastion Host" (a small EC2 instance in the public subnet), SSH into it, and from there run `pg_dump` and `psql` to migrate your data.

---

## 3. EC2 Auto Scaling Group (ASG) (Private Subnet)

Instead of a single EC2 instance, you will use an Auto Scaling Group. This ensures that if an instance goes down, a new one spins up, and if traffic spikes, more instances are added.

1. **Create a Security Group for EC2 (`ec2-sg`)**:
   - Allow incoming traffic on port `80` (or `8000`) **only** from the ALB Security Group (`alb-sg`).
2. **Create a Launch Template**:
   - AMI: Ubuntu 22.04/24.04.
   - Instance Type: `t2.micro` or similar.
   - Security Group: Attach `ec2-sg`.
   - **User Data**: Scroll to advanced details and provide a bash script that runs when the instance boots. It should install dependencies, clone your code (or download from S3), set up env variables, and start FastAPI.
     ```bash
     #!/bin/bash
     apt update
     apt install python3-pip python3-venv git nginx -y
     # Clone your repo, pull env variables from AWS Parameter Store/Secrets Manager
     # Install python requirements and start Gunicorn/Uvicorn on port 8000
     ```
3. **Create the Auto Scaling Group (ASG)**:
   - Use the Launch Template.
   - VPC: Select your custom VPC.
   - Subnets: Select the **Private Subnets**.
   - Scaling Policies: Target tracking policy based on average CPU utilization (e.g., keep at 50%). Set min instances to 2 and max to 5.

---

## 4. Application Load Balancer (ALB) (Public Subnet)

The ALB is the only entry point to your backend from the public internet.

1. **Create a Security Group for ALB (`alb-sg`)**:
   - Allow HTTP (port 80) and HTTPS (port 443) from Anywhere (`0.0.0.0/0`).
2. **Create a Target Group**:
   - Target Type: Instances.
   - Protocol: HTTP on port 8000 (or port 80 if you run Nginx on EC2).
   - Attach this Target Group to your ASG during creation or edit the ASG to include it.
3. **Create the Application Load Balancer (ALB)**:
   - Scheme: Internet-facing.
   - VPC: Select your custom VPC.
   - Subnets: Select the **Public Subnets**.
   - Security Group: Attach `alb-sg`.
   - Configure Listeners: 
     - Forward HTTP (80) traffic to HTTPS (443).
     - Attach an AWS Certificate Manager (ACM) SSL Certificate to the HTTPS (443) listener and forward traffic to your Target Group.

---

## 5. How the UI Communicates with the Backend

With this architecture, the flow is highly secure and scalable.

### A. Update the Frontend API Base URL
In your React/Frontend code, point your API calls to the **ALB's DNS name**, or preferably, a custom domain that points to the ALB.

**.env.production** (in your frontend):
```env
REACT_APP_API_BASE_URL=https://api.yourdomain.com
```

### B. Configure CORS on the Backend
Update your `main.py` CORS setup to allow traffic from your frontend S3/CloudFront domain:
```python
frontend_url = os.getenv("FRONTEND_URL", "https://your-frontend-domain.com")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[frontend_url], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Summary of the Flow:
1. **User interacts with UI** (Hosted on AWS S3/CloudFront).
2. **UI makes an HTTPS request** to `https://api.yourdomain.com`.
3. **AWS Route 53** routes `api.yourdomain.com` to the **Application Load Balancer (ALB)** in your Public Subnet.
4. **ALB** terminates the SSL connection and forwards the request via HTTP to one of the **EC2 instances (ASG)** running in a Private Subnet.
5. **FastAPI (EC2)** processes the request, securely connecting to the **RDS PostgreSQL** database in another Private Subnet.
6. **FastAPI** returns the JSON response back through the ALB to the UI.
