import genToken from "../config/token.js";
import User from "../models/user.model.js";
import bcrypt from "bcryptjs";

const getCookieOptions = () => ({
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
    secure: process.env.NODE_ENV === "production",
});

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const maxPasswordBytes = 72;

// ================= SIGN UP =================
export const signUp = async (req, res) => {
    try {
        const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
        const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
        const password = typeof req.body?.password === "string" ? req.body.password : "";

        if (!name || !email || !password) {
            return res.status(400).json({
                message: "Name, email and password are required",
            });
        }

        if (name.length > 80 || email.length > 254 || !isValidEmail(email)) {
            return res.status(400).json({ message: "Enter a valid name and email address" });
        }

        if (password.length < 8 || Buffer.byteLength(password, "utf8") > maxPasswordBytes) {
            return res.status(400).json({
                message: "Password must be at least 8 characters and no more than 72 bytes",
            });
        }

        const existEmail = await User.findOne({ email });

        if (existEmail) {
            return res.status(400).json({
                message: "Email Already Exists!",
            });
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const user = await User.create({
            name,
            email,
            password: hashedPassword,
        });

        const token = await genToken(user._id);

        res.cookie("token", token, getCookieOptions());

        return res.status(201).json({
            message: "Account created successfully",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
            },
        });

    } catch (error) {
        console.error("SIGNUP ERROR:", error);

        if (error.code === 11000) {
            return res.status(409).json({ message: "Email is already registered" });
        }

        return res.status(500).json({
            message: error.message || "Signup failed",
        });
    }
};


// ================= LOGIN =================
export const login = async (req, res) => {
    try {
        const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
        const password = typeof req.body?.password === "string" ? req.body.password : "";

        if (!email || !password || email.length > 254 || !isValidEmail(email) || Buffer.byteLength(password, "utf8") > maxPasswordBytes) {
            return res.status(400).json({
                message: "Enter a valid email and password",
            });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        const isMatch = await bcrypt.compare(
            password,
            user.password
        );

        if (!isMatch) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        const token = await genToken(user._id);

        res.cookie("token", token, getCookieOptions());

        return res.status(200).json({
            message: "Login successful",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                assistantName: user.assistantName,
                assistantImage: user.assistantImage,
            },
        });

    } catch (error) {
        console.error("LOGIN ERROR:", error);

        return res.status(500).json({
            message: error.message || "Login failed",
        });
    }
};


// ================= LOGOUT =================
export const logOut = async (req, res) => {
    try {
        res.clearCookie("token", getCookieOptions());

        return res.status(200).json({
            message: "Log out successfully",
        });

    } catch (error) {
        console.error("LOGOUT ERROR:", error);

        return res.status(500).json({
            message: error.message || "Logout failed",
        });
    }
};