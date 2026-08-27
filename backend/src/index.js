import dotenv from "dotenv";


dotenv.config();

if (process.env.NODE_ENV !== 'production') {
    dotenv.config();
}

import connectDB from "./config/database.js";
import app from "./app.js";

console.log("--- index.js script has started ---");
import mongoose from "mongoose";

const connectDB = async () => {
    try {
        // This reads the MONGO_URI variable directly from Render or your .env file
        const connectionInstance = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Connected successfully! Host: ${connectionInstance.connection.host}`);
    } catch (error) {
        console.log("MongoDB connection failed error: ", error);
        process.exit(1);
    }
};

export default connectDB;



const startServer = async () => {
    try {
        console.log("Attempting to connect to MongoDB..."); // Add this line
        await connectDB();
        console.log("MongoDB connected successfully!"); // Add this line

        app.on('error', (error) => {
            console.log("ERROR", error);
            throw error;
        }); 

        const port = process.env.PORT || 8000;
        app.listen(port, () => {
            console.log(`Server is running on port: ${port}`);
        });
    
    } catch (error) {
        console.log("MongoDB connection failed!!!", error);
    }
}

startServer();

