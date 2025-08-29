import express from "express";
import { createRegion } from "../controllers/region.controller.js";

const router = express.Router();

router.route("/").post(createRegion);

export default router;
