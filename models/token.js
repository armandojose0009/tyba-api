const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const tokenSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 60 * 60 * 1000),
    },
  },
  { timestamps: true }
);

const Token = mongoose.model("Token", tokenSchema);

module.exports = Token;
