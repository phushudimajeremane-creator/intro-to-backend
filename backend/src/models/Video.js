import mongoose from "mongoose";

const videoSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String },
    category: { type: String, required: true },
    streamUrl: { type: String, required: true },
    thumbnail: { type: String },
    views: { type: Number, default: 0 },
    
    // ✅ CHANGED: Track likes as an array of User ObjectIDs instead of a simple number
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
}, { timestamps: true });

export default mongoose.model("Video", videoSchema);
