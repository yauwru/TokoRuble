const formatIDR = (v) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v || 0);
const formatNum = (v, d = 2) => new Intl.NumberFormat('id-ID', { minimumFractionDigits: d, maximumFractionDigits: d }).format(v || 0);
const escapeHTML = (s) => String(s || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

module.exports = { formatIDR, formatNum, escapeHTML };
