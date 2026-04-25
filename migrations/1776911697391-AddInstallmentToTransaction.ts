import { MigrationInterface, QueryRunner } from "typeorm";

export class AddInstallmentToTransaction1776911697391 implements MigrationInterface {
    name = 'AddInstallmentToTransaction1776911697391'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "transactions" ADD "installment_id" integer`);
        await queryRunner.query(`ALTER TABLE "transactions" ADD CONSTRAINT "FK_2de95724a8c50980aa12cb7de0d" FOREIGN KEY ("installment_id") REFERENCES "loan_installments"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "transactions" DROP CONSTRAINT "FK_2de95724a8c50980aa12cb7de0d"`);
        await queryRunner.query(`ALTER TABLE "transactions" DROP COLUMN "installment_id"`);
    }

}
