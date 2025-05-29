const jwt = require("jsonwebtoken");
const authenticate = require("@middlewares/authMiddleware");
const Token = require("@models/token");
const mongoose = require("mongoose");

jest.mock("@models/token");

describe("authenticate middleware", () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    Token.findOne.mockReset();
    req = {
      header: jest.fn(),
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
  });

  it("should return 401 if no token is provided", async () => {
    req.header.mockReturnValue(undefined);
    await authenticate(req, res, next);
    expect(req.header).toHaveBeenCalledWith("Authorization");
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      message: "Authentication required",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("should return 401 if the token format is invalid", async () => {
    req.header.mockReturnValue("InvalidTokenFormat");
    jwt.verify = jest.fn().mockImplementation(() => {
      throw new Error("Invalid token");
    });
    await authenticate(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "Invalid token" });
    expect(next).not.toHaveBeenCalled();
  });

  it("should return 401 if the JWT verification fails", async () => {
    req.header.mockReturnValue("Bearer invalid.jwt.token");
    jwt.verify = jest.fn().mockImplementation(() => {
      throw new jwt.JsonWebTokenError("invalid signature");
    });
    await authenticate(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "Invalid token" });
    expect(next).not.toHaveBeenCalled();
  });

  it("should return 401 if the token is not found in the database", async () => {
    const mockUserId = new mongoose.Types.ObjectId();
    const mockToken = "valid.jwt.token";
    req.header.mockReturnValue(`Bearer ${mockToken}`);
    jwt.verify = jest.fn().mockReturnValue({ userId: mockUserId });
    Token.findOne.mockResolvedValue(null);

    await authenticate(req, res, next);
    expect(Token.findOne).toHaveBeenCalledWith({
      token: mockToken,
      userId: mockUserId,
      status: "active",
      expiresAt: { $gt: expect.any(Date) },
    });
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      message: "Invalid or expired token",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("should return 401 if the token status is not active", async () => {
    const mockUserId = new mongoose.Types.ObjectId();
    const mockToken = "valid.jwt.token";
    req.header.mockReturnValue(`Bearer ${mockToken}`);
    jwt.verify = jest.fn().mockReturnValue({ userId: mockUserId });
    Token.findOne.mockResolvedValue({
      _id: new mongoose.Types.ObjectId(),
      userId: mockUserId,
      token: mockToken,
      status: "inactive",
      expiresAt: new Date(Date.now() + 3600000),
    });

    await authenticate(req, res, next);
    expect(Token.findOne).toHaveBeenCalledWith({
      token: mockToken,
      userId: mockUserId,
      status: "active",
      expiresAt: { $gt: expect.any(Date) },
    });
  });

  it("should return 401 if the token has expired in the database", async () => {
    const mockUserId = new mongoose.Types.ObjectId();
    const mockToken = "valid.jwt.token";
    req.header.mockReturnValue(`Bearer ${mockToken}`);
    jwt.verify = jest.fn().mockReturnValue({ userId: mockUserId });
    Token.findOne.mockResolvedValue({
      _id: new mongoose.Types.ObjectId(),
      userId: mockUserId,
      token: mockToken,
      status: "active",
      expiresAt: new Date(Date.now() - 3600000),
    });

    await authenticate(req, res, next);
    expect(Token.findOne).toHaveBeenCalledWith({
      token: mockToken,
      userId: mockUserId,
      status: "active",
      expiresAt: { $gt: expect.any(Date) },
    });
  });

  it("should call next() if the token is valid and active in the database", async () => {
    const mockUserId = new mongoose.Types.ObjectId();
    const mockToken = "valid.jwt.token";
    req.header.mockReturnValue(`Bearer ${mockToken}`);
    jwt.verify = jest.fn().mockReturnValue({ userId: mockUserId });
    Token.findOne.mockResolvedValue({
      _id: new mongoose.Types.ObjectId(),
      userId: mockUserId,
      token: mockToken,
      status: "active",
      expiresAt: new Date(Date.now() + 3600000),
    });

    await authenticate(req, res, next);
    expect(Token.findOne).toHaveBeenCalledWith({
      token: mockToken,
      userId: mockUserId,
      status: "active",
      expiresAt: { $gt: expect.any(Date) },
    });
    expect(req.user).toEqual({ userId: mockUserId });
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });
});
