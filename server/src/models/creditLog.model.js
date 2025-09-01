import mongoose, { Schema } from "mongoose";

const creditLogSchema = new Schema(
  {
    issuer: {
      type: String, // Wallet address of the issuer
      required: true,
      lowercase: true,
      index: true,
    },
    recipientUserId: {
      type: String, // The recipient's ID from your main user database
      required: true,
      index: true,
    },
    creditAmount: {
      type: Number, // Storing as a number. For high-precision financial data, consider mongoose-decimal-128
      required: true,
    },
    pricePerCredit: {
      type: Number,
    },
    creditType: {
      type: String,
      required: true,
    },
    reason: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    validityMonths: {
      type: Number, // In months
      required: true,
    },
    issuedAt: {
      type: Date, // The timestamp from the block
      required: true,
    },
    transactionHash: {
      type: String,
      required: true,
      unique: true, // This is the unique link to the on-chain transaction
      index: true,
    },
    blockNumber: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt timestamps
  }
);

export const CreditLog = mongoose.model("CreditLog", creditLogSchema);
