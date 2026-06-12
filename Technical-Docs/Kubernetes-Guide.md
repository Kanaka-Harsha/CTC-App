# Kubernetes Guide & Project Setup

This document explains the basics of Kubernetes (K8s) and provides a step-by-step guide to deploying your containerized application to a K8s cluster.

## 1. What is Kubernetes?

Kubernetes is a powerful open-source system for managing containerized applications across multiple hosts. It provides basic mechanisms for deployment, maintenance, and scaling of applications.

### Key Concepts:
- **Node**: A worker machine in Kubernetes (can be a VM or physical machine).
- **Cluster**: A set of worker machines (Nodes) running containerized applications.
- **Pod**: The smallest deployable unit in Kubernetes. A Pod contains one or more containers (like your Docker containers).
- **Deployment**: Tells Kubernetes how to create or modify instances of the Pods that hold a containerized application. It handles scaling and self-healing.
- **Service**: An abstract way to expose an application running on a set of Pods as a network service. This gives your application a stable IP address and DNS name.

---

## 2. Project Setup: Step-by-Step

Before proceeding, ensure your images are built and pushed to a container registry (like Docker Hub), or if you are using Minikube locally, you can build them directly inside the Minikube environment.

Create a folder named `k8s` in your project root to store these files.

### Step 1: PostgreSQL Manifests
Create `k8s/postgres.yaml` to deploy the database.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: postgres-deployment
spec:
  replicas: 1
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
      - name: postgres
        image: postgres:15-alpine
        env:
        - name: POSTGRES_USER
          value: postgres
        - name: POSTGRES_PASSWORD
          value: mysecretpassword
        - name: POSTGRES_DB
          value: ctc_db
        ports:
        - containerPort: 5432
---
apiVersion: v1
kind: Service
metadata:
  name: postgres-service
spec:
  selector:
    app: postgres
  ports:
    - protocol: TCP
      port: 5432
      targetPort: 5432
```

### Step 2: FastAPI Backend Manifests
Create `k8s/backend.yaml`. 
*(Note: Replace `your-dockerhub-username/ctc-backend:latest` with your actual image name).*

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend-deployment
spec:
  replicas: 2 # Runs 2 instances of your backend for high availability
  selector:
    matchLabels:
      app: backend
  template:
    metadata:
      labels:
        app: backend
    spec:
      containers:
      - name: backend
        image: your-dockerhub-username/ctc-backend:latest
        imagePullPolicy: IfNotPresent
        env:
        - name: DATABASE_URL
          value: postgresql://postgres:mysecretpassword@postgres-service:5432/ctc_db
        ports:
        - containerPort: 8000
---
apiVersion: v1
kind: Service
metadata:
  name: backend-service
spec:
  selector:
    app: backend
  ports:
    - protocol: TCP
      port: 8000
      targetPort: 8000
```

### Step 3: React Frontend Manifests
Create `k8s/frontend.yaml`.
*(Note: Replace `your-dockerhub-username/ctc-frontend:latest` with your actual image name).*

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: frontend-deployment
spec:
  replicas: 2
  selector:
    matchLabels:
      app: frontend
  template:
    metadata:
      labels:
        app: frontend
    spec:
      containers:
      - name: frontend
        image: your-dockerhub-username/ctc-frontend:latest
        imagePullPolicy: IfNotPresent
        ports:
        - containerPort: 80
---
apiVersion: v1
kind: Service
metadata:
  name: frontend-service
spec:
  type: NodePort # Makes the frontend accessible from outside the cluster
  selector:
    app: frontend
  ports:
    - protocol: TCP
      port: 80
      targetPort: 80
      nodePort: 30080 # Accessible at http://<node-ip>:30080
```

### Step 4: Deploying to the Cluster

Once you have your local cluster (like Minikube or Docker Desktop's Kubernetes) running, open your terminal and apply the manifests:

```bash
# 1. Apply the database
kubectl apply -f k8s/postgres.yaml

# 2. Apply the backend
kubectl apply -f k8s/backend.yaml

# 3. Apply the frontend
kubectl apply -f k8s/frontend.yaml

# Check the status of your Pods
kubectl get pods

# Check your Services
kubectl get services
```

Once everything is running, you can access your frontend at `http://localhost:30080` (or the IP provided by your specific Kubernetes environment).
