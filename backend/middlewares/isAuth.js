import jwt from 'jsonwebtoken'    // JWT library for decoding and validating authentication tokens

// Middleware to authenticate incoming requests using a signed JWT
const isAuth = async (req, res, next) => {
    try {
        const tokenFromCookie = req.cookies?.token
        const authHeader = req.headers.authorization || ""
        const token = tokenFromCookie || (authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null)

        // If no token is provided, block access
        if (!token) {
            return res.status(401).json({ message: "token not found" })
        }

        if (!process.env.JWT_SECRET || Buffer.byteLength(process.env.JWT_SECRET) < 32) {
            return res.status(500).json({ message: "Authentication is not configured securely" })
        }

        const verifyToken = jwt.verify(token, process.env.JWT_SECRET)
        if (typeof verifyToken !== "object" || !verifyToken.userId) {
            return res.status(401).json({ message: "Unauthorized" })
        }

        // Attach the authenticated user's ID to the request object for downstream handlers
        req.userId = verifyToken.userId

        next()                                     // Grant access to subsequent middleware or route handlers

    } catch {
        return res.status(401).json({ message: "Unauthorized" }) // Authentication failure response
    }
}

export default isAuth       // Export for integration into protected routes
