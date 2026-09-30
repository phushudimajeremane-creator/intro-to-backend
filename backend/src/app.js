import express from 'express';
import cookieParser from 'cookie-parser';
import { authRouter } from './routes/auth.routes.js';
import { videoRouter } from './routes/video.routes.js';

const app = express();

// Standard Parsers & Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Comprehensive Netlify Route Prefix Stripper Middleware
app.use((req, res, next) => {
    if (req.url.startsWith('/.netlify/functions/index')) {
        req.url = req.url.replace('/.netlify/functions/index', '');
    }
    if (req.url === '') {
        req.url = '/';
    }
    next();
});

// REGISTER BACKEND ROUTERS
app.use('/api/auth', authRouter);
app.use('/api/video', videoRouter);
app.use('/api/videos', videoRouter);

// Main landing route fallback
app.get('/', (req, res) => {
    res.status(200).json({ 
        status: "Online", 
        message: "Romang Serverless Engine is active. Static UI layers are managed on the Netlify CDN layer." 
    });
});

// Health check endpoint
app.get("/api/v1/health", (req, res) => {
    res.status(200).json({ status: "OK", message: "Server is healthy!" });
});

export default app;
