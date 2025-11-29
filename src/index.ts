import dotenv from "dotenv";
dotenv.config({
  path: ".env",
});
import { app } from "./app";
import connectDB from "./db";
import logger from "./utils/logger";
import { config } from "./config/config";
const PORT = config.get("PORT");

// connect database
connectDB()
  .then(() => {
    app.listen(config.get("PORT"), () => {
      logger.info(`server is running at PORT || ${PORT}`);
    });
  })
  .catch((err) => {
    logger.error(`MongoDB connetion error`);
    logger.error(err);
  });
