import express from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import { fileURLToPath } from 'url';
import { authRouter } from './routes/auth.routes.js';
import { videoRouter } from './routes/video.routes.js';

const app = express();

// Set up __dirname cleanly
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Standard Parsers & Middlewares (Declared only once)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// FIXED: Tells Express to look out of backend/src/ and find the main public folder
app.use(express.static(path.join(__dirname, '../public')));
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')))

// REGISTER BACKEND ROUTERS
app.use('/api/auth', authRouter);
app.use('/api/videos', videoRouter);

// Main landing route (Serves your HTML file located inside backend/src/)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Health check endpoint
app.get("/api/v1/health", (req, res) => {
    res.status(200).json({ status: "OK", message: "Server is healthy!" });
});

export default app;
