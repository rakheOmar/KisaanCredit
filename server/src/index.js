import connectDB from "./db/index.js";
import dotenv from "dotenv";
import { httpServer } from "./app.js";

dotenv.config({ path: "./.env" });

connectDB()
  .then(() => {
    httpServer.listen(process.env.PORT || 8000, () => {
      console.log(`🚀 Server running at: http://localhost:${process.env.PORT || 8000}/api/v1/`);
      console.log(
        `❤️  Check health at: http://localhost:${process.env.PORT || 8000}/api/v1/health`
      );
    });
  })
  .catch((err) => {
    console.error("Database connection failed:", err);
    process.exit(1);
  });
