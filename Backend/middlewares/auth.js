const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) {
    console.log('No token provided');
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, 'your_jwt_secret');
    console.log(`Token verified for user ${decoded.id}`);
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Invalid token error:', error.message);
    res.status(401).json({ error: 'Invalid token' });
  }
};

module.exports = auth;

