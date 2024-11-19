import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser"
import status from "express-status-monitor"
const app = express();


app.use(
  cors({
    origin: [`${process.env.CORS_ORIGIN}`],
    credentials: true,
  })
);




// express middlewares 
app.use(express.json({ limit: "20kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));

// monitor server
app.use(status());

app.use(cookieParser());


// imports routes
import healthcheckRouter from "./routes/healthcheck.routes";
import userRouter from "./routes/user.routes"
import errorHandler from "./middlewares/error.middlewares";




// routes

app.use('/api/v1/healthcheck',healthcheckRouter);
app.use('/api/v1/users',userRouter);



// error

app.use(errorHandler);

export { app };
