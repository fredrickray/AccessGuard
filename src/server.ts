import express, { Application } from "express";
import morgan from "morgan";
import { errorHandler, routeNotFound } from "@middlewares/error.middleware";
import bodyParser from "body-parser";
import proxyRouter from "@proxy/router";
import { zeroTrustGuard } from "@middlewares/accessGuard";
import demoAppRouter from "@routes/demoApp.route";
import adminRouter from "@routes/admin.route";
import authRouter from "@routes/auth.route";
import connectDB from "@config/db";
import indexRouter from "./routes";
import cors from "cors";

export default class Server {
  public app: Application;

  constructor() {
    this.app = express();
    this.initializeMiddlewares();
    console.log("Registering middlewares...");
    this.routes();
    console.log("Handling errors...");
    this.handleErrors();
    this.connectToDatabase();
  }

  private connectToDatabase() {
    connectDB().catch((err) => {
      console.error("❌ Failed to connect to database:", err);
    });
  }

  initializeMiddlewares() {
    this.app.use(bodyParser.urlencoded({ extended: true }));
    this.app.use(express.json());
    this.app.use(morgan("dev"));
    this.app.get("/api/health", (req, res) => {
      res.json({ status: "ok", timestamp: new Date().toISOString() });
    });
  }

  handleErrors() {
    this.app.use(errorHandler);
    this.app.use(routeNotFound);
  }

  routes() {
    //   this.app.use('/', indexRouter);
    this.app.use("/auth", authRouter);

    this.app.use("/api", zeroTrustGuard);

    this.app.use("/api", demoAppRouter);

    this.app.use("/api/admin", adminRouter);

    this.app.use("/proxy", proxyRouter);
  }

  start(port: number) {
    this.app.listen(port, () => {
      console.log(`Server initialized and ready for action! 🤖`);
      console.log("     /\\_/\\");
      console.log("    / o o \\");
      console.log('   (   "   )');
      console.log("    \\~(*)~/");
      console.log("     /___\\");
      console.log(`Server is running on port ${port}`);
      console.log("Welcome to the enchanted forest of code!");
      console.log("🔐 Zero-Trust Access Guard: ACTIVE");
    });
  }
}
