import dns from "dns";
import "dotenv/config";
import express from "express";
import connectDb from "./config/db.js";
import authRouter from "./routes/auth.routes.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import userRouter from "./routes/user.routes.js";

dns.setServers([
    "8.8.8.8",
    "8.8.4.4",
]);

const app = express();                        // Initialize the Express application
const isProduction = process.env.NODE_ENV === "production";

if (isProduction) {
    app.set("trust proxy", Number(process.env.TRUST_PROXY_HOPS) || 1);
}

const allowedOrigins = new Set([
    ...(process.env.CORS_ORIGINS || process.env.FRONTEND_URL || "")
        .split(",")
        .map((origin) => origin.trim().replace(/\/+$/, ""))
        .filter(Boolean),
    ...(!isProduction ? ["http://localhost:5173", "http://127.0.0.1:5173"] : []),
]);

app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            imgSrc: ["'self'", "data:", "https:", "blob:"],
        },
    },
    strictTransportSecurity: isProduction ? undefined : false,
}));

app.use((req, res, next) => {
    if (isProduction && !req.secure) {
        return res.status(426).json({ message: "HTTPS is required" });
    }
    next();
});

// Configure CORS to allow both deployed and local frontend origins
app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.has(origin.replace(/\/+$/, ""))) {
            callback(null, true);
            return;
        }
        const error = new Error("Not allowed by CORS");
        error.status = 403;
        callback(error);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: Number(process.env.API_RATE_LIMIT_MAX) || (isProduction ? 300 : 1500),
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { message: "Too many requests. Please try again later." },
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: Number(process.env.AUTH_RATE_LIMIT_MAX) || (isProduction ? 10 : 100),
    standardHeaders: "draft-8",
    legacyHeaders: false,
    skipSuccessfulRequests: true,               // Only failed attempts count, so normal sign-ins never lock users out
    message: { message: "Too many authentication attempts. Please try again later." },
});

app.use("/api", apiLimiter);
app.use(["/api/auth/signin", "/api/auth/signup"], authLimiter);   // Logout is not throttled
app.use(express.json({ limit: "16kb" }));       // Bound JSON request bodies
app.use(cookieParser());                        // Parse cookies for authentication workflows

// Test Route
app.get("/", (req, res) => {
    res.json({
        message: "AI Virtual Assistant API is running",
        status: "ok"
    });
});

// Mount authentication and user functionality routes
app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);

// Unknown routes get a JSON 404 instead of Express's HTML page
app.use((req, res) => {
    res.status(404).json({ message: "Not found" });
});

// Global Error Handler Middleware (Prevents Server Crashes)
app.use((err, req, res, next) => {
    // Multer errors (unexpected field, too many files, ...) are client mistakes, not server failures
    const status = err.code === "LIMIT_FILE_SIZE" ? 413
        : err.name === "MulterError" ? 400
        : err.status || err.statusCode || 500;
    if (status >= 500) {
        console.error("Server Error:", err.stack || err.message);
    } else {
        // Rejected client requests are expected; a one-line note is enough
        console.warn(`Client Error ${status}: ${req.method} ${req.originalUrl} - ${err.message}`);
    }
    res.status(status).json({
        // 4xx messages are safe to show and tell the user what to fix; 5xx details stay in the logs
        message: isProduction && status >= 500 ? "Request failed" : err.message || "Internal Server Error"
    });
});

const port = process.env.PORT || 5000;          // Define server port

// First connect to DB, then start server
const startServer = async () => {
    try {
        if (!process.env.JWT_SECRET || Buffer.byteLength(process.env.JWT_SECRET) < 32) {
            throw new Error("JWT_SECRET must be configured with at least 32 bytes");
        }
        await connectDb();                      // Establish connection to MongoDB asynchronously
        console.log("Connected to Database successfully.");
        
        app.listen(port, () => {
            console.log(`Server started on port ${port}`);
        });
    } catch (error) {
        console.error("Failed to start server:", error.message);
        process.exit(1);
    }
};

startServer();