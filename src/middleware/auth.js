const jwt = require('jsonwebtoken');

function authGuard(req, res, next) {
  const token = req.cookies?.token || (req.headers.authorization?.split(' ')[1]);
  if (!token) return res.status(401).json({error:'Not authenticated'});
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

function masterOnly(req,res,next) {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  if (req.user.role !== 'MASTER_ADMIN') return res.status(403).json({ error: 'Forbidden' });
  next();
}

module.exports = { authGuard, masterOnly };
