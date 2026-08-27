import dotenv from "dotenv";


dotenv.config();

import connectDB from "./config/database.js";
import app from "./app.js";

console.log("--- index.js script has started ---");


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

