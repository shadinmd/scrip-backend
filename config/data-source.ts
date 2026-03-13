import { DataSource } from "typeorm";

import { User } from "../entity/user.entity";
import { Transaction } from "../entity/transaction.entity";
import { Category } from "../entity/category.entity";
import { LoanInstallment } from "../entity/loan-installment.entity";
import { Loan } from "../entity/loan.entity";

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  synchronize: false,
  logging: true,
  entities: [User, Transaction, Category, Loan, LoanInstallment],
  subscribers: [],
  migrations: [__dirname + "/../migrations/**/*.ts"],
});
