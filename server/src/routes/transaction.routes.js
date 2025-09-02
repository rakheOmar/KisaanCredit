import { Router } from "express";
import {
  getAllTransactions,
  getTransactionStats,
  getTransactionByHash,
} from "../controllers/transaction.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// router.use(verifyJWT); // Apply authentication to all routes

router.route("/").get(getAllTransactions);
router.route("/stats").get(getTransactionStats);
router.route("/verify/:hash").get(getTransactionByHash);

export default router;
