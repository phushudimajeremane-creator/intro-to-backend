import dotenv from "dotenv";
import serverless from 'serverless-http';
import connectDB from "./config/database.js";
import app from "./app.js";

if (process.env.NODE_ENV !== 'production') {
    dotenv.config();
}

let isConnected = false;

const connectToDatabase = async () => {
    if (isConnected) return;
    try {
        await connectDB(); 
        isConnected = true;
    } catch (error) {
        console.error("MongoDB connection failed!!!", error);
        throw error;
    }
};

const serverlessHandler = serverless(app);

export const handler = async (event, context) => {
    context.callbackWaitsForEmptyEventLoop = false;
    await connectToDatabase();
    return await serverlessHandler(event, context);
};
