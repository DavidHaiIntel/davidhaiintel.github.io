const { githubRequest } = require('../lib/github');

// Public: add a 👍 reaction to a question (best-effort duplicate prevention is client-side).
module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const { id } = req.body || {};
  if (!id || !/^\d+$/.test(String(id))) {
    return res.status(400).json({ error: 'חסר מזהה שאלה' });
  }
  try {
    await githubRequest(`/issues/${id}/reactions`, 'POST', { content: '+1' });
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'שגיאה בהצבעה' });
  }
};
