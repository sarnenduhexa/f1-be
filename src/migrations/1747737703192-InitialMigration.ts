import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialMigration1747737703192 implements MigrationInterface {
  name = 'InitialMigration1747737703192';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "drivers" ("driverId" character varying NOT NULL, "permanentNumber" character varying, "code" character varying, "url" character varying, "givenName" character varying, "familyName" character varying, "dateOfBirth" date, "nationality" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_cddc81d98d048e1f2cc19168302" PRIMARY KEY ("driverId"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "seasons" ("year" integer NOT NULL, "url" character varying NOT NULL, "winnerDriverId" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_e20814074bbf37638cb4affa089" PRIMARY KEY ("year"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "races" ("id" character varying NOT NULL, "season" integer NOT NULL, "round" integer NOT NULL, "raceName" character varying NOT NULL, "circuitName" character varying NOT NULL, "date" TIMESTAMP NOT NULL, "time" character varying, "url" character varying, "winnerDriverId" character varying, "winnerConstructorId" character varying, "winnerTime" character varying, "winnerLaps" integer, "winnerGrid" integer, "winnerPoints" integer, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_ba7d19b382156bc33244426c597" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "seasons" ADD CONSTRAINT "FK_57bca695d0f81017e545df4d33f" FOREIGN KEY ("winnerDriverId") REFERENCES "drivers"("driverId") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "races" ADD CONSTRAINT "FK_ee7445ffcf3c566f3147be86614" FOREIGN KEY ("season") REFERENCES "seasons"("year") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "races" ADD CONSTRAINT "FK_a4acce47fd45c7d92548f977414" FOREIGN KEY ("winnerDriverId") REFERENCES "drivers"("driverId") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "races" DROP CONSTRAINT "FK_a4acce47fd45c7d92548f977414"`,
    );
    await queryRunner.query(
      `ALTER TABLE "races" DROP CONSTRAINT "FK_ee7445ffcf3c566f3147be86614"`,
    );
    await queryRunner.query(
      `ALTER TABLE "seasons" DROP CONSTRAINT "FK_57bca695d0f81017e545df4d33f"`,
    );
    await queryRunner.query(`DROP TABLE "races"`);
    await queryRunner.query(`DROP TABLE "seasons"`);
    await queryRunner.query(`DROP TABLE "drivers"`);
  }
}
