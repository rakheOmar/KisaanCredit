import express from "express";
import { createRegion, getNdviDataForPolygon } from "../controllers/region.controller.js";

const router = express.Router();

router.route("/").post(createRegion);
router.route("/ndvi").post(getNdviDataForPolygon);

export default router;
