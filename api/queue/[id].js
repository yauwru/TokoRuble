const { getTicket, updateTicket } = require('../_lib/store');
const { isAuthed } = require('../_lib/auth');

module.exports = async (req, res) => {
  const { id } = req.query;

  if (req.method === 'GET') {
    const ticket = await getTicket(id);
    if (!ticket) return res.status(404).json({ error: 'Antrian tidak ditemukan' });
    return res.status(200).json(ticket);
  }

  if (req.method === 'PATCH') {
    if (!isAuthed(req)) return res.status(401).json({ error: 'Unauthorized' });
    const { status } = req.body || {};
    if (!['menunggu', 'dipanggil', 'selesai', 'dibatalkan'].includes(status)) {
      return res.status(400).json({ error: 'Status tidak valid' });
    }
    const patch = { status };
    if (status === 'dipanggil') patch.calledAt = Date.now();
    if (status === 'selesai' || status === 'dibatalkan') patch.completedAt = Date.now();
    const updated = await updateTicket(id, patch);
    if (!updated) return res.status(404).json({ error: 'Antrian tidak ditemukan' });
    return res.status(200).json(updated);
  }

  res.setHeader('Allow', 'GET, PATCH');
  return res.status(405).end();
};
