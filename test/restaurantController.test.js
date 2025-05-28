const restaurantService = require("@services/restaurantService");
const Transaction = require("@models/transaction");
const { getRestaurants } = require("@controllers/restaurantController");
const mongoose = require("mongoose");

jest.mock("../services/restaurantService", () => ({
  getRestaurants: jest.fn(),
}));

jest.mock("../models/transaction", () => ({
  create: jest.fn(),
}));

describe("Restaurant Controller - getRestaurants", () => {
  let mockReq;
  let mockRes;

  beforeEach(() => {
    restaurantService.getRestaurants.mockClear();
    Transaction.create.mockClear();

    mockReq = {
      query: {},
      user: { userId: "testUserId123" },
    };
    mockRes = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };
  });

  test("should return restaurants and create a transaction when city is provided", async () => {
    const mockRestaurants = [
      { name: "Restaurant A" },
      { name: "Restaurant B" },
    ];
    restaurantService.getRestaurants.mockResolvedValue(mockRestaurants);

    mockReq.query.city = "London";

    await getRestaurants(mockReq, mockRes);

    expect(restaurantService.getRestaurants).toHaveBeenCalledWith(
      "London",
      undefined,
      undefined
    );

    expect(Transaction.create).toHaveBeenCalledWith({
      userId: "testUserId123",
      city: "London",
      latitude: undefined,
      longitude: undefined,
    });

    expect(mockRes.json).toHaveBeenCalledWith(mockRestaurants);

    expect(mockRes.status).not.toHaveBeenCalled();
  });

  test("should return restaurants and create a transaction when latitude and longitude are provided", async () => {
    const mockRestaurants = [{ name: "Restaurant C" }];
    restaurantService.getRestaurants.mockResolvedValue(mockRestaurants);

    mockReq.query.latitude = "10.0";
    mockReq.query.longitude = "20.0";

    await getRestaurants(mockReq, mockRes);

    expect(restaurantService.getRestaurants).toHaveBeenCalledWith(
      undefined,
      "10.0",
      "20.0"
    );
    expect(Transaction.create).toHaveBeenCalledWith({
      userId: "testUserId123",
      latitude: "10.0",
      longitude: "20.0",
      city: undefined,
    });
    expect(mockRes.json).toHaveBeenCalledWith(mockRestaurants);
    expect(mockRes.status).not.toHaveBeenCalled();
  });

  test("should return 400 if neither city nor latitude/longitude are provided", async () => {
    await getRestaurants(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: "Please provide either city or latitude and longitude",
    });

    expect(restaurantService.getRestaurants).not.toHaveBeenCalled();
    expect(Transaction.create).not.toHaveBeenCalled();
  });

  test("should return 500 if restaurantService fails", async () => {
    const errorMessage = "Service unavailable";
    restaurantService.getRestaurants.mockRejectedValue(new Error(errorMessage));

    mockReq.query.city = "Paris";

    await getRestaurants(mockReq, mockRes);

    expect(restaurantService.getRestaurants).toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: "Failed to fetch restaurants",
    });

    expect(Transaction.create).not.toHaveBeenCalled();
  });

  test("should return 500 if Transaction.create fails", async () => {
    const mockRestaurants = [{ name: "Restaurant X" }];
    restaurantService.getRestaurants.mockResolvedValue(mockRestaurants);
    Transaction.create.mockRejectedValue(new Error("DB error"));

    mockReq.query.city = "Berlin";

    await getRestaurants(mockReq, mockRes);

    expect(restaurantService.getRestaurants).toHaveBeenCalled();
    expect(Transaction.create).toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: "Failed to fetch restaurants",
    });
    expect(mockRes.json).not.toHaveBeenCalledWith(mockRestaurants);
  });
});
