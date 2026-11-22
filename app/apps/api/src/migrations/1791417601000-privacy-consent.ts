import { MigrationInterface, QueryRunner } from "typeorm";

export class PrivacyConsent1791417601000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS "privacyAcceptedAt" TIMESTAMP, ADD COLUMN IF NOT EXISTS "privacyVersion" VARCHAR`,
    );
  }

  async down(): Promise<void> {
    throw new Error("No se elimina el registro de consentimiento automáticamente");
  }
}
