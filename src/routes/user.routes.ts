import { Router } from "express";
const router = Router();
import {
  changeCurrentPassword,
  getCurrentUser,
  getUserChannelProfile,
  getWatchHistory,
  loginUser,
  logoutUser,
  refreshAcessToken,
  registerUser,
  updateAccountDetails,
  updateAvatar,
  updateCoverImage,
} from "../controllers/user.controller";
import { upload } from "../middlewares/multer.middleware";
import isAuthenticated from "../middlewares/auth.middleware";

router.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  registerUser
);

router.route("/login").post(loginUser);
router.route("/refresh-token").post(refreshAcessToken);

// protected route

router.route("/logout").get(isAuthenticated, logoutUser);
router.route("/change-password").get(isAuthenticated, changeCurrentPassword);
router.route("/current-user").get(isAuthenticated, getCurrentUser);

router.route("/c/:username").post(isAuthenticated, getUserChannelProfile);
router.route("/update-account").patch(isAuthenticated, updateAccountDetails);
router
  .route("/avatar")
  .patch(isAuthenticated, upload.single("avatar"), updateAvatar);
router
  .route("/cover-image")
  .patch(isAuthenticated, upload.single("coverImage"), updateCoverImage);

router.route("/history").get(isAuthenticated, getWatchHistory);

export default router;
