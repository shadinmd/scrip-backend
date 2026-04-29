import type { Request, Response } from "express";
import { AppDataSource } from "../config/data-source";
import { Loan } from "../entity/loan.entity";
import { LoanInstallment } from "../entity/loan-installment.entity";
import { Transaction } from "../entity/transaction.entity";
import { Account } from "../entity/account.entity";
import { getPaginationMetadata } from "../utils/pagination";

const loanRepository = AppDataSource.getRepository(Loan);
const installmentRepository = AppDataSource.getRepository(LoanInstallment);

export const getLoans = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const showCompleted = req.query.showCompleted === "true";
    const skip = (page - 1) * limit;
    const userId = req.user!.id;

    const queryBuilder = loanRepository
      .createQueryBuilder("loan")
      .leftJoinAndSelect("loan.installments", "installment")
      .where("loan.userId = :userId", { userId });

    if (!showCompleted) {
      // Only show loans that have at least one unpaid installment
      queryBuilder.andWhere((qb) => {
        const subQuery = qb
          .subQuery()
          .select("1")
          .from(LoanInstallment, "inst")
          .where("inst.loanId = loan.id")
          .andWhere("inst.isPaid = false")
          .getQuery();
        return "EXISTS " + subQuery;
      });
    }

    // Add a hidden selection for sorting status: 1 for active, 0 for completed
    queryBuilder.addSelect((qb) => {
      return qb
        .subQuery()
        .select("CASE WHEN COUNT(*) > 0 THEN 1 ELSE 0 END")
        .from(LoanInstallment, "inst")
        .where("inst.loanId = loan.id")
        .andWhere("inst.isPaid = false");
    }, "is_active_sort");

    queryBuilder.orderBy("is_active_sort", "DESC");
    queryBuilder.addOrderBy("loan.createdAt", "DESC");

    const [loans, total] = await queryBuilder
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    const metadata = getPaginationMetadata(total, page, limit);

    res.json({
      data: loans,
      metadata,
    });
  } catch (error) {
    console.error("Get loans error:", error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

export const getLoan = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const loan = await loanRepository.findOne({
      where: { id: parseInt(id), userId: req.user?.id },
      relations: ["installments"],
    });

    if (!loan) {
      return res.status(404).json({ message: "Loan not found" });
    }

    res.json(loan);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

export const createLoan = async (req: Request, res: Response) => {
  try {
    const { name, installments } = req.body;

    const loan = loanRepository.create({
      name,
      userId: req.user!.id,
    });

    const savedLoan = await loanRepository.save(loan);

    if (installments && installments.length > 0) {
      const installmentsToCreate = installments.map((inst: any) => ({
        ...inst,
        loanId: savedLoan.id,
      }));
      const createdInstallments =
        installmentRepository.create(installmentsToCreate);
      await installmentRepository.save(createdInstallments);
    }

    const result = await loanRepository.findOne({
      where: { id: savedLoan.id },
      relations: ["installments"],
    });

    res.status(201).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

export const updateLoan = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { name, installments } = req.body;

    const loan = await loanRepository.findOne({
      where: { id: parseInt(id), userId: req.user?.id },
      relations: ["installments"],
    });

    if (!loan) {
      return res.status(404).json({ message: "Loan not found" });
    }

    // Protection logic for paid installments
    if (installments !== undefined) {
      const existingPaid = loan.installments.filter((inst) => inst.isPaid);

      for (const oldInst of existingPaid) {
        // Find if this paid installment exists in the new list (by date/month)
        const newInst = installments.find(
          (n: any) => n.date.substring(0, 7) === oldInst.date.substring(0, 7),
        );

        if (!newInst) {
          return res.status(400).json({
            message: `Cannot delete a paid installment for ${oldInst.date.substring(0, 7)}`,
          });
        }

        if (parseFloat(newInst.amount) !== parseFloat(oldInst.amount as any)) {
          return res.status(400).json({
            message: `Cannot change the amount of a paid installment for ${oldInst.date.substring(0, 7)}`,
          });
        }

        if (!newInst.isPaid) {
          return res.status(400).json({
            message: `Cannot unmark an installment as unpaid during a bulk edit for ${oldInst.date.substring(0, 7)}`,
          });
        }
      }
    }

    if (name !== undefined) loan.name = name;
    await loanRepository.save(loan);

    if (installments !== undefined) {
      // 1. Delete all existing installments for this loan
      await installmentRepository.delete({ loanId: loan.id });

      // 2. Create and save the new ones
      if (installments.length > 0) {
        const installmentsToCreate = installments.map((inst: any) => ({
          ...inst,
          loanId: loan.id,
        }));
        const createdInstallments =
          installmentRepository.create(installmentsToCreate);
        await installmentRepository.save(createdInstallments);
      }
    }

    const updatedLoan = await loanRepository.findOne({
      where: { id: loan.id },
      relations: ["installments"],
    });

    res.json(updatedLoan);
  } catch (error) {
    console.error("Update loan error:", error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

export const deleteLoan = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const loan = await loanRepository.findOne({
      where: { id: parseInt(id), userId: req.user?.id },
    });

    if (!loan) {
      return res.status(404).json({ message: "Loan not found" });
    }

    await loanRepository.remove(loan);
    res.json({ message: "Loan deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

export const toggleInstallmentPaid = async (req: Request, res: Response) => {
  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const { installmentId } = req.params;
    const { create_transaction, accountId } = req.body;
    const userId = req.user!.id;

    const installment = await queryRunner.manager.findOne(LoanInstallment, {
      where: { id: parseInt(installmentId) },
      relations: ["loan", "loan.installments"],
    });

    if (!installment || installment.loan.userId !== userId) {
      await queryRunner.rollbackTransaction();
      return res.status(404).json({ message: "Installment not found" });
    }

    const allInstallments = installment.loan.installments.sort((a, b) =>
      a.date.localeCompare(b.date),
    );
    const currentIndex = allInstallments.findIndex(
      (inst) => inst.id === installment.id,
    );

    if (!installment.isPaid) {
      const previousUnpaid = allInstallments
        .slice(0, currentIndex)
        .find((inst) => !inst.isPaid);
      if (previousUnpaid) {
        await queryRunner.rollbackTransaction();
        return res.status(400).json({
          message:
            "Cannot pay this installment until all previous installments are paid",
        });
      }
    } else {
      const laterPaid = allInstallments
        .slice(currentIndex + 1)
        .find((inst) => inst.isPaid);
      if (laterPaid) {
        await queryRunner.rollbackTransaction();
        return res.status(400).json({
          message:
            "Cannot unmark this installment as unpaid while later installments are already paid",
        });
      }
    }

    const wasPaidBefore = installment.isPaid;
    installment.isPaid = !installment.isPaid;
    await queryRunner.manager.save(installment);

    if (!wasPaidBefore && installment.isPaid) {
      // marking as PAID
      if (create_transaction) {
        const account = await queryRunner.manager.findOne(Account, {
          where: { id: accountId, userId },
        });

        if (!account) {
          throw new Error("Account not found");
        }

        const transaction = queryRunner.manager.create(Transaction, {
          amount: installment.amount,
          type: "debit",
          description: `Installment payment for ${installment.loan.name}`,
          date: installment.date,
          accountId: accountId,
          userId: userId,
          installmentId: installment.id,
        });

        // Update account balance
        account.balance =
          parseFloat(account.balance.toString()) -
          parseFloat(installment.amount.toString());

        await queryRunner.manager.save(transaction);
        await queryRunner.manager.save(account);
      }
    } else if (wasPaidBefore && !installment.isPaid) {
      // marking as UNPAID: Find and delete the linked transaction if any
      const transaction = await queryRunner.manager.findOne(Transaction, {
        where: { installmentId: installment.id, userId },
      });

      if (transaction) {
        const account = await queryRunner.manager.findOne(Account, {
          where: { id: transaction.accountId, userId },
        });

        if (account) {
          // Revert balance (add back the debit amount)
          account.balance =
            parseFloat(account.balance.toString()) +
            parseFloat(transaction.amount.toString());
          await queryRunner.manager.save(account);
        }

        await queryRunner.manager.remove(transaction);
      }
    }

    await queryRunner.commitTransaction();
    res.json(installment);
  } catch (error) {
    await queryRunner.rollbackTransaction();
    console.error("Toggle paid error:", error);
    res.status(500).json({ message: "Something went wrong" });
  } finally {
    await queryRunner.release();
  }
};
