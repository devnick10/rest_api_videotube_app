import dotenv from "dotenv";
dotenv.config({
  path: ".env",
});
import { app } from "./app";
import connectDB from "./db";
import logger from "./utils/logger";

// connect database
connectDB()
  .then(() => {
    app.listen(process.env.PORT || 3000, () => {
      logger.info(`server is running at PORT || ${process.env.PORT}`);
    });
  })
  .catch((err) => {
    logger.error(`MongoDB connetion error`);
    logger.error(err);
  });
