import app from "./app.js";
import { v2 as cloudinary } from "cloudinary";

const PORT=process.env.PORT
const HOSTNAME=process.env.HOSTNAME

// Cloudinary Configuration
cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET,
  });

app.listen(PORT,()=>{
    console.log(`App is live at http://${HOSTNAME}:${PORT}`)
})