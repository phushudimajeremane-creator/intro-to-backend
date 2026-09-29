import express from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import { authRouter } from './routes/auth.routes.js';
import { videoRouter } from './routes/video.routes.js';

const app = express();

// FIX: Replaced fileURLToPath with process.cwd() so esbuild doesn't crash on Netlify
const __dirname = process.cwd();

// Standard Parsers & Middlewares (Declared only once)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Netlify Route Prefix Stripper Middleware
app.use((req, res, next) => {
    if (req.url.startsWith('/.netlify/functions/index')) {
        req.url = req.url.replace('/.netlify/functions/index', '');
    }
    next();
});

// FIXED: Looks out from the root folder to find public files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// REGISTER BACKEND ROUTERS
app.use('/api/auth', authRouter);
app.use('/api/videos', videoRouter);

// Main landing route (Serves your HTML file located inside backend/src/)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'backend', 'src', 'index.html'));
});

// Health check endpoint
app.get("/api/v1/health", (req, res) => {
    res.status(200).json({ status: "OK", message: "Server is healthy!" });
});

export default app;
