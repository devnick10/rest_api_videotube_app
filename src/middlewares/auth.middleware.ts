import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { ApiError } from "../utils/ApiError";
import logger from "../utils/logger";

const isAuthenticated = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token =
    req.cookies.accessToken ||
    req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    return next(new ApiError(401, "Unauthorized"));
  }

  try {
    const decodeToken = jwt.verify(
      token,
      process.env.ACCESS_TOKEN_SECRET as string
    ) as JwtPayload;

    if (!decodeToken) {
      return next(new ApiError(401, "Unauthorized"));
    }
    req.userId = decodeToken.id;
    next();
  } catch (error) {
    logger.debug("Unauthorized", {
      message: (error as Error).message,
      stack: (error as Error).stack,
    });
    const err = error as Error;
    next(new ApiError(401, err.message || "Unauthorized"));
  }
};

export default isAuthenticated;
