import { DataSource } from "typeorm";

import { User } from "../entity/user.entity";
import { Transaction } from "../entity/transaction.entity";
import { Category } from "../entity/category.entity";
import { LoanInstallment } from "../entity/loan-installment.entity";
import { Loan } from "../entity/loan.entity";
import { Account } from "../entity/account.entity";

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl:
    process.env.NODE_ENV === "production"
      ? {
          rejectUnauthorized: false,
        }
      : false,
  synchronize: false,
  logging: true,
  entities: [User, Transaction, Category, Loan, LoanInstallment, Account],
  subscribers: [],
  migrations: [__dirname + "/../migrations/**/*.ts"],
});
