const { githubRequest, mapIssue } = require('../lib/github');
const { verifyToken } = require('../lib/auth');

// Admin-only: list every question, including closed ("deleted") ones.
module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!verifyToken(req)) {
    return res.status(401).json({ error: 'נדרשת התחברות מנהל' });
  }
  try {
    const issues = await githubRequest('/issues?state=all&labels=question&per_page=100&sort=created&direction=desc');
    return res.status(200).json(issues.map(mapIssue));
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'שגיאה בטעינת השאלות' });
  }
};
