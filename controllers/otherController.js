import { catchAsyncError } from "../middlewares/catchAsyncError.js";
import ErrorHandler from "../utils/errorHandler.js";
import { sendEmail } from "../utils/sendEmail.js";
import { Stats} from "../models/Stats.js";

// ----------------- Contact Form ----------------------- //
//  Check responses here : https://mailtrap.io/inboxes/2559120/messages/3963501719 //

export const contact = catchAsyncError(async (req, res, next) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message)
    return next(new ErrorHandler("Please Fill All Fields", 400));

  console.log(name, email, message);
  const to = process.env.MY_MAIL;

  const subject = "Contact From Learnify";

  const text = `I am ${name} and  My Email is ${email}. \n ${message}`;

  console.log(text);

  await sendEmail(to, subject, text);

  res.status(200).json({
    success: true,
    message: "Your message or Email Sent Successfully",
  });
});


// ----------------- Course Request ----------------------- //

export const courseRequest = catchAsyncError(async (req, res, next) => {
  const { name, email, course } = req.body;
  if (!name || !email || !course)
    return next(new ErrorHandler("Please Fill All Fields", 400));

  const to = process.env.MY_MAIL;

  const subject = "Requesting For a Course on Learnify";

  const text = `\n I am ${name} and \n My Email is ${email}. \n Requested Course : \n ${course}`;

  await sendEmail(to, subject, text);

  res.status(200).json({
    success: true,
    message: "Your Request has been Sent Successfully",
  });
});


// ----------------- Get Admin Dashboard Stats ----------------------- //

export const getDashboardStats = catchAsyncError(async (req, res, next) => {

   const stats = await Stats.find({}).sort({createdAt:"desc"}).limit(12);
   
   const statsData = [];

    for(let i = 0 ; i < stats.length ; i++){
          statsData.push(stats[i]); 
    }

    const requiredSize = 12 - stats.length;

    for(let i = 0 ; i < requiredSize ; i++){

       // unshift() method adds new items to the beginning of an array, and returns the new length.
        statsData.unshift(
           {
             users:0,
             subscription:0,
             views:0,
           }
        ); 
    }

    
    const usersCount  = statsData[11].users;
    const viewsCount  = statsData[11].views;
    const subscriptionCount  = statsData[11].subscription;

    let usersProfit = true , viewsProfit = true , subscriptionProfit = true;

    let usersPercentage = 0 , viewsPercentage = 0 , subscriptionPercentage = 0;

    if(statsData[10].users === 0) usersPercentage = usersCount * 100;
    if(statsData[10].views === 0) viewsPercentage = viewsCount * 100;
    if(statsData[10].subscription === 0) subscriptionPercentage = subscriptionCount * 100;

   
    else{
        const difference = {
            users:statsData[11].users - statsData[10].users,
            views:statsData[11].views - statsData[10].views,
            subscription:statsData[11].subscription - statsData[10].subscription,
        }

        usersPercentage = (difference.users / statsData[10].users) * 100;
        viewsPercentage = (difference.views / statsData[10].views) * 100;
        subscriptionPercentage = (difference.subscription / statsData[10].subscription) * 100;


        if(usersPercentage < 0) usersProfit = false;
        if(viewsPercentage < 0) viewsProfit = false;
        if(subscriptionPercentage < 0) subscriptionProfit = false;
    }
    
  res.status(200).json({
    success: true,
    stats:statsData,
    usersCount,
    viewsCount,
    subscriptionCount,
    subscriptionPercentage,
    viewsPercentage,
    usersPercentage,
    usersProfit,
    viewsProfit,
    subscriptionProfit,
  });
});
