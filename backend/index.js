
import dns from "dns";
import "dotenv/config";
import express from "express";
import connectDb from "./config/db.js";
import authRouter from "./routes/auth.routes.js";
import userRouter from "./routes/user.routes.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";

// Preserve the DNS resolver configuration used by your project.
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const app = express();
const isProduction = process.env.NODE_ENV === "production";

if (isProduction) {
  app.set("trust proxy", 1);
}

const allowedOrigins = new Set([
  ...(process.env.CORS_ORIGINS || process.env.FRONTEND_URL || "")
    .split(",")
    .map((origin) => origin.trim().replace(/\/+$/, ""))
    .filter(Boolean),
  ...(!isProduction
    ? ["http://localhost:5173", "http://127.0.0.1:5173"]
    : []),
]);

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        imgSrc: ["'self'", "data:", "https:", "blob:"],
      },
    },
  })
);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.has(origin.replace(/\/+$/, ""))) {
        return callback(null, true);
      }

      const error = new Error("Not allowed by CORS");
      error.status = 403;
      return callback(error);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

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
  skipSuccessfulRequests: true,
  message: { message: "Too many authentication attempts. Please try again later." },
});

app.use("/api", apiLimiter);
app.use(["/api/auth/signin", "/api/auth/signup"], authLimiter);

app.use(express.json({ limit: "16kb" }));
app.use(cookieParser());

// Database connection is handled by the Vercel entry point.

app.get("/", (req, res) => {
  res.json({
    message: "AI Virtual Assistant API is running",
    status: "ok",
  });
});

app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);

app.use((req, res) => {
  res.status(404).json({ message: "Not found" });
});

app.use((err, req, res, next) => {
  const status =
    err.code === "LIMIT_FILE_SIZE"
      ? 413
      : err.name === "MulterError"
        ? 400
        : err.status || err.statusCode || 500;

  if (status >= 500) {
    console.error("Server Error:", err.stack || err.message);
  } else {
    console.warn(
      `Client Error ${status}: ${req.method} ${req.originalUrl} - ${err.message}`
    );
  }

  res.status(status).json({
    message:
      isProduction && status >= 500
        ? "Request failed"
        : err.message || "Internal Server Error",
  });
});


// Start local server during development.
// Vercel handles requests through its serverless function.
if (process.env.VERCEL !== "1") {
    const port = process.env.PORT || 5000;

    const startServer = async () => {
        try {
            if (
                !process.env.JWT_SECRET ||
                Buffer.byteLength(process.env.JWT_SECRET) < 32
            ) {
                throw new Error(
                    "JWT_SECRET must be configured with at least 32 bytes"
                );
            }

            await connectDb();

            console.log("Connected to Database successfully.");

            app.listen(port, "0.0.0.0", () => {
                console.log(`Server started on port ${port}`);
            });
        } catch (error) {
            console.error("Failed to start server:", error.message);
            process.exit(1);
        }
    };

    startServer();
}

export default app;
