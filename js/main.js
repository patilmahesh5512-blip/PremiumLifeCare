/* ===================== STORAGE HELPERS ===================== */
function getUsers() {
    try { return JSON.parse(localStorage.getItem('plc_users') || '[]'); } catch(e) { return []; }
}
function saveUsers(users) { localStorage.setItem('plc_users', JSON.stringify(users)); }
function getCurrentUser() {
    try { return JSON.parse(localStorage.getItem('plc_current_user') || 'null'); } catch(e) { return null; }
}
function setCurrentUser(user) { localStorage.setItem('plc_current_user', JSON.stringify(user)); }
function clearCurrentUser() { localStorage.removeItem('plc_current_user'); }
function getEnquiries() {
    try { return JSON.parse(localStorage.getItem('plc_enquiries') || '[]'); } catch(e) { return []; }
}
function saveEnquiries(list) { localStorage.setItem('plc_enquiries', JSON.stringify(list)); }

/* Very simple obfuscation for demo purposes (NOT real security) */
function hashPw(pw) {
    let h = 0;
    for (let i = 0; i < pw.length; i++) { h = (h * 31 + pw.charCodeAt(i)) >>> 0; }
    return 'h' + h.toString(16);
}

/* ===================== NAVIGATION ===================== */
const GATED_PAGES = ['about','products','vending','services','contact','enquiries'];

function showPage(name) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const target = document.getElementById('page-' + name);
    if (target) target.classList.add('active');
    document.querySelectorAll('.nav-links a').forEach(a => {
        a.classList.toggle('active', a.dataset.page === name);
    });
    document.getElementById('navLinks').classList.remove('open');
    window.scrollTo({top:0, behavior:'smooth'});
    if (name === 'enquiries') renderEnquiries();
    return false;
}

function navGuard(name) {
    const user = getCurrentUser();
    if (!user) {
        showPage('locked');
        return false;
    }
    showPage(name);
    return false;
}

function toggleNav() {
    document.getElementById('navLinks').classList.toggle('open');
}

/* ===================== AUTH UI ===================== */
function switchAuthTab(which) {
    const isLogin = which === 'login';
    document.getElementById('tabLoginBtn').classList.toggle('active', isLogin);
    document.getElementById('tabSignupBtn').classList.toggle('active', !isLogin);
    document.getElementById('loginForm').style.display = isLogin ? 'block' : 'none';
    document.getElementById('signupForm').style.display = isLogin ? 'none' : 'block';
    hideAuthError();
}
function showAuthError(msg) {
    const el = document.getElementById('authError');
    el.textContent = msg;
    el.classList.add('show');
}
function hideAuthError() {
    document.getElementById('authError').classList.remove('show');
}

function doSignup() {
    hideAuthError();
    const name = document.getElementById('su_name').value.trim();
    const email = document.getElementById('su_email').value.trim().toLowerCase();
    const pw = document.getElementById('su_password').value;
    const pw2 = document.getElementById('su_password2').value;

    if (!name || !email || !pw || !pw2) { showAuthError('Please fill in all fields.'); return; }
    if (pw.length < 6) { showAuthError('Password must be at least 6 characters.'); return; }
    if (pw !== pw2) { showAuthError('Passwords do not match.'); return; }

    const users = getUsers();
    if (users.some(u => u.email === email)) {
        showAuthError('An account with this email already exists. Please log in.');
        return;
    }
    const newUser = { name, email, passwordHash: hashPw(pw) };
    users.push(newUser);
    saveUsers(users);
    setCurrentUser({ name: newUser.name, email: newUser.email });
    onLoginSuccess();
}

function doLogin() {
    hideAuthError();
    const email = document.getElementById('li_email').value.trim().toLowerCase();
    const pw = document.getElementById('li_password').value;
    if (!email || !pw) { showAuthError('Please enter your email and password.'); return; }

    const users = getUsers();
    const user = users.find(u => u.email === email);
    if (!user || user.passwordHash !== hashPw(pw)) {
        showAuthError('Incorrect email or password.');
        return;
    }
    setCurrentUser({ name: user.name, email: user.email });
    onLoginSuccess();
}

function onLoginSuccess() {
    updateAuthUI();
    showPage('home');
}

function logout() {
    clearCurrentUser();
    updateAuthUI();
    showPage('home');
}

function updateAuthUI() {
    const user = getCurrentUser();
    const chip = document.getElementById('userChip');
    const navLogin = document.getElementById('navLogin');
    const navEnquiries = document.getElementById('navEnquiries');
    if (user) {
        chip.style.display = 'flex';
        document.getElementById('userChipName').textContent = user.name.split(' ')[0];
        navLogin.style.display = 'none';
        navEnquiries.style.display = 'inline-block';
    } else {
        chip.style.display = 'none';
        navLogin.style.display = 'inline-block';
        navEnquiries.style.display = 'none';
    }
}

/* ===================== ENQUIRIES ===================== */
function sendWA() {
    const name = document.getElementById('c_name').value;
    const phone = document.getElementById('c_phone').value;
    if (!name || !phone) { alert('Please enter your name and phone number.'); return; }
    const org = document.getElementById('c_org').value;
    const email = document.getElementById('c_email').value;
    const type = document.getElementById('c_type').value;
    const qty = document.getElementById('c_qty').value;
    const msg = document.getElementById('c_msg').value;

    /* Save enquiry locally so it shows in the Enquiries tab */
    const enquiries = getEnquiries();
    enquiries.unshift({
        name, phone, org, email, type, qty, msg,
        time: new Date().toLocaleString()
    });
    saveEnquiries(enquiries);

    let m = `*New Enquiry - Premium Life Care*%0A%0A*Name:* ${name}%0A*Phone:* ${phone}`;
    if(org) m += `%0A*Org:* ${org}`;
    if(email) m += `%0A*Email:* ${email}`;
    if(type) m += `%0A*Type:* ${type}`;
    if(qty) m += `%0A*Qty:* ${qty}`;
    if(msg) m += `%0A*Message:* ${msg}`;
    window.open('https://wa.me/917795452724?text=' + m, '_blank');
}

function renderEnquiries() {
    const list = getEnquiries();
    const container = document.getElementById('enquiriesList');
    const countEl = document.getElementById('enqCount');
    countEl.textContent = list.length + (list.length === 1 ? ' Enquiry' : ' Enquiries');

    if (list.length === 0) {
        container.innerHTML = `<div class="empty-state"><div class="ei">📭</div><p>No enquiries received yet. Submissions from the Contact Us form will appear here.</p></div>`;
        return;
    }

    container.innerHTML = list.map(e => `
        <div class="enq-card">
            <div class="enq-top">
                <h4>${escapeHtml(e.name || 'Unnamed')}</h4>
                <span class="enq-time">${escapeHtml(e.time || '')}</span>
            </div>
            ${e.type ? `<span class="enq-type-badge">${escapeHtml(e.type)}</span>` : ''}
            <div class="enq-grid" style="margin-top:10px;">
                <div><b>Phone:</b> ${escapeHtml(e.phone || '—')}</div>
                <div><b>Email:</b> ${escapeHtml(e.email || '—')}</div>
                <div><b>Organization:</b> ${escapeHtml(e.org || '—')}</div>
                <div><b>Quantity:</b> ${escapeHtml(e.qty || '—')}</div>
            </div>
            ${e.msg ? `<div class="enq-msg">${escapeHtml(e.msg)}</div>` : ''}
        </div>
    `).join('');
}

function clearEnquiries() {
    if (!confirm('Are you sure you want to clear all enquiries? This cannot be undone.')) return;
    saveEnquiries([]);
    renderEnquiries();
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

/* ===================== INIT ===================== */
document.addEventListener('DOMContentLoaded', function() {
    updateAuthUI();
});