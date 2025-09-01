import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

// ------------------- Auth Helpers -------------------
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

// ------------------- Register -------------------
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

// ------------------- Login -------------------
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

  return res.status(200).json(
    new ApiResponse(200, "User logged in successfully", {
      user: loggedInUser,
      accessToken,
      refreshToken,
    })
  );
});

// ------------------- Logout -------------------
const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: { refreshToken: 1 },
    },
    { new: true }
  );

  return res.status(200).json(new ApiResponse(200, "User logged out successfully"));
});

// ------------------- Refresh Token -------------------
const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.body.refreshToken;
  if (!incomingRefreshToken) throw new ApiError(401, "Refresh token is required");

  try {
    const decoded = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);

    const user = await User.findById(decoded?._id);
    if (!user) throw new ApiError(401, "Invalid refresh token");

    if (incomingRefreshToken !== user.refreshToken) {
      throw new ApiError(401, "Refresh token expired or already used");
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

    return res
      .status(200)
      .json(
        new ApiResponse(200, "Access token refreshed successfully", { accessToken, refreshToken })
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token");
  }
});

// ------------------- Change Password -------------------
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

// ------------------- Get Current User -------------------
const getCurrentUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user?._id).select("-password -refreshToken");
  if (!user) throw new ApiError(404, "User not found");

  return res.status(200).json(new ApiResponse(200, "Current user fetched successfully", user));
});

// ------------------- Update Profile -------------------
const updateCurrentUser = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body;

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    { fullName, email },
    { new: true }
  ).select("-password -refreshToken");

  return res.status(200).json(new ApiResponse(200, "User updated successfully", user));
});

// ------------------- Update Avatar -------------------
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

// ------------------- Get User Profile -------------------
const getUserProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;

  const user = await User.findOne({ username }).select("-password -refreshToken");
  if (!user) throw new ApiError(404, "User not found");

  return res.status(200).json(new ApiResponse(200, "User profile fetched successfully", user));
});

// =========================================================
// 🟢 CARBON CREDIT METHODS
// =========================================================

// Add credits and update money earned
const addCarbonCredits = asyncHandler(async (req, res) => {
  const { credits, pricePerCredit } = req.body;

  if (!credits || !pricePerCredit) {
    throw new ApiError(400, "Credits and pricePerCredit are required");
  }

  const user = await User.findById(req.user?._id);
  if (!user) throw new ApiError(404, "User not found");

  const additionalEarnings = credits * pricePerCredit;
  user.carbonCredits += credits;
  user.moneyEarned += additionalEarnings;
  await user.save();

  return res.status(200).json(
    new ApiResponse(200, "Carbon credits added successfully", {
      carbonCredits: user.carbonCredits,
      moneyEarned: user.moneyEarned,
    })
  );
});

// Redeem / Sell credits
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

// Get credits & earnings summary
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

// =========================================================
// EXPORTS
// =========================================================
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
