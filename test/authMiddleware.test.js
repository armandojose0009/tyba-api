const jwt = require("jsonwebtoken");
const authenticate = require("../middlewares/authMiddleware");

jest.mock("jsonwebtoken", () => ({
  verify: jest.fn(),
}));

describe("Authenticate Middleware", () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
  });

  it("should return 401 if no token is provided", () => {
    req.header = jest.fn().mockReturnValue(undefined);

    authenticate(req, res, next);

    expect(req.header).toHaveBeenCalledWith("Authorization");
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      message: "Authentication required",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("should return 401 if the token is invalid", () => {
    req.header = jest.fn().mockReturnValue("Bearer invalidtoken");
    jwt.verify.mockImplementation(() => {
      throw new Error("Invalid token");
    });

    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    authenticate(req, res, next);

    expect(req.header).toHaveBeenCalledWith("Authorization");
    expect(jwt.verify).toHaveBeenCalledWith(
      "invalidtoken",
      process.env.JWT_SECRET
    );
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "Invalid token" });
    expect(next).not.toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.any(Error));
    consoleErrorSpy.mockRestore();
  });

  it("should call next() and attach decoded user to req if token is valid", () => {
    const mockToken = "validtoken";
    const mockDecoded = { userId: "user123", iat: 12345, exp: 67890 };

    req.header = jest.fn().mockReturnValue(`Bearer ${mockToken}`);
    jwt.verify.mockReturnValue(mockDecoded);

    process.env.JWT_SECRET = "supersecretkey";

    authenticate(req, res, next);

    expect(req.header).toHaveBeenCalledWith("Authorization");
    expect(jwt.verify).toHaveBeenCalledWith(mockToken, "supersecretkey");
    expect(req.user).toEqual(mockDecoded);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();

    delete process.env.JWT_SECRET;
  });

  it("should handle token without 'Bearer ' prefix correctly", () => {
    const mockToken = "justatoken";
    const mockDecoded = { userId: "user456" };

    req.header = jest.fn().mockReturnValue(mockToken);
    jwt.verify.mockReturnValue(mockDecoded);

    process.env.JWT_SECRET = "anothersecret";

    authenticate(req, res, next);

    expect(req.header).toHaveBeenCalledWith("Authorization");

    expect(jwt.verify).toHaveBeenCalledWith(mockToken, "anothersecret");
    expect(req.user).toEqual(mockDecoded);
    expect(next).toHaveBeenCalled();

    delete process.env.JWT_SECRET;
  });
});
