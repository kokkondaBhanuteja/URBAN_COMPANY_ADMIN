import mongoose, { ClientSession } from "mongoose";

const MONGODB_URL = process.env.MONGODB_URI || "mongodb://localhost:27017";

if (!MONGODB_URL) {
  console.log("Please specify the URI in the Environment Variables.");
}

interface IConnectDb {
  db: typeof mongoose;
  session: ClientSession;
}

export const connectDb = async (): Promise<IConnectDb | undefined> => {
  try {
    if (mongoose.connection.readyState === 1) {
      console.log("Db is already Connected, skipping");
    } else {
      await mongoose.connect(MONGODB_URL, {
        dbName: "URBAN_COMPANY",
      });
      console.log("mongoDb is successfully Connected!");
    }

    const session = await mongoose.startSession();
    return { db: mongoose, session };
  } catch (err) {
    console.log("Failed to connect to MongoDB ", err);
    process.exit(1);
  }
};