import type { Request, Response } from "express";
import { AppDataSource } from "../config/data-source";
import { Account } from "../entity/account.entity";
import { getPaginationMetadata } from "../utils/pagination";

const accountRepository = AppDataSource.getRepository(Account);

export const getAccounts = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const [accounts, total] = await accountRepository.findAndCount({
      where: { userId: req.user?.id },
      skip,
      take: limit,
      order: { name: "ASC" },
    });

    const metadata = getPaginationMetadata(total, page, limit);

    res.json({
      data: accounts,
      metadata,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

export const getAccount = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const account = await accountRepository.findOne({
      where: { id: parseInt(id), userId: req.user?.id },
    });
    if (!account) {
      return res.status(404).json({ message: "Account not found" });
    }
    res.json(account);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

export const createAccount = async (req: Request, res: Response) => {
  try {
    const { name, balance, isDefault } = req.body;
    const userId = req.user!.id;

    if (isDefault) {
      await accountRepository.update(
        { userId, isDefault: true },
        { isDefault: false },
      );
    }

    const account = accountRepository.create({
      name,
      balance,
      isDefault,
      userId,
    });

    await accountRepository.save(account);
    res.status(201).json(account);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

export const updateAccount = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { name, balance, isDefault } = req.body;
    const userId = req.user!.id;

    const account = await accountRepository.findOne({
      where: { id: parseInt(id), userId },
    });

    if (!account) {
      return res.status(404).json({ message: "Account not found" });
    }

    if (isDefault && !account.isDefault) {
      // Unset existing default account
      await accountRepository.update(
        { userId, isDefault: true },
        { isDefault: false },
      );
    }

    if (name !== undefined) account.name = name;
    if (balance !== undefined) account.balance = balance;
    if (isDefault !== undefined) account.isDefault = isDefault;

    await accountRepository.save(account);
    res.json(account);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

export const deleteAccount = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const account = await accountRepository.findOne({
      where: { id: parseInt(id), userId: req.user?.id },
    });

    if (!account) {
      return res.status(404).json({ message: "Account not found" });
    }

    if (account.isDefault) {
      return res.status(400).json({ message: "Cannot delete default account" });
    }

    await accountRepository.remove(account);
    res.json({ message: "Account deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};
