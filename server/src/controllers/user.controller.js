import { User } from "../models/user.model.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ethers } from "ethers";
import { logCreditIssuanceToBlockchain } from "../utils/blockchain.js";
import { CreditLog } from "../models/creditLog.model.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, "Something went wrong while generating tokens");
  }
};

const registerUser = asyncHandler(async (req, res) => {
  const { username, email, fullName, password, role } = req.body;

  if (!username || !email || !fullName || !password) {
    throw new ApiError(400, "All fields are required");
  }

  const existedUser = await User.findOne({ $or: [{ username }, { email }] });
  if (existedUser) {
    throw new ApiError(409, "User with username or email already exists");
  }

  const user = await User.create({
    username,
    email,
    fullName,
    password,
    role,
  });

  const createdUser = await User.findById(user._id).select("-password -refreshToken");

  return res.status(201).json(new ApiResponse(201, "User registered successfully", createdUser));
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, username, password } = req.body;

  if (!(username || email)) {
    throw new ApiError(400, "Username or email is required");
  }

  const user = await User.findOne({ $or: [{ username }, { email }] });
  if (!user) {
    throw new ApiError(404, "User does not exist");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid credentials");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

  const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(200, "User logged in successfully", {
        user: loggedInUser,
        accessToken,
        refreshToken,
      })
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, { $set: { refreshToken: undefined } }, { new: true });

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, "User logged out successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

  if (!incRefreshToken) {
    throw new ApiError("Please provide refresh token", 401);
  }

  const decodedToken = jwt.verify(incRefreshToken, process.env.REFRESH_TOKEN_SECRET);

  const user = await User.findById(decodedToken?._id);

  if (!user) {
    throw new ApiError("User not found", 404);
  }

  if (user.refreshToken !== incRefreshToken) {
    throw new ApiError("Invalid refresh token", 401);
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(200, "Access token refreshed successfully", {
        accessToken,
        refreshToken,
      })
    );
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  const user = await User.findById(req.user?._id);
  if (!user) throw new ApiError(404, "User not found");

  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);
  if (!isPasswordCorrect) throw new ApiError(400, "Invalid old password");

  user.password = newPassword;
  await user.save();

  return res.status(200).json(new ApiResponse(200, "Password changed successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user?._id).select("-password -refreshToken");
  if (!user) throw new ApiError(404, "User not found");

  return res.status(200).json(new ApiResponse(200, "Current user fetched successfully", user));
});

const updateCurrentUser = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body;

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    { fullName, email },
    { new: true }
  ).select("-password -refreshToken");

  return res.status(200).json(new ApiResponse(200, "User updated successfully", user));
});

const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarUrl = req.file?.path;
  if (!avatarUrl) throw new ApiError(400, "Avatar is required");

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    { avatar: avatarUrl },
    { new: true }
  ).select("-password -refreshToken");

  return res.status(200).json(new ApiResponse(200, "Avatar updated successfully", user));
});

const getUserProfile = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await User.findById(id).select("-password -refreshToken");
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return res.status(200).json(new ApiResponse(200, "User profile fetched successfully", user));
});

const addCarbonCredits = asyncHandler(async (req, res) => {
  const { userId, creditAmount, pricePerCredit, creditType, reason, description, validityMonths } =
    req.body;

  if ([userId, creditType, reason].some((field) => !field || field.trim() === "")) {
    throw new ApiError(400, "User ID, credit type, and reason are required");
  }

  if (!creditAmount || isNaN(creditAmount) || creditAmount <= 0) {
    throw new ApiError(400, "A valid credit amount is required");
  }

  const recipientUser = await User.findById(userId);
  if (!recipientUser) throw new ApiError(404, "Recipient user not found");

  const transactionReceipt = await logCreditIssuanceToBlockchain(req.body);

  const numericCreditAmount = parseFloat(creditAmount);
  const numericPricePerCredit = parseFloat(pricePerCredit) || 0;
  const additionalEarnings = numericCreditAmount * numericPricePerCredit;

  recipientUser.carbonCredits = (recipientUser.carbonCredits || 0) + numericCreditAmount;
  recipientUser.moneyEarned = (recipientUser.moneyEarned || 0) + additionalEarnings;

  await recipientUser.save({ validateBeforeSave: false });

  const provider = new ethers.JsonRpcProvider(process.env.BLOCKCHAIN_RPC_URL);
  const block = await provider.getBlock(transactionReceipt.blockNumber);

  const newLog = new CreditLog({
    issuer: transactionReceipt.from,
    recipientUserId: userId,
    creditAmount: numericCreditAmount,
    pricePerCredit: numericPricePerCredit,
    creditType,
    reason,
    description,
    validityMonths: parseInt(validityMonths, 10) || 12,
    issuedAt: new Date(block.timestamp * 1000),
    transactionHash: transactionReceipt.hash,
    blockNumber: transactionReceipt.blockNumber,
  });

  await newLog.save();

  return res.status(200).json(
    new ApiResponse(200, "Carbon credits issued and logged successfully", {
      transactionHash: transactionReceipt.hash,
      updatedUser: {
        _id: recipientUser._id,
        carbonCredits: recipientUser.carbonCredits,
        moneyEarned: recipientUser.moneyEarned,
      },
      logId: newLog._id,
    })
  );
});

const redeemCarbonCredits = asyncHandler(async (req, res) => {
  const { creditsToRedeem, pricePerCredit } = req.body;

  if (!creditsToRedeem || !pricePerCredit) {
    throw new ApiError(400, "creditsToRedeem and pricePerCredit are required");
  }

  const user = await User.findById(req.user?._id);
  if (!user) throw new ApiError(404, "User not found");

  if (user.carbonCredits < creditsToRedeem) {
    throw new ApiError(400, "Insufficient carbon credits");
  }

  const redeemedValue = creditsToRedeem * pricePerCredit;
  user.carbonCredits -= creditsToRedeem;
  user.moneyEarned += redeemedValue;
  await user.save();

  return res.status(200).json(
    new ApiResponse(200, "Carbon credits redeemed successfully", {
      carbonCredits: user.carbonCredits,
      moneyEarned: user.moneyEarned,
    })
  );
});

const getCreditsSummary = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user?._id).select("carbonCredits moneyEarned");
  if (!user) throw new ApiError(404, "User not found");

  return res.status(200).json(
    new ApiResponse(200, "Carbon credit summary fetched successfully", {
      carbonCredits: user.carbonCredits,
      moneyEarned: user.moneyEarned,
    })
  );
});

const getTopCarbonCreditUsers = asyncHandler(async (req, res) => {
  const topUsers = await User.find()
    .sort({ carbonCredits: -1 }) // descending order
    .limit(10)
    .select("username fullName avatar role carbonCredits moneyEarned");

  return res
    .status(200)
    .json(new ApiResponse(200, "Top 10 users by carbon credits fetched successfully", topUsers));
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateCurrentUser,
  updateUserAvatar,
  getUserProfile,
  addCarbonCredits,
  redeemCarbonCredits,
  getCreditsSummary,
  getTopCarbonCreditUsers,
};
