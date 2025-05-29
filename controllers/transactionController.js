const Transaction = require("@models/transaction");

const getTransactions = async (req, res) => {
  try {
    const userId = req.user.userId;
    const transactions = await Transaction.find({ userId }).sort({
      timestamp: -1,
    });
    return res.json(transactions);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to fetch transactions" });
  }
};

module.exports = { getTransactions };
