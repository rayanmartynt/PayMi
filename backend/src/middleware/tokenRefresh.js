const jwt = require('jsonwebtoken');

const autoRefreshToken = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const now = Math.floor(Date.now() / 1000);
      const timeUntilExpiry = decoded.exp - now;
      
      // If token will expire within 5 minutes, generate a new one
      if (timeUntilExpiry < 300 && timeUntilExpiry > 0) {
        const userId = decoded.userId || decoded.id;
        const newToken = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '30m' });
        res.setHeader('X-New-Token', newToken);
        res.setHeader('X-New-Token-Expires-In', '30m');
      }
    } catch (e) {
      // Token is invalid or expired, let the auth middleware handle it
    }
  }
  
  next();
};

module.exports = autoRefreshToken;
