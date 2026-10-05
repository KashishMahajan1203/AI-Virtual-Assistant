import jwt from "jsonwebtoken";

const genToken = (userId) => {
    if (!process.env.JWT_SECRET || Buffer.byteLength(process.env.JWT_SECRET) < 32) {
        throw new Error("JWT_SECRET must be configured with at least 32 bytes");
    }

    return jwt.sign(
        { userId },
        process.env.JWT_SECRET,
        {
            expiresIn: "7d",
        }
    );
};

export default genToken;