import { config } from "./config/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import status from "express-status-monitor";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import hpp from "hpp";
import mongoSanitize from "express-mongo-sanitize";
import morgan from "morgan";
const app = express();
const CORS_ORIGIN = config.get("CORS_ORIGIN");
const NODE_ENV = config.get("NODE_ENV");

// cors
app.use(
  cors({
    origin: [`${CORS_ORIGIN}`],
    credentials: true,
  })
);

// Global rate limiting
const limitter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minute
  max: 100, // limit each ip to 100 req per windowMS
  message: "To many requests from this IP, please try again later.",
});

// Security middleware
app.use(helmet());
app.use(hpp()); // Prevent http parameters pollution
app.use(mongoSanitize()); // Data sanitization against NoSQL query injection
app.use("/api", limitter); // Apply rate limiting to all routes

// express middlewares
app.use(express.json({ limit: "20kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

// monitor server
app.use(status());

// logging middleware
if (NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// imports routes
import errorHandler from "./middlewares/error.middlewares";
import healthcheckRouter from "./routes/healthcheck.routes";
import userRouter from "./routes/user.routes";
import videoRouter from "./routes/video.routes";
import tweetRouter from "./routes/tweet.routes";
import subscriptionRouter from "./routes/subscription.routes";
import playlistRouter from "./routes/playlist.routes";
import likeRouter from "./routes/like.routes";
import commentRouter from "./routes/comment.routes";
import dashboardRouter from "./routes/dashboard.routes";

// routes
app.use("/api/v1/healthcheck", healthcheckRouter);
app.use("/api/v1/user", userRouter);
app.use("/api/v1/video", videoRouter);
app.use("/api/v1/tweet", tweetRouter);
app.use("/api/v1/subscription", subscriptionRouter);
app.use("/api/v1/playlist", playlistRouter);
app.use("/api/v1/like", likeRouter);
app.use("/api/v1/comment", commentRouter);
app.use("/api/v1/dashboard", dashboardRouter);

// error

app.use(errorHandler);

export { app };
