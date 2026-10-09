 # 🤖 MERN AI Virtual Assistant

A dynamic AI-powered Virtual Assistant built on the MERN stack, engineered to deliver seamless conversational interactions and execute real-time user commands.
The assistant interprets natural language, answers user questions, and performs tasks such as opening social platforms, searching Google and YouTube, showing the weather, and telling the current date and time.

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
* Open the calculator
* Search anything on Google
* Search or play anything on YouTube

# ⛅ Weather Reporting

Shows the current weather on request.

# 🕒 Date & Time Information

Supplies the current:
* Time
* Date
* Day
* Month

# 🧠 AI Response Engine

Every command is sent to an LLM, which returns a JSON intent (`general`, `google-search`, `youtube-play`, `get-time`, …) plus a short spoken reply. The provider is chosen from `backend/.env`:

| Setting | Provider used |
| --- | --- |
| `AI_API_KEY` set | **Groq** (default, free) with `openai/gpt-oss-20b`, or any OpenAI-compatible API via `AI_API_URL` / `AI_MODEL` (OpenRouter, Ollama, OpenAI) |
| only `GEMINI_API_URL` set | **Google Gemini** |

If both are set, `AI_API_KEY` wins. The assistant always says it was created by Kashish Mahajan.

# 🌗 Light & Dark Theme

Follows the system theme on first visit, can be toggled from any page and is remembered across visits.

# 💬 Dashboard

Voice wake-word (say your assistant's name, e.g. "Nova, what's the time?") plus a typed-command fallback, a live conversation view, one-click suggestions and recent-command history you can re-run, edit, delete or clear. Fully responsive on mobile, tablet and desktop.

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
* **AI API key never logged** (errors log only the status and reason)
* **PM2** process manager config (`ecosystem.config.cjs`) with auto-restart and memory limit
* **Environment variables** via `.env` (git-ignored); the server refuses to start without a strong `JWT_SECRET`

# 🔌 API Endpoints

| Method | Route | Description |
| --- | --- | --- |
| POST | `/api/auth/signup` | Create an account |
| POST | `/api/auth/signin` | Sign in |
| POST | `/api/auth/logout` | Sign out |
| GET | `/api/user/current` | Current user |
| POST | `/api/user/update` | Set assistant name and image (upload or preset) |
| POST | `/api/user/asktoassistant` | Send a command to the assistant |
| PATCH | `/api/user/history/:index` | Edit a history item |
| DELETE | `/api/user/history/:index` | Delete a history item |
| DELETE | `/api/user/history` | Clear all history |

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

# ⚙️ Environment Variables

Copy the examples and fill in your own values:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

**`backend/.env`**

| Variable | Description |
| --- | --- |
| `NODE_ENV` | `development` or `production` |
| `PORT` | API port (default `5000`) |
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | Long random secret (32+ characters) |
| `FRONTEND_URL`, `CORS_ORIGINS` | Allowed frontend origin(s) |
| `TRUST_PROXY_HOPS` | Proxies in front of the app (e.g. `1` on Render) |
| `API_RATE_LIMIT_MAX`, `AUTH_RATE_LIMIT_MAX` | Rate limits |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Image uploads |
| `AI_API_KEY` | Groq API key ([get one free](https://console.groq.com/keys)) |
| `AI_API_URL`, `AI_MODEL` | Optional: other OpenAI-compatible API / model |
| `GEMINI_API_URL` | Optional: Gemini endpoint, used only when `AI_API_KEY` is not set |

**`frontend/.env`**

| Variable | Description |
| --- | --- |
| `VITE_SERVER_URL` | Backend URL, e.g. `http://localhost:5000` |

---
# 🛠️ Tech Stack
**Backend:**
* Node.js
* Express 5
* MongoDB / Mongoose
* JWT Authentication + bcrypt
* Cloudinary & Multer
* Helmet & express-rate-limit
* Groq (OpenAI-compatible) / Google Gemini
* Moment.js (for date/time operations)
* Axios
* PM2

**Frontend:**
* React 19 + Vite
* TailwindCSS 4
* React Router DOM
* React Icons
* Axios
* Web Speech API (voice input and spoken replies)

# 📂 Project Structure
```bash
📦 MERN-AI-Virtual-Assistant
 ┣ 📂 backend
 ┃ ┣ config            # db, cloudinary, JWT token
 ┃ ┣ controllers       # auth + user/assistant logic
 ┃ ┣ middlewares       # isAuth, multer upload
 ┃ ┣ models            # User model
 ┃ ┣ routes            # /api/auth, /api/user
 ┃ ┣ tests             # security + API test suites
 ┃ ┣ gemini.js         # AI provider (Groq / OpenAI-compatible / Gemini)
 ┃ ┣ ecosystem.config.cjs
 ┃ ┗ index.js
 ┣ 📂 frontend
 ┃ ┣ 📂 src
 ┃ ┃ ┣ components      # header, theme toggle, recent commands, …
 ┃ ┃ ┣ context         # user data + API calls
 ┃ ┃ ┣ pages           # SignUp, SignIn, Customize, Customize2, Home
 ┃ ┃ ┣ App.jsx
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
cp .env.example .env    # then fill in your values
npm run dev             # or: npm start / npm run pm2:start

# Frontend
cd ../frontend
npm install
cp .env.example .env
npm run dev

```
---

📞 Contact

For collaboration or inquiries:

Email: kashishmahajan878@gmail.com

LinkedIn: https://www.linkedin.com/in/kashish-mahajan-0591ba2b4/

GitHub: https://github.com/KashishMahajan1203

Developed with 💡 and passion by Kashish Mahajan

