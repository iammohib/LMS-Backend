import { config } from "dotenv";
config();
import express, { urlencoded } from "express";
import connectToDb from "./configs/db.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import morgan from "morgan";
import errorMiddleware from "./middlewares/error.middleware.js";

const app = express();

// Db connection
connectToDb();

// Middleware
// Built-In
app.use(express.json());
app.use(express.urlencoded({extended: true}))

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
import userRoutes from "./routes/user.routes.js";

// Routing to routes
app.use("/api/v1/user", userRoutes);

// Default catch all route - 404
app.all("*", (_req, res) => {
  res.status(400).send("404 page not found !");
});

app.use(errorMiddleware);

export default app
