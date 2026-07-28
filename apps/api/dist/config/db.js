import mongoose from "mongoose";
import { env } from "./env.js";
import { logger } from "./logger.js";
let connected = false;
export async function connectDb() {
    if (connected)
        return mongoose;
    mongoose.set("strictQuery", true);
    await mongoose.connect(env.MONGODB_URI, {
        dbName: env.MONGODB_DB,
    });
    connected = true;
    logger.info(`MongoDB connected: ${env.MONGODB_DB}`);
    mongoose.connection.on("error", (err) => {
        logger.error("MongoDB connection error", err);
    });
    return mongoose;
}
export async function disconnectDb() {
    if (!connected)
        return;
    await mongoose.disconnect();
    connected = false;
}
//# sourceMappingURL=db.js.map