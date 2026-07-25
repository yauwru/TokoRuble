const RECEIPT_I18N = {
    id: {
        title: 'TokoRuble',
        subtitle: 'Bukti Transaksi',
        queueNumber: 'Nomor Antrian',
        date: 'Tanggal',
        service: 'Layanan',
        name: 'Nama',
        phone: 'No. HP',
        paid: 'Jumlah Dibayar',
        received: 'Jumlah Diterima',
        rate: 'Kurs',
        status: 'Status',
        statusSelesai: 'SELESAI',
        statusDibatalkan: 'DIBATALKAN',
        typeLabel1: 'Transfer RUB → Cash IDR',
        typeLabel2: 'Cash IDR → Kirim RUB',
        thanks: 'Terima kasih telah menggunakan TokoRuble!',
    },
    ru: {
        title: 'TokoRuble',
        subtitle: 'Чек операции',
        queueNumber: 'Номер очереди',
        date: 'Дата',
        service: 'Услуга',
        name: 'Имя',
        phone: 'Телефон',
        paid: 'Сумма оплаты',
        received: 'Сумма получения',
        rate: 'Курс',
        status: 'Статус',
        statusSelesai: 'ЗАВЕРШЕНО',
        statusDibatalkan: 'ОТМЕНЕНО',
        typeLabel1: 'Перевод RUB → Наличные IDR',
        typeLabel2: 'Наличные IDR → Перевод RUB',
        thanks: 'Спасибо, что воспользовались TokoRuble!',
    },
};

function receiptT(lang, key) {
    return (RECEIPT_I18N[lang] && RECEIPT_I18N[lang][key]) || RECEIPT_I18N.id[key] || key;
}

function receiptFormatIDR(v) {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v || 0);
}

function receiptFormatNum(v, d) {
    return new Intl.NumberFormat('id-ID', { minimumFractionDigits: d == null ? 2 : d, maximumFractionDigits: d == null ? 2 : d }).format(v || 0);
}

function receiptFormatDate(ms) {
    return new Date(ms || Date.now()).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
}

function receiptEscapeHTML(s) {
    return String(s || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function receiptFields(ticket, lang) {
    const t = (k) => receiptT(lang, k);
    const isRubToIdr = ticket.type === 'rub_to_idr';
    const paidText = isRubToIdr ? `${receiptFormatNum(ticket.amount, 2)} RUB` : receiptFormatIDR(ticket.amount);
    const receivedText = isRubToIdr ? receiptFormatIDR(ticket.estimatedResult) : `${receiptFormatNum(ticket.estimatedResult, 2)} RUB`;
    const statusText = ticket.status === 'dibatalkan' ? t('statusDibatalkan') : t('statusSelesai');
    return [
        [t('queueNumber'), ticket.queueNumber],
        [t('date'), receiptFormatDate(ticket.completedAt || ticket.createdAt)],
        [t('service'), isRubToIdr ? t('typeLabel1') : t('typeLabel2')],
        [t('name'), ticket.customerName || '-'],
        [t('phone'), ticket.customerPhone || '-'],
        [t('paid'), paidText],
        [t('received'), receivedText],
        [t('rate'), `1 RUB = ${receiptFormatNum(ticket.rate, 2)} IDR`],
        [t('status'), statusText],
    ];
}

function generateReceiptPDF(ticket, lang) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'mm', format: [80, 180] });
    const centerX = 40;
    let y = 10;

    doc.setFont('courier', 'bold');
    doc.setFontSize(13);
    doc.text(receiptT(lang, 'title'), centerX, y, { align: 'center' });
    y += 6;
    doc.setFont('courier', 'normal');
    doc.setFontSize(9);
    doc.text(receiptT(lang, 'subtitle'), centerX, y, { align: 'center' });
    y += 5;
    doc.line(5, y, 75, y);
    y += 6;

    doc.setFontSize(8.5);
    receiptFields(ticket, lang).forEach(([label, value]) => {
        doc.setFont('courier', 'bold');
        doc.text(label, 5, y);
        doc.setFont('courier', 'normal');
        doc.text(String(value), 75, y, { align: 'right' });
        y += 5.5;
    });

    y += 1;
    doc.line(5, y, 75, y);
    y += 6;
    doc.setFontSize(8);
    doc.text(receiptT(lang, 'thanks'), centerX, y, { align: 'center', maxWidth: 68 });

    return doc;
}

function downloadReceiptPDF(ticket, lang) {
    const doc = generateReceiptPDF(ticket, lang);
    doc.save(`TokoRuble-${ticket.queueNumber}.pdf`);
}

function renderReceiptPrintHTML(ticket, lang) {
    const rows = receiptFields(ticket, lang)
        .map(([label, value]) => `<div style="display:flex;justify-content:space-between;gap:12px;margin:3px 0;"><span>${receiptEscapeHTML(label)}</span><span style="font-weight:bold;text-align:right;">${receiptEscapeHTML(String(value))}</span></div>`)
        .join('');
    return `
        <div style="width:280px;margin:0 auto;font-family:'Courier New',monospace;color:#000;text-align:left;">
            <div style="text-align:center;font-weight:bold;font-size:18px;">${receiptEscapeHTML(receiptT(lang, 'title'))}</div>
            <div style="text-align:center;font-size:13px;margin-bottom:10px;">${receiptEscapeHTML(receiptT(lang, 'subtitle'))}</div>
            <hr style="border:none;border-top:1px dashed #000;">
            <div style="margin:10px 0;font-size:13px;">${rows}</div>
            <hr style="border:none;border-top:1px dashed #000;">
            <div style="text-align:center;font-size:12px;margin-top:10px;">${receiptEscapeHTML(receiptT(lang, 'thanks'))}</div>
        </div>
    `;
}
