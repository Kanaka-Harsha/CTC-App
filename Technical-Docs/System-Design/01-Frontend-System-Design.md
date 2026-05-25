# Frontend System Design Concepts

The Frontend of the Citizen Traffic Camera (CTC) application is built for high performance, mobile resilience, and scalability. Below are the key system design concepts implemented:

## 1. Single Page Application (SPA) with Vite & React
The app uses **React** combined with **Vite**. Vite provides lightning-fast Hot Module Replacement (HMR) during development and highly optimized static assets for production, improving the initial load time and overall Core Web Vitals.

## 2. Progressive Web App (PWA)
The `package.json` includes `vite-plugin-pwa`, indicating that the frontend acts as a Progressive Web App.
- **Offline Capabilities**: Caches static assets, allowing the app to load even with poor network conditions.
- **Installability**: Citizens can "install" the web app on their home screens without navigating through app stores, increasing adoption rates.

## 3. Direct-to-Cloud Uploads (Bypassing the Backend)
Instead of sending 50MB+ video files to the backend server (which would cause massive network bottlenecks and require high compute resources), the frontend implements **Direct S3 Uploads**:
1. The frontend requests a short-lived **Pre-signed URL** from the backend.
2. The frontend directly uploads the file to the AWS S3 bucket.
3. This significantly reduces the backend load, shifting the bandwidth burden directly to AWS's edge network.

## 4. Edge Caching & Content Delivery Network (CDN)
The frontend build (`dist/`) is deployed to an S3 bucket and served via **AWS CloudFront** (as seen in `deploy.sh`). CloudFront caches the static files at edge locations globally. This means users access the UI from a server physically closest to them, minimizing latency.

## 5. Responsive & Utility-First Styling
The application uses **TailwindCSS**, a utility-first CSS framework. This approach ensures a minimal CSS footprint (only used classes are bundled) and guarantees that the UI is responsive across all devices (mobile, tablet, desktop).
