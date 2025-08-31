import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { DailyLog } from "../models/dailyLog.model.js";

// Update farmer land plot
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

// Create a daily log
const createDailyLog = asyncHandler(async (req, res) => {
  const { waterStatus, fertilizerType, fertilizerAmount } = req.body;

  if (!req.user?._id) {
    throw new ApiError(401, "Unauthorized");
  }

  // Handle multiple image uploads
  let imageUrls = [];
  if (req.files && req.files.length > 0) {
    for (const file of req.files) {
      const uploaded = await uploadOnCloudinary(file.path);
      if (uploaded) imageUrls.push(uploaded.url);
    }
  }

  const dailyLog = new DailyLog({
    seasonalLog: null, // or link to seasonal log if needed
    date: new Date(),
    waterStatus: waterStatus || "Moist",
    fertilizerApplication: {
      type: fertilizerType || "Urea",
      amount: fertilizerAmount || 0,
    },
    image: imageUrls, // save all uploaded image URLs
  });

  await dailyLog.save();

  return res.status(200).json(new ApiResponse(200, "Daily log created successfully", dailyLog));
});

// Fetch daily logs for activities
const fetchDailyLogs = asyncHandler(async (req, res) => {
  if (!req.user?._id) {
    throw new ApiError(401, "Unauthorized");
  }

  const logs = await DailyLog.find({}).sort({ date: -1 }).lean();

  // Map to activity-friendly format
  const activities = logs.map((log) => ({
    title: `Water Status: ${log.waterStatus}`,
    date: log.date.toISOString().split("T")[0],
    status: "Pending", // or customize based on verification
  }));

  return res.status(200).json(new ApiResponse(200, "Daily logs fetched successfully", activities));
});

export { updateFarmerLandPlot, createDailyLog, fetchDailyLogs };
