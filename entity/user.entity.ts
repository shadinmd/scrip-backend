import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("users")
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: "username" })
  username!: string;

  @Column({ unique: true, name: "email" })
  email!: string;

  @Column({ name: "password" })
  password!: string;

  @Column({ name: "token_version", default: 0 })
  tokenVersion!: number;

  @Column({ name: "fcm_token", nullable: true })
  fcmToken?: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}
