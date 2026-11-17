# Separate EmployeeMaster from UserMaster

- **Id:** TICK-019
- **Status:** future
- **Repos:** SERVER | WORK
- **Opened:** 2026-11-17
- **Finished:**
- **Creator:** draungminoo
- **Assignee:**
- **Related:** **MEET-005** / **NOTE-005** · depends on **TICK-018** (Users = accounts)

## Goal

Split login accounts from employee (HR) records so auth stays lean and staff can exist without a login.

## Scope

- `EmployeeMaster` entity (employee no, name, dept/position, hire/end, status, contact, …)
- Link: FK on **employee** → `user` (`employee.userId` nullable unique); expose inverse `user.employee`
- Admin Staff/Employee UI separate from Users
- Optional: sync display name from employee when linked

## Out of scope

- Replacing Keycloak / UserMaster
- Moving roles/permissions onto employee

## Done when

- [ ] Employee can exist without a user account
- [ ] User can exist without an employee (e.g. system admin)
- [ ] `user.employee` loads via inverse OneToOne; DB column is on employee only
