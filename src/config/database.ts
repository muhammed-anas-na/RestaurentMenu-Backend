// src/config/database.ts
import mongoose from "mongoose";
import config from "./env";

export const connectDB = async (): Promise<void> => {
  try {
    await mongoose.connect(config.mongodb.uri);

    mongoose.connection.on("connected", () => {
      console.log("MongoDB Connected Successfully");
    });

    mongoose.connection.on("error", (err) => {
      console.error("MongoDB Connection Error:", err);
    });

    mongoose.connection.on("disconnected", () => {
      console.log("MongoDB Disconnected");
    });
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};
