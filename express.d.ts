import "express";
import { ObjectId } from "mongoose";

declare global {
  namespace Express {
    interface Request {
      userId?: ObjectId;
      files?: {
        avatar?: Express.Multer.File[];
        coverImage?: Express.Multer.File[];
      };
    }
  }
}
