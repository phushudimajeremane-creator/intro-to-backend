import mongoose from "mongoose";

const connectDB = async () => {
    try {
        // Fallback check: If the code thinks MONGO_URI is empty, look for common alternatives
        const connectionString = process.env.MONGO_URI || process.env.MONGODB_URI;

        if (!connectionString) {
            throw new Error("Database URI is undefined. Check Render Environment settings.");
        }

        console.log("Connecting with string layout verification...");
        const connectionInstance = await mongoose.connect(connectionString);
        console.log(`MongoDB Connected successfully! Host: ${connectionInstance.connection.host}`);
    } catch (error) {
        console.log("MongoDB connection failed error details:", error.message);
        process.exit(1);
    }
};

export default connectDB;

