import express from "express";
import cors from "cors";
import morgan from "morgan";
import { errorHandler } from "./middlewares/error.middleware";
import { AppDataSource } from "./config/data-source";
import authRouter from "./routers/auth.route";
import userRouter from "./routers/user.route";
import categoryRouter from "./routers/category.route";
import transactionsRouter from "./routers/transactions.route";
import loanRouter from "./routers/loan.route";
import accountRouter from "./routers/account.route";

AppDataSource.initialize()
  .then(() => {
    console.log("Database connected");

    const app = express();

    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(morgan("dev"));
    app.use(
      cors({
        origin: "*",
      }),
    );

    app.use("/api/auth", authRouter);
    app.use("/api/users", userRouter);
    app.use("/api/categories", categoryRouter);
    app.use("/api/transactions", transactionsRouter);
    app.use("/api/loans", loanRouter);
    app.use("/api/accounts", accountRouter);

    app.use(errorHandler);

    const PORT = Number(process.env.PORT || "8000");
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`app is listening on ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("DB connection error", err);
  });
