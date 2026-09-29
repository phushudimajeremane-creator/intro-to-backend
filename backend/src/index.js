import dotenv from "dotenv";
import serverless from 'serverless-http'; // Changed from 'require' to 'import'
import connectDB from "./config/database.js";
import app from "./app.js";

if (process.env.NODE_ENV !== 'production') {
    dotenv.config();
}

console.log("--- index.js script has started ---");

// Keep a reference to check if the database is already connected
let isConnected = false;

const connectToDatabase = async () => {
    if (isConnected) {
        return;
    }
    try {
        console.log("Attempting to connect to MongoDB...");
        await connectDB(); 
        isConnected = true;
        console.log("MongoDB connected successfully!");
    } catch (error) {
        console.log("MongoDB connection failed!!!", error);
        throw error;
    }
};

// We wrap your app in serverless-http and intercept requests to ensure the DB connects first
const handler = serverless(app, {
    async request(request, context) {
        context.callbackWaitsForEmptyEventLoop = false; // Prevents function timeouts with MongoDB
        await connectToDatabase();
    }
});

export { handler };

