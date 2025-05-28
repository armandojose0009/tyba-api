const express = require("express");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
require("module-alias/register");
const authRoutes = require("@routes/authRoutes");
const restaurantRoutes = require("@routes/restaurantRoutes");
const transactionRoutes = require("@routes/transactionRoutes");

dotenv.config();

const app = express();
app.use(express.json());

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

app.use("/auth", authRoutes);
app.use("/restaurants", restaurantRoutes);
app.use("/transactions", transactionRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
