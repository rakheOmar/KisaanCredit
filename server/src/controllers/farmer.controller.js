import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { User } from "../models/user.model.js";

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

  return res.status(200).json(new ApiResponse(200, user, "Farmer land plot updated successfully"));
});

export { updateFarmerLandPlot };
