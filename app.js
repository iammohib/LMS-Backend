import dotenv from "dotenv";
dotenv.config();
import express from "express";
import connectToDb from "./configs/db.js";
import cookieParser from "cookie-parser";
import cors from "cors";
const app = express();

// Db connection
connectToDb();

//express middleware
app.use(express.json());
app.use(cookieParser())
app.use(cors({
  origin: [process.env.FRONTEND_URL],
  credentials: true
}))

app.use("/ping", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server Created Successfully",
  });
});

export default app;
