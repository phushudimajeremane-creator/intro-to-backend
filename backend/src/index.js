import dotenv from "dotenv";

if (process.env.NODE_ENV !== 'production') {
    dotenv.config();
}

import connectDB from "./config/database.js";
import app from "./app.js";

console.log("--- index.js script has started ---");

const startServer = async () => {
    try {
        console.log("Attempting to connect to MongoDB...");
        await connectDB(); // This executes the function imported from database.js
        console.log("MongoDB connected successfully!");

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
