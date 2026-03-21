import type { Request, Response } from "express";
import { AppDataSource } from "../config/data-source";
import { Loan } from "../entity/loan.entity";
import { LoanInstallment } from "../entity/loan-installment.entity";
import { getPaginationMetadata } from "../utils/pagination";

const loanRepository = AppDataSource.getRepository(Loan);
const installmentRepository = AppDataSource.getRepository(LoanInstallment);

export const getLoans = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const [loans, total] = await loanRepository.findAndCount({
      where: { userId: req.user?.id },
      relations: ["installments"],
      order: { createdAt: "DESC" },
      skip,
      take: limit,
    });

    const metadata = getPaginationMetadata(total, page, limit);

    res.json({
      data: loans,
      metadata,
    });
  } catch (error) {
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
    res.status(500).json({ message: "Something went wrong" });
  }
};

export const toggleInstallmentPaid = async (req: Request, res: Response) => {
  try {
    const { installmentId } = req.params;

    const installment = await installmentRepository.findOne({
      where: { id: parseInt(installmentId) },
      relations: ["loan", "loan.installments"],
    });

    if (!installment || installment.loan.userId !== req.user?.id) {
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
        return res.status(400).json({
          message:
            "Cannot unmark this installment as unpaid while later installments are already paid",
        });
      }
    }

    installment.isPaid = !installment.isPaid;
    await installmentRepository.save(installment);

    res.json(installment);
  } catch (error) {
    console.error("Toggle paid error:", error);
    res.status(500).json({ message: "Something went wrong" });
  }
};
