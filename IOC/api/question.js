const { githubRequest, mapIssue } = require('../lib/github');
const { verifyToken } = require('../lib/auth');

const MAX_NAME = 80;
const MAX_QUESTION = 1000;

// Admin-only: edit, close ("delete"), or reopen ("restore") a single question by issue number.
module.exports = async (req, res) => {
  if (!verifyToken(req)) {
    return res.status(401).json({ error: 'נדרשת התחברות מנהל' });
  }

  const id = req.query.id;
  if (!id || !/^\d+$/.test(String(id))) {
    return res.status(400).json({ error: 'חסר מזהה שאלה' });
  }

  if (req.method === 'PATCH') {
    const { name, question, state } = req.body || {};
    const body = {};
    if (name !== undefined) body.title = String(name).trim().slice(0, MAX_NAME);
    if (question !== undefined) body.body = String(question).trim().slice(0, MAX_QUESTION);
    if (state === 'open' || state === 'closed') body.state = state;
    try {
      const issue = await githubRequest(`/issues/${id}`, 'PATCH', body);
      return res.status(200).json(mapIssue(issue));
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: 'שגיאה בעדכון השאלה' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const issue = await githubRequest(`/issues/${id}`, 'PATCH', { state: 'closed' });
      return res.status(200).json(mapIssue(issue));
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: 'שגיאה במחיקת השאלה' });
    }
  }

  res.setHeader('Allow', 'PATCH, DELETE');
  return res.status(405).json({ error: 'Method not allowed' });
};
