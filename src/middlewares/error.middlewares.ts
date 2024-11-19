// import mongoose from "mongoose";
// import { ApiError } from "../utils/ApiError";
// import { ErrorRequestHandler, Request, Response, NextFunction } from "express";

// const errorHandler: ErrorRequestHandler = (
//   err: ApiError | Error,
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {
//   let error = err;

//   if ((error instanceof ApiError)) {
     
//    const statusCode = error.statusCode || error instanceof mongoose.Error ? 400 : 500
    
//    const message = error.message || "Something went wrong."
      
//    error = new ApiError(statusCode,message,error?.errors || [] ,err.stack)

//   }

//   const response = {
//     ...error,
//     message:error.message,
//     ...(process.env.NODE_ENV === "development" ?{stack:error.stack}:{})
//   }


   
//   return res.status(apierror.statusCode).json(response)

// };

// export default errorHandler;


import { Request, Response, NextFunction, ErrorRequestHandler } from "express";
import mongoose from "mongoose";
import { ApiError } from "../utils/ApiError";

const errorHandler: ErrorRequestHandler = (
  err: ApiError | Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let error: ApiError;

  // Ensure the error is an instance of ApiError
  if (err instanceof ApiError) {
    error = err;
  } else {
    const statusCode = err instanceof mongoose.Error ? 400 : 500;
    const message = err.message || "Something went wrong.";

    error = new ApiError(statusCode, message);
    error.stack = err.stack || ""; // Add the stack trace if available
    error.errors = []; // Ensure the errors array is set
  }

  // Default status code if none is provided
  const statusCode = error.statusCode || 500;

  // Build the response object
  const response = {
    success: false,
    statusCode: error.statusCode,
    message: error.message,
    errors: error.errors, // Include the errors array
    ...(process.env.NODE_ENV === "development" ? { stack: error.stack } : {}),
  };

  // Send the response
  return res.status(statusCode).json(response);
};

export default errorHandler;



