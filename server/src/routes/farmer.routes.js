import { Router } from "express";
import {
  updateFarmerLandPlot,
  createDailyLog,
  fetchDailyLogs,
} from "../controllers/farmer.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js"; // for handling images

const router = Router();

// -------------------- Land Routes --------------------
router.patch("/land", verifyJWT, updateFarmerLandPlot);

// -------------------- Daily Log Routes --------------------
// Use upload.array("images") to handle multiple images from frontend
router.post("/daily-log", verifyJWT, upload.array("images", 5), createDailyLog);
// "images" is the field name in the form-data, 5 is max files

router.get("/daily-log", verifyJWT, fetchDailyLogs);

export default router;
