import mongoose from "mongoose";
import { DB_NAME } from "../constants";
import logger from "../utils/logger";
import { config } from "../config/config";

const connectDB = async () => {
  try {
    const connectionInstence = await mongoose.connect(
      `${config.get("DB_URI")}/${DB_NAME}`
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
