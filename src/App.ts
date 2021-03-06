import Express, { Application } from "express";

// import { test } from "./controllers/news/news.cron";

import * as bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import { connect, set } from "mongoose";
import cors from "cors";

import Controller from "./interfaces/controller.interface";
import errorMiddleware from "./middleware/error.middleware";

class App {
  public app: Application;

  constructor(controllers: Controller[]) {
    this.app = Express();

    this.connectMongoDB();
    this.initializeMiddlewares();
    this.initializeErrorHandling();
    this.initializeControllers(controllers);
    // test;
  }

  public listen() {
    this.app.listen(process.env.PORT, () => {
      console.log(`${process.env.PORT}번 포트로 서버가 열렸습니다.`);
      console.log(`현재 ${process.pid}에서 실행중입니다.`);
    });
  }

  public getServer() {
    return this.app;
  }

  private initializeMiddlewares() {
    this.app.use(bodyParser.json());
    this.app.use(cookieParser());
    this.app.use(
      cors({
        origin: true,
        credentials: true,
      })
    );
  }

  private initializeErrorHandling() {
    this.app.use(errorMiddleware);
  }

  private initializeControllers(controllers: Controller[]) {
    controllers.forEach((controller) => {
      this.app.use("/", controller.router);
    });
  }

  private async connectMongoDB() {
    const {
      MONGO_USER,
      MONGO_PASSWORD,
      MONGO_DB,
      MONGO_PORT,
      MONGO_DBNAME,
    } = process.env;
    await set("useCreateIndex", true);
    connect(
      `mongodb://${MONGO_USER}:${MONGO_PASSWORD}@${MONGO_DB}:${MONGO_PORT}/${MONGO_DBNAME}`,
      {
        useUnifiedTopology: true,
        useNewUrlParser: true,
      }
    )
      .then(() => console.log("몽고DB에 연결되었습니다."))
      .catch((err) => console.log(`몽고DB에 연결 실패!! : ${err}`));
  }
}

export default App;
