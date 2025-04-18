const jwt = require('jsonwebtoken');
const { User } = require('../models');

module.exports = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: "No token provided" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.userId);
    
    if (!user || decoded.version !== user.tokenVersion) {
      return res.status(401).json({ message: "Session expired" });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid token" });
  }
};