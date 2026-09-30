import express from 'express';
import path from 'path';
import fs from 'fs';
import cookieParser from 'cookie-parser';
import { authRouter } from './routes/auth.routes.js';
import { videoRouter } from './routes/video.routes.js';

const app = express();

const __dirname = process.cwd();

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

// FIXED: Declare static directories relative to project roots so CSS and scripts resolve correctly
app.use(express.static(path.join(__dirname)));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'src')));

// REGISTER BACKEND ROUTERS
app.use('/api/auth', authRouter);
app.use('/api/video', videoRouter);
app.use('/api/videos', videoRouter);

// Main landing route
app.get('/', (req, res) => {
    // FIXED: Trace the specific location of your HTML canvas file directly
    const possiblePaths = [
        path.join(__dirname, 'src', 'index.html'),
        path.join(__dirname, 'backend', 'src', 'index.html'),
        path.join(__dirname, 'index.html'),
        path.join(__dirname, 'public', 'index.html')
    ];

    for (const targetPath of possiblePaths) {
        if (fs.existsSync(targetPath)) {
            return res.sendFile(targetPath);
        }
    }
    
    // Fall back to general greeting if no matching entry file structure is parsed by the bundler
    res.status(200).send("<h1>Welcome to Romang Backend Engine</h1><p>API status: Online and Healthy. Static frontend asset files were not captured by compilation pathways.</p>");
});

// Health check endpoint
app.get("/api/v1/health", (req, res) => {
    res.status(200).json({ status: "OK", message: "Server is healthy!" });
});

export default app;
