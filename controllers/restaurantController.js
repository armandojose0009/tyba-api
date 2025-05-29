const restaurantService = require("@services/restaurantService");
const Transaction = require("@models/transaction");

const getRestaurants = async (req, res) => {
  try {
    const { city, latitude, longitude } = req.query;

    if (!city && (!latitude || !longitude)) {
      return res.status(400).json({
        message: "Please provide either city or latitude and longitude",
      });
    }
    const userId = req.user.userId;
    const restaurants = await restaurantService.getRestaurants(
      city,
      latitude,
      longitude
    );

    await Transaction.create({ userId, city, latitude, longitude });
    return res.json(restaurants);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to fetch restaurants" });
  }
};

module.exports = { getRestaurants };
