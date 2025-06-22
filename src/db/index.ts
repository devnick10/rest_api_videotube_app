import mongoose from "mongoose";
import { DB_NAME } from "../constants";
import logger from "../utils/logger";

const connectDB = async () => {
  try {
    const connectionInstence = await mongoose.connect(
      `${process.env.DB_URI}/${DB_NAME}`
    );

    logger.info(
      `Database connected ! || DB host: ${connectionInstence.connection.host}`
    );
  } catch (error) {
    logger.error(`MongoDB connection error`);
    console.error(error);
    process.exit(1);
  }
};

export default connectDB;
