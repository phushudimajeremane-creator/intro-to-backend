import mongoose from "mongoose";

const commentSchema = new mongoose.Schema({
    body: { type: String, required: true },
    username: { type: String, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    video: { type: mongoose.Schema.Types.ObjectId, ref: "Video", required: true }
}, { timestamps: true });

export default mongoose.model("Comment", commentSchema);
