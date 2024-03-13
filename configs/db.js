import mongoose from "mongoose";

export const connectToDb = () => {
  mongoose
    .connect(process.env.MONGO_URI)
    .then((conn) => {
      console.log("Connected to Db:", conn.connection.host);
    })
    .catch((error) => {
      console.error(error.message);
      process.exit(1);
    });
};
