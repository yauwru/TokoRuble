const { clearSessionCookie } = require('../_lib/auth');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end();
  }
  res.setHeader('Set-Cookie', clearSessionCookie());
  return res.status(200).json({ ok: true });
};
