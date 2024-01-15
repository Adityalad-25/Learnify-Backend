import jwt from "jsonwebtoken";
import { catchAsyncError } from "../middlewares/catchAsyncError.js";
import ErrorHandler from "../utils/errorHandler.js";
import { User } from "../models/User.js";

// Check if user is authenticated or not

export const isAuthenticated = catchAsyncError(async (req, res, next) => {
  const { token } = req.cookies;
  if (!token) {
    // 401 is for unauthorized access
    return next(new ErrorHandler("Login first to access this resource", 401));
  }
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  req.user = await User.findById(decoded._id);
  next();
});

// Check is user is Admin or not
export const authorizeAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return next(
      new ErrorHandler(
        `${req.user.role} is not allowed to access this resource`,
        403
      )
    );
  }

  next();
  
};

// authorize subscribers
export const authorizeSubscribers = (req, res, next) => {

 
  if (req.user.subscription.status !== "active" && req.user.role !== "admin") {
    return next(
      new ErrorHandler(
        `Only active subscribers are allowed to access this resource`,
        403
      )
    );
  }

  next();
  
};
