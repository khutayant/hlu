# Separate EmployeeMaster from UserMaster

- **Id:** TICK-019
- **Status:** done
- **Repos:** SERVER | WORK
- **Opened:** 2026-11-17
- **Finished:** 2026-11-17
- **Creator:** draungminoo
- **Assignee:** draungminoo
- **Related:** **MEET-005** / **NOTE-005** · depends on **TICK-018** (Users = accounts)

## Goal

Split login accounts from employee (HR) records so auth stays lean and staff can exist without a login.

## Scope

- [x] `EmployeeMaster` entity (employee no, name, gender, township, position, experience, hire/end, contact, …)
- [x] Link: FK on **employee** → `user` (`employee.userId` nullable); optional linked login
- [x] Admin Staff/Employee UI separate from Users (`/staff/employee`, import/export, profile)
- [x] `EMPLOYEE_MANAGEMENT_SYSTEM` module seed + UI ModuleGate; `ALL_SYSTEM` remains wildcard
- [x] Seed `{subject}:manage` for every permission subject
- [x] CSV import (focal dup check) + CSV export with confirm; ribbon Close → fixed routes

## Out of scope

- Replacing Keycloak / UserMaster
- Moving roles/permissions onto employee
- Dedicated position / experience masters (free text for now)

## Done when

- [x] Employee can exist without a user account
- [x] User can exist without an employee (e.g. system admin)
- [x] Staff employee pages gated by `EMPLOYEE_MANAGEMENT_SYSTEM` (or `ALL_SYSTEM`)
