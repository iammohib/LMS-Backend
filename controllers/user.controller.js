import userModel from "../models/user.model.js";

/**
 * @REGISTER
 */
const register = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: "TODO",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @LOGIN
 */
const login = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: "TODO",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @LOGOUT
 */
const logout = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: "TODO",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @GETUSER
 */
const getUser = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: "TODO",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export {
  register,
  login,
  logout,
  getUser,
};
