import type { Request, Response } from "express";
import { AppDataSource } from "../config/data-source";
import { Transaction } from "../entity/transaction.entity";
import { Category } from "../entity/category.entity";
import { getPaginationMetadata } from "../utils/pagination";
import { Between, LessThanOrEqual, MoreThanOrEqual, In } from "typeorm";

const transactionRepository = AppDataSource.getRepository(Transaction);
const categoryRepository = AppDataSource.getRepository(Category);

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
      relations: ["category"],
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
    res.status(500).json({ message: "Something went wrong" });
  }
};

export const getTransaction = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const transaction = await transactionRepository.findOne({
      where: { id: parseInt(id), userId: req.user?.id },
      relations: ["category"],
    });
    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }
    res.json(transaction);
  } catch (error) {
    res.status(500).json({ message: "Something went wrong" });
  }
};

export const createTransaction = async (req: Request, res: Response) => {
  try {
    const { amount, description, date, categoryId } = req.body;

    let category = null;
    if (categoryId) {
      category = await categoryRepository.findOneBy({ id: categoryId });
      if (!category) {
        return res.status(400).json({ message: "Invalid category" });
      }
    }

    const transaction = transactionRepository.create({
      amount,
      description,
      date,
      category,
      userId: req.user!.id,
    });

    await transactionRepository.save(transaction);
    res.status(201).json(transaction);
  } catch (error) {
    res.status(500).json({ message: "Something went wrong" });
  }
};

export const updateTransaction = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { amount, description, date, categoryId } = req.body;

    const transaction = await transactionRepository.findOne({
      where: { id: parseInt(id), userId: req.user?.id },
    });

    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    if (amount !== undefined) transaction.amount = amount;
    if (description !== undefined) transaction.description = description;
    if (date !== undefined) transaction.date = date;

    if (categoryId !== undefined) {
      if (categoryId === null) {
        transaction.category = null;
      } else {
        const category = await categoryRepository.findOneBy({ id: categoryId });
        if (!category) {
          return res.status(400).json({ message: "Invalid category" });
        }
        transaction.category = category;
      }
    }

    await transactionRepository.save(transaction);
    res.json(transaction);
  } catch (error) {
    res.status(500).json({ message: "Something went wrong" });
  }
};

export const deleteTransaction = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const transaction = await transactionRepository.findOne({
      where: { id: parseInt(id), userId: req.user?.id },
    });

    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    await transactionRepository.remove(transaction);
    res.json({ message: "Transaction deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Something went wrong" });
  }
};
