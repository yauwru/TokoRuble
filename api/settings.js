const { getSettings, setSettings } = require('./_lib/store');
const { isAuthed } = require('./_lib/auth');

module.exports = async (req, res) => {
  if (req.method === 'GET') {
    const s = await getSettings();
    return res.status(200).json(s);
  }

  if (req.method === 'PUT') {
    if (!isAuthed(req)) return res.status(401).json({ error: 'Unauthorized' });
    const { bankName, accountNumber, accountHolder, rate } = req.body || {};
    const patch = {};
    if (bankName !== undefined) patch.bankName = String(bankName).slice(0, 100);
    if (accountNumber !== undefined) patch.accountNumber = String(accountNumber).slice(0, 60);
    if (accountHolder !== undefined) patch.accountHolder = String(accountHolder).slice(0, 100);
    if (rate !== undefined) {
      const r = Number(rate);
      if (!Number.isFinite(r) || r <= 0) return res.status(400).json({ error: 'Kurs tidak valid' });
      patch.rate = r;
    }
    const updated = await setSettings(patch);
    return res.status(200).json(updated);
  }

  res.setHeader('Allow', 'GET, PUT');
  return res.status(405).end();
};
