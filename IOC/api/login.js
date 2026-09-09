const { issueToken } = require('../lib/auth');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const { password } = req.body || {};
  if (!password || !process.env.ADMIN_PASSWORD || password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'סיסמה שגויה' });
  }
  return res.status(200).json({ token: issueToken() });
};
