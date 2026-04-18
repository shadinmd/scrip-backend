import type { Request, Response } from "express";
import { AppDataSource } from "../config/data-source";
import { Transaction } from "../entity/transaction.entity";
import { Category } from "../entity/category.entity";
import { Account } from "../entity/account.entity";
import { getPaginationMetadata } from "../utils/pagination";
import { Between, LessThanOrEqual, MoreThanOrEqual, In } from "typeorm";

const transactionRepository = AppDataSource.getRepository(Transaction);

export const getTransactions = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const minAmount = req.query.min_amount
      ? parseFloat(req.query.min_amount as string)
      : undefined;
    const maxAmount = req.query.max_amount
      ? parseFloat(req.query.max_amount as string)
      : undefined;
    const startDate = req.query.start_date as string | undefined;
    const endDate = req.query.end_date as string | undefined;
    const accountId = req.query.accountId as string | undefined;

    let categoryIds: number[] | undefined = undefined;
    const queryCategoryIds = req.query.categoryIds;

    if (queryCategoryIds) {
      if (Array.isArray(queryCategoryIds)) {
        categoryIds = queryCategoryIds.map((id) => parseInt(id as string));
      } else {
        categoryIds = (queryCategoryIds as string)
          .split(",")
          .map((id) => parseInt(id));
      }
    }

    const where: any = { userId: req.user?.id };

    if (categoryIds && categoryIds.length > 0) {
      where.categoryId = In(categoryIds);
    }

    if (accountId) {
      where.accountId = parseInt(accountId);
    }

    if (minAmount !== undefined && maxAmount !== undefined) {
      where.amount = Between(minAmount, maxAmount);
    } else if (minAmount !== undefined) {
      where.amount = MoreThanOrEqual(minAmount);
    } else if (maxAmount !== undefined) {
      where.amount = LessThanOrEqual(maxAmount);
    }

    if (startDate && endDate) {
      where.date = Between(startDate, endDate);
    } else if (startDate) {
      where.date = MoreThanOrEqual(startDate);
    } else if (endDate) {
      where.date = LessThanOrEqual(endDate);
    }

    const [transactions, total] = await transactionRepository.findAndCount({
      where,
      relations: ["category", "account"],
      order: { date: "DESC", createdAt: "DESC" },
      skip,
      take: limit,
    });

    const metadata = getPaginationMetadata(total, page, limit);

    res.json({
      data: transactions,
      metadata,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

export const getSummary = async (req: Request, res: Response) => {
  try {
    const today = new Date();

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfMonthStr = `${startOfMonth.getFullYear()}-${String(startOfMonth.getMonth() + 1).padStart(2, "0")}-01`;

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 6);
    const sevenDaysAgoStr = `${sevenDaysAgo.getFullYear()}-${String(sevenDaysAgo.getMonth() + 1).padStart(2, "0")}-${String(sevenDaysAgo.getDate()).padStart(2, "0")}`;

    const userId = req.user!.id;

    // 1. Current Month Expenses (debit) and Income (credit)
    const monthTransactions = await transactionRepository.find({
      where: {
        userId,
        date: MoreThanOrEqual(startOfMonthStr),
      },
    });

    const monthExpenses = monthTransactions
      .filter((t) => t.type === "debit")
      .reduce((sum, t) => sum + Math.abs(parseFloat(t.amount.toString())), 0);

    const monthIncome = monthTransactions
      .filter((t) => t.type === "credit")
      .reduce((sum, t) => sum + Math.abs(parseFloat(t.amount.toString())), 0);

    // 2. Last 7 days activity (net or just expenses? usually daily activity shows spending)
    // Let's keep it as expenses for the activity chart for now, but we could return both.
    const last7DaysTransactions = await transactionRepository.find({
      where: {
        userId,
        date: MoreThanOrEqual(sevenDaysAgoStr),
      },
    });

    const dailyActivity = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

      const dayExpenses = last7DaysTransactions
        .filter((t) => t.date === dStr && t.type === "debit")
        .reduce((sum, t) => sum + Math.abs(parseFloat(t.amount.toString())), 0);

      const dayIncome = last7DaysTransactions
        .filter((t) => t.date === dStr && t.type === "credit")
        .reduce((sum, t) => sum + Math.abs(parseFloat(t.amount.toString())), 0);

      dailyActivity.push({
        date: dStr,
        expenses: dayExpenses,
        income: dayIncome,
        total: dayExpenses, // Keep total as expenses for backward compatibility if needed, but return others
      });
    }

    // 3. Recent 5 transactions
    const recentTransactions = await transactionRepository.find({
      where: { userId },
      relations: ["category", "account"],
      order: { date: "DESC", createdAt: "DESC" },
      take: 5,
    });

    res.json({
      currentMonth: {
        expenses: monthExpenses,
        income: monthIncome,
        count: monthTransactions.length,
      },
      dailyActivity,
      recentTransactions,
    });
  } catch (error) {
    console.error("Summary error:", error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

export const getTransaction = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const transaction = await transactionRepository.findOne({
      where: { id: parseInt(id), userId: req.user?.id },
      relations: ["category", "account"],
    });
    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }
    res.json(transaction);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

export const createTransaction = async (req: Request, res: Response) => {
  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const { amount, type, description, date, categoryId, accountId } = req.body;
    const userId = req.user!.id;

    const account = await queryRunner.manager.findOne(Account, {
      where: { id: accountId, userId },
    });

    if (!account) {
      return res.status(400).json({ message: "Invalid account" });
    }

    let category = null;
    if (categoryId) {
      category = await queryRunner.manager.findOne(Category, {
        where: { id: categoryId },
      });
      if (!category) {
        return res.status(400).json({ message: "Invalid category" });
      }
    }

    const transaction = transactionRepository.create({
      amount,
      type,
      description,
      date,
      category,
      accountId,
      userId,
    });

    // Update account balance
    if (type === "credit") {
      account.balance = parseFloat(account.balance.toString()) + amount;
    } else {
      account.balance = parseFloat(account.balance.toString()) - amount;
    }

    await queryRunner.manager.save(transaction);
    await queryRunner.manager.save(account);

    await queryRunner.commitTransaction();
    res.status(201).json(transaction);
  } catch (error) {
    await queryRunner.rollbackTransaction();
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  } finally {
    await queryRunner.release();
  }
};

export const updateTransaction = async (req: Request, res: Response) => {
  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const id = req.params.id as string;
    const { amount, type, description, date, categoryId, accountId } = req.body;
    const userId = req.user!.id;

    const transaction = await queryRunner.manager.findOne(Transaction, {
      where: { id: parseInt(id), userId },
    });

    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    const oldAccountId = transaction.accountId;
    const oldAmount = parseFloat(transaction.amount.toString());
    const oldType = transaction.type;

    const newAmount = amount !== undefined ? amount : oldAmount;
    const newType = type !== undefined ? type : oldType;
    const newAccountId = accountId !== undefined ? accountId : oldAccountId;

    // 1. Revert old transaction effect on old account
    const oldAccount = await queryRunner.manager.findOne(Account, {
      where: { id: oldAccountId, userId },
    });
    if (oldAccount) {
      if (oldType === "credit") {
        oldAccount.balance =
          parseFloat(oldAccount.balance.toString()) - oldAmount;
      } else {
        oldAccount.balance =
          parseFloat(oldAccount.balance.toString()) + oldAmount;
      }
      await queryRunner.manager.save(oldAccount);
    }

    // 2. Apply new transaction effect on new account
    if (newAccountId === oldAccountId && oldAccount) {
      // Refresh balance since we saved oldAccount
      if (newType === "credit") {
        oldAccount.balance =
          parseFloat(oldAccount.balance.toString()) + newAmount;
      } else {
        oldAccount.balance =
          parseFloat(oldAccount.balance.toString()) - newAmount;
      }
      await queryRunner.manager.save(oldAccount);
    } else {
      const newAccount = await queryRunner.manager.findOne(Account, {
        where: { id: newAccountId, userId },
      });
      if (!newAccount) {
        throw new Error("New account not found");
      }
      if (newType === "credit") {
        newAccount.balance =
          parseFloat(newAccount.balance.toString()) + newAmount;
      } else {
        newAccount.balance =
          parseFloat(newAccount.balance.toString()) - newAmount;
      }
      await queryRunner.manager.save(newAccount);
    }

    transaction.accountId = newAccountId;
    if (amount !== undefined) transaction.amount = amount;
    if (type !== undefined) transaction.type = type;
    if (description !== undefined) transaction.description = description;
    if (date !== undefined) transaction.date = date;

    if (categoryId !== undefined) {
      if (categoryId === null) {
        transaction.category = null;
        transaction.categoryId = null;
      } else {
        const category = await queryRunner.manager.findOne(Category, {
          where: { id: categoryId },
        });
        if (!category) {
          return res.status(400).json({ message: "Invalid category" });
        }
        transaction.category = category;
        transaction.categoryId = categoryId;
      }
    }

    await queryRunner.manager.save(transaction);
    await queryRunner.commitTransaction();
    res.json(transaction);
  } catch (error) {
    await queryRunner.rollbackTransaction();
    console.error("Update error:", error);
    res.status(500).json({ message: "Something went wrong" });
  } finally {
    await queryRunner.release();
  }
};

export const deleteTransaction = async (req: Request, res: Response) => {
  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const id = req.params.id as string;
    const transaction = await queryRunner.manager.findOne(Transaction, {
      where: { id: parseInt(id), userId: req.user?.id },
    });

    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    const account = await queryRunner.manager.findOne(Account, {
      where: { id: transaction.accountId, userId: req.user?.id },
    });
    if (account) {
      if (transaction.type === "credit") {
        account.balance =
          parseFloat(account.balance.toString()) -
          parseFloat(transaction.amount.toString());
      } else {
        account.balance =
          parseFloat(account.balance.toString()) +
          parseFloat(transaction.amount.toString());
      }
      await queryRunner.manager.save(account);
    }

    await queryRunner.manager.remove(transaction);
    await queryRunner.commitTransaction();
    res.json({ message: "Transaction deleted successfully" });
  } catch (error) {
    await queryRunner.rollbackTransaction();
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  } finally {
    await queryRunner.release();
  }
};
