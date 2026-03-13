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

@Entity("transactions")
export class Transaction {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  amount!: number;

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

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;

  @Column({ name: "user_id" })
  userId!: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: "user_id" })
  user!: User;
}
