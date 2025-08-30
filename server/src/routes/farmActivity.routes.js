import { Router } from "express";
import {
  startNewSeason,
  addDailyLog,
  getSeasonLogs,
} from "../controllers/farmActivity.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT);

router.post("/season", startNewSeason);
router.post("/season/:seasonId/log", addDailyLog);
router.get("/season/:seasonId", getSeasonLogs);

export default router;
