const jwt = require('jsonwebtoken');

const VerifyToken = (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1]; // Extract the token from the Authorization header
  
  if (!token) {
    return res.status(401).json({ message: 'Access Denied: No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // Verify the token
    req.user = decoded; // Attach the decoded user info to the request
    next(); // Move to the next middleware or route handler
  } catch (err) {
    res.status(403).json({ message: 'Invalid token' });
  }
};

module.exports = VerifyToken;
