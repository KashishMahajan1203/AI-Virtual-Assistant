
import app from "../index.js";
import connectDb from "../config/db.js";

export default async function handler(req, res) {
  try {
    if (
      !process.env.JWT_SECRET ||
      Buffer.byteLength(process.env.JWT_SECRET) < 32
    ) {
      throw new Error("JWT_SECRET must be configured with at least 32 bytes");
    }

    await connectDb();

    return app(req, res);
  } catch (error) {
    console.error("API startup error:", error.message);

    return res.status(500).json({
      message: "Server configuration or database connection failed",
    });
  }
}
