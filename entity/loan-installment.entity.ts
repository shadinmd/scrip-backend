import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToOne,
  type Relation,
} from "typeorm";
import { Loan } from "./loan.entity";
import { Transaction } from "./transaction.entity";

@Entity("loan_installments")
export class LoanInstallment {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  amount!: number;

  @Column({ type: "date" })
  date!: string;

  @Column({ default: false, name: "is_paid" })
  isPaid!: boolean;

  @Column({ name: "loan_id" })
  loanId!: number;

  @ManyToOne(() => Loan, (loan) => loan.installments, { onDelete: "CASCADE" })
  @JoinColumn({ name: "loan_id" })
  loan!: Relation<Loan>;

  @OneToOne(() => Transaction, (transaction) => transaction.installment)
  transaction?: Relation<Transaction>;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}
