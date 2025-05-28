const Transaction = require("@models/transaction");

const { getTransactions } = require("@controllers/transactionController");

jest.mock("@models/transaction", () => ({
  find: jest.fn().mockReturnThis(),
  sort: jest.fn(),
}));

describe("Transaction Controller", () => {
  let req;
  let res;

  beforeEach(() => {
    jest.clearAllMocks();

    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };
  });

  describe("getTransactions", () => {
    it("should fetch transactions for the authenticated user and return them sorted", async () => {
      const mockUserId = "user123";
      const mockTransactions = [
        {
          _id: "trans456",
          userId: mockUserId,
          city: "New York",
          latitude: "40.7128",
          longitude: "-74.0060",
          timestamp: new Date("2023-01-02T10:00:00Z"),
        },
        {
          _id: "trans123",
          userId: mockUserId,
          city: "Los Angeles",
          latitude: "34.0522",
          longitude: "-118.2437",
          timestamp: new Date("2023-01-01T10:00:00Z"),
        },
      ];

      req = {
        user: {
          userId: mockUserId,
        },
      };

      Transaction.find.mockReturnThis();
      Transaction.sort.mockResolvedValue(mockTransactions);

      await getTransactions(req, res);

      expect(Transaction.find).toHaveBeenCalledWith({ userId: mockUserId });
      expect(Transaction.sort).toHaveBeenCalledWith({ timestamp: -1 });
      expect(res.json).toHaveBeenCalledWith(mockTransactions);
      expect(res.status).not.toHaveBeenCalled();
    });

    it("should return 500 if fetching transactions fails due to a server error", async () => {
      const mockUserId = "user123";
      req = {
        user: {
          userId: mockUserId,
        },
      };

      Transaction.find.mockImplementation(() => {
        throw new Error("Database error");
      });

      const consoleErrorSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      await getTransactions(req, res);

      expect(Transaction.find).toHaveBeenCalledWith({ userId: mockUserId });
      expect(Transaction.sort).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Failed to fetch transactions",
      });
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.any(Error));
      consoleErrorSpy.mockRestore();
    });
  });
});
