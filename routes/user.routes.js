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
} from "../controllers/user.controller.js";
import isLoggedIn from "../middlewares/auth.middleware.js";
import upload from "../middlewares/multer.middleware.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.get("/logout", logout);
router.get("/me", isLoggedIn, getUser);
router.post("/changepassword", isLoggedIn, changePassword);
router.post(
  "/changeprofilepic",
  isLoggedIn,
  upload.single("avatar"),
  changeProfilePic
);
router.post('/forgotpassword',forgotPassword)
router.post('/resetpassword/:resettoken',resetPassword)

export default router;
