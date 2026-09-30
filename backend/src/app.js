import express from 'express';
import path from 'path';
import fs from 'fs'; // FIXED: Imported filesystem module to resolve path conflicts safely
import cookieParser from 'cookie-parser';
import { authRouter } from './routes/auth.routes.js';
import { videoRouter } from './routes/video.routes.js';

const app = express();

const __dirname = process.cwd();

// Standard Parsers & Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// FIXED: Comprehensive Netlify Route Prefix Stripper Middleware
app.use((req, res, next) => {
    if (req.url.startsWith('/.netlify/functions/index')) {
        req.url = req.url.replace('/.netlify/functions/index', '');
    }
    // If a request comes in as empty string after stripping, normalize it to the root path
    if (req.url === '') {
        req.url = '/';
    }
    next();
});

// Look out from the root folder to find public files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// REGISTER BACKEND ROUTERS
app.use('/api/auth', authRouter);

// Mounted both singular and plural options to map flawlessly to frontend requests
app.use('/api/video', videoRouter);
app.use('/api/videos', videoRouter);

// Main landing route
app.get('/', (req, res) => {
    // FIXED: Safely check both local root path resolutions and serverless base paths
    const pathWithBackend = path.join(__dirname, 'backend', 'src', 'index.html');
    const pathDirect = path.join(__dirname, 'src', 'index.html');
    
    if (fs.existsSync(pathDirect)) {
        return res.sendFile(pathDirect);
    } else if (fs.existsSync(pathWithBackend)) {
        return res.sendFile(pathWithBackend);
    }
    
    // Fail-safe fall back response if index.html is missing entirely from deployment files
    res.status(200).send("<h1>Welcome to Romang Backend Engine</h1><p>API status: Online and Healthy.</p>");
});

// Health check endpoint
app.get("/api/v1/health", (req, res) => {
    res.status(200).json({ status: "OK", message: "Server is healthy!" });
});

export default app;
