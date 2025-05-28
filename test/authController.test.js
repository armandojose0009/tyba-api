const User = require("@models/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const { register, login, logout } = require("@controllers/authController");

jest.mock("@models/user", () => {
  const MockUser = jest.fn().mockImplementation((data) => {
    return {
      ...data,
      save: jest.fn(),
    };
  });

  MockUser.findOne = jest.fn();
  return MockUser;
});

jest.mock("bcryptjs", () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

jest.mock("jsonwebtoken", () => ({
  sign: jest.fn(),
}));

describe("Auth Controller", () => {
  let req;
  let res;

  beforeEach(() => {
    jest.clearAllMocks();

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  describe("register", () => {
    it("should register a new user successfully", async () => {
      req = {
        body: {
          username: "testuser",
          email: "test@example.com",
          password: "password123",
        },
      };

      User.findOne.mockResolvedValue(null);

      bcrypt.hash.mockResolvedValue("hashedPassword123");

      await register(req, res);

      expect(User.findOne).toHaveBeenCalledWith({
        $or: [{ email: "test@example.com" }, { username: "testuser" }],
      });
      expect(bcrypt.hash).toHaveBeenCalledWith("password123", 10);

      expect(User).toHaveBeenCalledWith({
        username: "testuser",
        email: "test@example.com",
        password: "hashedPassword123",
      });

      expect(User.mock.results[0].value.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: "User registered successfully",
      });
    });

    it("should return 400 if user already exists", async () => {
      req = {
        body: {
          username: "existinguser",
          email: "existing@example.com",
          password: "password123",
        },
      };

      User.findOne.mockResolvedValue({
        username: "existinguser",
        email: "existing@example.com",
      });

      await register(req, res);

      expect(User.findOne).toHaveBeenCalled();
      expect(bcrypt.hash).not.toHaveBeenCalled();
      expect(User).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "User already exists" });
    });

    it("should return 500 if registration fails due to server error", async () => {
      req = {
        body: {
          username: "erroruser",
          email: "error@example.com",
          password: "password123",
        },
      };

      User.findOne.mockResolvedValue(null);

      bcrypt.hash.mockResolvedValue("hashedPassword123");

      User.mockImplementationOnce((data) => ({
        ...data,
        save: jest.fn().mockRejectedValue(new Error("Database error")),
      }));

      const consoleErrorSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      await register(req, res);

      expect(User.findOne).toHaveBeenCalled();
      expect(bcrypt.hash).toHaveBeenCalled();
      expect(User).toHaveBeenCalled();
      expect(User.mock.results[0].value.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: "Registration failed" });
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.any(Error));
      consoleErrorSpy.mockRestore();
    });
  });

  describe("logout", () => {
    it("should return a logout message", () => {
      req = {};

      logout(req, res);

      expect(res.json).toHaveBeenCalledWith({
        message: "Logged out (token should be deleted client-side)",
      });
    });
  });
});
