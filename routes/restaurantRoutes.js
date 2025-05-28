const express = require("express");
const router = express.Router();
const restaurantController = require("@controllers/restaurantController");
const authenticate = require("@middlewares/authMiddleware");

router.get("/", authenticate, restaurantController.getRestaurants);

module.exports = router;
