import dotenv from "dotenv";
import serverless from 'serverless-http';
import connectDB from "./config/database.js";
import app from "./app.js";

if (process.env.NODE_ENV !== 'production') {
    dotenv.config();
}

console.log("--- index.js script has started ---");

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
        console.error("MongoDB connection failed!!!", error);
        throw error;
    }
};

// Create the standard serverless handler base
const serverlessHandler = serverless(app);

// Export the true handler that Netlify triggers
export const handler = async (event, context) => {
    // CRITICAL: Tell AWS Lambda/Netlify to shut down immediately when the 
    // response is ready, without waiting for the MongoDB connection pool to empty.
    context.callbackWaitsForEmptyEventLoop = false;

    // Ensure database connectivity before executing the Express app routing
    await connectToDatabase();

    // Pass execution down to express
    return await serverlessHandler(event, context);
};
