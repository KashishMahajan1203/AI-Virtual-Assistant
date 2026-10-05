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
    message: { message: "Too many authentication attempts. Please try again later." },
});

app.use("/api", apiLimiter);
app.use("/api/auth", authLimiter);
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

// Global Error Handler Middleware (Prevents Server Crashes)
app.use((err, req, res, next) => {
    console.error("Server Error:", err.stack || err.message);
    const status = err.code === "LIMIT_FILE_SIZE" ? 413 : err.status || err.statusCode || 500;
    res.status(status).json({
        message: isProduction ? "Request failed" : err.message || "Internal Server Error"
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
        console.error("Failed to connect to Database:", error.message);
        process.exit(1);
    }
};

startServer();