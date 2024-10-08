import jwt from "jsonwebtoken";
import { AppError } from "../utils/error.util.js";

export const isLoggedIn = async (req, res, next) => {
  try {
    // Exracting token from cookies
    const { token } = req.cookies;
    if (!token) {
      return next(new AppError(400, "Unauthenticated, Please login first"));
    }

    // Verifying the token and get user-id and other details from it
    const userDetails = await jwt.verify(token, process.env.JWT_SECRET_KEY);
    if (!userDetails) {
      return next(new AppError(400, "Unauthenticated, Please login first"));
    }
    req.user = userDetails;
    next();
  } catch (error) {
    return next(new AppError(500, error.message));
  }
};

// Middleware for authorization check
export const authorizeRoles =
  (...roles) =>
  async (req, res, next) => {
    try {
      if (!roles.includes(req.user.role)) {
        return next(
          new AppError(400, "You are not authorized for this action")
        );
      }
      next();
    } catch (error) {
      return next(new AppError(400, "Erver Error !"));
    }
  };
