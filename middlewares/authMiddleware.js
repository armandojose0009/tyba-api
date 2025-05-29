const jwt = require("jsonwebtoken");
const Token = require("@models/token");

const authenticate = async (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({ message: "Authentication required" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;

    const dbToken = await Token.findOne({
      token: token,
      userId: decoded.userId,
      status: "active",
      expiresAt: { $gt: new Date() },
    });

    if (!dbToken) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    next();
  } catch (error) {
    console.error(error);
    return res.status(401).json({ message: "Invalid token" });
  }
};

module.exports = authenticate;
