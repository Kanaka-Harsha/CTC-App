"Kanoon kitna bhi andha ho, humare cameras tho kabhi nahi honge." 👁️📹

Few months back, while I was scrolling through my instagram reels, I was disturbed by the endless flood of dashcam videos which displayed reckless accidents, open robberies, street harassment, and even kidnappings. 

I was like—why are thousands of these crucial incident videos scattered across social media just for views, while the culprits get away without any fear? This is because authorities have no centralized way to collect and verify this evidence during real emergencies.

That question became the foundation of my app - **Citizen Traffic Camera (CTC)**. I decided to build a cloud-native platform where citizens can securely upload incident footage right from their phones, while an automated AI pipeline instantly analyzes and organizes the evidence—bridging the gap between public awareness and actual law enforcement action(If authorities are enforced to review each report and take action.). 🚦☁️

### Technical Implementation

Here's a quick look at how I built it:

• **Backend:** Engineered a high-performance REST API using **Python and FastAPI**, deployed on **Amazon EC2** to orchestrate secure workflows using rate-limiting and providing data processing.
• **Frontend:** Built the entire **React UI** using highly optimized AI prompts, allowing me to rapidly develop a responsive UI, based on my idea and backend needs.🤖
• **Database:** Leveraged **PostgreSQL on Amazon RDS** with a strict schema for resilient data tracking.
• **Storage & Network:** Implemented direct-to-cloud uploads. Videos stream straight to **Amazon S3** via pre-signed URLs (bypassing backend bottlenecks) with Glacier Deep Archive for cost-efficient retention. ☁️
• **Security:** Protected sensitive citizen data using salted SHA-256 double-hashing and implemented a secure **Email OTP** workflow for seamless authentication. 🛡️
• **AI Pipeline:** Designed an event-driven architecture utilizing **Amazon SQS, AWS Lambda, AWS Rekognition**, and **Gemini APIs** to automatically analyze footage the moment it hits storage. The AI instantly categorizes the evidence into 5 critical areas (Accidents, Theft, Harassment, Kidnapping, or Suspicious Activities) and extracts metadata like vehicle number plates. ⚡

So far, I’ve got a solid MVP up and running that handles scalable uploads and AI processing without breaking a sweat. Up next? Real-time geolocation tagging, dedicated dashboards for authorities, and advanced traffic analytics! 🗺️🚀

Link: (I request you not to send multiple requests, as the product works just fine, but I have not planned for the costs from my end.)

I'm super excited to share this journey. Let me know what you guys think in the comments! 👇

#DigitalIndia #GovTech #SmartCities #IndiaTech #TrafficManagement #RoadSafety #AWS #CloudComputing #CloudNative #SystemDesign #KLUniversity
