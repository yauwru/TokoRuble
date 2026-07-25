const { listTodayTickets, deleteTickets, resetTodayCounters } = require('../_lib/store');
const { isAuthed } = require('../_lib/auth');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end();
  }
  if (!isAuthed(req)) return res.status(401).json({ error: 'Unauthorized' });

  const tickets = await listTodayTickets();
  await deleteTickets(tickets.map((t) => t.id));
  await resetTodayCounters();

  return res.status(200).json({ ok: true, cleared: tickets.length });
};
