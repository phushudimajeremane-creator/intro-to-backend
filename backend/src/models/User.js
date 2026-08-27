import mongoose from "mongoose";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true }
}, { timestamps: true });


// FIXED: Removed 'next' from the arguments list
userSchema.pre("save", async function () {
    // 1. If password isn't changed, stop and exit early
    if (!this.isModified("password")) return;
    
    // 2. Encrypt the password string field
    this.password = await bcrypt.hash(this.password, 10);
    
    // 🚨 CRITICAL FIX: Deleted next(); from here completely! 
    // Simply letting the async function finish tells Mongoose it's safe to save.
});

// Helper method to verify passwords during login attempts
userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password);
};


export default mongoose.model("User", userSchema);
