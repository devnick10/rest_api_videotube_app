import { NextFunction, Request, Response } from "express";
import { User } from "../models/user.model";
import { ApiError } from "../utils/ApiError";
import jwt, { JwtPayload } from "jsonwebtoken";
import logger from "../utils/logger";

export interface IAuthRequest extends Request {
  user?: any;
}

const isAuthenticated = async (
  req: IAuthRequest,
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

    const user = await User.findById(decodeToken?.id);

    if (!user) {
      return next(new ApiError(401, "Unauthorized"));
    }

    req.user = user;

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
