import { Router } from "express";
import User from "../models/User.js";

const router = Router();

// ==================== SIGN UP ROUTER ENDPOINT ====================
router.post("/signup", async (req, res) => {
    try {
        const { username, email, password } = req.body;
        
        if (!username || !email || !password) {
            return res.status(400).json({ error: "All input fields are required." });
        }

        const localizedQuery = await User.findOne({
            $or: [
                { email: email.toLowerCase() },
                { username: username.trim() }
            ]
        });

        if (localizedQuery) {
            return res.status(409).json({ error: "That username or email is already registered." });
        }

        const userInstance = await User.create({
            username: username.trim(),
            email: email.toLowerCase(),
            password: password
        });
        
        const sanitizedUser = userInstance.toObject();
        delete sanitizedUser.password;

        res.cookie("userId", userInstance._id.toString(), {
            httpOnly: true,
            secure: false, 
            sameSite: "lax"
        });

        return res.status(201).json({ user: sanitizedUser });

    } catch (dbError) {
        console.error("CRITICAL SIGNUP FAILURE:", dbError);
        return res.status(500).json({ error: "Internal Database Registration Failed." });
    }
});

// ==================== LOGIN ROUTER ENDPOINT ====================
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ error: "Email and password are required." });
        }

        const userMatch = await User.findOne({ email: email.toLowerCase() });
        if (!userMatch) {
            return res.status(401).json({ error: "Invalid credentials supplied." });
        }

        const validationCheck = await userMatch.isPasswordCorrect(password);
        if (!validationCheck) {
            return res.status(401).json({ error: "Invalid credentials supplied." });
        }

        const authenticatedProfile = userMatch.toObject();
        delete authenticatedProfile.password;

        res.cookie("userId", userMatch._id.toString(), {
            httpOnly: true,
            secure: false,
            sameSite: "lax"
        });

        return res.status(200).json({ user: authenticatedProfile });

    } catch (loginError) {
        console.error("CRITICAL LOGIN FAILURE:", loginError);
        return res.status(500).json({ error: "Authentication system error encountered." });
    }
});

// ==================== SESSION MANAGEMENT STATUS (🚨 FIX HERE) ====================
router.get("/me", async (req, res) => {
    try {
        const activeSessionCookie = req.cookies ? req.cookies.userId : null; // ✅ Guard against undefined cookies object
        if (!activeSessionCookie) {
            return res.status(401).json({ error: "No active session detected." });
        }

        const profileLookup = await User.findById(activeSessionCookie).select("-password");
        if (!profileLookup) {
            res.clearCookie("userId");
            return res.status(401).json({ error: "Session profile no longer active." });
        }

        return res.status(200).json({ user: profileLookup });

    } catch (sessionError) {
        console.error("CRITICAL ME SESSION FAILURE:", sessionError);
        return res.status(500).json({ error: "Session validation runtime exception." });
    }
});

// ==================== ACCOUNT LOGOUT ENDPOINT ====================
router.post("/logout", (req, res) => {
    if (res.clearCookie) {
        res.clearCookie("userId");
    }
    return res.status(200).json({ message: "Logged out successfully" });
});

export { router as authRouter }; // ✅ Explicitly aliased router export map match
