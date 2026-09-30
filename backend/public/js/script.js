// Global State Tracker
let currentUserId = null;

// On Initialization: Fetch standard data grid
document.addEventListener("DOMContentLoaded", () => {
    loadVideos();
});

// Toast notification helper
function showToast(message, isError = false) {
    const toast = document.getElementById("toast");
    if (!toast) return;
    toast.innerText = message;
    toast.style.display = "block";
    toast.style.background = isError ? "#e74c3c" : "#2ecc71";
    toast.style.color = "white";
    
    setTimeout(() => {
        toast.style.display = "none";
    }, 4000);
}

// Open global overlay wrapper
function openModal(htmlContent) {
    const modal = document.getElementById("modal");
    const modalBody = document.getElementById("modalBody");
    if (!modal || !modalBody) return;
    
    modalBody.innerHTML = htmlContent;
    modal.style.display = "flex";
}

// Close global overlay wrapper
function closeModal() {
    const modal = document.getElementById("modal");
    if (modal) modal.style.display = "none";
}

// ==================== AUTHENTICATION WINDOW INTERFACE ====================
function openAuth() {
    // Inject the combined Login and Registration template straight into your modal content
    const authHTML = `
        <div style="padding: 10px; font-family: sans-serif;">
            <h3 style="margin-top: 0; color: #2c3e50;">Account Authentication</h3>
            
            <!-- Register Section -->
            <div style="margin-bottom: 25px; border-bottom: 1px solid #eee; padding-bottom: 20px;">
                <h4 style="margin: 0 0 10px 0; color: #34495e;">1. Create an Account</h4>
                <input type="text" id="regUsername" placeholder="Username" style="width:100%; padding:8px; margin-bottom:8px; box-sizing:border-box;">
                <input type="email" id="regEmail" placeholder="Email Address" style="width:100%; padding:8px; margin-bottom:8px; box-sizing:border-box;">
                <input type="password" id="regPassword" placeholder="Password" style="width:100%; padding:8px; margin-bottom:10px; box-sizing:border-box;">
                <button onclick="submitRegister()" style="background:#3498db; color:white; border:none; padding:10px width:100%; cursor:pointer; border-radius:4px; font-weight:bold; width:100%;">Sign Up</button>
            </div>

            <!-- Login Section -->
            <div>
                <h4 style="margin: 0 0 10px 0; color: #34495e;">2. Sign In</h4>
                <input type="email" id="logEmail" placeholder="Email Address" style="width:100%; padding:8px; margin-bottom:8px; box-sizing:border-box;">
                <input type="password" id="logPassword" placeholder="Password" style="width:100%; padding:8px; margin-bottom:10px; box-sizing:border-box;">
                <button onclick="submitLogin()" style="background:#2ecc71; color:white; border:none; padding:10px; width:100%; cursor:pointer; border-radius:4px; font-weight:bold; width:100%;">Log In</button>
            </div>
        </div>
    `;
    openModal(authHTML);
}

// Handle User Account Registration API Connection
async function submitRegister() {
    const username = document.getElementById("regUsername").value;
    const email = document.getElementById("regEmail").value;
    const password = document.getElementById("regPassword").value;

    if (!username || !email || !password) {
        showToast("Please fill in all registration fields.", true);
        return;
    }

    try {
        const res = await fetch("/api/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, email, password })
        });
        const data = await res.json();

        if (res.ok) {
            showToast("Account created successfully! You can now log in.");
        } else {
            showToast(data.error || "Registration failed.", true);
        }
    } catch (err) {
        showToast("Server network connection error.", true);
    }
}

// Handle User Account Login API Connection
async function submitLogin() {
    const email = document.getElementById("logEmail").value;
    const password = document.getElementById("logPassword").value;

    if (!email || !password) {
        showToast("Please enter your email and password.", true);
        return;
    }

    try {
        const res = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();

        if (res.ok) {
            showToast(`Welcome back, ${data.user?.username || "User"}!`);
            currentUserId = data.user?.id || null;
            closeModal();
        } else {
            showToast(data.error || "Invalid credentials.", true);
        }
    } catch (err) {
        showToast("Server network connection error.", true);
    }
}

// Placeholder loadVideos script hook to prevent initialization breakage
async function loadVideos() {
    const content = document.getElementById("content");
    const searchVal = document.getElementById("q")?.value || "";
    
    try {
        const url = searchVal ? `/api/videos?q=${encodeURIComponent(searchVal)}` : '/api/videos';
        const res = await fetch(url);
        const data = await res.json();
        
        if (content) {
            if (data.videos && data.videos.length > 0) {
                content.innerHTML = data.videos.map(v => `<div class="video-card"><h3>${v.title}</h3></div>`).join('');
            } else {
                content.innerHTML = "<p style='grid-column: 1/-1; text-align: center; color: #7f8c8d;'>No videos loaded yet.</p>";
            }
        }
    } catch (err) {
        if (content) content.innerHTML = "<p>Error reaching video content servers.</p>";
    }
}

// Upload Placeholder interface handler
function openUpload() {
    openModal(`
        <div style="padding:10px;">
            <h3 style="margin-top:0;">Upload Video Asset</h3>
            <p style="color:#7f8c8d; font-size:14px;">Authentication registration must be completed before cloud transfer tools are initialized.</p>
            <button onclick="closeModal()" style="padding:8px 12px;">Close</button>
        </div>
    `);
}
