 # 🤖 MERN AI Virtual Assistant

A dynamic AI-powered Virtual Assistant built on the MERN stack, engineered to deliver seamless conversational interactions and execute real-time user commands.
The assistant interprets natural language, answers user questions, and performs tasks such as opening social platforms, retrieving weather insights, launching websites, and displaying accurate date and time details.

[⚡🧠 Access the Intelligent Response Engine!!](https://ai-virtual-assistant-02m7.onrender.com/)

---

## 📸 Screenshots
### 📝 Create Your Account
![Sign up page](https://res.cloudinary.com/dfacldueh/image/upload/v1791527917/Screenshot_2026-10-09_120714_uweuss.png)

### 🤖 Step 1 – Choose Your Assistant's Look
![Choose assistant image](https://res.cloudinary.com/dfacldueh/image/upload/v1791527918/Screenshot_2026-10-09_120805_xdk1jk.png)

### 👤 Step 2 – Name Your Assistant
![Name your assistant](https://res.cloudinary.com/dfacldueh/image/upload/v1791527917/Screenshot_2026-10-09_120818_zgylgj.png)

### ⭐ Dashboard – Talk to Your Assistant
![Assistant dashboard](https://res.cloudinary.com/dfacldueh/image/upload/v1791527917/Screenshot_2026-10-09_120752_jeatau.png)

--- 

# 🚀 Capabilities
✨ Conversational Intelligence

Understands and responds to user queries naturally, providing clear answers and actionable information.

# 🌐 Smart Navigation

Responds instantly to commands such as:
* Open Instagram
* Open Facebook
* Open YouTube
* Open Google
* Open any URL requested

# ⛅ Weather Reporting

Provides real-time weather details upon request.

# 🕒 Date & Time Information

Supplies accurate and current:
* Time
* Date
* Month
* Year

# 🧠 AI Response Engine

Processes user prompts using NLP and produces contextual, intelligent responses.

# 🌗 Light & Dark Theme

Follows the system theme on first visit, can be toggled from any page and is remembered across visits.

# 💬 Dashboard

Voice wake-word ("Nova, what's the time?") plus a typed-command fallback, a live conversation view, one-click suggestions and recent-command history you can re-run, edit, delete or clear.

# 🔐 Security & Production Readiness

* **JWT authentication** in an `httpOnly` cookie (7-day expiry; `Secure` + `SameSite=None` in production)
* **bcrypt** password hashing (cost factor 12) with a 72-byte password limit
* **Input validation** on every endpoint (email format, lengths, type checks against NoSQL-injection payloads, https-only image URLs, 16 KB JSON body limit)
* **Image upload validation**: images only, max 5 MB (checked on both client and server)
* **Rate limiting**: global API limiter plus a stricter limiter on auth routes
* **CORS** allow-list with credentials
* **Helmet** security headers (CSP, HSTS, nosniff; `X-Powered-By` removed)
* **HTTPS-only** in production (`426 Upgrade Required` for plain HTTP behind a proxy)
* **MongoDB unique index** on email
* **PM2** process manager config (`ecosystem.config.cjs`) with auto-restart and memory limit
* **Environment variables** via `.env` (git-ignored); the server refuses to start without a strong `JWT_SECRET`

# 🧪 Testing

Start a production-mode test server, then run both suites (they create and clean up their own test user):

```bash
cd backend
NODE_ENV=production PORT=5011 CORS_ORIGINS=https://test-frontend.local AUTH_RATE_LIMIT_MAX=2 node index.js
# in another terminal
npm run test:security   # 16 checks: HTTPS, Helmet, CORS, JWT, rate limit, upload limits, bcrypt, indexes
npm run test:api        # 33 checks: full dashboard API flow, history edit/delete, JWT tampering/expiry, validation, env config
```

# 🧩 Scalable MERN Structure

A clean, modular backend and frontend architecture designed for growth and efficient feature expansion.

# ⚙️ Backend Setup (Node.js + Express)
```bash
npm init -y
npm i express mongoose dotenv nodemon jsonwebtoken bcryptjs cookie-parser cloudinary multer
npm i cors
npm i axios
npm i moment

# Start backend
npm run dev

```
---
# 🎨 Frontend Setup (React + Vite)
```bash
npm create vite@latest frontend

# Tailwind setup
npm install -D tailwindcss @tailwindcss/vite
# Add: @import "tailwindcss"; in your main CSS file

npm i react-router-dom react-icons axios

# Start frontend
npm run dev

```
---
# 🛠️ Tech Stack
**Backend:**
* Node.js
* Express
* MongoDB / Mongoose
* JWT Authentication
* Cloudinary & Multer
* Moment.js (for date/time operations)
* Axios

**Frontend:**
* React + Vite
* TailwindCSS
* React Router DOM
* React Icons
* Axios

# 📂 Project Structure
```bash
📦 MERN-AI-Virtual-Assistant
 ┣ 📂 backend
 ┃ ┣ controllers
 ┃ ┣ models
 ┃ ┣ routes
 ┃ ┣ middleware
 ┃ ┣ utils
 ┃ ┗ server.js
 ┣ 📂 frontend
 ┃ ┣ 📂 src
 ┃ ┃ ┣ components
 ┃ ┃ ┣ pages
 ┃ ┃ ┣ api
 ┃ ┃ ┗ main.jsx
 ┗ README.md

```
---
 # ▶️ Launching the Application
 ```bash
# Clone the repository
git clone https://github.com/KashishMahajan1203/-AI-Virtual-Assistant-.git

# Backend
cd backend
npm install
npm run dev

# Frontend
cd ../frontend
npm install
npm run dev

```
---

📞 Contact

For collaboration or inquiries:

Email: kashishmahajan878@gmail.com

LinkedIn: https://www.linkedin.com/in/kashish-mahajan-0591ba2b4/

GitHub: https://github.com/KashishMahajan1203

Developed with 💡 and passion by Kashish Mahajan


