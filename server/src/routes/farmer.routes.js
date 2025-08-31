import express from "express";
import {
  updateFarmerLandPlot,
  createDailyLog,
  fetchDailyLogs,
  getSeasonalLogs,
  getDailyLogs,
  getAllFarmers,
} from "../controllers/farmer.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import multer from "multer";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.put("/land-plot", verifyJWT, updateFarmerLandPlot);
router.get("/", verifyJWT, getAllFarmers);
router.post("/daily-log", verifyJWT, upload.array("images", 5), createDailyLog);
router.get("/daily-logs", verifyJWT, fetchDailyLogs);
router.get("/seasonal-logs/:farmerId", verifyJWT, getSeasonalLogs);
router.get("/daily-logs/:seasonalLogId", verifyJWT, getDailyLogs);
router.get("/farmer-daily-logs/:farmerId", verifyJWT, getDailyLogs);

export default router;
