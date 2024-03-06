import jwt from "jsonwebtoken";
import AppError from "../utils/error.util.js";

const isLoggedin = async (req, res, next) => {
  try {
    const { token } = req.cookies;
    console.log(token)
    if (!token) {
      return next(new AppError(400, "Unauthenticated, login first"));
    }
    const userDetails = await jwt.verify(token, process.env.JWT_SECRET_KEY);
    req.user = userDetails;
    next();
  } catch (error) {
    return next(new AppError(500, error.message));
  }
};
export default isLoggedin;
