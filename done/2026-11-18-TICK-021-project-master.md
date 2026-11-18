# Project master

- **Id:** TICK-021
- **Status:** done
- **Repos:** SERVER | WORK
- **Opened:** 2026-11-18
- **Finished:** 2026-11-18
- **Creator:** draungminoo
- **Assignee:** draungminoo
- **Related:** **NOTE-008**; Projects shell (Batches/Doses later)
- **Note:** Originally drafted as “program”; renamed to **project** (`projectNo` / `PJ`). No `program` naming remains.

## Goal

Add **ProjectMaster**: name, auto `projectNo` (`PJ` + `YYYY` + 4 digits), optional description. CRUD under Masters → Projects → Projects panel.

## Scope

- [x] `ProjectMaster` entity (`name`, `projectNo`, `description?`) — replaces prior code/fromDate/toDate shape for this master
- [x] `CODE_STRUCTURE.projectNo` + `PROJECT_NO` code type
- [x] CRUD APIs + RBAC subject `project`
- [x] Work UI Projects panel (list/create/edit/active)
- [x] Leave Batches / Doses as placeholders
- [x] Remove Sessions masters page from Work UI

## Out of scope

- TypeORM migration file (apply table SQL manually until migrations are touched)
- BatchMaster / DoseMaster
- Dropping `session_master` table / entity (UI only removed)

## Done when

- [x] Admin can list/create/update/activate projects
- [x] `projectNo` generated as `PJ[YYYY][4 digits]` and immutable after create
- [x] No Programs route/menu/copy in Work UI

## Manual SQL (local DB; no migration)

```sql
DROP TABLE IF EXISTS "program_master";

DROP TABLE IF EXISTS "project_master";
CREATE TABLE "project_master" (
  "createdDate" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  "createdBy" uuid,
  "updatedDate" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  "updatedBy" uuid,
  "active" boolean NOT NULL DEFAULT true,
  "id" uuid NOT NULL,
  "name" character varying(125) NOT NULL,
  "projectNo" character varying(16) NOT NULL,
  "description" character varying(256),
  CONSTRAINT "UQ_project_master_projectNo" UNIQUE ("projectNo"),
  CONSTRAINT "CHK_project_master_projectNo" CHECK ("projectNo" ~ '^PJ[0-9]{4}[0-9]{4}$'),
  CONSTRAINT "PK_project_master" PRIMARY KEY ("id")
);
```
