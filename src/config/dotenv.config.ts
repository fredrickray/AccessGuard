import dotenv from "dotenv";
dotenv.config();

const config = {
  mongodbURL: process.env.MONGO_URL as string,
  redisURL: process.env.REDIS_URL as string,
  serverPort: process.env.PORT as unknown as number,
  serverEnvironment: process.env.ENV,
  company: process.env.COMPANY_NAME as string,
};

export default config;
