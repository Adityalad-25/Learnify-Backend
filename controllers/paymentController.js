import { catchAsyncError } from "../middlewares/catchAsyncError.js";
import { User } from "../models/User.js";
import { instance } from "../server.js";
import ErrorHandler from "../utils/errorHandler.js";
import crypto from "crypto";
import { Payment } from "../models/Payment.js";

// ----------------- BUY SUBSCRIPTION ----------------------- //

export const buySubscription = catchAsyncError(async (req, res, next) => {
  // 1. Get user from req.user._id
  const user = await User.findById(req.user._id);

  // 2. Check if user is admin or not
  if (user.role === "admin")
    return next(new ErrorHandler("Admin can't buy Subscription", 400));

  // 3. Check if user is already subscribed or not
  const plan_id = process.env.PLAN_ID || "plan_NNbeBdR35bvAsR";

  // 4. Create subscription
  const subscription = await instance.subscriptions.create({
    plan_id,
    customer_notify: 1,
    total_count: 12,
  });

  console.log("Subscription created:", subscription);

  // 5. Update user subscription
  user.subscription.id = subscription.id;
  console.log("User subscription updated:", user.subscription);

  // 6. Update user subscription status
  user.subscription.status = subscription.status;
  console.log(user.subscription);
  // 7. save user
  await user.save();

  // 8. Send response
  res.status(201).json({
    success: true,
    subscriptionId: subscription.id,
    message: "Subscription created successfully",
  });
});

// ----------------- Payment Verfication ----------------------- //

export const paymentVerification = catchAsyncError(async (req, res, next) => {
  const {
    razorpay_payment_id,
    razorpay_subscription_id,
    razorpay_signature,
  } = req.body;

  // 1. Get user from req.user._id
  const user = await User.findById(req.user._id);

  const subscription_id = user.subscription.id;

  const generated_signature = crypto
    .createHmac("sha256", process.env.RAZORPAY_API_SECRET)
    .update(razorpay_payment_id + "|" + subscription_id, "utf-8")
    .digest("hex");

  // check auntehtication
  const isAuthentic = generated_signature === razorpay_signature;

  // if not authentic then redirect to payment fail page
  if (!isAuthentic)
    return res.redirect(`${process.env.FRONTEND_URL}/paymentfail`);

  // if authentic then update the database with the necessary information
  await Payment.create({
    razorpay_payment_id,
    razorpay_subscription_id,
    razorpay_signature,
  });

  user.subscription.status = "active";

  await user.save();

  // Send response

  res.redirect(
    `${process.env.FRONTEND_URL}/paymentsuccess?reference=${razorpay_payment_id}`
  );

});


// ----------------- Get Razorpay Key ----------------------- //

export const getRazorpayKey = catchAsyncError(async (req, res, next) => {

    res.status(200).json({
        success: true,
        key: process.env.RAZORPAY_API_KEY,
    })
});



// ----------------- Cancel Subscription ----------------------- //

export const cancelSubscription = catchAsyncError(async (req, res, next) => {

    const user  = await User.findById(req.user._id);

    const subscriptionId = user.subscription.id;

    let refund  = false;

    await instance.subscriptions.cancel(subscriptionId);
    

    const payment = await Payment.findOne({razorpay_subscription_id: subscriptionId});
    
    const gap = Date.now() - payment.createdAt;

    const refundTime = process.env.REFUND_TIME * 24 * 60 * 60 * 1000;

    if(gap < refundTime){
        await instance.payments.refund(payment.razorpay_payment_id)
        refund = true;
    }
    
      await payment.deleteOne();
      user.subscription.id = undefined;
      user.subscription.status = undefined;
      await user.save();

    res.status(200).json({
        success: true,
        message:
        refund ? "Subscription cancelled successfully , You will get refund within 7 days": "Subscription cancelled successfully , No refund initiated as subscription is cancelled after 7 days",
    });
});


/// Test_payment - details :-  https://razorpay.com/docs/payments/payments/test-card-details/#test-card-for-subscriptions