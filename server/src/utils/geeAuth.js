// config/geeAuth.js
import ee from "@google/earthengine";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const privateKey = JSON.parse(readFileSync(join(__dirname, "gee-service-account.json"), "utf8"));

export const authenticateGEE = () => {
  return new Promise((resolve, reject) => {
    ee.data.authenticateViaPrivateKey(
      privateKey,
      () => {
        ee.initialize(null, null, resolve, reject);
      },
      reject
    );
  });
};
