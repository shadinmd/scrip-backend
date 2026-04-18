import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { User } from "./user.entity";
import { Category } from "./category.entity";
import { Account } from "./account.entity";
import { LoanInstallment } from "./loan-installment.entity";

@Entity("transactions")
export class Transaction {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  amount!: number;

  @Column({
    type: "varchar",
    length: 10,
    default: "debit",
  })
  type!: "debit" | "credit";

  @Column()
  description!: string;

  @Column({ type: "date" })
  date!: string;

  @Column({ name: "category_id", nullable: true })
  categoryId?: number | null;

  @ManyToOne(() => Category, (category) => category.transactions, {
    nullable: true,
  })
  @JoinColumn({ name: "category_id" })
  category?: Category | null;

  @Column({ name: "account_id" })
  accountId!: number;

  @ManyToOne(() => Account, (account) => account.transactions, {
    nullable: false,
  })
  @JoinColumn({ name: "account_id" })
  account!: Account;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;

  @Column({ name: "user_id" })
  userId!: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: "user_id" })
  user!: User;

  @Column({ name: "installment_id", nullable: true })
  installmentId?: number | null;

  @ManyToOne(() => LoanInstallment, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "installment_id" })
  installment?: LoanInstallment | null;
}
