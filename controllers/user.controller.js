import User from "../models/user.model.js";
import { AppError } from "../utils/error.util.js";
import fs from "fs/promises";
import crypto from "crypto";
import { sendMail } from "../utils/sendEmail.js";
import { sendGmail } from "../utils/sendGmail.js";
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
 * @ROUTE @POST => {{URL}}/api/v1/user/register
 * @ACCESS Public
 */
export const register = async (req, res, next) => {
  try {
    // Destructuring the neccessary data
    const { fullName, email, password } = req.body;
    if (!fullName || !email || !password) {
      return next(new AppError(400, "All feild are required"));
    }

    // Check if user exists with the with provided email
    const userExist = await User.findOne({ email });
    if (userExist) {
      return next(new AppError(400, "Email is already registered"));
    }

    // Create new user, with provided email, and default data
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

    // If there any problem in creating user, return with an error
    if (!user) {
      return next(
        new AppError(400, "User registration failed, please try again !")
      );
    }

    // If everything is okay save user to DB
    await user.save();

    // Generating JWT Token
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
 * @ROUTE @POST {{URL}}/api/v1/user/login
 * @ACCESS Public
 */
export const login = async (req, res, next) => {
  try {
    // Destructuring the emai, password
    const { email, password } = req.body;
    if (!email || !password) {
      return next(new AppError(400, "Fill all the feilds"));
    }

    // Checking if user exist with this email or not
    const user = await User.findOne({ email }).select("+password");
    if (!user || !(await user.comparePassword(password))) {
      return next(new AppError(400, "Invalid credentials"));
    }

    // generating the token
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
 * @ROUTE @POST {{URL}}/api/v1/user/logout
 * @ACCESS Private (Logged in user only)
 */
export const logout = async (req, res, next) => {
  try {
    // Setting the cookie value to null
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
 * @ROUTE @GET {{URL}}/api/v1/user/me
 * @ACCESS Private(Logged in user only)
 *
 */
export const getUser = async (req, res, next) => {
  try {
    // Destructring the userId
    const userId = req.user.id;

    // Getting the user deatils from DB throug userId
    const user = await User.findById(userId);
    if (!user) {
      return next(new AppError(500, "Internal server error"));
    }

    // Sending response with user details
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
 * @ROUTE @POST {{URL}}/api/v1/user/changepassword
 * @ACCESS Private (Logged in user only)
 */
export const changePassword = async (req, res, next) => {
  try {
    // Destructring the details
    const { password, newPassword, confirmNewPassword } = req.body;
    if (!password || !newPassword || !confirmNewPassword) {
      return next(new AppError(500, "Fill all the feilds"));
    }

    const userId = req.user.id;
    const user = await User.findById(userId).select("+password");
    if (!user) {
      return next(new AppError(500, "Internal server error"));
    }

    // Validating if old password is correct or not
    if (!(await user.comparePassword(password))) {
      return next(
        new AppError(
          400,
          "Invalid password, you can reset it, if you forgotten your password"
        )
      );
    }

    // If everything good set the new password
    user.password = newPassword;

    // Saving to DB
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
 * @ROUTE @POST {{URL}}/api/v1/user/changeprofilepic
 * @ACCESS Private (Logged in user only)
 */
export const changeProfilePic = async (req, res, next) => {
  try {
    // Destructring details
    const imageFile = await req.file;
    if (!imageFile) {
      return next(new AppError(400, "Internal server error"));
    }

    const userId = req.user.id;
    if (!userId) {
      return next(new AppError(400, "Internal server error"));
    }

    // Checking if user exists or not
    const user = await User.findById(userId);
    if (!user) {
      return next(new AppError(400, "Internal server error"));
    }

    // Transformation option for cloudinary
    const option = {
      folder: "lms",
      width: 250,
      height: 250,
      gravity: "faces",
      crop: "fill",
    };

    // Deletes the old image uploaded by the user
    await destroyImageOnCloudinary(user.avatar.public_id);

    // Saving image on cloudinary
    const result = await uploadOnCloudinary(imageFile.path, option);
    if (!result) {
      return next(new AppError(500, "Server Error"));
    }
    // Set the public_id and secure_url in DB
    user.avatar.public_id = result.public_id;
    user.avatar.secure_url = result.secure_url;

    // Saving the user object
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
 * @ROUTE @POST {{URL}}/api/v1/user/forgotpassword
 * @ACCESS Public
 */
export const forgotPassword = async (req, res, next) => {
  try {
    // Destructring email from req.body
    const { email } = req.body;
    if (!email) {
      return next(new AppError(400, "Enter the email address"));
    }

    // Checking the user existance
    const user = await User.findOne({ email });
    if (!user) {
      return next(
        new AppError(400, "User is not exist with this email address")
      );
    }

    // Generating the forgotPasswordToken
    const forgotPasswordToken = await user.getForgotPasswordToken();
    if (!forgotPasswordToken) {
      return next(new AppError(400, "Internal Server Error"));
    }

    // Saving the user object
    await user.save();

    // Creating the reset password url
    const resetPasswordURL = `${process.env.FRONTEND_URL}/resetpassword/${forgotPasswordToken}`;

    const resetPasswordURLBE = `${process.env.BACKEND_URL}/api/v1/user/resetpassword/${forgotPasswordToken}`;

    // for mail body
    const subject = "Reset Password";
    const message = `Click on the link to reset password: ${resetPasswordURL} \nor\n${resetPasswordURLBE} \n\nIgnore if you are not requested`;

    // Sending the reset password mail
    // await sendEmail(email,subject,message);
    await sendGmail(email, subject, message);

    res.status(201).json({
      success: true,
      message: `Reset-Password Token generated and send to your email ${email} successfully`,
    });
  } catch (error) {
    // If there is error, undefining the token and expiry
    user.forgotPasswordToken = undefined;
    user.forgotPasswordExpiry = undefined;

    // Saving user object
    await user.save();
    return next(new AppError(400, error.message));
  }
};

/**
 * @RESETPASSWORD
 * @ROUTE @POST {{URL}}/api/v1/user/resetpassword
 * @ACCESS Private(Only user who have the reset password url)
 */
export const resetPassword = async (req, res, next) => {
  try {
    // Extracting token from the url
    const { resettoken } = req.params;

    // Destructring password from the req.body
    const { password } = req.body;
    if (!password) {
      return next(new AppError(400, "Enter your new password"));
    }

    // Hashing the token
    const forgotPasswordToken = await crypto
      .createHash("sha256")
      .update(resettoken)
      .digest("hex");

    // Check if user is valid or not
    const user = await User.findOne({
      forgotPasswordToken,
      forgotPasswordExpiry: { $gt: Date.now() },
    });

    // If user is invalid send error
    if (!user) {
      return next(new AppError(400, "Invalid token! or token is expired"));
    }

    user.password = password;

    // Making forgotPassword valus undefined in the DB after reseting the password
    user.forgotPasswordToken = undefined;
    user.forgotPasswordExpiry = undefined;

    // Saving the user object
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
 * @UPDATEPROFILE
 * @ROUTE @PUT {{URL}}/api/v1/user/updateprofile
 * @ACCESS Private (Logged in user only)
 */
export const updateProfile = async (req, res, next) => {
  const imageFile = req.file;
  try {
    // Destructring the neccessary details
    const { id } = req.user;
    const { fullName } = req.body;

    // Checking the user exitance and get details
    const user = await User.findById(id);
    if (!user) {
      return next(new AppError(500, "Internal server error"));
    }

    if (fullName) {
      user.fullName = fullName;
    }

    if (imageFile) {
      // Deletes the old image uploaded by the user
      await destroyImageOnCloudinary(user.avatar.public_id);

      // Transformation option for cloudinary
      const option = {
        folder: "lms",
        width: 250,
        height: 250,
        gravity: "faces",
        crop: "fill",
      };

      // Saving image on cloudinary
      const result = await uploadOnCloudinary(imageFile.path, option);
      if (!result) {
        return next(new AppError(500, "Internal server error"));
      }

      // Set the public_id and secure_url in DB
      user.avatar.public_id = result.public_id;
      user.avatar.secure_url = result.secure_url;

      // deleting the req.file from server after uploading it to cloudinary
      fs.rm(imageFile.path);
    }

    // Saving the user object
    await user.save();

    res.status(201).json({
      success: true,
      message: "Profile updated successfully",
      user,
    });
  } catch (error) {
    if (imageFile) {
      fs.rm(imageFile.path);
    }
    return next(new AppError(400, error.message));
  }
};

/**
 * @CHANGEEMAIL
 * @ROUTE @PUT {{URL}}/api/v1/user/changeemail
 * @ACCESS Private (Logged in user only)
 */
export const changeEmail = async (req, res, next) => {
  // Destructring data from req
  const { id } = req.user;
  const { newEmail } = req.body;

  if (!newEmail) {
    return next(new AppError(400, "Enter your email"));
  }

  // Check if the email already registered or not
  const emailExist = await User.findOne({ email: newEmail });
  if (emailExist) {
    return next(
      new AppError(400, "Email already registered, use another email")
    );
  }

  // Getting user detail through id
  const user = await User.findById(id);
  if (!user) {
    return next(new AppError(400, "Internal server Error"));
  }

  try {
    // Generating OTP for email verification
    const OTP = await user.generateOTP();

    if (!OTP) {
      return next(new AppError(400, "OTP is not defined"));
    }

    // for mail body
    const subject = "OTP for email verification";
    const message = `Here is the OTP for email verification:\n${OTP}\n\nIgnore if not requested`;

    // Sending the reset password mail
    // await sendEmail(email,subject,message);
    await sendGmail(newEmail, subject, message);

    // Saving new email to DB, as temporary
    user.tempEmail = newEmail;

    // Saving user object
    await user.save();

    res.status(201).json({
      success: true,
      message: `OTP sent to your email ${newEmail} for email verification, valid for 15 min`,
    });
  } catch (error) {
    user.tempEmail = undefined;
    user.otp = undefined;
    user.otpExpiry = undefined;

    // Saving user object
    await user.save();
    return next(new AppError(400, error.message));
  }
};

/**
 * @VERIFYEMAIL
 * @ROUTE @PUT {{URL}}/api/v1/user/verifyemail
 * @ACCESS Private (Logged in user only)
 */
export const verifyEmail = async (req, res, next) => {
  const { id } = req.user;
  const { otp } = req.body;
  if (!otp) {
    return next(new AppError(400, "Enter the OTP"));
  }

  // Getting user detail through id
  const user = await User.findById(id);
  if (!user) {
    return next(new AppError(400, "Internal server error"));
  }
  if (!(await user.isValidOTP(otp))) {
    return next(new AppError(400, "Invalid OTP or OTP expired"));
  }
  try {
    user.email = user.tempEmail;
    user.tempEmail = undefined;
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Email updated successfully",
      user,
    });
  } catch (error) {
    return next(new AppError(400, error.message));
  }
};
