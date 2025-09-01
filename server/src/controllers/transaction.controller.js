import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { CreditLog } from "../models/creditLog.model.js";
import { User } from "../models/user.model.js";

export const getAllTransactions = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, sortBy = "createdAt", sortOrder = "desc" } = req.query;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  try {
    // Fetch transactions with user details
    const transactions = await CreditLog.aggregate([
      {
        $lookup: {
          from: "users",
          localField: "recipientUserId",
          foreignField: "_id",
          as: "recipient",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "issuer",
          foreignField: "_id",
          as: "issuerDetails",
        },
      },
      {
        $addFields: {
          recipient: { $arrayElemAt: ["$recipient", 0] },
          issuerDetails: { $arrayElemAt: ["$issuerDetails", 0] },
        },
      },
      {
        $project: {
          _id: 1,
          issuer: 1,
          recipientUserId: 1,
          creditAmount: 1,
          pricePerCredit: 1,
          creditType: 1,
          reason: 1,
          description: 1,
          validityMonths: 1,
          issuedAt: 1,
          transactionHash: 1,
          blockNumber: 1,
          createdAt: 1,
          updatedAt: 1,
          "recipient.name": 1,
          "recipient.email": 1,
          "issuerDetails.name": 1,
          totalValue: { $multiply: ["$creditAmount", "$pricePerCredit"] },
        },
      },
      { $sort: { [sortBy]: sortOrder === "desc" ? -1 : 1 } },
      { $skip: skip },
      { $limit: parseInt(limit) },
    ]);

    // Get total count for pagination
    const totalTransactions = await CreditLog.countDocuments();
    const totalPages = Math.ceil(totalTransactions / parseInt(limit));

    return res.status(200).json(
      new ApiResponse(200, "Transactions fetched successfully", {
        transactions,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalTransactions,
          hasNext: parseInt(page) < totalPages,
          hasPrev: parseInt(page) > 1,
        },
      })
    );
  } catch (error) {
    throw new ApiError(500, "Error fetching transactions", [], error.stack);
  }
});

export const getTransactionStats = asyncHandler(async (req, res) => {
  try {
    const stats = await CreditLog.aggregate([
      {
        $group: {
          _id: null,
          totalTransactions: { $sum: 1 },
          totalCreditsIssued: { $sum: "$creditAmount" },
          totalValue: { $sum: { $multiply: ["$creditAmount", "$pricePerCredit"] } },
          avgCreditAmount: { $avg: "$creditAmount" },
          avgPricePerCredit: { $avg: "$pricePerCredit" },
        },
      },
    ]);

    const creditTypeStats = await CreditLog.aggregate([
      {
        $group: {
          _id: "$creditType",
          count: { $sum: 1 },
          totalCredits: { $sum: "$creditAmount" },
          totalValue: { $sum: { $multiply: ["$creditAmount", "$pricePerCredit"] } },
        },
      },
      { $sort: { count: -1 } },
    ]);

    return res.status(200).json(
      new ApiResponse(200, "Transaction statistics fetched successfully", {
        overview: stats[0] || {
          totalTransactions: 0,
          totalCreditsIssued: 0,
          totalValue: 0,
          avgCreditAmount: 0,
          avgPricePerCredit: 0,
        },
        creditTypeBreakdown: creditTypeStats,
      })
    );
  } catch (error) {
    throw new ApiError(500, "Error fetching transaction statistics", [], error.stack);
  }
});

export const getTransactionByHash = asyncHandler(async (req, res) => {
  const { hash } = req.params;

  if (!hash) {
    throw new ApiError(400, "Transaction hash is required");
  }

  try {
    const transaction = await CreditLog.aggregate([
      { $match: { transactionHash: hash } },
      {
        $lookup: {
          from: "users",
          localField: "recipientUserId",
          foreignField: "_id",
          as: "recipient",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "issuer",
          foreignField: "_id",
          as: "issuerDetails",
        },
      },
      {
        $addFields: {
          recipient: { $arrayElemAt: ["$recipient", 0] },
          issuerDetails: { $arrayElemAt: ["$issuerDetails", 0] },
        },
      },
      {
        $project: {
          _id: 1,
          issuer: 1,
          recipientUserId: 1,
          creditAmount: 1,
          pricePerCredit: 1,
          creditType: 1,
          reason: 1,
          description: 1,
          validityMonths: 1,
          issuedAt: 1,
          transactionHash: 1,
          blockNumber: 1,
          status: { $ifNull: ["$status", "confirmed"] },
          blockchainVerified: { $ifNull: ["$blockchainVerified", false] },
          gasUsed: 1,
          gasPrice: 1,
          createdAt: 1,
          updatedAt: 1,
          "recipient.name": 1,
          "recipient.email": 1,
          "recipient.walletAddress": 1,
          "issuerDetails.name": 1,
          "issuerDetails.email": 1,
          totalValue: { $multiply: ["$creditAmount", "$pricePerCredit"] },
        },
      },
    ]);

    if (!transaction || transaction.length === 0) {
      throw new ApiError(404, "Transaction not found");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, "Transaction fetched successfully", transaction[0]));
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, "Error fetching transaction", [], error.stack);
  }
});
