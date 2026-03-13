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
      const createdInstallments = installmentRepository.create(installmentsToCreate);
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
    const { name } = req.body;

    const loan = await loanRepository.findOne({
      where: { id: parseInt(id), userId: req.user?.id },
    });

    if (!loan) {
      return res.status(404).json({ message: "Loan not found" });
    }

    if (name !== undefined) loan.name = name;

    await loanRepository.save(loan);
    res.json(loan);
  } catch (error) {
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
    
    // First find the installment and ensure it belongs to the user's loan
    const installment = await installmentRepository.findOne({
      where: { id: parseInt(installmentId) },
      relations: ["loan"]
    });

    if (!installment || installment.loan.userId !== req.user?.id) {
      return res.status(404).json({ message: "Installment not found" });
    }

    installment.isPaid = !installment.isPaid;
    await installmentRepository.save(installment);

    res.json(installment);
  } catch (error) {
    res.status(500).json({ message: "Something went wrong" });
  }
};
