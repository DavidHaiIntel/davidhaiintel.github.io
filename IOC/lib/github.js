// Thin wrapper around the GitHub REST API, used as the data store (issues = questions).
const BASE = 'https://api.github.com';

async function githubRequest(path, method = 'GET', body) {
  const { GITHUB_OWNER, GITHUB_REPO, GITHUB_TOKEN } = process.env;
  if (!GITHUB_OWNER || !GITHUB_REPO || !GITHUB_TOKEN) {
    throw new Error('חסרה תצורת שרת (GITHUB_OWNER/GITHUB_REPO/GITHUB_TOKEN)');
  }
  const url = `${BASE}/repos/${GITHUB_OWNER}/${GITHUB_REPO}${path}`;
  const resp = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`GitHub API ${resp.status}: ${text}`);
  }
  return resp.status === 204 ? null : resp.json();
}

function mapIssue(issue) {
  return {
    id: issue.number,
    name: issue.title,
    question: issue.body || '',
    createdAt: issue.created_at,
    state: issue.state,
    upvotes: (issue.reactions && issue.reactions['+1']) || 0,
  };
}

module.exports = { githubRequest, mapIssue };
