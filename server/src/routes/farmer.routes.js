import { Router } from "express";
import { updateFarmerLandPlot } from "../controllers/farmer.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.patch("/land", verifyJWT, updateFarmerLandPlot);

export default router;
