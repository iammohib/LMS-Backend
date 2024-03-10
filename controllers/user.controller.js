import User from "../models/user.model.js";
import AppError from "../utils/error.util.js";
import fs from "fs/promises";
import crypto from "crypto";
import sendEmail from "../utils/sendEmail.js";
import sendGmail from "../utils/sendGmail.js";
import {
  uploadOnCloudinary,
  destroyImageOnCloudinary,
} from "../utils/cloudinary.util.js";

const cookieOption = {
  maxAge: 7 * 24 * 60 * 60 * 1000, //7 days
  httpOnly: true,
  secure: false,
};
/**
 * @REGISTER
 * @ROUTE @POST => {{URL}}/api/v1/user/registration
 * @ACCESS Public
 */
export const register = async (req, res, next) => {
  try {
    const { fullName, email, password } = req.body;
    if (!fullName || !email || !password) {
      return next(new AppError(400, "All feild are required"));
    }

    const userExist = await User.findOne({ email });

    if (userExist) {
      return next(new AppError(400, "Email is already registered"));
    }

    const user = await User.create({
      fullName,
      email,
      password,
      avatar: {
        public_id: email,
        secure_url:
          "https://res.cloudinary.com/du9jzqlpt/image/upload/v1674647316/avatar_drzgxv.jpg",
      },
    });

    if (!user) {
      return next(
        new AppError(400, "User registration failed, please try again !")
      );
    }

    await user.save();

    //loged in the user
    const token = await user.generateJWTToken();

    user.password = undefined;

    res.cookie("token", token, cookieOption);

    res.status(201).json({
      success: true,
      message: "Account created successfully",
      user,
    });
  } catch (error) {
    return next(new AppError(500, error.message));
  }
};

/**
 * @LOGIN
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return next(new AppError(400, "Fill all the feilds"));
    }

    const user = await User.findOne({ email }).select("+password");
    if (!user || !(await user.comparePassword(password))) {
      return next(new AppError(400, "Invalid credentials"));
    }

    const token = await user.generateJWTToken();
    user.password = undefined;
    res.cookie("token", token, cookieOption);

    res.status(200).json({
      success: true,
      message: "User logged in successfully",
      user,
    });
  } catch (error) {
    return next(new AppError(500, error.message));
  }
};

/**
 * @LOGOUT
 */
export const logout = async (req, res, next) => {
  try {
    res.cookie("token", null, {
      secure: true,
      maxAge: 0,
      httpOnly: true,
    });
    res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    return next(new AppError(500, error.message));
  }
};

/**
 * @GETUSER
 */
export const getUser = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    if (!user) {
      return next(new AppError(500, "Internal server error"));
    }
    res.status(200).json({
      success: true,
      message: "User details fetched successfully",
      user,
    });
  } catch (error) {
    return next(new AppError(500, error.message));
  }
};
/**
 * @CHANGEPASSWORD
 */
export const changePassword = async (req, res, next) => {
  try {
    const { password, newPassword, confirmNewPassword } = req.body;
    if (!password || !newPassword || !confirmNewPassword) {
      return next(new AppError(500, "Fill all the feilds"));
    }
    const userId = req.user.id;
    const user = await User.findById(userId).select("+password");
    if (!user) {
      return next(new AppError(500, "Internal server error"));
    }
    if (!(await user.comparePassword(password))) {
      return next(
        new AppError(
          400,
          "Invalid password, you can reset it, if you forgotten your password"
        )
      );
    }
    user.password = newPassword;
    user.save();
    res.status(200).json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error) {
    return next(new AppError(500, error.message));
  }
};

/**
 * @CHANGEPROFILEPIC
 */
export const changeProfilePic = async (req, res, next) => {
  try {
    const imageFile = await req.file;
    if (!imageFile) {
      return next(new AppError(400, "Internal server error"));
    }

    const userId = req.user.id;
    if (!userId) {
      return next(new AppError(400, "Internal server error"));
    }

    const user = await User.findById(userId);
    if (!user) {
      return next(new AppError(400, "Internal server error"));
    }

    const option = {
      folder: "lms",
      width: 250,
      height: 250,
      gravity: "faces",
      crop: "fill",
    };

    // Deletes the old image uploaded by the user
    await destroyImageOnCloudinary(user.avatar.public_id);

    const result = await uploadOnCloudinary(imageFile.path, option);
    if (!result) {
      return next(new AppError(500, "Server Error"));
    }
    user.avatar.public_id = result.public_id;
    user.avatar.secure_url = result.secure_url;

    await user.save();

    // deleting the req.file from server after uploading it to cloudinary
    fs.rm(imageFile.path);
    res.status(201).json({
      success: true,
      message: "Profile picture updated successfully",
      user,
    });
  } catch (error) {
    fs.rm(imageFile.path);
    return next(new AppError(400, error.message));
  }
};

/**
 * @FORGOTPASSWORD
 */

export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return next(new AppError(400, "Enter the email address"));
    }

    const user = await User.findOne({ email });
    if (!user) {
      return next(
        new AppError(400, "User is not exist with this email address")
      );
    }

    const forgotPasswordToken = await user.getForgotPasswordToken();
    if (!forgotPasswordToken) {
      return next(new AppError(400, "Internal Server Error"));
    }

    await user.save();

    const resetPasswordURL = `${process.env.FRONTEND_URL}/resetpassword/${forgotPasswordToken}`;
    
    const resetPasswordURLBE = `${process.env.BACKEND_URL}/api/v1/user/resetpassword/${forgotPasswordToken}`;

    const subject = "Reset Password";
    const message = `Click on the link to reset password: ${resetPasswordURL} \nor\n${resetPasswordURLBE} \n\nIgnore if you are not requested`;
    // await sendEmail(email,subject,message);
    await sendGmail(email, subject, message);

    res.status(201).json({
      success: true,
      message: `Reset-Password Token generated and send to your email ${email} successfully`,
      // forgotPasswordToken,
    });
  } catch (error) {
    user.forgotPasswordToken = undefined;
    user.forgotPasswordExpiry = undefined;
    await user.save();
    return next(new AppError(400, error.message));
  }
};

/**
 * @RESETPASSWORD
 */

export const resetPassword = async (req, res, next) => {
  try {
    const { resettoken } = req.params;
    const { password } = req.body;

    const forgotPasswordToken = await crypto
      .createHash("sha256")
      .update(resettoken)
      .digest("hex");

    const user = await User.findOne({
      forgotPasswordToken,
      forgotPasswordExpiry: { $gt: Date.now() },
    });

    if (!user) {
      return next(new AppError(400, "Invalid token! or token is expired"));
    }

    // making forgotPassword* valus undefined in the DB
    user.password = password;

    user.forgotPasswordToken = undefined;
    user.forgotPasswordExpiry = undefined;

    await user.save();

    res.status(201).json({
      success: true,
      message: "Password reset successfully!",
      user,
    });
  } catch (error) {
    return next(new AppError(400, error.message));
  }
};

/**
 * @UPDATE_PROFILE
 */
export const updateProfile = async (req, res, next) => {
  try {
    const { id } = req.user;
    const { fullName, email } = req.body;
    const imageFile = req.file;

    const user = await User.findById(id);
    if (!user) {
      return next(new AppError(500, "Internal server error"));
    }

    if (fullName) {
      user.fullName = fullName;
    }
    if (email) {
      user.email = email;
    }
    if (imageFile) {
      // Deletes the old image uploaded by the user
      await destroyImageOnCloudinary(user.avatar.public_id);
      const option = {
        folder: "lms",
        width: 250,
        height: 250,
        gravity: "faces",
        crop: "fill",
      };
      const result = await uploadOnCloudinary(imageFile.path, option);
      if (!result) {
        return next(new AppError(500, "Internal server error"));
      }
      user.avatar.public_id = result.public_id;
      user.avatar.secure_url = result.secure_url;

      // deleting the req.file from server after uploading it to cloudinary
      fs.rm(imageFile.path);
    }

    await user.save();

    res.status(201).json({
      success: true,
      message: "Profile updated successfully",
      user,
    });
  } catch (error) {
    fs.rm(imageFile.path);
    return next(new AppError(400, error.message));
  }
};
