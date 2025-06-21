import { ErrorRequestHandler, NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/ApiError";

const errorHandler: ErrorRequestHandler = (
  err: ApiError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  err.statusCode = err.statusCode || 500;

  if (process.env.NODE_ENV === "development") {
    // Development error response
    res.status(err.statusCode).json({
      error: err,
      message: err.message,
      stack: err.stack,
    });
  } else {
    // Production error response
    if (err.isOperational) {
      res.status(err.statusCode).json({
        message: err.message,
        error: err,
      });
    } else {
      // Programming or other unknown error: don't leak error details
      console.error("ERROR 💥", err);
      res.status(500).json({
        message: "Something went wrong!",
      });
    }
  }
};

export default errorHandler;
