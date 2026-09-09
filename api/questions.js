const { githubRequest, mapIssue } = require('../lib/github');

const MAX_NAME = 80;
const MAX_QUESTION = 1000;

module.exports = async (req, res) => {
  if (req.method === 'GET') {
    try {
      const issues = await githubRequest('/issues?state=open&labels=question&per_page=100&sort=created&direction=desc');
      return res.status(200).json(issues.map(mapIssue));
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: 'שגיאה בטעינת השאלות' });
    }
  }

  if (req.method === 'POST') {
    const { name, question, website } = req.body || {};
    if (website) {
      // honeypot field: real users never fill this, bots do.
      return res.status(201).json({ ok: true });
    }
    const cleanName = String(name || '').trim().slice(0, MAX_NAME);
    const cleanQuestion = String(question || '').trim().slice(0, MAX_QUESTION);
    if (!cleanName || !cleanQuestion) {
      return res.status(400).json({ error: 'נא למלא שם ושאלה' });
    }
    try {
      const issue = await githubRequest('/issues', 'POST', {
        title: cleanName,
        body: cleanQuestion,
        labels: ['question'],
      });
      return res.status(201).json(mapIssue(issue));
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: 'שגיאה בשליחת השאלה' });
    }
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({ error: 'Method not allowed' });
};
