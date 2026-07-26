const { getSettings, setSettings } = require('./_lib/store');
const { isAuthed } = require('./_lib/auth');

module.exports = async (req, res) => {
  if (req.method === 'GET') {
    const s = await getSettings();
    return res.status(200).json(s);
  }

  if (req.method === 'PUT') {
    if (!isAuthed(req)) return res.status(401).json({ error: 'Unauthorized' });
    const {
      bankName, accountNumber, accountHolder, rate,
      feePercent, feeFlatIDR, loyaltyThreshold, loyaltyDiscountPercent, totalWindows,
      shopOpen, stockIdrEmpty, stockRubEmpty,
    } = req.body || {};
    const patch = {};
    if (bankName !== undefined) patch.bankName = String(bankName).slice(0, 100);
    if (accountNumber !== undefined) patch.accountNumber = String(accountNumber).slice(0, 60);
    if (accountHolder !== undefined) patch.accountHolder = String(accountHolder).slice(0, 100);
    if (rate !== undefined) {
      const r = Number(rate);
      if (!Number.isFinite(r) || r <= 0) return res.status(400).json({ error: 'Kurs tidak valid' });
      patch.rate = r;
    }
    if (feePercent !== undefined) {
      const v = Number(feePercent);
      if (!Number.isFinite(v) || v < 0 || v > 100) return res.status(400).json({ error: 'Fee persen tidak valid' });
      patch.feePercent = v;
    }
    if (feeFlatIDR !== undefined) {
      const v = Number(feeFlatIDR);
      if (!Number.isFinite(v) || v < 0) return res.status(400).json({ error: 'Fee tetap tidak valid' });
      patch.feeFlatIDR = v;
    }
    if (loyaltyThreshold !== undefined) {
      const v = Number(loyaltyThreshold);
      if (!Number.isFinite(v) || v < 0) return res.status(400).json({ error: 'Ambang loyalitas tidak valid' });
      patch.loyaltyThreshold = Math.floor(v);
    }
    if (loyaltyDiscountPercent !== undefined) {
      const v = Number(loyaltyDiscountPercent);
      if (!Number.isFinite(v) || v < 0 || v > 100) return res.status(400).json({ error: 'Diskon loyalitas tidak valid' });
      patch.loyaltyDiscountPercent = v;
    }
    if (totalWindows !== undefined) {
      const v = Number(totalWindows);
      if (!Number.isFinite(v) || v < 1 || v > 20) return res.status(400).json({ error: 'Jumlah loket tidak valid' });
      patch.totalWindows = Math.floor(v);
    }
    if (shopOpen !== undefined) patch.shopOpen = Boolean(shopOpen);
    if (stockIdrEmpty !== undefined) patch.stockIdrEmpty = Boolean(stockIdrEmpty);
    if (stockRubEmpty !== undefined) patch.stockRubEmpty = Boolean(stockRubEmpty);
    const updated = await setSettings(patch);
    return res.status(200).json(updated);
  }

  res.setHeader('Allow', 'GET, PUT');
  return res.status(405).end();
};
