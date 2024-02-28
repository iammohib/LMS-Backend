import mongoose from "mongoose";

const connectToDb = () => {
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

export default connectToDb;
