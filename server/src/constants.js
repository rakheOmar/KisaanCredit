import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const DB_NAME = "nabard_1";

export const CHATBOT_PERSONA = fs.readFileSync(
  path.join(__dirname, "chatbot-persona.txt"),
  "utf-8"
);
