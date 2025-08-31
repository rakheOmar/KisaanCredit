import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { DailyLog } from "../models/dailyLog.model.js";
import { SeasonalLog } from "../models/seasonalLog.model.js";

const updateFarmerLandPlot = asyncHandler(async (req, res) => {
  const { geoJson, areaInHectares } = req.body;

  if (!geoJson || !areaInHectares) {
    throw new ApiError(400, "GeoJSON data and area are required");
  }

  if (geoJson.type !== "Polygon" || !Array.isArray(geoJson.coordinates)) {
    throw new ApiError(400, "Invalid GeoJSON Polygon data");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        farmLand: {
          geoJson,
          areaInHectares,
        },
      },
    },
    { new: true }
  ).select("-password -refreshToken");

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return res.status(200).json(new ApiResponse(200, "Farmer land plot updated successfully", user));
});

const createDailyLog = asyncHandler(async (req, res) => {
  const { waterStatus, fertilizerType, fertilizerAmount, seasonalLogId } = req.body;

  if (!req.user?._id) {
    throw new ApiError(401, "Unauthorized");
  }

  let imageUrls = [];
  if (req.files && req.files.length > 0) {
    for (const file of req.files) {
      const uploaded = await uploadOnCloudinary(file.path);
      if (uploaded) imageUrls.push(uploaded.url);
    }
  }

  const dailyLog = new DailyLog({
    farmerId: req.user._id,
    seasonalLog: seasonalLogId || null,
    date: new Date(),
    waterStatus: waterStatus,
    fertilizerApplication: {
      fertilizerType: fertilizerType,
      amount: fertilizerAmount || 0,
    },
    image: imageUrls,
  });

  await dailyLog.save();

  return res.status(200).json(new ApiResponse(200, "Daily log created successfully", dailyLog));
});
const fetchDailyLogs = asyncHandler(async (req, res) => {
  // The middleware has already populated req.user, so this check is valid.
  if (!req.user?._id) {
    throw new ApiError(401, "Unauthorized");
  }

  // Find all logs for the user, sorted by most recent
  const logs = await DailyLog.find({ farmerId: req.user._id }).sort({ date: -1 }).lean();

  // Return the complete log objects directly
  return res.status(200).json(new ApiResponse(200, "Daily logs fetched successfully", logs));
});

const getSeasonalLogs = asyncHandler(async (req, res) => {
  const { farmerId } = req.params;

  const seasonalLogs = await SeasonalLog.find({ farmer: farmerId })
    .populate("farmer", "-password -refreshToken")
    .populate("carbonProject");

  if (!seasonalLogs || seasonalLogs.length === 0) {
    return res.status(404).json(new ApiResponse(404, "No seasonal logs found", null));
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "Seasonal logs fetched successfully", seasonalLogs));
});

const getDailyLogs = asyncHandler(async (req, res) => {
  const { farmerId } = req.params;

  const dailyLogs = await DailyLog.find({ farmerId: farmerId }).sort({ date: -1 }).lean();

  if (!dailyLogs || dailyLogs.length === 0) {
    return res.status(404).json(new ApiResponse(404, "No daily logs found", null));
  }

  return res.status(200).json(new ApiResponse(200, "Daily logs fetched successfully", dailyLogs));
});

const getAllFarmers = asyncHandler(async (req, res) => {
  const farmers = await User.find({ role: "Farmer" }).select("-password -refreshToken");

  if (!farmers || farmers.length === 0) {
    return res.status(404).json(new ApiResponse(404, null, "No farmers found"));
  }

  return res.status(200).json(new ApiResponse(200, "Farmers fetched successfully", farmers));
});

export {
  updateFarmerLandPlot,
  createDailyLog,
  fetchDailyLogs,
  getSeasonalLogs,
  getDailyLogs,
  getAllFarmers,
};
