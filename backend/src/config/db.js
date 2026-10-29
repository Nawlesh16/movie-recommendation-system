// Connects the app to MongoDB using Mongoose.
import mongoose from "mongoose";
import { env } from "./env.js";

export async function connectDB() {
  mongoose.connection.on("disconnected", () => {
    console.warn("MongoDB disconnected");
  });

  // If MongoDB is not running we want to find out in 5 seconds, not 30.
  await mongoose.connect(env.mongodbUri, { serverSelectionTimeoutMS: 5000 });

  console.log(
    `MongoDB connected: ${mongoose.connection.host}/${mongoose.connection.name}`
  );
}

export async function disconnectDB() {
  await mongoose.connection.close();
}
