import mongoose from "mongoose";
import { SeasonalLog } from "../models/seasonalLog.model.js";
import { DailyLog } from "../models/dailyLog.model.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const startNewSeason = asyncHandler(async (req, res) => {
  const { carbonProjectId, cropType, cropVariety, plantingDate } = req.body;

  if (!carbonProjectId || !cropType || !plantingDate) {
    throw new ApiError(400, "Project, crop type, and planting date are required.");
  }

  if (req.user.role !== "Farmer") {
    throw new ApiError(403, "Only farmers can start a new season log.");
  }

  const seasonalLog = await SeasonalLog.create({
    farmer: req.user._id,
    carbonProject: carbonProjectId,
    cropType,
    cropVariety,
    plantingDate,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, seasonalLog, "New season started successfully."));
});

const addDailyLog = asyncHandler(async (req, res) => {
  const { seasonId } = req.params;
  const { date, waterStatus, activityNotes, fertilizerApplication, treesPlanted } = req.body;

  if (!date) {
    throw new ApiError(400, "Date is required for a daily log.");
  }

  if (!mongoose.isValidObjectId(seasonId)) {
    throw new ApiError(400, "Invalid Season ID.");
  }

  const seasonalLog = await SeasonalLog.findById(seasonId);

  if (!seasonalLog) {
    throw new ApiError(404, "Seasonal log not found.");
  }

  if (seasonalLog.farmer.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not authorized to add logs to this season.");
  }

  const dailyLog = await DailyLog.create({
    seasonalLog: seasonId,
    date,
    waterStatus,
    activityNotes,
    fertilizerApplication,
    treesPlanted,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, dailyLog, "Daily activity logged successfully."));
});

const getSeasonLogs = asyncHandler(async (req, res) => {
  const { seasonId } = req.params;

  if (!mongoose.isValidObjectId(seasonId)) {
    throw new ApiError(400, "Invalid Season ID.");
  }

  const seasonalLog = await SeasonalLog.findById(seasonId);

  if (!seasonalLog) {
    throw new ApiError(404, "Seasonal log not found.");
  }

  const dailyLogs = await DailyLog.find({ seasonalLog: seasonId }).sort({ date: "asc" });

  const fullLog = {
    season: seasonalLog,
    dailyEntries: dailyLogs,
  };

  return res
    .status(200)
    .json(new ApiResponse(200, fullLog, "Full seasonal data fetched successfully."));
});

export { startNewSeason, addDailyLog, getSeasonLogs };
