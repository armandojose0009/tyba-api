const { register, login, logout } = require("@controllers/authController");
const User = require("@models/user");
const Token = require("@models/token");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

jest.mock("@models/user");
jest.mock("@models/token");
jest.mock("bcryptjs");
jest.mock("jsonwebtoken");

describe("Auth Controllers", () => {
  let req;
  let res;

  beforeEach(() => {
    User.findOne.mockReset();
    User.create.mockReset();
    Token.findOne.mockReset();
    Token.create.mockReset();
    Token.findOneAndUpdate.mockReset();
    bcrypt.hash.mockReset();
    bcrypt.compare.mockReset();
    jwt.sign.mockReset();

    req = {
      body: {},
      headers: {},
      header: jest.fn(),
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  describe("register", () => {
    it("should register a new user successfully", async () => {
      const mockUserData = {
        username: "testuser",
        email: "test@example.com",
        password: "password123",
      };
      req.body = mockUserData;
      User.findOne.mockResolvedValue(null);
      bcrypt.hash.mockResolvedValue("hashedPassword");
      User.create.mockResolvedValue(mockUserData);

      await register(req, res);

      expect(User.findOne).toHaveBeenCalledWith({
        $or: [
          { email: mockUserData.email },
          { username: mockUserData.username },
        ],
      });
      expect(bcrypt.hash).toHaveBeenCalledWith(mockUserData.password, 10);
      expect(User.create).toHaveBeenCalledWith({
        username: mockUserData.username,
        email: mockUserData.email,
        password: "hashedPassword",
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: "User registered successfully",
      });
    });

    it("should return 400 if user already exists", async () => {
      const mockUserData = {
        username: "existinguser",
        email: "existing@example.com",
        password: "password123",
      };
      req.body = mockUserData;
      User.findOne.mockResolvedValue(mockUserData);

      await register(req, res);

      expect(User.findOne).toHaveBeenCalledWith({
        $or: [
          { email: mockUserData.email },
          { username: mockUserData.username },
        ],
      });
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "User already exists" });
      expect(bcrypt.hash).not.toHaveBeenCalled();
      expect(User.create).not.toHaveBeenCalled();
    });

    it("should return 500 if registration fails", async () => {
      const mockUserData = {
        username: "testuser",
        email: "test@example.com",
        password: "password123",
      };
      req.body = mockUserData;
      User.findOne.mockResolvedValue(null);
      bcrypt.hash.mockRejectedValue(new Error("Hashing failed"));

      await register(req, res);

      expect(User.findOne).toHaveBeenCalledWith({
        $or: [
          { email: mockUserData.email },
          { username: mockUserData.username },
        ],
      });
      expect(bcrypt.hash).toHaveBeenCalledWith(mockUserData.password, 10);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: "Registration failed" });
      expect(User.create).not.toHaveBeenCalled();
    });
  });

  describe("login", () => {
    it("should log in a user successfully and return a token", async () => {
      const mockUserData = {
        _id: new mongoose.Types.ObjectId(),
        email: "test@example.com",
        password: "hashedPassword",
      };
      req.body = { email: mockUserData.email, password: "password123" };

      const mockFindOneResult = mockUserData;
      User.findOne.mockResolvedValue(mockFindOneResult);

      bcrypt.compare.mockResolvedValue(true);
      const mockToken = "mockedToken";
      jwt.sign.mockReturnValue(mockToken);
      Token.create.mockResolvedValue({
        userId: mockUserData._id,
        token: mockToken,
        status: "active",
      });

      await login(req, res);

      expect(User.findOne).toHaveBeenCalledWith({ email: mockUserData.email });
      expect(bcrypt.compare).toHaveBeenCalledWith(
        req.body.password,
        mockUserData.password
      );
      expect(jwt.sign).toHaveBeenCalledWith(
        { userId: mockUserData._id },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
      );
      expect(Token.create).toHaveBeenCalledWith({
        userId: mockUserData._id,
        token: mockToken,
        status: "active",
      });
      expect(res.json).toHaveBeenCalledWith({ token: mockToken });
    });

    it("should return 401 for invalid credentials (user not found)", async () => {
      req.body = { email: "nonexistent@example.com", password: "password123" };
      User.findOne.mockResolvedValue(null);

      await login(req, res);

      expect(User.findOne).toHaveBeenCalledWith({ email: req.body.email });
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: "Invalid credentials" });
      expect(bcrypt.compare).not.toHaveBeenCalled();
      expect(jwt.sign).not.toHaveBeenCalled();
      expect(Token.create).not.toHaveBeenCalled();
    });

    it("should return 401 for invalid credentials (incorrect password)", async () => {
      const mockUserData = {
        _id: new mongoose.Types.ObjectId(),
        email: "test@example.com",
        password: "hashedPassword",
      };
      req.body = { email: mockUserData.email, password: "wrongPassword" };

      const mockFindOneResult = mockUserData;
      User.findOne.mockResolvedValue(mockFindOneResult);

      bcrypt.compare.mockResolvedValue(false);

      await login(req, res);

      expect(User.findOne).toHaveBeenCalledWith({ email: req.body.email });
      expect(bcrypt.compare).toHaveBeenCalledWith(
        req.body.password,
        mockUserData.password
      );
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: "Invalid credentials" });
      expect(jwt.sign).not.toHaveBeenCalled();
      expect(Token.create).not.toHaveBeenCalled();
    });

    it("should return 500 if login fails", async () => {
      req.body = { email: "test@example.com", password: "password123" };
      User.findOne.mockRejectedValue(new Error("Database error"));

      await login(req, res);

      expect(User.findOne).toHaveBeenCalledWith({ email: req.body.email });
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: "Login failed" });
      expect(bcrypt.compare).not.toHaveBeenCalled();
      expect(jwt.sign).not.toHaveBeenCalled();
      expect(Token.create).not.toHaveBeenCalled();
    });
  });

  describe("logout", () => {
    it("should successfully log out a user by inactivating the token", async () => {
      const mockToken = "mockedAuthToken";
      req.header.mockReturnValue(`Bearer ${mockToken}`);
      Token.findOneAndUpdate.mockResolvedValue({
        token: mockToken,
        status: "inactive",
      });

      await logout(req, res);

      expect(req.header).toHaveBeenCalledWith("Authorization");
      expect(Token.findOneAndUpdate).toHaveBeenCalledWith(
        { token: mockToken },
        { status: "inactive" }
      );
      expect(res.json).toHaveBeenCalledWith({
        message: "Logged out successfully",
      });
    });

    it("should return a success message if no token is provided", async () => {
      req.header.mockReturnValue(undefined);
      await logout(req, res);

      expect(req.header).toHaveBeenCalledWith("Authorization");
      expect(Token.findOneAndUpdate).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        message: "Logged out (no token provided)",
      });
    });

    it("should return 404 if the token is not found", async () => {
      const mockToken = "mockedAuthToken";
      req.header.mockReturnValue(`Bearer ${mockToken}`);
      Token.findOneAndUpdate.mockResolvedValue(null);

      await logout(req, res);

      expect(req.header).toHaveBeenCalledWith("Authorization");
      expect(Token.findOneAndUpdate).toHaveBeenCalledWith(
        { token: mockToken },
        { status: "inactive" }
      );
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "Token not found" });
    });

    it("should return 500 if logout fails", async () => {
      const mockToken = "mockedAuthToken";
      req.header.mockReturnValue(`Bearer ${mockToken}`);
      Token.findOneAndUpdate.mockRejectedValue(new Error("Database error"));

      await logout(req, res);

      expect(req.header).toHaveBeenCalledWith("Authorization");
      expect(Token.findOneAndUpdate).toHaveBeenCalledWith(
        { token: mockToken },
        { status: "inactive" }
      );
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: "Logout failed" });
    });
  });
});
