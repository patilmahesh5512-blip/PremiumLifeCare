function showPage(name) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById('page-' + name).classList.add('active');
    document.querySelectorAll('.nav-links a').forEach(a => {
        a.classList.toggle('active', a.dataset.page === name);
    });
    document.getElementById('navLinks').classList.remove('open');
    window.scrollTo({top:0, behavior:'smooth'});
    return false;
}
function toggleNav() {
    document.getElementById('navLinks').classList.toggle('open');
}
function sendWA() {
    const name = document.getElementById('c_name').value;
    const phone = document.getElementById('c_phone').value;
    if (!name || !phone) { alert('Please enter your name and phone number.'); return; }
    const org = document.getElementById('c_org').value;
    const email = document.getElementById('c_email').value;
    const type = document.getElementById('c_type').value;
    const qty = document.getElementById('c_qty').value;
    const msg = document.getElementById('c_msg').value;
    let m = `*New Enquiry - Premium Life Care*%0A%0A*Name:* ${name}%0A*Phone:* ${phone}`;
    if(org) m += `%0A*Org:* ${org}`;
    if(email) m += `%0A*Email:* ${email}`;
    if(type) m += `%0A*Type:* ${type}`;
    if(qty) m += `%0A*Qty:* ${qty}`;
    if(msg) m += `%0A*Message:* ${msg}`;
    window.open('https://wa.me/917795452724?text=' + m, '_blank');
}