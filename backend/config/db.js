import mongoose from "mongoose";
import User from "../models/user.model.js";

const getMongoUri = () => {
    return (
        process.env.MONGODB_URL ||
        process.env.MONGO_URI ||
        process.env.MONGODB_URI
    );
};

const connectDb = async () => {
    try {
        const mongoUri = getMongoUri();

        if (!mongoUri) {
            throw new Error("MongoDB connection URL is missing");
        }

        await mongoose.connect(mongoUri);
        await User.createIndexes();

        console.log("MongoDB connected successfully");
    } catch (error) {
        console.error("MongoDB connection error:", error.message);
        throw error;
    }
};

export default connectDb;