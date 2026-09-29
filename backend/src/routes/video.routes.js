import { Router } from "express";
import multer from "multer";
import path from "path";
import Video from "../models/Video.js";
import Comment from "../models/Comment.js";

const router = Router();

// FIX: Switch Multer to use memoryStorage instead of diskStorage for serverless architectures
const storage = multer.memoryStorage();
const upload = multer({ storage });

// ==================== 1. GET ALL VIDEOS (HOMEPAGE GRID) ====================
router.get("/", async (req, res) => {
    try {
        const { q, category } = req.query;
        let queryFilter = {};
        if (q) queryFilter.title = { regex: q, options: "i" };
        if (category && category !== "All") queryFilter.category = category;

        const videos = await Video.find(queryFilter).populate("owner", "username");
        
        const safeVideos = videos.map(video => {
            const vObj = video.toObject();
            if (!vObj.likes || !Array.isArray(vObj.likes)) {
                vObj.likes = [];
            }
            return vObj;
        });

        res.status(200).json({ videos: safeVideos });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==================== 2. UPLOAD NEW VIDEO FILE ====================
router.post("/upload", upload.single("video"), async (req, res) => {
    try {
        const userId = req.cookies.userId;
        if (!userId) return res.status(401).json({ error: "Please log in to upload videos." });
        if (!req.file) return res.status(400).json({ error: "No video file attached." });

        const { title, description, category } = req.body;

        // NOTE: In production, upload req.file.buffer to Cloudinary/S3 here!
        const newVideo = await Video.create({
            title,
            description,
            category,
            streamUrl: `https://example.com`, // Temporary URL until cloud storage is added
            thumbnail: "https://unsplash.com", 
            likes: [], 
            owner: userId
        });

        res.status(201).json({ video: newVideo });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==================== 3. GET SINGLE VIDEO DETAILED DATA ====================
router.get("/:id", async (req, res) => {
    try {
        const userId = req.cookies.userId;
        const video = await Video.findById(req.params.id).populate("owner", "username");
        if (!video) return res.status(404).json({ error: "Video not found" });

        const comments = await Comment.find({ video: req.params.id }).sort({ createdAt: -1 });

        const videoData = video.toObject();
        
        if (!videoData.likes || !Array.isArray(videoData.likes)) {
            videoData.likes = [];
        }
        
        videoData.id = video._id.toString();
        videoData.likesCount = videoData.likes.length;
        videoData.hasUserLiked = userId ? videoData.likes.includes(userId.toString()) : false;

        res.status(200).json({ video: videoData, comments });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==================== 4. TOGGLE LIKE / UNLIKE ROUTE ====================
router.post("/:id/like", async (req, res) => {
    try {
        const userId = req.cookies.userId;
        if (!userId) return res.status(401).json({ error: "You must be logged in to like videos." });

        const video = await Video.findById(req.params.id);
        if (!video) return res.status(404).json({ error: "Video not found." });

        if (!video.likes || !Array.isArray(video.likes)) {
            video.likes = [];
        }

        const stringUserId = userId.toString();
        const hasLiked = video.likes.map(id => id.toString()).includes(stringUserId);

        if (hasLiked) {
            video.likes = video.likes.filter(id => id.toString() !== stringUserId);
        } else {
            video.likes.push(userId);
        }

        await video.save();
        
        res.status(200).json({ 
            likesCount: video.likes.length, 
            liked: !hasLiked 
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==================== 5. POST COMMENTS ROUTE ====================
router.post("/:id/comments", async (req, res) => {
    try {
        const userId = req.cookies.userId;
        if (!userId) return res.status(401).json({ error: "Log in to post a comment." });

        const { body } = req.body;
        if (!body) return res.status(400).json({ error: "Comment text cannot be empty." });

        const UserModule = await import("../models/User.js");
        const profile = await UserModule.default.findById(userId);

        const newComment = await Comment.create({
            body,
            username: profile.username,
            user: userId,
            video: req.params.id
        });

        res.status(201).json({ comment: newComment });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==================== DELETE A VIDEO (SECURE) ====================
router.delete("/:id", async (req, res) => {
    try {
        const userId = req.cookies.userId;
        if (!userId) return res.status(401).json({ error: "You must be logged in to delete videos." });

        const video = await Video.findById(req.params.id);
        if (!video) return res.status(404).json({ error: "Video not found." });

        if (video.owner.toString() !== userId.toString()) {
            return res.status(403).json({ error: "You are not authorized to delete this video." });
        }

        // NOTE: In production, add cloud asset removal logic here instead of local fs.unlinkSync

        await Video.findByIdAndDelete(req.params.id);
        await Comment.deleteMany({ video: req.params.id });

        res.status(200).json({ message: "Video deleted successfully." });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export { router as videoRouter };
