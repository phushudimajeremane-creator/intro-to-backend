// --- 1. GLOBAL VARIABLES & UTILITIES ---
let cat = 'All';          // Tracks the selected video category
let me = null;            // Holds the currently logged-in user info
let current = null;       // Holds the video object currently being watched

// Shortcut helper to grab HTML elements by their ID
const $ = x => document.getElementById(x);

// Helper function to safely clean text and prevent malicious script injections
function esc(s) {
    return String(s || '').replace(/[&<>"']/g, c => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;' // ✅ FIXED: Replaced the broken quotes with a valid HTML entity string
    }[c]));
}

// Shows quick popup alert messages on the screen
function toast(m) {
    let t = $('toast');
    if (t) {
        t.textContent = m;
        t.style.display = 'block';
        setTimeout(() => t.style.display = 'none', 3000);
    } else {
        alert(m);
    }
}

// Simple Modal UI Toggles
function openModal() {
    let m = $('modal');
    if (m) m.style.display = 'block';
}

function closeModal() {
    let m = $('modal');
    if (m) m.style.display = 'none';
}


// --- 2. CORE NETWORK API HANDLER ---
async function api(url, opt = {}) {
    let r = await fetch(url, { credentials: 'include', ...opt });
    let d = await r.json().catch(() => ({}));
    if (!r.ok) throw Error(d.error || 'Request failed');
    return d;
}


// --- 3. APP INITIALIZATION ---
async function boot() {
    try {
        me = (await api('/api/auth/me')).user;
    } catch (e) {
        me = null;
    }
    loadVideos();
}
boot();


// --- 4. VIDEO FETCHING & DISPLAY ---
async function loadVideos() {
    let q = $('q') ? $('q').value : '';
    let d = await api('/api/videos?q=' + encodeURIComponent(q) + '&category=' + encodeURIComponent(cat));
    if ($('heading')) $('heading').textContent = q ? 'Search results' : 'Recommended';
    renderVideos(d.videos || []);
}

function renderVideos(vs) {
    let content = $('content');
    if (!content) return;
    content.className = 'grid';
    content.innerHTML = vs.map(v => `
        <article class="card" onclick="watch('${v.id || v._id}')">
            <div class="thumb">
                <img src="${v.thumbnail || 'https://unsplash.com'}">
                <span class="dur">${v.duration || 'HD'}</span>
            </div>
            <div class="meta">
                <div class="ca">${(v.owner?.username || '?').toUpperCase()[0]}</div>
                <div>
                    <div class="title">${esc(v.title)}</div>
                    <div class="muted">
                        ${esc(v.owner?.username || 'Creator')}<br>
                        ${v.views || 0} views • ${new Date(v.created_at || v.createdAt || Date.now()).toLocaleDateString()}
                    </div>
                </div>
            </div>
        </article>
    `).join('') || '<p>No videos found.</p>';
}


// --- 5. VIDEO WATCHING & INTERACTION ROUTINES ---
async function watch(id) {
    let d = await api('/api/videos/' + id);
    current = d.video;
    
    $('modalBody').innerHTML = `
         <video class="video" controls autoplay src="${current.streamUrl}" onplay="recordView('${id}')"></video>
         <h2>${esc(current.title)}</h2>
         <div class="muted">${esc(current.owner?.username || 'Creator')} • ${current.views || 0} views</div>
    
         <div class="row" style="margin: 12px 0">
             <button class="primary" onclick="like('${id}')">
                ${current.hasUserLiked ? '❤️ Liked' : '👍 Like'} ${current.likesCount || 0}
             </button>
        
             <button class="primary" onclick="subscribe('${current.owner?._id || current.owner?.id}')">
                ${current.subscribed ? 'Subscribed' : 'Subscribe'}
             </button>
             <button class="primary" onclick="toast('Added to playlist!')">+ Playlist</button>
         </div>
     
         <p>${esc(current.description)}</p>

        <h3>Comments</h3>
        <div id="comments">
            ${(d.comments || []).map(c => `
                <div class="comment" style="margin-bottom: 8px; border-bottom: 1px solid #eee; padding-bottom: 4px;">
                    <b>${esc(c.username)}</b>
                    <p style="margin: 4px 0 0 0; color: #333;">${esc(c.body)}</p>
                </div>
            `).join('')}
        </div>
        
        <div class="form">
            <input id="comment" placeholder="Add a public comment">
            <button class="primary" onclick="comment('${id}')">Comment</button>
        </div>
    `;
    openModal();
}

async function recordView(id) {
    if (me) await api('/api/videos/' + id + '/view', { method: 'POST' });
}

async function like(id) {
    if (!me) return openAuth();
    try {
        await api('/api/videos/' + id + '/like', { method: 'POST' });
        watch(id); // Reload modal window data view seamlessly
    } catch (err) {
        toast(err.message);
    }
}

async function subscribe(id) {
    if (!me) return openAuth();
    await api('/api/channels/' + id + '/subscribe', { method: 'POST' });
    watch(current.id || current._id);
}

async function comment(id) {
    if (!me) return openAuth();
    let body = $('comment').value;
    if (!body.trim()) return toast("Comment cannot be empty!");
    
    await api('/api/videos/' + id + '/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body })
    });
    watch(id);
}
async function accountPage() {
    openModal();
    $('modalBody').innerHTML = `<h2>Loading Studio...</h2>`;
    
    try {
        // Fetch all videos, then filter down to ones owned by the logged-in user
        let d = await api('/api/videos');
        let myVideos = d.videos.filter(v => v.owner && (v.owner._id === me._id || v.owner === me._id));

        $('modalBody').innerHTML = `
            <h2>Creator Studio</h2>
            <p>Logged in as: <b>${esc(me.username)}</b></p>
            <div class="row" style="margin-bottom: 20px;">
                <button class="primary" onclick="openUpload()">➕ Upload New Video</button>
                <button class="primary" style="background: #555;" onclick="logout()">Log out</button>
            </div>
            
            <h3>Your Managed Content</h3>
            <div class="studio-list" style="max-height: 250px; overflow-y: auto; display: flex; flex-direction: column; gap: 10px;">
                ${myVideos.map(v => `
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px; background: #f0f0f0; border-radius: 4px;">
                        <span style="font-size: 14px; font-weight: bold;">${esc(v.title)}</span>
                        <!-- Delete Button triggering custom delete utility -->
                        <button class="primary" style="background: #cc0000; padding: 4px 8px; font-size: 12px;" onclick="deleteVideo('${v._id || v.id}', event)">
                            🗑️ Delete
                        </button>
                    </div>
                `).join('') || '<p style="color: #666;">You haven\'t uploaded any videos yet.</p>'}
            </div>
        `;
    } catch (err) {
        toast(err.message);
    }
}

async function deleteVideo(id, event) {
    // Stop modal or background clicks from conflicting
    if (event) event.stopPropagation();
    
    if (!confirm("Are you absolutely sure you want to permanently delete this video?")) return;

    try {
        let response = await api('/api/videos/' + id, {
            method: 'DELETE'
        });
        
        toast(response.message || "Video deleted successfully!");
        accountPage(); // Refresh the studio dashboard list view instantly
        loadVideos();  // Refresh the main home screen grid gallery view background
    } catch (error) {
        toast(error.message);
    }
}

// 🚨 REMEMBER TO EXPOSE IT TO THE WINDOW OBJECT AT THE ABSOLUTE BOTTOM:
window.deleteVideo = deleteVideo;



// --- 6. USER ACCOUNT AUTHENTICATION ---
function openAuth() {
    if (me) return accountPage();
    $('modalBody').innerHTML = `
        <h2>Sign in</h2>
        <div class="form">
            <input id="email" placeholder="Email" type="email">
            <input id="password" type="password" placeholder="Password">
            <input id="username" placeholder="Username (for signup)">
            <button class="primary" onclick="auth('login')">Log in</button>
            <button class="primary" onclick="auth('signup')">Create account</button>
        </div>
    `;
    openModal();
}

async function auth(type) {
    try {
        let body = {
            email: $('email').value,
            password: $('password').value
        };
        
        let userEl = $('username');
        if (userEl && userEl.value) {
            body.username = userEl.value;
        }

        me = (await api('/api/auth/' + type, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        })).user;
        
        closeModal();
        toast('Welcome ' + me.username);
        loadVideos();
    } catch (e) {
        toast(e.message);
    }
}

function accountPage() {
    openModal();
    $('modalBody').innerHTML = `
        <h2>${esc(me.username)}</h2>
        <p>${esc(me.email || '')}</p>
        <div class="row">
            <button class="primary" onclick="openUpload()">Creator Studio</button>
            <button class="primary" onclick="logout()">Log out</button>
        </div>
    `;
}

async function logout() {
    await api('/api/auth/logout', { method: 'POST' });
    me = null;
    closeModal();
    toast('Logged out');
    loadVideos();
}


// --- 7. CREATOR DASHBOARD & CONTENT UPLOADS ---
function openUpload() {
    if (!me) return openAuth();
    $('modalBody').innerHTML = `
        <h2>Upload video</h2>
        <form class="form" onsubmit="upload(event)">
            <input name="title" id="uploadTitle" required placeholder="Title">
            <textarea name="description" id="uploadDesc" placeholder="Description"></textarea>
            <select name="category" id="uploadCat">
                <option>Technology</option>
                <option>Music</option>
                <option>Gaming</option>
                <option>News</option>
                <option>Sports</option>
                <option>Education</option>
                <option>Other</option>
            </select>
            <input name="video" type="file" accept="video/*" required>
            <button class="primary" type="submit">Upload</button>
        </form>
    `;
    openModal();
}

async function upload(event) {
    event.preventDefault();
    toast("Uploading file to server...");
    try {
        const formDataPayload = new FormData(event.target);
        let r = await fetch('/api/videos/upload', {
            method: 'POST',
            body: formDataPayload
        });
        let d = await r.json();
        if (!r.ok) throw Error(d.error || 'Upload failed.');
        closeModal();
        toast("Video published successfully!");
        loadVideos();
    } catch (error) {
        toast(error.message);
    }
}

// --- 8. EXPOSE FUNCTIONS TO GLOBAL WINDOW OBJECT ---
window.watch = watch;
window.like = like;
window.subscribe = subscribe;
window.comment = comment;
window.openAuth = openAuth;
window.auth = auth;
window.logout = logout;
window.openUpload = openUpload;
window.upload = upload;
window.closeModal = closeModal;
