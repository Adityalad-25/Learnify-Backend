export const sendToken = (res,user, message,statusCode = 200 ) => {
  const token = user.getJwtToken();
  const options = {
    // expires in 15 days
    expires: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
    httpOnly: true,
    // dont add secure while in localhost || token wont be saved in cookie if secure=true in cookie options
    secure: true,

    sameSite:"none",
  };

  res
    .status(statusCode)
    .cookie("token", token, options)
    .json({
      success: true,
    //   token,
      message,
      user,
    });

};
