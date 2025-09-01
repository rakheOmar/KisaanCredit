import { Router } from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateCurrentUser,
  updateUserAvatar,
  getUserProfile,
  addCarbonCredits,
  redeemCarbonCredits,
  getCreditsSummary,
  getTopCarbonCreditUsers,
} from "../controllers/user.controller.js";

import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/register", upload.single("avatar"), registerUser);
router.post("/login", loginUser);
router.post("/refresh-token", refreshAccessToken);
router.post("/logout", verifyJWT, logoutUser);
router.post("/change-password", verifyJWT, changeCurrentPassword);
router.get("/me", verifyJWT, getCurrentUser);
router.patch("/me", verifyJWT, updateCurrentUser);
router.patch("/me/avatar", verifyJWT, upload.single("avatar"), updateUserAvatar);
router.get("/profile/:id", verifyJWT, getUserProfile);
router.post("/credits/add", verifyJWT, addCarbonCredits);
router.post("/credits/redeem", verifyJWT, redeemCarbonCredits);
router.get("/credits/summary", verifyJWT, getCreditsSummary);
router.get("/credits/top", verifyJWT, getTopCarbonCreditUsers);

export default router;
