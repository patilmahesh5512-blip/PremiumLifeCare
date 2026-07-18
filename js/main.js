/* ===================== SUPABASE CONFIG ===================== */
const SUPABASE_URL = 'https://qpbhftgfsjyilroorvix.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwYmhmdGdmc2p5aWxyb29ydml4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM2NTAxNTQsImV4cCI6MjA5OTIyNjE1NH0.lMUDbEOP6SirH-ANmpVdqMc1AJjM-gOGLzw3sr2Yv0Q';
/* Guard against the Supabase CDN script failing to load (e.g. network hiccup,
   ad blocker, offline testing). Without this, a single failed external script
   would previously crash this entire file and break unrelated features like
   navigation and the language switcher. */
let sb = null;
try {
    if (window.supabase && typeof window.supabase.createClient === 'function') {
        sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    } else {
        console.error('Supabase library did not load — database features (enquiries, product prices, quotes) will not work until the page is reloaded with a working internet connection.');
    }
} catch (e) {
    console.error('Failed to initialize Supabase client:', e);
}

/* ===================== ADMIN CREDENTIALS ===================== */
/* Only the site admin can log in to view the Admin Dashboard. */
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'PremiumCare@2026';

/* ===================== DEFAULT PRODUCT MASTER DATA ===================== */
/* Used to seed Supabase the very first time, and as a structural reference
   (names/ids/tiers) that saved prices get merged into. */
const DEFAULT_PRODUCTS = [
    {
        id: 'xl6',
        name: 'XL (290mm) 6 Pads',
        meta: 'XL Size | 6 Pads per Packet',
        tiers: [ { label: 'Price per Packet', qty: 1, price: null, mrp: null } ]
    },
    {
        id: 'xl15',
        name: 'XL (290mm) 15 Pads',
        meta: 'XL Size | 15 Pads per Packet',
        tiers: [ { label: 'Price per Packet', qty: 1, price: null, mrp: null } ]
    },
    {
        id: 'xl30',
        name: 'XL (290mm) 30 Pads',
        meta: 'XL Size | 30 Pads per Packet',
        tiers: [ { label: 'Price per Packet', qty: 1, price: null, mrp: null } ]
    },
    {
        id: 'xxl6',
        name: 'XXL+ (360mm) 6 Pads',
        meta: 'XXL+ Size | 6 Pads per Packet',
        tiers: [ { label: 'Price per Packet', qty: 1, price: null, mrp: null } ]
    },
    {
        id: 'xxl15',
        name: 'XXL+ (360mm) 15 Pads',
        meta: 'XXL+ Size | 15 Pads per Packet',
        tiers: [ { label: 'Price per Packet', qty: 1, price: null, mrp: null } ]
    },
    {
        id: 'xxl30',
        name: 'XXL+ (360mm) 30 Pads',
        meta: 'XXL+ Size | 30 Pads per Packet',
        tiers: [ { label: 'Price per Packet', qty: 1, price: null, mrp: null } ]
    },
    {
        id: 'upivend25',
        name: 'UPI Based Vending Machine 25 Capacity',
        meta: '25 Pad Capacity | UPI Payment Enabled',
        tiers: [ { label: 'Price per Unit', qty: 1, price: null, mrp: null } ]
    },
    {
        id: 'upivend80',
        name: 'UPI Based Vending Machine 80 Capacity',
        meta: '80 Pad Capacity | UPI Payment Enabled',
        tiers: [ { label: 'Price per Unit', qty: 1, price: null, mrp: null } ]
    }
];

const COMPANY_INFO = {
    name: 'PREMIUM LIFE CARE',
    address: 'Margai Nagar, Kameshwar Galli, B K Kangali, Belagavi – 590010, Karnataka, India',
    phone: '+91 7795452724',
    email: 'Premiumlifecare31@gmail.com'
};

/* ===================== SESSION HELPERS (admin login stays local/per-browser) ===================== */
function isAdminLoggedIn() {
    return sessionStorage.getItem('plc_admin_session') === 'true';
}
function setAdminLoggedIn() { sessionStorage.setItem('plc_admin_session', 'true'); }
function clearAdminLoggedIn() { sessionStorage.removeItem('plc_admin_session'); }

/* ===================== SUPABASE DATA HELPERS ===================== */
const SB_UNAVAILABLE_MSG = 'Database connection is unavailable right now. Please check your internet connection and reload the page.';

/* Enquiries are a PERMANENT log — never deleted, only marked quoted:true/false */
async function getEnquiries() {
    if (!sb) { console.error(SB_UNAVAILABLE_MSG); return []; }
    const { data, error } = await sb.from('enquiries').select('*').order('created_at', { ascending: false });
    if (error) { console.error('getEnquiries error:', error); return []; }
    return (data || []).map(row => ({
        id: row.id, name: row.name, phone: row.phone, org: row.org, email: row.email,
        type: row.type, qty: row.qty, msg: row.msg, time: row.time, quoted: row.quoted
    }));
}

async function insertEnquiry(enq) {
    if (!sb) { alert(SB_UNAVAILABLE_MSG); return; }
    const { error } = await sb.from('enquiries').insert([enq]);
    if (error) console.error('insertEnquiry error:', error);
}

async function markEnquiriesQuoted(ids) {
    if (!sb) { console.error(SB_UNAVAILABLE_MSG); return; }
    const { error } = await sb.from('enquiries').update({ quoted: true }).in('id', ids);
    if (error) console.error('markEnquiriesQuoted error:', error);
}

async function getQuotes() {
    if (!sb) { console.error(SB_UNAVAILABLE_MSG); return []; }
    const { data, error } = await sb.from('quotes').select('*').order('created_at', { ascending: false });
    if (error) { console.error('getQuotes error:', error); return []; }
    return (data || []).map(row => ({
        quoteNo: row.quote_no, date: row.date, product: row.product, productMeta: row.product_meta,
        quantity: row.quantity, price: row.price, deliveryMethod: row.delivery_method, customers: row.customers || []
    }));
}

async function insertQuote(q) {
    if (!sb) { console.error(SB_UNAVAILABLE_MSG); return; }
    const { error } = await sb.from('quotes').insert([{
        quote_no: q.quoteNo, date: q.date, product: q.product, product_meta: q.productMeta,
        quantity: q.quantity, price: q.price, delivery_method: q.deliveryMethod, customers: q.customers
    }]);
    if (error) console.error('insertQuote error:', error);
}

/* Products: fetched from Supabase, seeded from DEFAULT_PRODUCTS on first run if table is empty */
async function getProducts() {
    if (!sb) { console.error(SB_UNAVAILABLE_MSG); return JSON.parse(JSON.stringify(DEFAULT_PRODUCTS)); }
    const { data, error } = await sb.from('products').select('*').order('id', { ascending: true });
    if (error) { console.error('getProducts error:', error); return JSON.parse(JSON.stringify(DEFAULT_PRODUCTS)); }

    if (!data || data.length === 0) {
        /* First run — seed Supabase with the default product list */
        await seedDefaultProducts();
        return JSON.parse(JSON.stringify(DEFAULT_PRODUCTS));
    }

    /* Always use the CURRENT DEFAULT_PRODUCTS structure (names/ids/tiers) as the
       source of truth for what products/tiers exist, and merge in saved prices
       by id. This means renaming/adding products in code always takes effect,
       and old removed products never resurface. */
    const defaults = JSON.parse(JSON.stringify(DEFAULT_PRODUCTS));
    const savedById = {};
    data.forEach(row => { savedById[row.id] = row; });

    const finalProducts = defaults.map(prod => {
        const savedProd = savedById[prod.id];
        if (savedProd && savedProd.tiers) {
            prod.tiers.forEach((tier, idx) => {
                const savedTier = savedProd.tiers[idx];
                if (savedTier && savedTier.label === tier.label) {
                    if (savedTier.price != null) tier.price = savedTier.price;
                    if (savedTier.mrp != null) tier.mrp = savedTier.mrp;
                }
            });
        }
        return prod;
    });

    return finalProducts;
}

async function seedDefaultProducts() {
    if (!sb) return;
    const rows = DEFAULT_PRODUCTS.map(p => ({ id: p.id, name: p.name, meta: p.meta, tiers: p.tiers }));
    const { error } = await sb.from('products').upsert(rows);
    if (error) console.error('seedDefaultProducts error:', error);
}

async function saveProducts(list) {
    if (!sb) return { success: false, error: { message: SB_UNAVAILABLE_MSG } };
    const rows = list.map(p => ({ id: p.id, name: p.name, meta: p.meta, tiers: p.tiers }));
    const { error } = await sb.from('products').upsert(rows);
    if (error) {
        console.error('saveProducts error:', error);
        return { success: false, error };
    }
    return { success: true };
}

async function getNextQuoteSeq() {
    if (!sb) { console.error(SB_UNAVAILABLE_MSG); return Date.now() % 100000; }
    /* Read-increment-write against the single row in quote_sequence.
       Not perfectly race-proof under simultaneous admins, but fine for this scale. */
    const { data, error } = await sb.from('quote_sequence').select('*').eq('id', 1).single();
    let seq = 0;
    if (!error && data) seq = data.seq || 0;
    seq += 1;
    const { error: updateError } = await sb.from('quote_sequence').update({ seq }).eq('id', 1);
    if (updateError) console.error('getNextQuoteSeq update error:', updateError);
    return seq;
}

/* ===================== NAVIGATION ===================== */
async function showPage(name) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const target = document.getElementById('page-' + name);
    if (target) target.classList.add('active');
    document.querySelectorAll('.nav-links a').forEach(a => {
        a.classList.toggle('active', a.dataset.page === name);
    });
    document.getElementById('navLinks').classList.remove('open');
    window.scrollTo({top:0, behavior:'smooth'});
    if (name === 'enquiries') {
        switchAdminTab('products');
        await renderProductMaster();
        await renderEnquiries();
        await renderPending();
        await renderQuotes();
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
        pending:  { btn: 'atBtnPending', panel: 'atPending' },
        quotes:   { btn: 'atBtnQuotes', panel: 'atQuotes' }
    };
    Object.keys(map).forEach(key => {
        document.getElementById(map[key].btn).classList.toggle('active', key === which);
        document.getElementById(map[key].panel).classList.toggle('active', key === which);
    });
}

/* ===================== PRODUCT MASTER ===================== */
async function renderProductMaster() {
    const container = document.getElementById('pmContainer');
    container.innerHTML = `<div class="empty-state"><div class="ei">⏳</div><p>Loading products...</p></div>`;

    const products = await getProducts();

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
                                <td><input type="number" min="0" value="${tier.price == null ? '' : tier.price}" placeholder="Enter price" data-product="${prod.id}" data-tier="${idx}" data-field="price"></td>
                                <td><input type="number" min="0" value="${tier.mrp == null ? '' : tier.mrp}" placeholder="Enter MRP" data-product="${prod.id}" data-tier="${idx}" data-field="mrp"></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `).join('');
}

async function savePrices() {
    const saveBtn = document.querySelector('.pm-save-btn');
    const originalText = saveBtn.textContent;
    saveBtn.textContent = 'Saving...';
    saveBtn.disabled = true;

    const products = await getProducts();
    document.querySelectorAll('#pmContainer input').forEach(input => {
        const prodId = input.dataset.product;
        const tierIdx = parseInt(input.dataset.tier, 10);
        const field = input.dataset.field;
        const prod = products.find(p => p.id === prodId);
        if (prod && prod.tiers[tierIdx]) {
            const raw = input.value.trim();
            prod.tiers[tierIdx][field] = raw === '' ? null : parseFloat(raw);
        }
    });
    const result = await saveProducts(products);

    saveBtn.textContent = originalText;
    saveBtn.disabled = false;

    const msg = document.getElementById('pmSavedMsg');
    if (result && result.success) {
        msg.textContent = '✓ Prices saved successfully.';
        msg.style.color = '';
        msg.classList.add('show');
        setTimeout(() => msg.classList.remove('show'), 2500);
        /* Re-render so the admin sees the freshly saved values reflected immediately */
        await renderProductMaster();
    } else {
        const reason = (result && result.error && result.error.message) ? result.error.message : 'Unknown error';
        msg.textContent = '✗ Save failed: ' + reason + ' — please check your internet connection and try again.';
        msg.style.color = '#c0304a';
        msg.classList.add('show');
        console.error('Product save failed:', result && result.error);
    }
}

/* ===================== CONTACT FORM SUBMISSION ===================== */
async function sendWA() {
    const name = document.getElementById('c_name').value;
    const phone = document.getElementById('c_phone').value;
    if (!name || !phone) { alert('Please enter your name and phone number.'); return; }
    const org = document.getElementById('c_org').value;
    const email = document.getElementById('c_email').value;
    const type = document.getElementById('c_type').value;
    const qty = document.getElementById('c_qty').value;
    const msg = document.getElementById('c_msg').value;

    /* Save enquiry to Supabase so it shows in the admin dashboard from any device */
    const enquiry = {
        id: 'enq_' + Date.now() + '_' + Math.floor(Math.random()*10000),
        name, phone, org, email, type, qty, msg,
        time: new Date().toLocaleString(),
        quoted: false
    };
    await insertEnquiry(enquiry);

    let m = `*New Enquiry - Premium Life Care*%0A%0A*Name:* ${name}%0A*Phone:* ${phone}`;
    if(org) m += `%0A*Org:* ${org}`;
    if(email) m += `%0A*Email:* ${email}`;
    if(type) m += `%0A*Type:* ${type}`;
    if(qty) m += `%0A*Qty:* ${qty}`;
    if(msg) m += `%0A*Message:* ${msg}`;
    window.open('https://wa.me/917795452724?text=' + m, '_blank');
}

/* ===================== TAB 2: ENQUIRIES RECEIVED (full permanent log) ===================== */
async function renderEnquiries() {
    const container = document.getElementById('enquiriesList');
    container.innerHTML = `<div class="empty-state"><div class="ei">⏳</div><p>Loading enquiries...</p></div>`;

    const list = await getEnquiries();
    const countEl = document.getElementById('enqCount');
    countEl.textContent = list.length + (list.length === 1 ? ' Enquiry' : ' Enquiries');

    if (list.length === 0) {
        container.innerHTML = `<div class="empty-state"><div class="ei">📭</div><p>No enquiries received yet. Submissions from the Contact Us form will appear here.</p></div>`;
        return;
    }

    container.innerHTML = list.map(e => `
        <div class="enq-card">
            <div class="enq-body">
                <div class="enq-top">
                    <h4>${escapeHtml(e.name || 'Unnamed')}
                        <span class="status-badge ${e.quoted ? 'status-quoted' : 'status-pending'}">${e.quoted ? '✓ Quoted' : '⏳ Pending'}</span>
                    </h4>
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
        </div>
    `).join('');
}

/* ===================== TAB 3: PENDING ENQUIRIES (not yet quoted, actionable) ===================== */
async function renderPending() {
    const container = document.getElementById('pendingList');
    container.innerHTML = `<div class="empty-state"><div class="ei">⏳</div><p>Loading pending enquiries...</p></div>`;

    const all = await getEnquiries();
    const list = all.filter(e => e.quoted !== true);
    const countEl = document.getElementById('pendingCount');
    countEl.textContent = list.length + (list.length === 1 ? ' Pending' : ' Pending');

    if (list.length === 0) {
        container.innerHTML = `<div class="empty-state"><div class="ei">✅</div><p>No pending enquiries. Everything has been quoted!</p></div>`;
        updateBulkQuoteBtn();
        return;
    }

    container.innerHTML = list.map(e => `
        <div class="enq-card" id="pendcard-${e.id}">
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
    const card = document.getElementById('pendcard-' + id);
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

async function openQuoteModal(enquiryIds) {
    if (!enquiryIds || enquiryIds.length === 0) return;
    quoteModalEnquiryIds = enquiryIds;

    const products = await getProducts();
    const select = document.getElementById('qm_product');
    select.innerHTML = products.map(p =>
        `<option value="${p.id}">${escapeHtml(p.name)} — ${escapeHtml(p.meta)}</option>`
    ).join('');

    /* Pre-fill quantity from the first selected enquiry if it has a numeric qty */
    const enquiries = await getEnquiries();
    const firstEnq = enquiries.find(e => e.id === enquiryIds[0]);
    const guessedQty = firstEnq ? (parseInt((firstEnq.qty || '').replace(/[^\d]/g, ''), 10) || 1) : 1;
    document.getElementById('qm_qty').value = guessedQty;

    /* Default delivery method: email if the enquiry has an email, else WhatsApp */
    const deliverySelect = document.getElementById('qm_delivery');
    deliverySelect.value = (firstEnq && firstEnq.email) ? 'email' : 'whatsapp';

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
    if (chosen.price == null) return { unitPrice: 0, total: 0, tierLabel: chosen.label, priceNotSet: true };
    const unitPrice = chosen.price / chosen.qty;
    const total = Math.round(unitPrice * qty);
    return { unitPrice, total, tierLabel: chosen.label };
}

async function updateQuotePreview() {
    const products = await getProducts();
    const prodId = document.getElementById('qm_product').value;
    const qty = parseInt(document.getElementById('qm_qty').value, 10) || 1;
    const product = products.find(p => p.id === prodId) || products[0];
    if (!product) return;

    const { unitPrice, total, tierLabel, priceNotSet } = findBestTierPrice(product, qty);
    const preview = document.getElementById('qm_preview');

    if (priceNotSet) {
        preview.innerHTML = `
            <div><b>Product:</b> ${escapeHtml(product.name)}</div>
            <div><b>Quantity:</b> ${qty} Packet(s)</div>
            <div style="color:#c0304a; font-weight:600;">⚠ Price not set yet. Please add a price for this product in the Product Master tab first.</div>
        `;
        return;
    }

    preview.innerHTML = `
        <div><b>Product:</b> ${escapeHtml(product.name)}</div>
        <div><b>Quantity:</b> ${qty} Packet(s)</div>
        <div><b>Rate basis:</b> ${escapeHtml(tierLabel)} pricing (₹${unitPrice.toFixed(2)}/packet)</div>
        <div><b>Estimated Total:</b> ₹${total.toLocaleString('en-IN')}</div>
    `;
}

async function confirmGenerateQuote() {
    const confirmBtn = document.querySelector('.modal-confirm-btn');
    const originalText = confirmBtn.textContent;
    confirmBtn.textContent = 'Generating...';
    confirmBtn.disabled = true;

    const products = await getProducts();
    const prodId = document.getElementById('qm_product').value;
    const qty = parseInt(document.getElementById('qm_qty').value, 10) || 1;
    const deliveryMethod = document.getElementById('qm_delivery').value;
    const product = products.find(p => p.id === prodId);
    if (!product) { confirmBtn.textContent = originalText; confirmBtn.disabled = false; return; }

    const { total, priceNotSet } = findBestTierPrice(product, qty);
    if (priceNotSet) {
        alert('This product does not have a price set yet. Please go to Product Master and enter a price before generating a quote.');
        confirmBtn.textContent = originalText;
        confirmBtn.disabled = false;
        return;
    }

    const seq = await getNextQuoteSeq();
    const quoteNo = 'PLC-Q-' + String(seq).padStart(4, '0');
    const dateStr = new Date().toLocaleDateString('en-IN', { year:'numeric', month:'short', day:'numeric' });

    const enquiries = await getEnquiries();
    const linkedEnquiries = enquiries.filter(e => quoteModalEnquiryIds.includes(e.id));
    const primaryCustomer = linkedEnquiries[0] || {};

    const quoteRecord = {
        quoteNo,
        date: dateStr,
        product: product.name,
        productMeta: product.meta,
        quantity: qty,
        price: total,
        deliveryMethod,
        customers: linkedEnquiries.map(e => ({ name: e.name, phone: e.phone, org: e.org, email: e.email }))
    };

    await insertQuote(quoteRecord);
    await markEnquiriesQuoted(quoteModalEnquiryIds);

    /* Generate the PDF and trigger delivery */
    const pdfDataUri = buildQuotePdf(quoteRecord, primaryCustomer);
    deliverQuote(quoteRecord, primaryCustomer, pdfDataUri, deliveryMethod);

    confirmBtn.textContent = originalText;
    confirmBtn.disabled = false;
    closeQuoteModal();
    await renderEnquiries();
    await renderPending();
    await renderQuotes();
    switchAdminTab('quotes');
}

/* ===================== PDF GENERATION ===================== */
function buildQuotePdf(quote, customer) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'pt', format: 'a5' }); // small/compact page size
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 40;

    /* Header */
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(212, 20, 90);
    doc.text(COMPANY_INFO.name, pageWidth / 2, y, { align: 'center' });
    y += 18;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(90, 90, 90);
    const addressLines = doc.splitTextToSize(COMPANY_INFO.address, pageWidth - 60);
    addressLines.forEach(line => { doc.text(line, pageWidth / 2, y, { align: 'center' }); y += 10; });
    doc.text(`Phone: ${COMPANY_INFO.phone}  |  Email: ${COMPANY_INFO.email}`, pageWidth / 2, y, { align: 'center' });
    y += 18;

    doc.setDrawColor(212, 20, 90);
    doc.setLineWidth(1);
    doc.line(30, y, pageWidth - 30, y);
    y += 24;

    /* Quote title */
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(30, 30, 46);
    doc.text('QUOTATION', pageWidth / 2, y, { align: 'center' });
    y += 22;

    /* Quote meta */
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(50, 50, 50);
    doc.text(`Quote No: ${quote.quoteNo}`, 30, y);
    doc.text(`Date: ${quote.date}`, pageWidth - 30, y, { align: 'right' });
    y += 20;

    /* Customer details */
    if (customer && (customer.name || customer.phone || customer.org)) {
        doc.setFont('helvetica', 'bold');
        doc.text('Bill To:', 30, y);
        y += 13;
        doc.setFont('helvetica', 'normal');
        if (customer.name) { doc.text(customer.name, 30, y); y += 12; }
        if (customer.org)  { doc.text(customer.org, 30, y); y += 12; }
        if (customer.phone){ doc.text('Phone: ' + customer.phone, 30, y); y += 12; }
        if (customer.email){ doc.text('Email: ' + customer.email, 30, y); y += 12; }
        y += 8;
    }

    /* Table header */
    doc.setFillColor(212, 20, 90);
    doc.rect(30, y, pageWidth - 60, 20, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('Product', 36, y + 14);
    doc.text('Qty', pageWidth - 160, y + 14);
    doc.text('Price (₹)', pageWidth - 36, y + 14, { align: 'right' });
    y += 20;

    /* Table row */
    doc.setTextColor(30, 30, 30);
    doc.setFont('helvetica', 'normal');
    const nameLines = doc.splitTextToSize(quote.product, 190);
    doc.text(nameLines, 36, y + 14);
    doc.text(String(quote.quantity) + ' pkt', pageWidth - 160, y + 14);
    doc.text(quote.price.toLocaleString('en-IN'), pageWidth - 36, y + 14, { align: 'right' });
    y += Math.max(20, nameLines.length * 12 + 8);

    if (quote.productMeta) {
        doc.setFontSize(7.5);
        doc.setTextColor(120, 120, 120);
        doc.text(quote.productMeta, 36, y);
        y += 14;
    }

    doc.setDrawColor(220, 220, 220);
    doc.line(30, y, pageWidth - 30, y);
    y += 20;

    /* Total */
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(0, 169, 157);
    doc.text('Total Amount:', pageWidth - 160, y);
    doc.text('Rs. ' + quote.price.toLocaleString('en-IN'), pageWidth - 36, y, { align: 'right' });
    y += 30;

    /* Footer note */
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    const noteLines = doc.splitTextToSize('This is a system-generated quotation. Prices are subject to change without prior notice. For queries, please contact us using the details above.', pageWidth - 60);
    noteLines.forEach(line => { doc.text(line, 30, y); y += 10; });

    return doc.output('datauristring');
}

/* ===================== QUOTE DELIVERY (WhatsApp / Email) ===================== */
function deliverQuote(quote, customer, pdfDataUri, method) {
    /* Always trigger a download of the PDF so the admin has the file ready to attach,
       since browsers cannot auto-attach files to WhatsApp Web / mailto links. */
    downloadPdf(pdfDataUri, quote.quoteNo + '.pdf');

    const msgText = `Hello${customer.name ? ' ' + customer.name : ''}, please find your quotation ${quote.quoteNo} from Premium Life Care.%0A%0A*Product:* ${encodeURIComponent(quote.product)}%0A*Quantity:* ${quote.quantity} Packet(s)%0A*Total Price:* Rs. ${quote.price.toLocaleString('en-IN')}%0A%0AThe PDF quote has been downloaded — please attach it here to send. Thank you for choosing Premium Life Care!`;

    if (method === 'email' && customer.email) {
        const subject = encodeURIComponent(`Quotation ${quote.quoteNo} - Premium Life Care`);
        const body = encodeURIComponent(
            `Hello${customer.name ? ' ' + customer.name : ''},\n\nPlease find attached your quotation ${quote.quoteNo} from Premium Life Care.\n\nProduct: ${quote.product}\nQuantity: ${quote.quantity} Packet(s)\nTotal Price: Rs. ${quote.price.toLocaleString('en-IN')}\n\nNote: The quote PDF has just been downloaded to this device — please attach "${quote.quoteNo}.pdf" before sending.\n\nThank you for choosing Premium Life Care!`
        );
        window.open(`mailto:${customer.email}?subject=${subject}&body=${body}`, '_blank');
    } else {
        /* WhatsApp fallback (also used if no email on file) */
        const phone = (customer.phone || '').replace(/[^\d]/g, '');
        const waNumber = phone ? (phone.length === 10 ? '91' + phone : phone) : '917795452724';
        window.open(`https://wa.me/${waNumber}?text=${msgText}`, '_blank');
    }
}

function downloadPdf(dataUri, filename) {
    const link = document.createElement('a');
    link.href = dataUri;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

/* ===================== FULL DATA BACKUP ===================== */
/* Since Supabase's free tier has no automatic backups, this lets the admin
   manually export every table's data as one JSON file whenever they like —
   safe to save to Google Drive, email to themselves, or keep on their computer. */
async function downloadFullBackup() {
    const btn = document.querySelector('.backup-btn');
    const originalText = btn.textContent;
    btn.textContent = 'Preparing backup...';
    btn.disabled = true;

    try {
        const [enquiries, products, quotes] = await Promise.all([
            getEnquiries(),
            getProducts(),
            getQuotes()
        ]);

        const backup = {
            exportedAt: new Date().toISOString(),
            exportedAtReadable: new Date().toLocaleString(),
            source: 'Premium Life Care Admin Dashboard',
            enquiries,
            products,
            quotes
        };

        const json = JSON.stringify(backup, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const dateStamp = new Date().toISOString().slice(0, 10);
        const link = document.createElement('a');
        link.href = url;
        link.download = `premium-life-care-backup-${dateStamp}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    } catch (err) {
        console.error('Backup failed:', err);
        alert('Backup failed. Please check your internet connection and try again.');
    } finally {
        btn.textContent = originalText;
        btn.disabled = false;
    }
}

/* ===================== TAB 4: QUOTES SENT ===================== */
async function renderQuotes() {
    const container = document.getElementById('quotesList');
    container.innerHTML = `<div class="empty-state"><div class="ei">⏳</div><p>Loading quotes...</p></div>`;

    const list = await getQuotes();
    const countEl = document.getElementById('quoteCount');
    countEl.textContent = list.length + (list.length === 1 ? ' Quote' : ' Quotes');

    if (list.length === 0) {
        container.innerHTML = `<div class="empty-state"><div class="ei">📄</div><p>No quotes generated yet. Use "Generate Quote" from the Pending Enquiries tab to create one.</p></div>`;
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
            <div class="delivery-note">Sent via ${q.deliveryMethod === 'email' ? 'Email' : 'WhatsApp'} — PDF downloaded to this device.</div>
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

/* ===================== COLLAPSIBLE SOCIAL PANEL ===================== */
/* Starts open by default on first visit; remembers the user's choice afterwards. */
function toggleSocialPanel() {
    const panel = document.getElementById('socialPanel');
    const isOpen = panel.classList.toggle('open');
    localStorage.setItem('plc_social_open', isOpen ? 'true' : 'false');
    const btn = document.getElementById('socialToggleBtn');
    btn.setAttribute('aria-label', isOpen ? 'Hide social links' : 'Show social links');
}

document.addEventListener('DOMContentLoaded', function() {
    const panel = document.getElementById('socialPanel');
    if (!panel) return;
    const saved = localStorage.getItem('plc_social_open');
    /* Default to open (saved === null means first-ever visit) */
    const shouldOpen = saved === null ? true : saved === 'true';
    if (shouldOpen) panel.classList.add('open');
});

/* ===================== MULTILINGUAL / i18n ===================== */
const TRANSLATIONS = {
  en: {
    "nav.home":"Home","nav.about":"About Us","nav.products":"Products","nav.vending":"Vending Machine",
    "nav.services":"Services","nav.events":"Events","nav.blog":"Blog","nav.contact":"Contact Us","nav.login":"Login",
    "home.heroTitle":"Welcome to Premium Life Care",
    "home.heroSub":"Your trusted partner in menstrual health and hygiene, serving schools, hospitals, NGOs, and institutions across India.",
    "home.mainTitle":"Premium Sanitary Pads &amp; Menstrual Hygiene Solutions",
    "home.mainSub":"Empowering women's health with high-quality, affordable feminine hygiene products. Trusted supplier for schools, hospitals, NGOs, and institutions across India.",
    "home.cta":"Get a Quote Today",
    "home.stat1":"Protection Layers","home.stat2":"Pure Cotton","home.stat3":"Absorption",
    "home.weServe":"We Serve",
    "home.tag1":"🏥 Government Hospitals","home.tag2":"🏫 Schools &amp; Colleges","home.tag3":"🏠 Hostels",
    "home.tag4":"💚 NGOs","home.tag5":"🏢 Corporate Offices","home.tag6":"🏭 Factories &amp; Industries","home.tag7":"🚉 Public Spaces",
    "about.heroTitle":"About Premium Life Care",
    "about.heroSub":"Dedicated to advancing women's menstrual health by delivering superior-quality sanitary napkins and feminine care products at accessible prices.",
    "about.whoTitle":"Who We Are",
    "about.p1":"<strong>PREMIUM LIFE CARE</strong> is dedicated to advancing women's menstrual health and hygiene by delivering superior-quality sanitary napkins and feminine care products at accessible prices.",
    "about.p2":"We specialize in supplying comfortable, hygienic sanitary pads to educational institutions, healthcare facilities, corporate offices, and non-profit organizations.",
    "about.p3":"Our commitment extends beyond product supply — we actively support menstrual hygiene awareness programs in both urban and rural communities, ensuring every woman has access to safe, reliable feminine hygiene products.",
    "about.visionTitle":"🌸 Our Vision",
    "about.visionText":"To revolutionize menstrual health awareness and provide accessible, affordable sanitary hygiene solutions for every woman across India.",
    "about.f1t":"Affordable Quality","about.f1p":"Premium sanitary pads at competitive institutional prices",
    "about.f2t":"Hygiene Awareness","about.f2p":"Educational initiatives for menstrual health awareness",
    "about.f3t":"Timely Supply","about.f3p":"Reliable delivery schedules for institutions",
    "about.f4t":"Bulk Capability","about.f4p":"Bulk orders for large organizations",
    "about.f5t":"Customer Support","about.f5p":"Responsive assistance for all your needs",
    "products.heroTitle":"Our Premium Sanitary Pad Products",
    "products.heroSub":"Advanced protection with natural materials — designed for comfort, confidence, and care.",
    "products.p1title":"Premium 4X Free — Daily Use",
    "products.p1desc":"Ultra-comfortable sanitary pads with advanced technology. 280mm | 6 pads per pack.",
    "products.p1s1":"Size: 280mm — Daily Use","products.p1s2":"Anion + Nano Silver + Far Infrared",
    "products.p1s3":"100% Soft Cotton Non-Woven Top","products.p1s4":"Ultra-Thin &amp; High Absorbent",
    "products.p1s5":"Negative Ion Strip for Odor Control","products.p1s6":"6 Pads per Pack",
    "products.p2title":"8 Layers of Advanced Protection",
    "products.p2desc":"Scientific multi-layer design for maximum comfort and leak-proof security. 290mm XL.",
    "products.p2s1":"Cotton Smooth Non-Woven Top Sheet","products.p2s2":"Nano-Silver &amp; Negative Ion Strip",
    "products.p2s3":"Super-Absorbent Polymer (5–10× absorption)","products.p2s4":"First Air-Laid Layer for Leak Protection",
    "products.p2s5":"Breathable Moisture-Trapping Layer","products.p2s6":"Release Paper &amp; Wrapping Film",
    "products.p3title":"MAXX Free &amp; Queens Range",
    "products.p3desc":"Extended protection range — XXL+ sizes with 15 pads per pack for overnight &amp; heavy flow.",
    "products.p3s1":"Size: 360mm XXL+","products.p3s2":"15 Pads per Pack","products.p3s3":"MAXX Free &amp; Queens variants",
    "products.p3s4":"500ML+ Absorption (Queens)","products.p3s5":"Bulk packs from 1 to 16 packets",
    "vending.heroTitle":"🏧 Sanitary Pad Vending Machine",
    "vending.heroSub":"Automated, hygienic, and always available — bringing period care to every restroom, school, hospital, and workplace.",
    "vending.mainTitle":"Smart Dispensing for Every Space",
    "vending.p1":"Our sanitary pad vending machines provide 24/7 access to Premium Life Care products, ensuring women always have access to hygienic feminine care — no matter the time or place.",
    "vending.p2":"Compact, reliable, and easy to maintain, these machines are designed for high-traffic restrooms in institutions, public spaces, and corporate environments across India.",
    "vending.p3":"Available on both <strong>purchase</strong> and <strong>rental/lease</strong> basis. Machines are pre-stocked and serviced by our team.",
    "vending.f1":"Coin &amp; cashless payment options","vending.f2":"Easy installation &amp; low maintenance",
    "vending.f3":"Compact design for any restroom","vending.f4":"Refillable with Premium 4X Free pads",
    "vending.f5":"Ideal for institutions &amp; public spaces","vending.f6":"Available on rental or purchase basis",
    "vending.cta":"Enquire Now",
    "vending.c1t":"Schools &amp; Colleges","vending.c1p":"Ensure adolescent girls never miss school due to period emergencies. Discreet, accessible placement in girls' washrooms.",
    "vending.c2t":"Hospitals &amp; Clinics","vending.c2p":"Patient-friendly dispensing in wards and restrooms. Supports dignity and hygiene for patients, staff, and visitors.",
    "vending.c3t":"Corporate Offices","vending.c3p":"A thoughtful workplace benefit for female employees. Boosts morale and reduces unplanned absences.",
    "vending.c4t":"Factories &amp; Industries","vending.c4p":"Ensure hygiene access for women on the shop floor with robust, vandal-resistant machines for industrial environments.",
    "vending.c5t":"Public Spaces","vending.c5p":"Malls, bus stations, railway stations, and airports — making period care universally accessible across Karnataka.",
    "vending.c6t":"Coin &amp; Cashless Payment","vending.c6p":"Supports coin-based and digital payment options for maximum convenience and ease of use.",
    "services.heroTitle":"Our Services",
    "services.heroSub":"Comprehensive feminine hygiene solutions for institutions, corporates, and communities.",
    "services.s1t":"Bulk Sanitary Pad Supply","services.s1p":"Wholesale feminine hygiene products for schools, colleges, hospitals, and corporate institutions with flexible quantity options.",
    "services.s2t":"Vending Machine Installation","services.s2p":"Supply, installation, and maintenance of sanitary pad vending machines for restrooms in public facilities and workplaces.",
    "services.s3t":"Menstrual Hygiene Awareness","services.s3p":"Educational workshops and awareness campaigns on period health, menstrual hygiene management, and feminine care.",
    "services.s4t":"Government &amp; Institutional Supply","services.s4p":"Authorized supplier for government schemes, public health programs, and institutional feminine hygiene requirements.",
    "services.s5t":"Doorstep Delivery","services.s5p":"Reliable, timely delivery to institutions across Karnataka and beyond. Flexible scheduling to meet your requirements.",
    "services.s6t":"Dedicated Customer Support","services.s6p":"Our responsive team is available via WhatsApp, phone, and email to assist with orders, queries, and after-sales support.",
    "events.heroTitle":"Events",
    "events.heroSub":"Menstrual hygiene awareness drives, health camps, and community outreach programs we've organized or taken part in.",
    "events.e1t":"School Awareness Drives","events.e1p":"Interactive sessions with adolescent girls on menstrual hygiene management, myth-busting, and safe practices.",
    "events.e2t":"Free Health Camps","events.e2p":"Community health camps in partnership with local clinics, offering guidance on feminine hygiene and wellness.",
    "events.e3t":"NGO Collaborations","events.e3p":"Joint initiatives with NGOs to distribute sanitary pads and educational material in underserved communities.",
    "events.e4t":"Corporate Wellness Sessions","events.e4p":"Workplace talks and product demos helping companies support their female employees' health needs.",
    "events.e5t":"Upcoming Events","events.e5p":"Stay tuned — new awareness programs and community drives are being planned. Contact us to host one at your institution.",
    "blog.heroTitle":"Blog",
    "blog.heroSub":"Articles and insights on menstrual health, hygiene best practices, and product education.",
    "blog.b1t":"Understanding Menstrual Hygiene","blog.b1p":"A beginner's guide to maintaining proper hygiene during periods, and why the right sanitary products matter.",
    "blog.b2t":"Why Choose Cotton Sanitary Pads","blog.b2p":"Exploring the benefits of soft cotton non-woven top sheets over synthetic petrochemical alternatives.",
    "blog.b3t":"The Rise of Vending Machines","blog.b3p":"How automated dispensers are making feminine hygiene products more accessible in schools and workplaces.",
    "blog.b4t":"Breaking the Stigma","blog.b4p":"Why open conversations about periods matter, and how institutions can create more supportive environments.",
    "blog.b5t":"More Articles Coming Soon","blog.b5p":"We're building out our blog with more health tips and product guides. Check back soon for new posts.",
    "contact.heroTitle":"Contact Us","contact.heroSub":"Get in touch for bulk orders, vending machine enquiries, or partnerships.",
    "contact.waLink":"WhatsApp: Click to Chat","contact.formTitle":"Request a Quote / Enquiry",
    "contact.lblName":"Full Name *","contact.phName":"Enter your name",
    "contact.lblOrg":"Organization / Institution","contact.phOrg":"School, Hospital, NGO, etc.",
    "contact.lblPhone":"Phone Number *","contact.lblEmail":"Email Address",
    "contact.lblType":"Enquiry Type","contact.optSelect":"Select an option",
    "contact.lblQty":"Estimated Quantity","contact.phQty":"e.g. 500 packs/month or 2 vending machines",
    "contact.lblMsg":"Message","contact.phMsg":"Tell us more about your requirements...",
    "contact.submitBtn":"Send Enquiry via WhatsApp 💬",
    "footer.tagline":"Quality Sanitary Pads &amp; Feminine Hygiene Products",
    "footer.serving":"Serving Schools, Hospitals, NGOs &amp; Institutions Across India",
    "footer.rights":"All Rights Reserved.",
    "locked.title":"Admin Access Only",
    "locked.text":"The Enquiries list is restricted to the site admin. Please log in with the admin credentials to view submitted enquiries.",
    "locked.btn":"Admin Login"
  },
  es: {
    "nav.home":"Inicio","nav.about":"Nosotros","nav.products":"Productos","nav.vending":"Máquina Expendedora",
    "nav.services":"Servicios","nav.events":"Eventos","nav.blog":"Blog","nav.contact":"Contacto","nav.login":"Iniciar sesión",
    "home.heroTitle":"Bienvenido a Premium Life Care",
    "home.heroSub":"Su socio de confianza en salud e higiene menstrual, sirviendo a escuelas, hospitales, ONGs e instituciones en toda India.",
    "home.mainTitle":"Toallas Sanitarias Premium y Soluciones de Higiene Menstrual",
    "home.mainSub":"Empoderando la salud de la mujer con productos de higiene femenina asequibles y de alta calidad. Proveedor confiable para escuelas, hospitales, ONGs e instituciones en toda India.",
    "home.cta":"Solicitar Cotización Hoy",
    "home.stat1":"Capas de Protección","home.stat2":"Algodón Puro","home.stat3":"Absorción",
    "home.weServe":"A Quién Servimos",
    "home.tag1":"🏥 Hospitales Gubernamentales","home.tag2":"🏫 Escuelas y Universidades","home.tag3":"🏠 Albergues",
    "home.tag4":"💚 ONGs","home.tag5":"🏢 Oficinas Corporativas","home.tag6":"🏭 Fábricas e Industrias","home.tag7":"🚉 Espacios Públicos",
    "about.heroTitle":"Sobre Premium Life Care",
    "about.heroSub":"Dedicados a promover la salud menstrual de la mujer entregando toallas sanitarias y productos de cuidado femenino de calidad superior a precios accesibles.",
    "about.whoTitle":"Quiénes Somos",
    "about.p1":"<strong>PREMIUM LIFE CARE</strong> está dedicada a promover la salud e higiene menstrual de la mujer entregando toallas sanitarias y productos de cuidado femenino de calidad superior a precios accesibles.",
    "about.p2":"Nos especializamos en suministrar toallas sanitarias cómodas e higiénicas a instituciones educativas, centros de salud, oficinas corporativas y organizaciones sin fines de lucro.",
    "about.p3":"Nuestro compromiso va más allá del suministro de productos — apoyamos activamente programas de concientización sobre higiene menstrual en comunidades urbanas y rurales, asegurando que cada mujer tenga acceso a productos de higiene femenina seguros y confiables.",
    "about.visionTitle":"🌸 Nuestra Visión",
    "about.visionText":"Revolucionar la concientización sobre la salud menstrual y proporcionar soluciones de higiene sanitaria accesibles y asequibles para cada mujer en toda India.",
    "about.f1t":"Calidad Asequible","about.f1p":"Toallas sanitarias premium a precios institucionales competitivos",
    "about.f2t":"Concientización de Higiene","about.f2p":"Iniciativas educativas para la concientización de la salud menstrual",
    "about.f3t":"Suministro Puntual","about.f3p":"Horarios de entrega confiables para instituciones",
    "about.f4t":"Capacidad de Volumen","about.f4p":"Pedidos al por mayor para grandes organizaciones",
    "about.f5t":"Atención al Cliente","about.f5p":"Asistencia receptiva para todas sus necesidades",
    "products.heroTitle":"Nuestros Productos Premium de Toallas Sanitarias",
    "products.heroSub":"Protección avanzada con materiales naturales — diseñada para comodidad, confianza y cuidado.",
    "products.p1title":"Premium 4X Free — Uso Diario",
    "products.p1desc":"Toallas sanitarias ultra cómodas con tecnología avanzada. 280mm | 6 toallas por paquete.",
    "products.p1s1":"Tamaño: 280mm — Uso Diario","products.p1s2":"Anión + Nano Plata + Infrarrojo Lejano",
    "products.p1s3":"100% Algodón Suave No Tejido","products.p1s4":"Ultra Delgado y Alta Absorción",
    "products.p1s5":"Tira de Iones Negativos para Control de Olor","products.p1s6":"6 Toallas por Paquete",
    "products.p2title":"8 Capas de Protección Avanzada",
    "products.p2desc":"Diseño científico multicapa para máxima comodidad y seguridad a prueba de fugas. 290mm XL.",
    "products.p2s1":"Capa Superior de Algodón Suave No Tejido","products.p2s2":"Nano Plata y Tira de Iones Negativos",
    "products.p2s3":"Polímero Súper Absorbente (5–10× absorción)","products.p2s4":"Primera Capa Air-Laid para Protección contra Fugas",
    "products.p2s5":"Capa Transpirable que Atrapa la Humedad","products.p2s6":"Papel de Liberación y Película de Envoltura",
    "products.p3title":"Gama MAXX Free y Queens",
    "products.p3desc":"Gama de protección extendida — tamaños XXL+ con 15 toallas por paquete para flujo nocturno y abundante.",
    "products.p3s1":"Tamaño: 360mm XXL+","products.p3s2":"15 Toallas por Paquete","products.p3s3":"Variantes MAXX Free y Queens",
    "products.p3s4":"Absorción 500ML+ (Queens)","products.p3s5":"Paquetes al por mayor de 1 a 16 paquetes",
    "vending.heroTitle":"🏧 Máquina Expendedora de Toallas Sanitarias",
    "vending.heroSub":"Automatizada, higiénica y siempre disponible — llevando el cuidado menstrual a cada baño, escuela, hospital y lugar de trabajo.",
    "vending.mainTitle":"Distribución Inteligente para Cada Espacio",
    "vending.p1":"Nuestras máquinas expendedoras de toallas sanitarias brindan acceso las 24 horas a los productos de Premium Life Care, asegurando que las mujeres siempre tengan acceso a cuidado femenino higiénico — sin importar la hora o el lugar.",
    "vending.p2":"Compactas, confiables y fáciles de mantener, estas máquinas están diseñadas para baños de alto tráfico en instituciones, espacios públicos y entornos corporativos en toda India.",
    "vending.p3":"Disponible tanto en <strong>compra</strong> como en <strong>alquiler/arrendamiento</strong>. Las máquinas están pre-abastecidas y mantenidas por nuestro equipo.",
    "vending.f1":"Opciones de pago con monedas y sin efectivo","vending.f2":"Instalación fácil y bajo mantenimiento",
    "vending.f3":"Diseño compacto para cualquier baño","vending.f4":"Rellenable con toallas Premium 4X Free",
    "vending.f5":"Ideal para instituciones y espacios públicos","vending.f6":"Disponible en alquiler o compra",
    "vending.cta":"Consultar Ahora",
    "vending.c1t":"Escuelas y Universidades","vending.c1p":"Aseguran que las adolescentes nunca falten a la escuela debido a emergencias menstruales. Colocación discreta y accesible en baños de niñas.",
    "vending.c2t":"Hospitales y Clínicas","vending.c2p":"Distribución amigable para pacientes en salas y baños. Apoya la dignidad e higiene de pacientes, personal y visitantes.",
    "vending.c3t":"Oficinas Corporativas","vending.c3p":"Un beneficio laboral considerado para empleadas. Mejora la moral y reduce ausencias imprevistas.",
    "vending.c4t":"Fábricas e Industrias","vending.c4p":"Aseguran el acceso a higiene para mujeres en la planta de producción con máquinas robustas y resistentes al vandalismo para entornos industriales.",
    "vending.c5t":"Espacios Públicos","vending.c5p":"Centros comerciales, estaciones de autobús, estaciones de tren y aeropuertos — haciendo que el cuidado menstrual sea universalmente accesible en toda Karnataka.",
    "vending.c6t":"Pago con Monedas y Sin Efectivo","vending.c6p":"Admite opciones de pago con monedas y digitales para máxima conveniencia y facilidad de uso.",
    "services.heroTitle":"Nuestros Servicios",
    "services.heroSub":"Soluciones integrales de higiene femenina para instituciones, corporaciones y comunidades.",
    "services.s1t":"Suministro Mayorista de Toallas Sanitarias","services.s1p":"Productos de higiene femenina al por mayor para escuelas, universidades, hospitales e instituciones corporativas con opciones de cantidad flexibles.",
    "services.s2t":"Instalación de Máquinas Expendedoras","services.s2p":"Suministro, instalación y mantenimiento de máquinas expendedoras de toallas sanitarias para baños en instalaciones públicas y lugares de trabajo.",
    "services.s3t":"Concientización de Higiene Menstrual","services.s3p":"Talleres educativos y campañas de concientización sobre salud menstrual, manejo de higiene menstrual y cuidado femenino.",
    "services.s4t":"Suministro Gubernamental e Institucional","services.s4p":"Proveedor autorizado para programas gubernamentales, programas de salud pública y requisitos de higiene femenina institucional.",
    "services.s5t":"Entrega a Domicilio","services.s5p":"Entrega confiable y puntual a instituciones en toda Karnataka y más allá. Programación flexible para satisfacer sus necesidades.",
    "services.s6t":"Atención al Cliente Dedicada","services.s6p":"Nuestro equipo receptivo está disponible por WhatsApp, teléfono y correo electrónico para ayudar con pedidos, consultas y soporte postventa.",
    "events.heroTitle":"Eventos",
    "events.heroSub":"Campañas de concientización sobre higiene menstrual, campamentos de salud y programas de alcance comunitario que hemos organizado o en los que hemos participado.",
    "events.e1t":"Campañas de Concientización Escolar","events.e1p":"Sesiones interactivas con adolescentes sobre manejo de higiene menstrual, desmintiendo mitos y prácticas seguras.",
    "events.e2t":"Campamentos de Salud Gratuitos","events.e2p":"Campamentos de salud comunitarios en asociación con clínicas locales, ofreciendo orientación sobre higiene femenina y bienestar.",
    "events.e3t":"Colaboraciones con ONGs","events.e3p":"Iniciativas conjuntas con ONGs para distribuir toallas sanitarias y material educativo en comunidades desatendidas.",
    "events.e4t":"Sesiones de Bienestar Corporativo","events.e4p":"Charlas en el lugar de trabajo y demostraciones de productos que ayudan a las empresas a apoyar las necesidades de salud de sus empleadas.",
    "events.e5t":"Próximos Eventos","events.e5p":"Manténgase atento — se están planificando nuevos programas de concientización y campañas comunitarias. Contáctenos para organizar uno en su institución.",
    "blog.heroTitle":"Blog",
    "blog.heroSub":"Artículos e ideas sobre salud menstrual, mejores prácticas de higiene y educación sobre productos.",
    "blog.b1t":"Entendiendo la Higiene Menstrual","blog.b1p":"Una guía para principiantes sobre cómo mantener una higiene adecuada durante el período, y por qué los productos sanitarios correctos importan.",
    "blog.b2t":"Por Qué Elegir Toallas Sanitarias de Algodón","blog.b2p":"Explorando los beneficios de las capas superiores de algodón suave no tejido sobre las alternativas petroquímicas sintéticas.",
    "blog.b3t":"El Auge de las Máquinas Expendedoras","blog.b3p":"Cómo los dispensadores automatizados están haciendo que los productos de higiene femenina sean más accesibles en escuelas y lugares de trabajo.",
    "blog.b4t":"Rompiendo el Estigma","blog.b4p":"Por qué las conversaciones abiertas sobre el período importan, y cómo las instituciones pueden crear entornos más comprensivos.",
    "blog.b5t":"Más Artículos Próximamente","blog.b5p":"Estamos construyendo nuestro blog con más consejos de salud y guías de productos. Vuelva pronto para nuevas publicaciones.",
    "contact.heroTitle":"Contáctenos","contact.heroSub":"Póngase en contacto para pedidos al por mayor, consultas sobre máquinas expendedoras o asociaciones.",
    "contact.waLink":"WhatsApp: Haga clic para chatear","contact.formTitle":"Solicitar Cotización / Consulta",
    "contact.lblName":"Nombre Completo *","contact.phName":"Ingrese su nombre",
    "contact.lblOrg":"Organización / Institución","contact.phOrg":"Escuela, Hospital, ONG, etc.",
    "contact.lblPhone":"Número de Teléfono *","contact.lblEmail":"Correo Electrónico",
    "contact.lblType":"Tipo de Consulta","contact.optSelect":"Seleccione una opción",
    "contact.lblQty":"Cantidad Estimada","contact.phQty":"ej. 500 paquetes/mes o 2 máquinas expendedoras",
    "contact.lblMsg":"Mensaje","contact.phMsg":"Cuéntenos más sobre sus necesidades...",
    "contact.submitBtn":"Enviar Consulta por WhatsApp 💬",
    "footer.tagline":"Toallas Sanitarias Premium y Productos de Higiene Femenina",
    "footer.serving":"Sirviendo a Escuelas, Hospitales, ONGs e Instituciones en Toda India",
    "footer.rights":"Todos los Derechos Reservados.",
    "locked.title":"Solo Acceso de Administrador",
    "locked.text":"La lista de consultas está restringida al administrador del sitio. Inicie sesión con las credenciales de administrador para ver las consultas enviadas.",
    "locked.btn":"Inicio de Sesión de Administrador"
  },
  de: {
    "nav.home":"Startseite","nav.about":"Über Uns","nav.products":"Produkte","nav.vending":"Verkaufsautomat",
    "nav.services":"Dienstleistungen","nav.events":"Veranstaltungen","nav.blog":"Blog","nav.contact":"Kontakt","nav.login":"Anmelden",
    "home.heroTitle":"Willkommen bei Premium Life Care",
    "home.heroSub":"Ihr vertrauenswürdiger Partner für Menstruationsgesundheit und Hygiene, im Dienst von Schulen, Krankenhäusern, NGOs und Institutionen in ganz Indien.",
    "home.mainTitle":"Premium Damenbinden und Menstruationshygiene-Lösungen",
    "home.mainSub":"Wir stärken die Gesundheit von Frauen mit hochwertigen, erschwinglichen Hygieneprodukten für Frauen. Vertrauenswürdiger Lieferant für Schulen, Krankenhäuser, NGOs und Institutionen in ganz Indien.",
    "home.cta":"Jetzt Angebot Anfordern",
    "home.stat1":"Schutzschichten","home.stat2":"Reine Baumwolle","home.stat3":"Absorption",
    "home.weServe":"Wir Bedienen",
    "home.tag1":"🏥 Staatliche Krankenhäuser","home.tag2":"🏫 Schulen und Hochschulen","home.tag3":"🏠 Wohnheime",
    "home.tag4":"💚 NGOs","home.tag5":"🏢 Firmenbüros","home.tag6":"🏭 Fabriken und Industrie","home.tag7":"🚉 Öffentliche Räume",
    "about.heroTitle":"Über Premium Life Care",
    "about.heroSub":"Wir setzen uns dafür ein, die Menstruationsgesundheit von Frauen zu fördern, indem wir hochwertige Damenbinden und Pflegeprodukte für Frauen zu erschwinglichen Preisen anbieten.",
    "about.whoTitle":"Wer Wir Sind",
    "about.p1":"<strong>PREMIUM LIFE CARE</strong> setzt sich dafür ein, die Menstruationsgesundheit und -hygiene von Frauen zu fördern, indem hochwertige Damenbinden und Pflegeprodukte für Frauen zu erschwinglichen Preisen angeboten werden.",
    "about.p2":"Wir sind spezialisiert auf die Lieferung von komfortablen, hygienischen Damenbinden an Bildungseinrichtungen, Gesundheitseinrichtungen, Firmenbüros und gemeinnützige Organisationen.",
    "about.p3":"Unser Engagement geht über die Produktlieferung hinaus — wir unterstützen aktiv Programme zur Sensibilisierung für Menstruationshygiene in städtischen und ländlichen Gemeinden und stellen sicher, dass jede Frau Zugang zu sicheren, zuverlässigen Hygieneprodukten hat.",
    "about.visionTitle":"🌸 Unsere Vision",
    "about.visionText":"Die Sensibilisierung für Menstruationsgesundheit zu revolutionieren und zugängliche, erschwingliche Hygienelösungen für jede Frau in ganz Indien bereitzustellen.",
    "about.f1t":"Erschwingliche Qualität","about.f1p":"Premium-Damenbinden zu wettbewerbsfähigen institutionellen Preisen",
    "about.f2t":"Hygienebewusstsein","about.f2p":"Bildungsinitiativen zur Sensibilisierung für Menstruationsgesundheit",
    "about.f3t":"Pünktliche Lieferung","about.f3p":"Zuverlässige Lieferzeitpläne für Institutionen",
    "about.f4t":"Großhandelsfähigkeit","about.f4p":"Großbestellungen für große Organisationen",
    "about.f5t":"Kundensupport","about.f5p":"Reaktionsschnelle Unterstützung für alle Ihre Bedürfnisse",
    "products.heroTitle":"Unsere Premium-Damenbinden-Produkte",
    "products.heroSub":"Fortschrittlicher Schutz mit natürlichen Materialien — entwickelt für Komfort, Vertrauen und Pflege.",
    "products.p1title":"Premium 4X Free — Täglicher Gebrauch",
    "products.p1desc":"Ultra-komfortable Damenbinden mit fortschrittlicher Technologie. 280mm | 6 Binden pro Packung.",
    "products.p1s1":"Größe: 280mm — Täglicher Gebrauch","products.p1s2":"Anion + Nano-Silber + Ferninfrarot",
    "products.p1s3":"100% weiche Baumwoll-Vliesoberfläche","products.p1s4":"Ultra-Dünn und Hochabsorbierend",
    "products.p1s5":"Negativ-Ionen-Streifen zur Geruchskontrolle","products.p1s6":"6 Binden pro Packung",
    "products.p2title":"8-Schichten Fortschrittlicher Schutz",
    "products.p2desc":"Wissenschaftliches mehrschichtiges Design für maximalen Komfort und auslaufsichere Sicherheit. 290mm XL.",
    "products.p2s1":"Weiche Baumwoll-Vliesoberschicht","products.p2s2":"Nano-Silber und Negativ-Ionen-Streifen",
    "products.p2s3":"Superabsorbierendes Polymer (5–10× Absorption)","products.p2s4":"Erste Air-Laid-Schicht zum Auslaufschutz",
    "products.p2s5":"Atmungsaktive Feuchtigkeitsspeicherschicht","products.p2s6":"Trennpapier und Verpackungsfolie",
    "products.p3title":"MAXX Free und Queens Serie",
    "products.p3desc":"Erweiterte Schutzserie — XXL+ Größen mit 15 Binden pro Packung für nächtlichen und starken Fluss.",
    "products.p3s1":"Größe: 360mm XXL+","products.p3s2":"15 Binden pro Packung","products.p3s3":"MAXX Free und Queens Varianten",
    "products.p3s4":"500ML+ Absorption (Queens)","products.p3s5":"Großpackungen von 1 bis 16 Packungen",
    "vending.heroTitle":"🏧 Damenbinden-Verkaufsautomat",
    "vending.heroSub":"Automatisiert, hygienisch und immer verfügbar — bringt Menstruationspflege in jede Toilette, Schule, jedes Krankenhaus und jeden Arbeitsplatz.",
    "vending.mainTitle":"Intelligente Ausgabe für Jeden Raum",
    "vending.p1":"Unsere Damenbinden-Verkaufsautomaten bieten rund um die Uhr Zugang zu Premium Life Care-Produkten und stellen sicher, dass Frauen immer Zugang zu hygienischer Damenpflege haben — unabhängig von Zeit oder Ort.",
    "vending.p2":"Kompakt, zuverlässig und einfach zu warten, sind diese Automaten für stark frequentierte Toiletten in Institutionen, öffentlichen Räumen und Firmenumgebungen in ganz Indien konzipiert.",
    "vending.p3":"Erhältlich sowohl zum <strong>Kauf</strong> als auch zur <strong>Miete/Leasing</strong>. Die Automaten werden von unserem Team bevorratet und gewartet.",
    "vending.f1":"Münz- und bargeldlose Zahlungsoptionen","vending.f2":"Einfache Installation und geringer Wartungsaufwand",
    "vending.f3":"Kompaktes Design für jede Toilette","vending.f4":"Nachfüllbar mit Premium 4X Free Binden",
    "vending.f5":"Ideal für Institutionen und öffentliche Räume","vending.f6":"Erhältlich zur Miete oder zum Kauf",
    "vending.cta":"Jetzt Anfragen",
    "vending.c1t":"Schulen und Hochschulen","vending.c1p":"Stellen Sie sicher, dass Mädchen im Teenageralter aufgrund von Menstruationsnotfällen nie die Schule verpassen. Diskrete, zugängliche Platzierung in Mädchentoiletten.",
    "vending.c2t":"Krankenhäuser und Kliniken","vending.c2p":"Patientenfreundliche Ausgabe in Stationen und Toiletten. Unterstützt Würde und Hygiene für Patienten, Personal und Besucher.",
    "vending.c3t":"Firmenbüros","vending.c3p":"Ein durchdachter Arbeitsplatzvorteil für weibliche Mitarbeiter. Steigert die Moral und reduziert ungeplante Abwesenheiten.",
    "vending.c4t":"Fabriken und Industrie","vending.c4p":"Stellen Sie den Hygienezugang für Frauen in der Produktion mit robusten, vandalismussicheren Automaten für industrielle Umgebungen sicher.",
    "vending.c5t":"Öffentliche Räume","vending.c5p":"Einkaufszentren, Busbahnhöfe, Bahnhöfe und Flughäfen — die Menstruationspflege in ganz Karnataka universell zugänglich machen.",
    "vending.c6t":"Münz- und Bargeldlose Zahlung","vending.c6p":"Unterstützt münzbasierte und digitale Zahlungsoptionen für maximalen Komfort und einfache Nutzung.",
    "services.heroTitle":"Unsere Dienstleistungen",
    "services.heroSub":"Umfassende Hygienelösungen für Frauen für Institutionen, Unternehmen und Gemeinden.",
    "services.s1t":"Großhandelslieferung von Damenbinden","services.s1p":"Hygieneprodukte für Frauen im Großhandel für Schulen, Hochschulen, Krankenhäuser und Firmeninstitutionen mit flexiblen Mengenoptionen.",
    "services.s2t":"Installation von Verkaufsautomaten","services.s2p":"Lieferung, Installation und Wartung von Damenbinden-Verkaufsautomaten für Toiletten in öffentlichen Einrichtungen und Arbeitsplätzen.",
    "services.s3t":"Sensibilisierung für Menstruationshygiene","services.s3p":"Bildungsworkshops und Sensibilisierungskampagnen zu Menstruationsgesundheit, Menstruationshygiene-Management und Frauenpflege.",
    "services.s4t":"Staatliche und Institutionelle Lieferung","services.s4p":"Autorisierter Lieferant für staatliche Programme, öffentliche Gesundheitsprogramme und institutionelle Anforderungen an die Frauenhygiene.",
    "services.s5t":"Haustürlieferung","services.s5p":"Zuverlässige, pünktliche Lieferung an Institutionen in ganz Karnataka und darüber hinaus. Flexible Terminplanung zur Erfüllung Ihrer Anforderungen.",
    "services.s6t":"Engagierter Kundensupport","services.s6p":"Unser reaktionsschnelles Team ist per WhatsApp, Telefon und E-Mail erreichbar, um bei Bestellungen, Anfragen und Support nach dem Kauf zu helfen.",
    "events.heroTitle":"Veranstaltungen",
    "events.heroSub":"Sensibilisierungskampagnen für Menstruationshygiene, Gesundheitscamps und Gemeinschaftsprogramme, die wir organisiert haben oder an denen wir teilgenommen haben.",
    "events.e1t":"Schulaufklärungskampagnen","events.e1p":"Interaktive Sitzungen mit Jugendlichen zum Thema Menstruationshygiene-Management, Mythenaufklärung und sichere Praktiken.",
    "events.e2t":"Kostenlose Gesundheitscamps","events.e2p":"Gemeinschaftsgesundheitscamps in Zusammenarbeit mit lokalen Kliniken, die Beratung zu Frauenhygiene und Wohlbefinden bieten.",
    "events.e3t":"NGO-Kooperationen","events.e3p":"Gemeinsame Initiativen mit NGOs zur Verteilung von Damenbinden und Bildungsmaterial in unterversorgten Gemeinden.",
    "events.e4t":"Unternehmens-Wellness-Sitzungen","events.e4p":"Vorträge am Arbeitsplatz und Produktvorführungen, die Unternehmen helfen, die Gesundheitsbedürfnisse ihrer Mitarbeiterinnen zu unterstützen.",
    "events.e5t":"Kommende Veranstaltungen","events.e5p":"Bleiben Sie dran — neue Aufklärungsprogramme und Gemeinschaftskampagnen werden geplant. Kontaktieren Sie uns, um eine an Ihrer Institution zu veranstalten.",
    "blog.heroTitle":"Blog",
    "blog.heroSub":"Artikel und Einblicke zu Menstruationsgesundheit, Hygiene-Best-Practices und Produktaufklärung.",
    "blog.b1t":"Menstruationshygiene Verstehen","blog.b1p":"Ein Leitfaden für Anfänger zur Aufrechterhaltung einer angemessenen Hygiene während der Menstruation und warum die richtigen Hygieneprodukte wichtig sind.",
    "blog.b2t":"Warum Baumwoll-Damenbinden Wählen","blog.b2p":"Erkundung der Vorteile von weichen Baumwoll-Vliesoberflächen gegenüber synthetischen petrochemischen Alternativen.",
    "blog.b3t":"Der Aufstieg der Verkaufsautomaten","blog.b3p":"Wie automatisierte Spender Hygieneprodukte für Frauen in Schulen und am Arbeitsplatz zugänglicher machen.",
    "blog.b4t":"Das Stigma Brechen","blog.b4p":"Warum offene Gespräche über die Menstruation wichtig sind und wie Institutionen unterstützendere Umgebungen schaffen können.",
    "blog.b5t":"Weitere Artikel Folgen Bald","blog.b5p":"Wir bauen unseren Blog mit weiteren Gesundheitstipps und Produktleitfäden aus. Schauen Sie bald wieder für neue Beiträge vorbei.",
    "contact.heroTitle":"Kontaktieren Sie Uns","contact.heroSub":"Kontaktieren Sie uns für Großbestellungen, Anfragen zu Verkaufsautomaten oder Partnerschaften.",
    "contact.waLink":"WhatsApp: Klicken zum Chatten","contact.formTitle":"Angebot Anfordern / Anfrage",
    "contact.lblName":"Vollständiger Name *","contact.phName":"Geben Sie Ihren Namen ein",
    "contact.lblOrg":"Organisation / Institution","contact.phOrg":"Schule, Krankenhaus, NGO, usw.",
    "contact.lblPhone":"Telefonnummer *","contact.lblEmail":"E-Mail-Adresse",
    "contact.lblType":"Anfragetyp","contact.optSelect":"Wählen Sie eine Option",
    "contact.lblQty":"Geschätzte Menge","contact.phQty":"z.B. 500 Packungen/Monat oder 2 Verkaufsautomaten",
    "contact.lblMsg":"Nachricht","contact.phMsg":"Erzählen Sie uns mehr über Ihre Anforderungen...",
    "contact.submitBtn":"Anfrage per WhatsApp Senden 💬",
    "footer.tagline":"Premium-Damenbinden und Hygieneprodukte für Frauen",
    "footer.serving":"Im Dienst von Schulen, Krankenhäusern, NGOs und Institutionen in Ganz Indien",
    "footer.rights":"Alle Rechte Vorbehalten.",
    "locked.title":"Nur Administratorzugriff",
    "locked.text":"Die Anfragenliste ist auf den Website-Administrator beschränkt. Bitte melden Sie sich mit den Administrator-Anmeldeinformationen an, um eingereichte Anfragen anzuzeigen.",
    "locked.btn":"Administrator-Anmeldung"
  },
  fr: {
    "nav.home":"Accueil","nav.about":"À Propos","nav.products":"Produits","nav.vending":"Distributeur Automatique",
    "nav.services":"Services","nav.events":"Événements","nav.blog":"Blog","nav.contact":"Contact","nav.login":"Connexion",
    "home.heroTitle":"Bienvenue chez Premium Life Care",
    "home.heroSub":"Votre partenaire de confiance en santé et hygiène menstruelle, au service des écoles, hôpitaux, ONG et institutions à travers l'Inde.",
    "home.mainTitle":"Serviettes Hygiéniques Premium et Solutions d'Hygiène Menstruelle",
    "home.mainSub":"Autonomiser la santé des femmes avec des produits d'hygiène féminine abordables et de haute qualité. Fournisseur de confiance pour les écoles, hôpitaux, ONG et institutions à travers l'Inde.",
    "home.cta":"Demander un Devis Aujourd'hui",
    "home.stat1":"Couches de Protection","home.stat2":"Coton Pur","home.stat3":"Absorption",
    "home.weServe":"Nous Servons",
    "home.tag1":"🏥 Hôpitaux Gouvernementaux","home.tag2":"🏫 Écoles et Collèges","home.tag3":"🏠 Foyers",
    "home.tag4":"💚 ONG","home.tag5":"🏢 Bureaux d'Entreprise","home.tag6":"🏭 Usines et Industries","home.tag7":"🚉 Espaces Publics",
    "about.heroTitle":"À Propos de Premium Life Care",
    "about.heroSub":"Dédiés à faire progresser la santé menstruelle des femmes en fournissant des serviettes hygiéniques et des produits de soins féminins de qualité supérieure à des prix accessibles.",
    "about.whoTitle":"Qui Sommes-Nous",
    "about.p1":"<strong>PREMIUM LIFE CARE</strong> est dédiée à faire progresser la santé et l'hygiène menstruelle des femmes en fournissant des serviettes hygiéniques et des produits de soins féminins de qualité supérieure à des prix accessibles.",
    "about.p2":"Nous sommes spécialisés dans la fourniture de serviettes hygiéniques confortables et hygiéniques aux établissements d'enseignement, aux établissements de santé, aux bureaux d'entreprise et aux organisations à but non lucratif.",
    "about.p3":"Notre engagement va au-delà de la fourniture de produits — nous soutenons activement les programmes de sensibilisation à l'hygiène menstruelle dans les communautés urbaines et rurales, garantissant à chaque femme l'accès à des produits d'hygiène féminine sûrs et fiables.",
    "about.visionTitle":"🌸 Notre Vision",
    "about.visionText":"Révolutionner la sensibilisation à la santé menstruelle et fournir des solutions d'hygiène sanitaire accessibles et abordables pour chaque femme à travers l'Inde.",
    "about.f1t":"Qualité Abordable","about.f1p":"Serviettes hygiéniques premium à des prix institutionnels compétitifs",
    "about.f2t":"Sensibilisation à l'Hygiène","about.f2p":"Initiatives éducatives pour la sensibilisation à la santé menstruelle",
    "about.f3t":"Livraison Ponctuelle","about.f3p":"Calendriers de livraison fiables pour les institutions",
    "about.f4t":"Capacité en Volume","about.f4p":"Commandes en gros pour les grandes organisations",
    "about.f5t":"Support Client","about.f5p":"Assistance réactive pour tous vos besoins",
    "products.heroTitle":"Nos Produits Premium de Serviettes Hygiéniques",
    "products.heroSub":"Protection avancée avec des matériaux naturels — conçue pour le confort, la confiance et le soin.",
    "products.p1title":"Premium 4X Free — Usage Quotidien",
    "products.p1desc":"Serviettes hygiéniques ultra-confortables avec technologie avancée. 280mm | 6 serviettes par paquet.",
    "products.p1s1":"Taille : 280mm — Usage Quotidien","products.p1s2":"Anion + Nano Argent + Infrarouge Lointain",
    "products.p1s3":"100% Coton Doux Non-Tissé","products.p1s4":"Ultra-Fin et Haute Absorption",
    "products.p1s5":"Bande d'Ions Négatifs pour Contrôle des Odeurs","products.p1s6":"6 Serviettes par Paquet",
    "products.p2title":"8 Couches de Protection Avancée",
    "products.p2desc":"Conception scientifique multicouche pour un confort maximal et une sécurité anti-fuite. 290mm XL.",
    "products.p2s1":"Couche Supérieure en Coton Doux Non-Tissé","products.p2s2":"Nano Argent et Bande d'Ions Négatifs",
    "products.p2s3":"Polymère Super Absorbant (5–10× absorption)","products.p2s4":"Première Couche Air-Laid pour Protection Anti-Fuite",
    "products.p2s5":"Couche Respirante Piégeant l'Humidité","products.p2s6":"Papier de Protection et Film d'Emballage",
    "products.p3title":"Gamme MAXX Free et Queens",
    "products.p3desc":"Gamme de protection étendue — tailles XXL+ avec 15 serviettes par paquet pour flux nocturne et abondant.",
    "products.p3s1":"Taille : 360mm XXL+","products.p3s2":"15 Serviettes par Paquet","products.p3s3":"Variantes MAXX Free et Queens",
    "products.p3s4":"Absorption 500ML+ (Queens)","products.p3s5":"Paquets en gros de 1 à 16 paquets",
    "vending.heroTitle":"🏧 Distributeur Automatique de Serviettes Hygiéniques",
    "vending.heroSub":"Automatisé, hygiénique et toujours disponible — apportant des soins menstruels à chaque toilette, école, hôpital et lieu de travail.",
    "vending.mainTitle":"Distribution Intelligente pour Chaque Espace",
    "vending.p1":"Nos distributeurs automatiques de serviettes hygiéniques offrent un accès 24h/24 et 7j/7 aux produits Premium Life Care, garantissant aux femmes un accès toujours disponible à des soins féminins hygiéniques — quel que soit le moment ou le lieu.",
    "vending.p2":"Compactes, fiables et faciles d'entretien, ces machines sont conçues pour les toilettes à fort trafic dans les institutions, les espaces publics et les environnements d'entreprise à travers l'Inde.",
    "vending.p3":"Disponible à l'<strong>achat</strong> et à la <strong>location/crédit-bail</strong>. Les machines sont pré-approvisionnées et entretenues par notre équipe.",
    "vending.f1":"Options de paiement par pièces et sans espèces","vending.f2":"Installation facile et faible entretien",
    "vending.f3":"Conception compacte pour toute toilette","vending.f4":"Rechargeable avec des serviettes Premium 4X Free",
    "vending.f5":"Idéal pour les institutions et les espaces publics","vending.f6":"Disponible en location ou à l'achat",
    "vending.cta":"Demander Maintenant",
    "vending.c1t":"Écoles et Collèges","vending.c1p":"Assurez-vous que les adolescentes ne manquent jamais l'école en raison d'urgences menstruelles. Placement discret et accessible dans les toilettes des filles.",
    "vending.c2t":"Hôpitaux et Cliniques","vending.c2p":"Distribution conviviale pour les patients dans les services et les toilettes. Soutient la dignité et l'hygiène des patients, du personnel et des visiteurs.",
    "vending.c3t":"Bureaux d'Entreprise","vending.c3p":"Un avantage professionnel réfléchi pour les employées. Améliore le moral et réduit les absences imprévues.",
    "vending.c4t":"Usines et Industries","vending.c4p":"Assurez l'accès à l'hygiène pour les femmes sur le site de production avec des machines robustes et résistantes au vandalisme pour les environnements industriels.",
    "vending.c5t":"Espaces Publics","vending.c5p":"Centres commerciaux, gares routières, gares ferroviaires et aéroports — rendant les soins menstruels universellement accessibles dans tout le Karnataka.",
    "vending.c6t":"Paiement par Pièces et Sans Espèces","vending.c6p":"Prend en charge les options de paiement par pièces et numériques pour un maximum de commodité et de facilité d'utilisation.",
    "services.heroTitle":"Nos Services",
    "services.heroSub":"Solutions complètes d'hygiène féminine pour les institutions, les entreprises et les communautés.",
    "services.s1t":"Fourniture en Gros de Serviettes Hygiéniques","services.s1p":"Produits d'hygiène féminine en gros pour les écoles, collèges, hôpitaux et institutions d'entreprise avec des options de quantité flexibles.",
    "services.s2t":"Installation de Distributeurs Automatiques","services.s2p":"Fourniture, installation et entretien de distributeurs automatiques de serviettes hygiéniques pour les toilettes dans les installations publiques et les lieux de travail.",
    "services.s3t":"Sensibilisation à l'Hygiène Menstruelle","services.s3p":"Ateliers éducatifs et campagnes de sensibilisation sur la santé menstruelle, la gestion de l'hygiène menstruelle et les soins féminins.",
    "services.s4t":"Fourniture Gouvernementale et Institutionnelle","services.s4p":"Fournisseur agréé pour les programmes gouvernementaux, les programmes de santé publique et les exigences d'hygiène féminine institutionnelle.",
    "services.s5t":"Livraison à Domicile","services.s5p":"Livraison fiable et ponctuelle aux institutions à travers le Karnataka et au-delà. Planification flexible pour répondre à vos besoins.",
    "services.s6t":"Support Client Dédié","services.s6p":"Notre équipe réactive est disponible par WhatsApp, téléphone et e-mail pour vous aider avec les commandes, les demandes et le support après-vente.",
    "events.heroTitle":"Événements",
    "events.heroSub":"Campagnes de sensibilisation à l'hygiène menstruelle, camps de santé et programmes de sensibilisation communautaire que nous avons organisés ou auxquels nous avons participé.",
    "events.e1t":"Campagnes de Sensibilisation Scolaire","events.e1p":"Sessions interactives avec des adolescentes sur la gestion de l'hygiène menstruelle, la déconstruction des mythes et les pratiques sûres.",
    "events.e2t":"Camps de Santé Gratuits","events.e2p":"Camps de santé communautaires en partenariat avec des cliniques locales, offrant des conseils sur l'hygiène féminine et le bien-être.",
    "events.e3t":"Collaborations avec des ONG","events.e3p":"Initiatives conjointes avec des ONG pour distribuer des serviettes hygiéniques et du matériel éducatif dans les communautés mal desservies.",
    "events.e4t":"Sessions de Bien-être en Entreprise","events.e4p":"Discussions sur le lieu de travail et démonstrations de produits aidant les entreprises à soutenir les besoins de santé de leurs employées.",
    "events.e5t":"Événements à Venir","events.e5p":"Restez à l'écoute — de nouveaux programmes de sensibilisation et campagnes communautaires sont en cours de planification. Contactez-nous pour en organiser un dans votre établissement.",
    "blog.heroTitle":"Blog",
    "blog.heroSub":"Articles et perspectives sur la santé menstruelle, les meilleures pratiques d'hygiène et l'éducation aux produits.",
    "blog.b1t":"Comprendre l'Hygiène Menstruelle","blog.b1p":"Un guide pour débutants sur le maintien d'une hygiène appropriée pendant les règles, et pourquoi les bons produits sanitaires sont importants.",
    "blog.b2t":"Pourquoi Choisir des Serviettes Hygiéniques en Coton","blog.b2p":"Exploration des avantages des couches supérieures en coton doux non-tissé par rapport aux alternatives pétrochimiques synthétiques.",
    "blog.b3t":"L'Essor des Distributeurs Automatiques","blog.b3p":"Comment les distributeurs automatisés rendent les produits d'hygiène féminine plus accessibles dans les écoles et sur les lieux de travail.",
    "blog.b4t":"Briser le Tabou","blog.b4p":"Pourquoi les conversations ouvertes sur les règles sont importantes, et comment les institutions peuvent créer des environnements plus favorables.",
    "blog.b5t":"Plus d'Articles à Venir","blog.b5p":"Nous développons notre blog avec plus de conseils santé et de guides produits. Revenez bientôt pour de nouveaux articles.",
    "contact.heroTitle":"Contactez-Nous","contact.heroSub":"Contactez-nous pour les commandes en gros, les demandes de distributeurs automatiques ou les partenariats.",
    "contact.waLink":"WhatsApp : Cliquez pour Discuter","contact.formTitle":"Demander un Devis / Renseignement",
    "contact.lblName":"Nom Complet *","contact.phName":"Entrez votre nom",
    "contact.lblOrg":"Organisation / Institution","contact.phOrg":"École, Hôpital, ONG, etc.",
    "contact.lblPhone":"Numéro de Téléphone *","contact.lblEmail":"Adresse E-mail",
    "contact.lblType":"Type de Demande","contact.optSelect":"Sélectionnez une option",
    "contact.lblQty":"Quantité Estimée","contact.phQty":"ex. 500 paquets/mois ou 2 distributeurs automatiques",
    "contact.lblMsg":"Message","contact.phMsg":"Dites-nous en plus sur vos besoins...",
    "contact.submitBtn":"Envoyer la Demande via WhatsApp 💬",
    "footer.tagline":"Serviettes Hygiéniques Premium et Produits d'Hygiène Féminine",
    "footer.serving":"Au Service des Écoles, Hôpitaux, ONG et Institutions à Travers l'Inde",
    "footer.rights":"Tous Droits Réservés.",
    "locked.title":"Accès Administrateur Uniquement",
    "locked.text":"La liste des demandes est réservée à l'administrateur du site. Veuillez vous connecter avec les identifiants administrateur pour voir les demandes soumises.",
    "locked.btn":"Connexion Administrateur"
  }
};

const LANG_FLAGS = { en: '🇬🇧', es: '🇪🇸', de: '🇩🇪', fr: '🇫🇷' };
const LANG_CODES = { en: 'EN', es: 'ES', de: 'DE', fr: 'FR' };
const LANG_NAMES = { en: 'English', es: 'Español', de: 'Deutsch', fr: 'Français' };

function getCurrentLang() {
    return localStorage.getItem('plc_lang') || 'en';
}

function applyTranslations(lang) {
    const dict = TRANSLATIONS[lang] || TRANSLATIONS.en;
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (dict[key] !== undefined) {
            el.innerHTML = dict[key];
        }
    });
    document.querySelectorAll('[data-i18n-ph]').forEach(el => {
        const key = el.getAttribute('data-i18n-ph');
        if (dict[key] !== undefined) {
            el.setAttribute('placeholder', dict[key]);
        }
    });
    document.documentElement.setAttribute('lang', lang);
}

function setLanguage(lang) {
    if (!TRANSLATIONS[lang]) lang = 'en';
    localStorage.setItem('plc_lang', lang);
    applyTranslations(lang);
    updateLangButton(lang);
    closeLangMenu();
}

function updateLangButton(lang) {
    const label = document.getElementById('langBtnLabel');
    if (label) {
        label.innerHTML = `<span class="lang-flag">${LANG_FLAGS[lang]}</span><span class="lang-code">${LANG_CODES[lang]}</span> ▾`;
    }
    document.querySelectorAll('.lang-option').forEach(opt => {
        opt.classList.toggle('active', opt.dataset.lang === lang);
    });
}

function toggleLangMenu() {
    document.getElementById('langMenu').classList.toggle('open');
}
function closeLangMenu() {
    document.getElementById('langMenu').classList.remove('open');
}

/* Close language menu when clicking outside of it */
document.addEventListener('click', function(e) {
    const switcher = document.getElementById('langSwitcher');
    if (switcher && !switcher.contains(e.target)) {
        closeLangMenu();
    }
});

/* Initialize language on page load */
document.addEventListener('DOMContentLoaded', function() {
    const savedLang = getCurrentLang();
    applyTranslations(savedLang);
    updateLangButton(savedLang);
});
