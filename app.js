import { config } from "dotenv";
config();
import express, { urlencoded } from "express";
import { connectToDb } from "./configs/db.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import morgan from "morgan";
import { errorMiddleware } from "./middlewares/error.middleware.js";

const app = express();

// Db connection
connectToDb();

// Middleware
// Built-In
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Third-Party
app.use(
  cors({
    origin: [process.env.FRONTEND_URL],
    credentials: true,
  })
);
app.use(cookieParser());
app.use(morgan("dev"));

// Server status check route
app.get("/ping", (req, res) => {
  res.status(200).send("pong");
});

// Import all routes
import { userRouter } from "./routes/user.routes.js";
// import { courseRouter } from "./routes/course.route.js";

// Routing to routes
app.use("/api/v1/user", userRouter);
// app.use("/api/v1/course", courseRouter);

// Default catch all route - 404
app.all("*", (_req, res) => {
  res.status(400).send("404 page not found !");
});

// Custom error handling middleware
app.use(errorMiddleware);

export default app;
