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
        fee: 'Biaya Layanan',
        received: 'Jumlah Diterima',
        rate: 'Kurs',
        window: 'Loket',
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
        fee: 'Комиссия',
        received: 'Сумма получения',
        rate: 'Курс',
        window: 'Окно',
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
    const fields = [
        [t('queueNumber'), ticket.queueNumber],
        [t('date'), receiptFormatDate(ticket.completedAt || ticket.createdAt)],
        [t('service'), isRubToIdr ? t('typeLabel1') : t('typeLabel2')],
        [t('name'), ticket.customerName || '-'],
        [t('phone'), ticket.customerPhone || '-'],
        [t('paid'), paidText],
    ];
    if (ticket.feeIDR) fields.push([t('fee'), receiptFormatIDR(ticket.feeIDR)]);
    fields.push([t('received'), receivedText]);
    fields.push([t('rate'), `1 RUB = ${receiptFormatNum(ticket.rate, 2)} IDR`]);
    if (ticket.windowNumber) fields.push([t('window'), String(ticket.windowNumber)]);
    fields.push([t('status'), statusText]);
    return fields;
}

function generateReceiptPDF(ticket, lang) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'mm', format: [80, 180] });
    const centerX = 40;
    let y = 12;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(receiptT(lang, 'title'), centerX, y, { align: 'center' });
    y += 7;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(60, 60, 60);
    doc.text(receiptT(lang, 'subtitle'), centerX, y, { align: 'center' });
    y += 5;
    doc.setTextColor(0, 0, 0);
    doc.line(5, y, 75, y);
    y += 7;

    doc.setFontSize(9);
    receiptFields(ticket, lang).forEach(([label, value]) => {
        doc.setTextColor(90, 90, 90);
        doc.text(label, 5, y);
        doc.setTextColor(0, 0, 0);
        doc.text(String(value), 75, y, { align: 'right' });
        y += 6;
    });

    y += 1;
    doc.line(5, y, 75, y);
    y += 7;
    doc.setFontSize(8.5);
    doc.setTextColor(60, 60, 60);
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
