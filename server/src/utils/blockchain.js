import { ethers } from "ethers";
import { ApiError } from "./apiError.js";

// FIX: The constant should be assigned the array directly, without the "abi": key.
const CONTRACT_ABI = [
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "creditId",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "address",
        name: "issuer",
        type: "address",
      },
      {
        indexed: false,
        internalType: "string",
        name: "recipientUserId",
        type: "string",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "creditAmount",
        type: "uint256",
      },
    ],
    name: "CreditIssued",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    name: "allCredits",
    outputs: [
      { internalType: "uint256", name: "id", type: "uint256" },
      { internalType: "address", name: "issuer", type: "address" },
      { internalType: "string", name: "recipientUserId", type: "string" },
      { internalType: "uint256", name: "creditAmount", type: "uint256" },
      { internalType: "uint256", name: "pricePerCredit", type: "uint256" },
      { internalType: "string", name: "creditType", type: "string" },
      { internalType: "string", name: "reason", type: "string" },
      { internalType: "string", name: "description", type: "string" },
      { internalType: "uint256", name: "validityPeriod", type: "uint256" },
      { internalType: "uint256", name: "issuedAt", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "_id", type: "uint256" }],
    name: "getCreditById",
    outputs: [
      {
        components: [
          { internalType: "uint256", name: "id", type: "uint256" },
          { internalType: "address", name: "issuer", type: "address" },
          { internalType: "string", name: "recipientUserId", type: "string" },
          { internalType: "uint256", name: "creditAmount", type: "uint256" },
          { internalType: "uint256", name: "pricePerCredit", type: "uint256" },
          { internalType: "string", name: "creditType", type: "string" },
          { internalType: "string", name: "reason", type: "string" },
          { internalType: "string", name: "description", type: "string" },
          { internalType: "uint256", name: "validityPeriod", type: "uint256" },
          { internalType: "uint256", name: "issuedAt", type: "uint256" },
        ],
        internalType: "struct CreditLedger.Credit",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getCreditsCount",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "string", name: "_recipientUserId", type: "string" },
      { internalType: "uint256", name: "_creditAmount", type: "uint256" },
      { internalType: "uint256", name: "_pricePerCredit", type: "uint256" },
      { internalType: "string", name: "_creditType", type: "string" },
      { internalType: "string", name: "_reason", type: "string" },
      { internalType: "string", name: "_description", type: "string" },
      { internalType: "uint256", name: "_validityPeriod", type: "uint256" },
    ],
    name: "issueCredit",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];

const { CONTRACT_ADDRESS, BLOCKCHAIN_RPC_URL, WALLET_PRIVATE_KEY } = process.env;

export const logCreditIssuanceToBlockchain = async (creditData) => {
  if (!CONTRACT_ADDRESS || !BLOCKCHAIN_RPC_URL || !WALLET_PRIVATE_KEY) {
    console.warn("Blockchain environment variables are not configured. Skipping blockchain log.");
    throw new ApiError(500, "Blockchain service is not configured on the server.");
  }

  try {
    const provider = new ethers.JsonRpcProvider(BLOCKCHAIN_RPC_URL);
    const wallet = new ethers.Wallet(WALLET_PRIVATE_KEY, provider);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, wallet);

    const {
      userId,
      creditAmount,
      pricePerCredit,
      creditType,
      reason,
      description,
      validityMonths: validityPeriod,
    } = creditData;

    // Add validation for required fields
    if (!userId) {
      throw new ApiError(400, "userId is required for blockchain logging");
    }

    if (creditAmount === undefined || creditAmount === null) {
      throw new ApiError(400, "creditAmount is required for blockchain logging");
    }

    // Safe conversion with fallback values
    const amountAsUint = ethers.parseUnits(creditAmount.toString(), 6);
    const priceAsUint = ethers.parseUnits((pricePerCredit || 0).toString(), 6);

    console.log("Submitting issueCredit transaction to the blockchain...");
    const tx = await contract.issueCredit(
      userId,
      amountAsUint,
      priceAsUint,
      creditType || "",
      reason || "",
      description || "",
      validityPeriod || 12
    );

    const receipt = await tx.wait();

    console.log("Credit issuance logged to blockchain! Transaction hash:", receipt.hash);
    return receipt;
  } catch (error) {
    console.error("Error logging credit issuance to blockchain:", error.message);
    throw new ApiError(500, "Error logging credit issuance to blockchain", [], error.stack);
  }
};
