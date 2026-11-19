# Master Management System module gate

- **Id:** TICK-041
- **Status:** done
- **Repos:** SERVER | WORK
- **Opened:** 2026-11-19
- **Finished:** 2026-11-19
- **Creator:** draungminoo
- **Assignee:** draungminoo
- **Related:** **TICK-039**, **TICK-011** · **MEET-013** / **NOTE-017**

## Goal

Gate the Masters (reference data) app behind a system module code.

## Scope

- [x] Seed `MASTER_MANAGEMENT_SYSTEM` in `system-module.upsert.json`
- [x] `ModuleGate` on `/masters*` routes
- [x] Home tile + masters sidebar `moduleCode`
- [x] `ALL_SYSTEM` remains wildcard

## Out of scope

- Splitting location / project / category into separate systems

## Done when

- [x] Masters routes / tile / sidebar require `MASTER_MANAGEMENT_SYSTEM` or `ALL_SYSTEM`
