const express = require("express");
const router = express.Router();
const transactionController = require("../controllers/transactionController");
const authenticate = require("../middlewares/authMiddleware");

router.get("/", authenticate, transactionController.getTransactions);

module.exports = router;
