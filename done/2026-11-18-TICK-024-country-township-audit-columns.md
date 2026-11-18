# Country and Township created-by / updated-by columns

- **Id:** TICK-024
- **Status:** done
- **Repos:** SERVER | WORK
- **Opened:** 2026-11-18
- **Finished:** 2026-11-18
- **Creator:** draungminoo
- **Assignee:** draungminoo
- **Related:** **TICK-020** (country and township masters)

## Goal

Show who created and who last updated each country and township, with the person's name and the date, on the location master tables.

## Scope

- [x] Country list: replace the single Updated column with **Created by** and **Updated by**
- [x] Township list: same columns
- [x] Each cell shows the actor name, with the datetime underneath
- [x] APIs resolve `createdBy` / `updatedBy` user ids to `{ id, name }` (first + last name, otherwise username)
- [x] English and Burmese column labels

## Out of scope

- District master
- Changing how created/updated ids are stored (already on the base entity)
- Other masters that already show these columns (project, title, employee)

## Done when

- [x] `/masters/location/country` shows Created by and Updated by (name + date)
- [x] `/masters/location/township` shows the same columns
- [x] `GET /v1/country` and `GET /v1/township` include `createdBy` and `updatedBy` objects
