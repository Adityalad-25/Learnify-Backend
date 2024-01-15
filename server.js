import app from "./app.js";
import { connectDB } from "./config/Database.js";
import cloudinary from "cloudinary";
import Razorpay from "razorpay";
import {config} from "dotenv";
import nodeCron from "node-cron";
import { Stats } from "./models/Stats.js";
import cors from "cors";

connectDB();

// CLOUDUNARY CONFIGURATION
cloudinary.v2.config({
  cloud_name: process.env.CLOUD_CLIENT_NAME,
  api_key: process.env.CLOUD_CLIENT_API,
  api_secret: process.env.CLOUD_CLIENT_SECRET,
});

// Create Instance of Razorpay
export const instance = new Razorpay({
  key_id: process.env.RAZORPAY_API_KEY,
  key_secret: process.env.RAZORPAY_API_SECRET,
});

// nodecron schedule
// "* * * * * * " => means every sec 24/7 the function will run and " 0 0 0 1 * * " => means the function will run on 1st of every month at 12:00 AM
nodeCron.schedule("0 0 0 1 * *", async () => {
  //console.log("This is a test cron job");
  try {
    await Stats.create({});
  } catch (error) {
    console.log(error);
  }
});


app.listen(process.env.PORT, () => {
  console.log(`Server running on  PORT : ${process.env.PORT}`);
});

