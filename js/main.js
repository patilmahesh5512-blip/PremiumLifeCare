/* ===================== SUPABASE CONFIG ===================== */
const SUPABASE_URL = 'https://qpbhftgfsjyilroorvix.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwYmhmdGdmc2p5aWxyb29ydml4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM2NTAxNTQsImV4cCI6MjA5OTIyNjE1NH0.lMUDbEOP6SirH-ANmpVdqMc1AJjM-gOGLzw3sr2Yv0Q';
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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
/* Enquiries are a PERMANENT log — never deleted, only marked quoted:true/false */
async function getEnquiries() {
    const { data, error } = await sb.from('enquiries').select('*').order('created_at', { ascending: false });
    if (error) { console.error('getEnquiries error:', error); return []; }
    return (data || []).map(row => ({
        id: row.id, name: row.name, phone: row.phone, org: row.org, email: row.email,
        type: row.type, qty: row.qty, msg: row.msg, time: row.time, quoted: row.quoted
    }));
}

async function insertEnquiry(enq) {
    const { error } = await sb.from('enquiries').insert([enq]);
    if (error) console.error('insertEnquiry error:', error);
}

async function markEnquiriesQuoted(ids) {
    const { error } = await sb.from('enquiries').update({ quoted: true }).in('id', ids);
    if (error) console.error('markEnquiriesQuoted error:', error);
}

async function getQuotes() {
    const { data, error } = await sb.from('quotes').select('*').order('created_at', { ascending: false });
    if (error) { console.error('getQuotes error:', error); return []; }
    return (data || []).map(row => ({
        quoteNo: row.quote_no, date: row.date, product: row.product, productMeta: row.product_meta,
        quantity: row.quantity, price: row.price, deliveryMethod: row.delivery_method, customers: row.customers || []
    }));
}

async function insertQuote(q) {
    const { error } = await sb.from('quotes').insert([{
        quote_no: q.quoteNo, date: q.date, product: q.product, product_meta: q.productMeta,
        quantity: q.quantity, price: q.price, delivery_method: q.deliveryMethod, customers: q.customers
    }]);
    if (error) console.error('insertQuote error:', error);
}

/* Products: fetched from Supabase, seeded from DEFAULT_PRODUCTS on first run if table is empty */
async function getProducts() {
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
    const rows = DEFAULT_PRODUCTS.map(p => ({ id: p.id, name: p.name, meta: p.meta, tiers: p.tiers }));
    const { error } = await sb.from('products').upsert(rows);
    if (error) console.error('seedDefaultProducts error:', error);
}

async function saveProducts(list) {
    const rows = list.map(p => ({ id: p.id, name: p.name, meta: p.meta, tiers: p.tiers }));
    const { error } = await sb.from('products').upsert(rows);
    if (error) {
        console.error('saveProducts error:', error);
        return { success: false, error };
    }
    return { success: true };
}

async function getNextQuoteSeq() {
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
