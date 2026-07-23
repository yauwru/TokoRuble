const { createSessionCookie } = require('../_lib/auth');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end();
  }
  const { password } = req.body || {};
  const expected = process.env.KIOS_ADMIN_PASSWORD;
  if (!expected) return res.status(500).json({ error: 'Server belum dikonfigurasi (KIOS_ADMIN_PASSWORD kosong)' });
  if (!password || password !== expected) return res.status(401).json({ error: 'Password salah' });

  res.setHeader('Set-Cookie', createSessionCookie());
  return res.status(200).json({ ok: true });
};
