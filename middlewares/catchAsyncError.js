
export const catchAsyncError = (passedfunc) => (req, res, next) => {
  Promise.resolve(passedfunc(req, res, next)).catch(next);
};

// passedfunc is the function that we will pass in the controller
// req, res, next are the parameters that we will pass in the controller
// next is the function that we will pass in the controller that calls the next middleware
