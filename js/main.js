/* ===================== ADMIN CREDENTIALS ===================== */
/* Only the site admin can log in to view the Enquiries list. */
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'PremiumCare@2026';

/* ===================== STORAGE HELPERS ===================== */
function isAdminLoggedIn() {
    return sessionStorage.getItem('plc_admin_session') === 'true';
}
function setAdminLoggedIn() { sessionStorage.setItem('plc_admin_session', 'true'); }
function clearAdminLoggedIn() { sessionStorage.removeItem('plc_admin_session'); }

function getEnquiries() {
    try { return JSON.parse(localStorage.getItem('plc_enquiries') || '[]'); } catch(e) { return []; }
}
function saveEnquiries(list) { localStorage.setItem('plc_enquiries', JSON.stringify(list)); }

/* ===================== NAVIGATION ===================== */
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

/* Only used for the admin-only Enquiries tab */
function navGuard(name) {
    if (!isAdminLoggedIn()) {
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
function showAuthError(msg) {
    const el = document.getElementById('authError');
    el.textContent = msg;
    el.classList.add('show');
}
function hideAuthError() {
    document.getElementById('authError').classList.remove('show');
}

function doLogin() {
    hideAuthError();
    const username = document.getElementById('li_email').value.trim();
    const pw = document.getElementById('li_password').value;
    if (!username || !pw) { showAuthError('Please enter the admin username and password.'); return; }

    if (username !== ADMIN_USERNAME || pw !== ADMIN_PASSWORD) {
        showAuthError('Incorrect admin username or password.');
        return;
    }
    setAdminLoggedIn();
    updateAuthUI();
    showPage('enquiries');
}

function logout() {
    clearAdminLoggedIn();
    updateAuthUI();
    showPage('home');
}

function updateAuthUI() {
    const loggedIn = isAdminLoggedIn();
    const chip = document.getElementById('userChip');
    const navLogin = document.getElementById('navLogin');
    const navEnquiries = document.getElementById('navEnquiries');
    if (loggedIn) {
        chip.style.display = 'flex';
        document.getElementById('userChipName').textContent = 'Admin';
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

    /* Save enquiry locally so it shows in the admin Enquiries tab */
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