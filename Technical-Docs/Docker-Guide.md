# Docker Guide & Project Setup

This document explains the basics of Docker and provides a step-by-step guide to containerizing your React (Vite) frontend, FastAPI backend, and PostgreSQL database.

## 1. What is Docker?

Docker is a tool designed to make it easier to create, deploy, and run applications by using containers. 
- **Image**: A lightweight, standalone, executable package of software that includes everything needed to run an application (code, runtime, system tools, system libraries, and settings).
- **Container**: A running instance of an image. It's isolated from the host machine and other containers.
- **Dockerfile**: A text document that contains all the commands a user could call on the command line to assemble an image.
- **Docker Compose**: A tool for defining and running multi-container Docker applications using a `docker-compose.yml` file.

---

## 2. Project Setup: Step-by-Step

Follow these steps to manually dockerize your project.

### Step 1: Frontend Dockerfile
Your frontend uses React and Vite. We will use a "multi-stage" build. First, we build the static files using Node.js, and then we serve them using a lightweight Nginx server.

Create a file named `Dockerfile` in the `CTC-FrontEnd/` directory and paste this:

```dockerfile
# Stage 1: Build the React application
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine
# Copy the built assets from the builder stage to Nginx's serve directory
COPY --from=builder /app/dist /usr/share/nginx/html
# Expose port 80
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

Create a `.dockerignore` file in `CTC-FrontEnd/`:
```text
node_modules/
dist/
dev-dist/
```

### Step 2: Backend Dockerfile
Your backend uses Python, FastAPI, and psycopg2.

Create a file named `Dockerfile` in the `CTC-BackEnd/` directory and paste this:

```dockerfile
FROM python:3.10-slim

WORKDIR /app

# Install system dependencies required for psycopg2
RUN apt-get update && apt-get install -y libpq-dev gcc

# Copy requirements from the root directory
COPY ../requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the backend code
COPY . .

# Expose the FastAPI default port
EXPOSE 8000

# Run the Uvicorn server (adjust 'app.main:app' if your main file or app variable is named differently)
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

Create a `.dockerignore` file in `CTC-BackEnd/`:
```text
__pycache__/
*.pyc
.env
```

### Step 3: Docker Compose
To run the frontend, backend, and a PostgreSQL database together, we'll use Docker Compose.

Create a file named `docker-compose.yml` in the root directory (`CTC App/`) and paste this:

```yaml
version: '3.8'

services:
  # 1. PostgreSQL Database
  db:
    image: postgres:15-alpine
    container_name: ctc-db
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: mysecretpassword
      POSTGRES_DB: ctc_db
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  # 2. FastAPI Backend
  backend:
    build:
      context: .
      dockerfile: CTC-BackEnd/Dockerfile
    container_name: ctc-backend
    ports:
      - "8000:8000"
    environment:
      # Example environment variables; adjust as needed
      - DATABASE_URL=postgresql://postgres:mysecretpassword@db:5432/ctc_db
    depends_on:
      - db

  # 3. React Frontend
  frontend:
    build:
      context: ./CTC-FrontEnd
    container_name: ctc-frontend
    ports:
      - "8080:80" # Maps port 80 in container to 8080 on your host machine
    depends_on:
      - backend

volumes:
  postgres_data:
```

### Step 4: Run the Application
Open your terminal in the root directory (`CTC App/`) and run:

```bash
docker-compose up --build
```

- Your **Frontend** will be available at `http://localhost:8080`
- Your **Backend API** will be available at `http://localhost:8000`
- Your **Database** will be running on `localhost:5432`
