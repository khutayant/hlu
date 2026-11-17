# Meeting: Admin Users, account active, User vs Employee

- **Id:** MEET-005
- **Date:** 2026-11-17
- **Attendees:** draungminoo
- **Status:** tracked; Users/active and EmployeeMaster/Staff UI delivered
- **Note:** **NOTE-005**
- **Tickets:** **TICK-018** done · **TICK-019** done
- **Context:** After RBAC admin shells, need account management (active/inactive) and a clear model for staff vs login.

## Notes

- `UserMaster.active` already exists on `BaseEntityWithNoPrimary`; login previously forced `active: true` on upsert — removed.
- Inactive login surfaces as `User account is inactive`; hlu-work callback maps `/inactive/i` → `auth.accountInactive` Alert.
- Admin Users is account-only; Staff/Employee is deferred.
- Link preference discussed: navigate as `user.employee`, store FK on employee.

## Decisions

| # | Decision | Lock |
| --- | --- | --- |
| D16 | Admin **Users** manages login accounts only (`UserMaster`); Status switch + Active/Inactive filter; admin cannot toggle self. | preferred |
| D17 | Inactive accounts must not complete login; do not reactivate on Keycloak upsert. | preferred |
| D18 | Callback shows i18n error Alert for inactive (`auth.accountInactive` EN/MM). | preferred |
| D19 | Split **user (account)** and **employee (HR)** tables when building Staff. | preferred |
| D20 | FK owns on **employee** (`employee.userId` nullable unique); TypeORM inverse `user.employee` — no `employeeId` on user row. | preferred |
| D21 | Ribbon Close uses a fixed parent/home route (not history back). | preferred |
| D22 | Shared display datetime: `DD-MMM-YYYY hh:mm:ss A`. | preferred |

## Action items

| Item | Owner | Ticket |
| --- | --- | --- |
| Commit server + hlu-work Users/active work | draungminoo | **TICK-018** ✓ |
| Implement EmployeeMaster + Staff UI | draungminoo | **TICK-019** ✓ |
