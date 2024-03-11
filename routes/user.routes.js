import { Router } from "express";
import {
  register,
  login,
  logout,
  getUser,
  changePassword,
  changeProfilePic,
  forgotPassword,
  resetPassword,
  updateProfile,
  changeEmail,
  verifyEmail,
} from "../controllers/user.controller.js";
import isLoggedIn from "../middlewares/auth.middleware.js";
import upload from "../middlewares/multer.middleware.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.get("/me", isLoggedIn, getUser);
router.post("/changepassword", isLoggedIn, changePassword);
router.post(
  "/changeprofilepic",
  isLoggedIn,
  upload.single("avatar"),
  changeProfilePic
);
router.post("/forgotpassword", forgotPassword);
router.post("/resetpassword/:resettoken", resetPassword);
router.put(
  "/updateprofile",
  isLoggedIn,
  upload.single("avatar"),
  updateProfile
);
router.put("/changeemail", isLoggedIn, changeEmail);
router.put("/verifyemail", isLoggedIn, verifyEmail);

export default router;
