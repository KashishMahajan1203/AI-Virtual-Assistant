
import mongoose from "mongoose";
import User from "../models/user.model.js";

const getMongoUri = () => {
  return (
    process.env.MONGODB_URL ||
    process.env.MONGO_URI ||
    process.env.MONGODB_URI
  );
};

let connectionPromise = null;
let indexesPromise = null;

const connectDb = async () => {
  const mongoUri = getMongoUri();

  if (!mongoUri) {
    throw new Error("MongoDB connection URL is missing");
  }

  if (mongoose.connection.readyState !== 1) {
    if (!connectionPromise) {
      connectionPromise = mongoose
        .connect(mongoUri)
        .catch((error) => {
          connectionPromise = null;
          throw error;
        });
    }

    await connectionPromise;
  }

  if (!indexesPromise) {
    indexesPromise = User.createIndexes().catch((error) => {
      indexesPromise = null;
      throw error;
    });
  }

  await indexesPromise;

  return mongoose.connection;
};

export default connectDb;
