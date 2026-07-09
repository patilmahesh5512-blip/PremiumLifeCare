/* ===================== ADMIN CREDENTIALS ===================== */
/* Only the site admin can log in to view the Admin Dashboard. */
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'PremiumCare@2026';

/* ===================== DEFAULT PRODUCT MASTER DATA ===================== */
/* Seeded from the pricing shown on the Products page. Admin can edit & save. */
const DEFAULT_PRODUCTS = [
    {
        id: 'p4x',
        name: 'PREMIUM 4X Free',
        meta: 'XL (290mm) | 1 Packet = 6 pads',
        tiers: [
            { label: '4 Packets',  qty: 4,  price: 200,  mrp: 240  },
            { label: '8 Packets',  qty: 8,  price: 380,  mrp: 480  },
            { label: '12 Packets', qty: 12, price: 540,  mrp: 720  },
            { label: '24 Packets', qty: 24, price: 1020, mrp: 1440 },
            { label: '60 Packets', qty: 60, price: 2400, mrp: 3600 }
        ]
    },
    {
        id: 'pmaxx',
        name: 'PREMIUM MAXX Free',
        meta: 'XXL+ (360mm) | 1 Packet = 15 pads',
        tiers: [
            { label: '1 Packet',   qty: 1,  price: 250,  mrp: 325  },
            { label: '2 Packets',  qty: 2,  price: 455,  mrp: 650  },
            { label: '4 Packets',  qty: 4,  price: 850,  mrp: 1300 },
            { label: '8 Packets',  qty: 8,  price: 1550, mrp: 2600 },
            { label: '12 Packets', qty: 12, price: 2150, mrp: 3900 },
            { label: '16 Packets', qty: 16, price: 2600, mrp: 5200 }
        ]
    },
    {
        id: 'pqueens',
        name: 'PREMIUM QUEENS (500ML+ Absorption)',
        meta: 'XXL+ (360mm) | 1 Packet = 15 pads',
        tiers: [
            { label: '1 Packet',   qty: 1,  price: 420,  mrp: 550  },
            { label: '2 Packets',  qty: 2,  price: 700,  mrp: 1100 },
            { label: '4 Packets',  qty: 4,  price: 1200, mrp: 2200 },
            { label: '8 Packets',  qty: 8,  price: 2160, mrp: 4400 },
            { label: '12 Packets', qty: 12, price: 2880, mrp: 6600 },
            { label: '16 Packets', qty: 16, price: 3360, mrp: 8800 }
        ]
    }
];

/* ===================== SESSION / STORAGE HELPERS ===================== */
function isAdminLoggedIn() {
    return sessionStorage.getItem('plc_admin_session') === 'true';
}
function setAdminLoggedIn() { sessionStorage.setItem('plc_admin_session', 'true'); }
function clearAdminLoggedIn() { sessionStorage.removeItem('plc_admin_session'); }

function getEnquiries() {
    try { return JSON.parse(localStorage.getItem('plc_enquiries') || '[]'); } catch(e) { return []; }
}
function saveEnquiries(list) { localStorage.setItem('plc_enquiries', JSON.stringify(list)); }

function getQuotes() {
    try { return JSON.parse(localStorage.getItem('plc_quotes') || '[]'); } catch(e) { return []; }
}
function saveQuotes(list) { localStorage.setItem('plc_quotes', JSON.stringify(list)); }

function getProducts() {
    try {
        const stored = JSON.parse(localStorage.getItem('plc_products'));
        if (stored && Array.isArray(stored) && stored.length) return stored;
    } catch(e) {}
    return JSON.parse(JSON.stringify(DEFAULT_PRODUCTS));
}
function saveProducts(list) { localStorage.setItem('plc_products', JSON.stringify(list)); }

function getNextQuoteSeq() {
    let seq = parseInt(localStorage.getItem('plc_quote_seq') || '0', 10);
    seq += 1;
    localStorage.setItem('plc_quote_seq', String(seq));
    return seq;
}

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
    if (name === 'enquiries') {
        renderProductMaster();
        renderEnquiries();
        renderQuotes();
        switchAdminTab('products');
    }
    return false;
}

/* Only used for the admin-only dashboard tab */
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

/* ===================== ADMIN DASHBOARD TABS ===================== */
function switchAdminTab(which) {
    const map = {
        products: { btn: 'atBtnProducts', panel: 'atProducts' },
        enq:      { btn: 'atBtnEnquiries', panel: 'atEnq' },
        quotes:   { btn: 'atBtnQuotes', panel: 'atQuotes' }
    };
    Object.keys(map).forEach(key => {
        document.getElementById(map[key].btn).classList.toggle('active', key === which);
        document.getElementById(map[key].panel).classList.toggle('active', key === which);
    });
}

/* ===================== PRODUCT MASTER ===================== */
function renderProductMaster() {
    const products = getProducts();
    const container = document.getElementById('pmContainer');

    container.innerHTML = products.map(prod => `
        <div class="pm-product-block" data-product-id="${prod.id}">
            <h3>${escapeHtml(prod.name)}</h3>
            <p class="pm-sub">${escapeHtml(prod.meta)}</p>
            <div class="pm-table-wrap">
                <table class="pm-table">
                    <thead><tr><th>Tier</th><th>Offer Price (₹)</th><th>MRP (₹)</th></tr></thead>
                    <tbody>
                        ${prod.tiers.map((tier, idx) => `
                            <tr>
                                <td>${escapeHtml(tier.label)}</td>
                                <td><input type="number" min="0" value="${tier.price}" data-product="${prod.id}" data-tier="${idx}" data-field="price"></td>
                                <td><input type="number" min="0" value="${tier.mrp}" data-product="${prod.id}" data-tier="${idx}" data-field="mrp"></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `).join('');
}

function savePrices() {
    const products = getProducts();
    document.querySelectorAll('#pmContainer input').forEach(input => {
        const prodId = input.dataset.product;
        const tierIdx = parseInt(input.dataset.tier, 10);
        const field = input.dataset.field;
        const prod = products.find(p => p.id === prodId);
        if (prod && prod.tiers[tierIdx]) {
            prod.tiers[tierIdx][field] = parseFloat(input.value) || 0;
        }
    });
    saveProducts(products);
    const msg = document.getElementById('pmSavedMsg');
    msg.classList.add('show');
    setTimeout(() => msg.classList.remove('show'), 2500);
}

/* ===================== ENQUIRIES RECEIVED ===================== */
function sendWA() {
    const name = document.getElementById('c_name').value;
    const phone = document.getElementById('c_phone').value;
    if (!name || !phone) { alert('Please enter your name and phone number.'); return; }
    const org = document.getElementById('c_org').value;
    const email = document.getElementById('c_email').value;
    const type = document.getElementById('c_type').value;
    const qty = document.getElementById('c_qty').value;
    const msg = document.getElementById('c_msg').value;

    /* Save enquiry locally so it shows in the admin dashboard */
    const enquiries = getEnquiries();
    enquiries.unshift({
        id: 'enq_' + Date.now() + '_' + Math.floor(Math.random()*10000),
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
        updateBulkQuoteBtn();
        return;
    }

    container.innerHTML = list.map(e => `
        <div class="enq-card" id="enqcard-${e.id}">
            <input type="checkbox" class="enq-checkbox" data-enq-id="${e.id}" onchange="onEnqCheckboxChange('${e.id}')">
            <div class="enq-body">
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
                <div class="enq-actions">
                    <button class="gen-quote-btn" onclick="openQuoteModal(['${e.id}'])">Generate Quote</button>
                </div>
            </div>
        </div>
    `).join('');
    updateBulkQuoteBtn();
}

function getSelectedEnquiryIds() {
    return Array.from(document.querySelectorAll('.enq-checkbox:checked')).map(cb => cb.dataset.enqId);
}

function onEnqCheckboxChange(id) {
    const card = document.getElementById('enqcard-' + id);
    const cb = card.querySelector('.enq-checkbox');
    card.classList.toggle('selected', cb.checked);
    updateBulkQuoteBtn();
}

function updateBulkQuoteBtn() {
    const btn = document.getElementById('bulkQuoteBtn');
    const selected = getSelectedEnquiryIds();
    btn.disabled = selected.length === 0;
    btn.textContent = selected.length > 0
        ? `Generate Quote for Selected (${selected.length})`
        : 'Generate Quote for Selected';
    btn.setAttribute('onclick', `openQuoteModal(getSelectedEnquiryIds())`);
}

/* ===================== QUOTE GENERATION ===================== */
let quoteModalEnquiryIds = [];

function openQuoteModal(enquiryIds) {
    if (!enquiryIds || enquiryIds.length === 0) return;
    quoteModalEnquiryIds = enquiryIds;

    const products = getProducts();
    const select = document.getElementById('qm_product');
    select.innerHTML = products.map(p =>
        `<option value="${p.id}">${escapeHtml(p.name)} — ${escapeHtml(p.meta)}</option>`
    ).join('');

    /* Pre-fill quantity from the first selected enquiry if it has a numeric qty */
    const enquiries = getEnquiries();
    const firstEnq = enquiries.find(e => e.id === enquiryIds[0]);
    const guessedQty = firstEnq ? (parseInt((firstEnq.qty || '').replace(/[^\d]/g, ''), 10) || 1) : 1;
    document.getElementById('qm_qty').value = guessedQty;

    document.getElementById('quoteModal').classList.add('show');
    updateQuotePreview();
}

function closeQuoteModal() {
    document.getElementById('quoteModal').classList.remove('show');
    quoteModalEnquiryIds = [];
}

function findBestTierPrice(product, qty) {
    if (!product.tiers.length) return { unitPrice: 0, total: 0, tierLabel: '—' };
    const sorted = [...product.tiers].sort((a,b) => a.qty - b.qty);
    let chosen = sorted[0];
    for (const t of sorted) {
        if (qty >= t.qty) chosen = t;
    }
    const unitPrice = chosen.price / chosen.qty;
    const total = Math.round(unitPrice * qty);
    return { unitPrice, total, tierLabel: chosen.label };
}

function updateQuotePreview() {
    const products = getProducts();
    const prodId = document.getElementById('qm_product').value;
    const qty = parseInt(document.getElementById('qm_qty').value, 10) || 1;
    const product = products.find(p => p.id === prodId) || products[0];
    if (!product) return;

    const { unitPrice, total, tierLabel } = findBestTierPrice(product, qty);
    const preview = document.getElementById('qm_preview');
    preview.innerHTML = `
        <div><b>Product:</b> ${escapeHtml(product.name)}</div>
        <div><b>Quantity:</b> ${qty} Packet(s)</div>
        <div><b>Rate basis:</b> ${escapeHtml(tierLabel)} pricing (₹${unitPrice.toFixed(2)}/packet)</div>
        <div><b>Estimated Total:</b> ₹${total.toLocaleString('en-IN')}</div>
    `;
}

function confirmGenerateQuote() {
    const products = getProducts();
    const prodId = document.getElementById('qm_product').value;
    const qty = parseInt(document.getElementById('qm_qty').value, 10) || 1;
    const product = products.find(p => p.id === prodId);
    if (!product) return;

    const { total } = findBestTierPrice(product, qty);
    const seq = getNextQuoteSeq();
    const quoteNo = 'PLC-Q-' + String(seq).padStart(4, '0');
    const dateStr = new Date().toLocaleDateString('en-IN', { year:'numeric', month:'short', day:'numeric' });

    const enquiries = getEnquiries();
    const linkedEnquiries = enquiries.filter(e => quoteModalEnquiryIds.includes(e.id));

    const quotes = getQuotes();
    quotes.unshift({
        quoteNo,
        date: dateStr,
        product: product.name,
        quantity: qty,
        price: total,
        customers: linkedEnquiries.map(e => ({ name: e.name, phone: e.phone, org: e.org, email: e.email }))
    });
    saveQuotes(quotes);

    /* Remove the linked enquiries from the Received list */
    const remaining = enquiries.filter(e => !quoteModalEnquiryIds.includes(e.id));
    saveEnquiries(remaining);

    closeQuoteModal();
    renderEnquiries();
    renderQuotes();
    switchAdminTab('quotes');
}

/* ===================== QUOTES SENT ===================== */
function renderQuotes() {
    const list = getQuotes();
    const container = document.getElementById('quotesList');
    const countEl = document.getElementById('quoteCount');
    countEl.textContent = list.length + (list.length === 1 ? ' Quote' : ' Quotes');

    if (list.length === 0) {
        container.innerHTML = `<div class="empty-state"><div class="ei">📄</div><p>No quotes generated yet. Use "Generate Quote" on an enquiry to create one.</p></div>`;
        return;
    }

    container.innerHTML = list.map(q => `
        <div class="quote-card">
            <div class="quote-top">
                <h4>${escapeHtml(q.product)}</h4>
                <span class="quote-no-badge">${escapeHtml(q.quoteNo)}</span>
            </div>
            <div class="enq-grid">
                <div><b>Date:</b> ${escapeHtml(q.date)}</div>
                <div><b>Quantity:</b> ${escapeHtml(String(q.quantity))} Packet(s)</div>
            </div>
            ${q.customers && q.customers.length ? `
                <div class="enq-grid" style="margin-top:6px;">
                    ${q.customers.map(c => `<div><b>Customer:</b> ${escapeHtml(c.name || '—')} (${escapeHtml(c.phone || '—')})</div>`).join('')}
                </div>
            ` : ''}
            <div class="quote-price-box">
                <div>Quote No: <b>${escapeHtml(q.quoteNo)}</b></div>
                <div>Total Price: <b>₹${Number(q.price).toLocaleString('en-IN')}</b></div>
            </div>
        </div>
    `).join('');
}

/* ===================== SHARED HELPERS ===================== */
function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str == null ? '' : str;
    return div.innerHTML;
}

/* ===================== INIT ===================== */
document.addEventListener('DOMContentLoaded', function() {
    updateAuthUI();
});
