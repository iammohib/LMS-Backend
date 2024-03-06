import User from "../models/user.model.js";
import AppError from "../utils/error.util.js";

const cookieOption = {
  maxAge: 7 * 24 * 60 * 60 * 1000, //7 days
  httpOnly: true,
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

    //TODO: file upload
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
    const user = await User.findById(userId)
    res.status(200).json({
      success: true,
      message: "User details fetched successfully",
      user
    });
  } catch (error) {
    return next(new AppError(500, error.message));
  }
};
