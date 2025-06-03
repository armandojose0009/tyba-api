const User = require("@models/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Token = require("@models/token");

const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await User.create({
      username,
      email,
      password: hashedPassword,
    });

    return res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Registration failed" });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });

  await Token.create({
    userId: user._id,
    token: token,
    status: "active",
  });

  return res.json({ token });
};

const logout = async (req, res) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    return res.json({ message: "Logged out (no token provided)" });
  }

  try {
    const updatedToken = await Token.findOneAndUpdate(
      { token },
      { status: "inactive" }
    );

    if (updatedToken) {
      return res.json({ message: "Logged out successfully" });
    } else {
      return res.status(404).json({ message: "Token not found" });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Logout failed" });
  }
};

module.exports = { register, login, logout };
