import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Create `position_master`, seed job positions, replace `employee_master.position`
 * text with FK `positionId`. Backfill by position name → code.
 * Data-only re-link: `local-data/employee-list/employee-position.sql` (code / focalNo).
 */
export class ManualGenerated1794979779621 implements MigrationInterface {
  name = 'ManualGenerated1794979779621';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "position_master" (
        "createdDate" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "createdBy" uuid,
        "updatedDate" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedBy" uuid,
        "active" boolean NOT NULL DEFAULT true,
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "name" character varying(125) NOT NULL,
        "code" character varying(64) NOT NULL,
        "description" character varying(256),
        CONSTRAINT "UQ_position_master_code" UNIQUE ("code"),
        CONSTRAINT "UQ_position_master_name" UNIQUE ("name"),
        CONSTRAINT "CHK_position_master_code" CHECK ("code" ~ '^[A-Z0-9_]+$'),
        CONSTRAINT "PK_position_master" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      INSERT INTO "position_master" ("name", "code")
      VALUES
        ('2nd M.B.B.S', 'SECOND_MBBS'),
        ('Clinical Sister', 'CLINICAL_SISTER'),
        ('Compounder', 'COMPOUNDER'),
        ('Data', 'DATA'),
        ('Health Assistant', 'HEALTH_ASSISTANT'),
        ('Health Assistant 1', 'HEALTH_ASSISTANT_1'),
        ('Health Assistant 2', 'HEALTH_ASSISTANT_2'),
        ('Health Assistant 4', 'HEALTH_ASSISTANT_4'),
        ('Lady Health Visitor', 'LADY_HEALTH_VISITOR'),
        ('Lady Health Visitor (C.F)', 'LADY_HEALTH_VISITOR_CF'),
        ('Medic', 'MEDIC'),
        ('Medical Officer', 'MEDICAL_OFFICER'),
        ('Midwife', 'MIDWIFE'),
        ('Nurse Aid', 'NURSE_AID'),
        ('Nursing Student', 'NURSING_STUDENT'),
        ('Public Health Staff 1', 'PUBLIC_HEALTH_STAFF_1'),
        ('Public Health Staff 2', 'PUBLIC_HEALTH_STAFF_2'),
        ('Senior Nurse', 'SENIOR_NURSE'),
        ('Sister', 'SISTER'),
        ('Township Coordinator', 'TOWNSHIP_COORDINATOR'),
        ('Township Focal', 'TOWNSHIP_FOCAL'),
        ('Township Health Nurse', 'TOWNSHIP_HEALTH_NURSE'),
        ('Township Medical Officer', 'TOWNSHIP_MEDICAL_OFFICER'),
        ('Trained Nurse', 'TRAINED_NURSE'),
        ('Volunteer', 'VOLUNTEER')
      ON CONFLICT ("code") DO UPDATE
        SET "name" = EXCLUDED."name",
            "updatedDate" = NOW()
    `);

    await queryRunner.query(`
      ALTER TABLE "employee_master"
      ADD COLUMN IF NOT EXISTS "positionId" uuid
    `);

    await queryRunner.query(`
      UPDATE "employee_master" e
      SET "positionId" = p.id
      FROM "position_master" p
      WHERE e."positionId" IS NULL
        AND e."position" IS NOT NULL
        AND TRIM(e."position") <> ''
        AND p.code = CASE TRIM(e."position")
          WHEN '2nd M.B.B.S' THEN 'SECOND_MBBS'
          WHEN 'Clinical Sister' THEN 'CLINICAL_SISTER'
          WHEN 'Compounder' THEN 'COMPOUNDER'
          WHEN 'Data' THEN 'DATA'
          WHEN 'Health Assistant' THEN 'HEALTH_ASSISTANT'
          WHEN 'Health Assistant 1' THEN 'HEALTH_ASSISTANT_1'
          WHEN 'Health Assistant 2' THEN 'HEALTH_ASSISTANT_2'
          WHEN 'Health Assistant 4' THEN 'HEALTH_ASSISTANT_4'
          WHEN 'Lady Health Visitor' THEN 'LADY_HEALTH_VISITOR'
          WHEN 'Lady Health Visitor (C.F)' THEN 'LADY_HEALTH_VISITOR_CF'
          WHEN 'Medic' THEN 'MEDIC'
          WHEN 'Medical Officer' THEN 'MEDICAL_OFFICER'
          WHEN 'Midwife' THEN 'MIDWIFE'
          WHEN 'Nurse Aid' THEN 'NURSE_AID'
          WHEN 'Nursing Student' THEN 'NURSING_STUDENT'
          WHEN 'Public Health Staff 1' THEN 'PUBLIC_HEALTH_STAFF_1'
          WHEN 'Public Health Staff 2' THEN 'PUBLIC_HEALTH_STAFF_2'
          WHEN 'Senior Nurse' THEN 'SENIOR_NURSE'
          WHEN 'Sister' THEN 'SISTER'
          WHEN 'Township Coordinator' THEN 'TOWNSHIP_COORDINATOR'
          WHEN 'Township Focal' THEN 'TOWNSHIP_FOCAL'
          WHEN 'Township Health Nurse' THEN 'TOWNSHIP_HEALTH_NURSE'
          WHEN 'Township Medical Officer' THEN 'TOWNSHIP_MEDICAL_OFFICER'
          WHEN 'Trained Nurse' THEN 'TRAINED_NURSE'
          WHEN 'Volunteer' THEN 'VOLUNTEER'
          ELSE NULL
        END
        AND p.active = true
    `);

    await queryRunner.query(`
      ALTER TABLE "employee_master"
      ALTER COLUMN "positionId" SET NOT NULL
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_employee_master_position'
        ) THEN
          ALTER TABLE "employee_master"
          ADD CONSTRAINT "FK_employee_master_position"
          FOREIGN KEY ("positionId") REFERENCES "position_master"("id")
          ON DELETE NO ACTION ON UPDATE NO ACTION;
        END IF;
      END $$
    `);

    await queryRunner.query(`
      ALTER TABLE "employee_master"
      DROP COLUMN IF EXISTS "position"
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "employee_master"
      ADD COLUMN IF NOT EXISTS "position" character varying(255)
    `);

    await queryRunner.query(`
      UPDATE "employee_master" e
      SET "position" = p.name
      FROM "position_master" p
      WHERE p.id = e."positionId"
        AND (e."position" IS NULL OR TRIM(e."position") = '')
    `);

    await queryRunner.query(`
      ALTER TABLE "employee_master"
      ALTER COLUMN "position" SET NOT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "employee_master"
      DROP CONSTRAINT IF EXISTS "FK_employee_master_position"
    `);

    await queryRunner.query(`
      ALTER TABLE "employee_master"
      DROP COLUMN IF EXISTS "positionId"
    `);

    await queryRunner.query(`DROP TABLE IF EXISTS "position_master"`);
  }
}
