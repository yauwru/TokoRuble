const { getSettings, nextQueueNumber, createTicket, listTodayTickets, deleteTickets, getCustomer } = require('../_lib/store');
const { notifyTelegram } = require('../_lib/telegram');
const { isAuthed } = require('../_lib/auth');
const { formatIDR, formatNum, escapeHTML } = require('../_lib/format');

module.exports = async (req, res) => {
  if (req.method === 'GET') {
    const tickets = await listTodayTickets();
    return res.status(200).json(tickets);
  }

  if (req.method === 'POST') {
    const { type, amount, customerName, customerPhone, customerBankAccount, transferNote } = req.body || {};
    if (!['rub_to_idr', 'idr_to_rub'].includes(type)) {
      return res.status(400).json({ error: 'Jenis layanan tidak valid' });
    }
    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0) return res.status(400).json({ error: 'Jumlah tidak valid' });
    if (!customerName || !String(customerName).trim()) return res.status(400).json({ error: 'Nama wajib diisi' });
    if (!customerPhone || !String(customerPhone).trim()) return res.status(400).json({ error: 'No. HP wajib diisi' });
    if (type === 'idr_to_rub' && (!customerBankAccount || !String(customerBankAccount).trim())) {
      return res.status(400).json({ error: 'Nomor rekening/kartu bank Rusia wajib diisi' });
    }

    const settings = await getSettings();
    const rate = settings.rate || 200;

    const customer = await getCustomer(customerPhone);
    const previousTxCount = (customer && customer.totalTx) || 0;

    let feePercent = settings.feePercent || 0;
    const feeFlatIDR = settings.feeFlatIDR || 0;
    let loyaltyApplied = false;
    if (settings.loyaltyThreshold > 0 && previousTxCount >= settings.loyaltyThreshold) {
      feePercent = Math.max(0, feePercent - (settings.loyaltyDiscountPercent || 0));
      loyaltyApplied = true;
    }

    const baseAmountIDR = type === 'rub_to_idr' ? amt * rate : amt;
    let feeIDR = baseAmountIDR * (feePercent / 100) + feeFlatIDR;
    feeIDR = Math.min(Math.max(feeIDR, 0), baseAmountIDR);
    const netIDR = baseAmountIDR - feeIDR;
    const estimatedResult = type === 'rub_to_idr' ? netIDR : netIDR / rate;

    const queueNumber = await nextQueueNumber(type);

    const ticket = await createTicket({
      queueNumber,
      type,
      amount: amt,
      baseAmountIDR,
      feeIDR,
      feePercent,
      loyaltyApplied,
      previousTxCount,
      estimatedResult,
      rate,
      customerName: String(customerName).trim().slice(0, 100),
      customerPhone: String(customerPhone).trim().slice(0, 30),
      customerBankAccount: type === 'idr_to_rub' ? String(customerBankAccount).trim().slice(0, 60) : '',
      transferNote: type === 'rub_to_idr' ? String(transferNote || '').trim().slice(0, 120) : '',
    });

    const label = type === 'rub_to_idr' ? 'Transfer RUB → Cash IDR' : 'Cash IDR → Kirim RUB';
    const resultText = type === 'rub_to_idr' ? formatIDR(estimatedResult) : `${formatNum(estimatedResult, 2)} RUB`;
    const amountText = type === 'rub_to_idr' ? `${formatNum(amt, 2)} RUB` : formatIDR(amt);
    const loyaltyText = loyaltyApplied ? ` (pelanggan ke-${previousTxCount + 1}, diskon loyalitas)` : (previousTxCount > 0 ? ` (pelanggan ke-${previousTxCount + 1})` : ' (pelanggan baru)');
    notifyTelegram(
      `🎟️ <b>ANTRIAN KIOS BARU: ${ticket.queueNumber}</b>\n---------------------------\n` +
      `👤 ${escapeHTML(ticket.customerName)} (${escapeHTML(ticket.customerPhone)})${loyaltyText}\n` +
      `📋 Layanan: ${label}\n💰 Jumlah: ${amountText}\n💵 Fee: ${formatIDR(feeIDR)}\n➡️ Estimasi Terima: ${resultText}\n` +
      `---------------------------\nBuka dashboard kios untuk melayani.`
    );

    return res.status(201).json(ticket);
  }

  if (req.method === 'DELETE') {
    if (!isAuthed(req)) return res.status(401).json({ error: 'Unauthorized' });
    const tickets = await listTodayTickets();
    const doneIds = tickets.filter((t) => t.status === 'selesai' || t.status === 'dibatalkan').map((t) => t.id);
    await deleteTickets(doneIds);
    return res.status(200).json({ deleted: doneIds.length });
  }

  res.setHeader('Allow', 'GET, POST, DELETE');
  return res.status(405).end();
};
