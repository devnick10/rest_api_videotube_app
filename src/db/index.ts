import mongoose from "mongoose";
import { DB_NAME } from "../constants";

const connectDB = async () => {
  try {
    const connectionInstence = await mongoose.connect(
      `${process.env.DB_URI}/${DB_NAME}`
    );

    console.log(
      `Database connected ! || DB host: ${connectionInstence.connection.host}`
    );
  } catch (error) {
    console.log(`MongoDB connection error`, error);
    process.exit(1);
  }
};

export default connectDB;
