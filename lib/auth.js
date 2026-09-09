// Stateless admin session token: "<expiry>.<hmac>", verified with a server-only secret.
const crypto = require('crypto');

function issueToken() {
  const expires = Date.now() + 1000 * 60 * 60 * 8; // 8 hours
  const sig = crypto.createHmac('sha256', process.env.SESSION_SECRET).update(String(expires)).digest('hex');
  return `${expires}.${sig}`;
}

function verifyToken(req) {
  const auth = req.headers['authorization'] || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  const [expiresStr, sig] = token.split('.');
  if (!expiresStr || !sig) return false;

  const expected = crypto.createHmac('sha256', process.env.SESSION_SECRET).update(expiresStr).digest('hex');
  const sigBuf = Buffer.from(sig, 'hex');
  const expBuf = Buffer.from(expected, 'hex');
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) return false;

  return Date.now() < Number(expiresStr);
}

module.exports = { issueToken, verifyToken };
