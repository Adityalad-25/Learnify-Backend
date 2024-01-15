import { catchAsyncError } from "../middlewares/catchAsyncError.js";
import { User } from "../models/User.js";
import { Course } from "../models/Course.js";
import ErrorHandler from "../utils/errorHandler.js";
import { sendEmail } from "../utils/sendEmail.js";
import { sendToken } from "../utils/sendToken.js";
import crypto from "crypto";
import cloudinary from "cloudinary";
import getDataUri from "../utils/dataUri.js";
import { Stats } from "../models/Stats.js";
import { create } from "domain";

// -------------------/register a user--------------------------------------- //

export const register = catchAsyncError(async (req, res, next) => {
  const { name, email, password } = req.body;
  const file = req.file;

  // console.log(name,email,password);

  if (!name || !email || !password || !file) {
    return next(new ErrorHandler("Please fill all the fields", 400));
  }

  let user = await User.findOne({ email });

  if (user) return next(new ErrorHandler("User already exists", 409));

  // upload file to cloudinary

  const fileUri = getDataUri(file);
  const mycloud = await cloudinary.v2.uploader.upload(fileUri.content);

  user = await User.create({
    name,
    email,
    password,
    avatar: {
      public_id: mycloud.public_id,
      url: mycloud.secure_url,
    },
  });

  sendToken(res, user, "User registered successfully", 201);
});

// -------------------/login a user--------------------------------------- //

export const login = catchAsyncError(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new ErrorHandler("Please fill all the fields", 400));
  }

  const user = await User.findOne({ email }).select("+password");

  if (!user) return next(new ErrorHandler("Incorrect Email or Password", 401));

  const isMatch = await user.comparePassword(password);

  if (!isMatch)
    return next(new ErrorHandler("Incorrect Email or Password", 401));

  sendToken(res, user, `Welcome Back, ${user.name}`, 200);
});

// -------------------// logout a user //--------------------------------------- //

export const logout = catchAsyncError(async (req, res, next) => {
  res.cookie("token", null, {
    expires: new Date(Date.now()),
    httpOnly: true,
  });

  res.status(200).json({
    success: true,
    message: "Logged Out Successfully",
  });

  //   res
  //     .status(200)
  //     .cookie("token", null, {
  //       expires: new Date(Date.now()),
  //     })
  //     .json({
  //       success: true,
  //       message: "Logged Out Successfully",
  //     });
});

// -------------------// get my profile //--------------------------------------- //

export const getMyProfile = catchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.user._id);

  res.status(200).json({
    success: true,
    user,
  });
});

// -------------------// delete my profile //--------------------------------------- //

export const deleteMyProfile = catchAsyncError(async (req, res, next) => {
  // get user
  const user = await User.findById(req.user._id);

  // delete the avartar using the public_id from cloudinary
  await cloudinary.v2.uploader.destroy(user.avatar.public_id);

  // cancel Subscription

  //  delete user now;
  await user.deleteOne();

  res
    .status(200)
    .cookie("token", null, {
      expires: new Date(Date.now()),
    })
    .json({
      success: true,
      message: "User Deleted Successfully",
    });
});

// -------------------// changePassword or update password //--------------------------------------- //

export const changePassword = catchAsyncError(async (req, res, next) => {
  const { oldPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id).select("+password");

  if (!oldPassword || !newPassword) {
    return next(new ErrorHandler("Please fill all the fields", 400));
  }
  const isMatch = await user.comparePassword(oldPassword);

  if (!isMatch) {
    return next(new ErrorHandler("Incorrect Old Password", 400));
  }

  user.password = newPassword;

  await user.save();

  res.status(200).json({
    success: true,
    message: "Password Changed Successfully",
  });
});

// -------------------// update profile //-------------------------------------- //

export const updateProfile = catchAsyncError(async (req, res, next) => {
  const { name, email } = req.body;

  const user = await User.findById(req.user._id);

  if (name) user.name = name;
  if (email) user.email = email;

  await user.save();

  res.status(200).json({
    success: true,
    message: "Profile Updated Successfully",
  });
});

// -------------------// update profile picture //--------------------------------------- //

export const updateProfilePicture = catchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.user._id);

  // cloudinary todo : upload to cloudinary

  const file = req.file;

  const fileUri = getDataUri(file);
  const mycloud = await cloudinary.v2.uploader.upload(fileUri.content);

  await cloudinary.v2.uploader.destroy(user.avatar.public_id);

  user.avatar = {
    public_id: mycloud.public_id,
    url: mycloud.secure_url,
  };

  await user.save();

  res.status(200).json({
    success: true,
    message: "Profile Picture Updated Successfully",
  });
});

// -------------------// forgot password //--------------------------------------- //

export const forgetPassword = catchAsyncError(async (req, res, next) => {
  const { email } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    return next(new ErrorHandler("User not found with this email", 400));
  }

  const resetToken = await user.getResetToken();

  await user.save();

  // FRONTEND_URL => http://localhost:3000/resetpassword/fhdjfdkfdj

  const url = `${process.env.FRONTEND_URL}/resetpassword/${resetToken}`;

  const message = `Click on the link below to reset your password ${url}. If you have not requested this email, then ignore it.`;

  // send token via email
  await sendEmail(user.email, "Learnify Reset Password ", message);

  res.status(200).json({
    success: true,
    message: `Reset Password Token sent to ${user.email}`,
  });
});

// // -------------------// reset password //--------------------------------------- //

export const resetPassword = catchAsyncError(async (req, res, next) => {
  const { token } = req.params;

  const ResetPasswordToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

  const user = await User.findOne({
    ResetPasswordToken,
    ResetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    return next(
      new ErrorHandler("Invalid Reset Password Token or token is expired ", 400)
    );
  }
  //else
  user.password = req.body.password;
  user.ResetPasswordExpire = undefined;
  user.ResetPasswordToken = undefined;

  await user.save();

  res.status(200).json({
    success: true,
    message: "Password Reset Successfully",
    token,
  });
});

// -------------------// add to playlist //--------------------------------------- //

export const addToPlaylist = catchAsyncError(async (req, res, next) => {
  // get user
  const user = await User.findById(req.user._id);
  // get course
  const course = await Course.findById(req.body.id);

  // check if course is valid or not
  if (!course)
    return next(new ErrorHandler("Invalid Course Id || Course not found", 404));

  // check if course is already in playlist
  const itemExist = user.playlist.find((item) => {
    if (item.course.toString() === course._id.toString()) {
      return true;
    }
  });

  // if course is already in playlist then return error and dont add to playlist
  if (itemExist)
    return next(new ErrorHandler("Course already in playlist", 409));

  //else if course is new or not in playlist then add to playlist
  user.playlist.push({
    course: course._id,
    poster: course.poster.url,
  });

  // save user
  await user.save();

  // send response
  res.status(200).json({
    success: true,
    message: "Added to Playlist Successfully",
  });
});

// -------------------// remove from playlist //--------------------------------------- //

export const removeFromPlaylist = catchAsyncError(async (req, res, next) => {
  // get user
  const user = await User.findById(req.user._id);

  // get course
  const course = await Course.findById(req.query.id);

  // check if course is valid or not
  if (!course)
    return next(new ErrorHandler("Invalid Course Id || Course not found", 404));

  // check if course is already in playlist
  const itemExist = user.playlist.find((item) => {
    if (item.course.toString() === course._id.toString()) {
      return true;
    }
  });

  // if course is not in playlist then return error and dont remove from playlist
  if (!itemExist) return next(new ErrorHandler("Course not in playlist", 404));

  // .filter helps to remove the item from the array(playlist) and return the new array(newplaylist) where the list is updated with the requested delete option

  const newPlaylist = user.playlist.filter((item) => {
    if (item.course.toString() !== course._id.toString()) return item;
  });

  user.playlist = newPlaylist;

  // save user
  await user.save();

  // send response
  res.status(200).json({
    success: true,
    message: "Removed from Playlist Successfully",
  });
});

// -------------------// get all users //---------------------//

export const getAllUsers = catchAsyncError(async (req, res, next) => {
  // get all users
  const users = await User.find({});

  // send response
  res.status(200).json({
    success: true,
    users,
  });
});

// -------------------// Update all users //---------------------//

export const updateUserRole = catchAsyncError(async (req, res, next) => {
  // get all users
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }
  if (user.role === "user") user.role = "admin";
  else user.role = "user";

  await user.save();
  // send response
  res.status(200).json({
    success: true,
    message: "User Role Updated Successfully",
  });
});

// -------------------//Delete User //---------------------//

export const deleteUser = catchAsyncError(async (req, res, next) => {
  // get user
  const user = await User.findById(req.params.id);
  console.log(user);

  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }

  //delete the avartar using the public_id
  await cloudinary.v2.uploader.destroy(user.avatar.public_id);

  // cancel Subscription

  //remove user
  await user.deleteOne();

  //send response
  res.status(200).json({
    success: true,
    message: "User Deleted Successfully",
  });
});


// Need to update the Collection of Stats in Database(MongoDb) everytime user is created to maintain the stats of the dashboard 
// User Watch For checking if new user is updated in the Users Collection  Database(MongoDb

User.watch().on("change", async () => {
   
  const stats = await Stats.find({}).sort({createdAt:"desc"}).limit(1);

  const subscription = await User.find({"subscription.status":"active"});

  stats[0].users = await User.countDocuments();
  stats[0].subscription = subscription.length;
  stats[0].createdAt = new Date(Date.now());

  await stats[0].save();
  
});