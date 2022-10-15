import dotenv from "dotenv";
dotenv.config();
const { BOT_TOKEN } = process.env;

if (!BOT_TOKEN) throw new Error("Missing environment variables");

const config: Record<string, string> = {
  BOT_TOKEN,
};

export default config;
