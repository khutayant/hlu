# UI base path, static serve, Vercel

- **Id:** TICK-002
- **Status:** done
- **Repos:** UI | SERVER
- **Opened:** 2026-10-24
- **Finished:** 2026-10-24
- **Creator:** draungminoo
- **Assignee:** draungminoo
- **Related:** **MEET-002** / **NOTE-002**

## Goal

Correct asset/API base paths under `/ui/hlu/`, serve built UI from server, support Vercel root build.

## Scope

- [x] Align API/UI base paths
- [x] Fix asset URLs under `/ui/hlu/`
- [x] Server UI static serving + production deploy script
- [x] Vercel build via `VITE_BASE=/` / `build:vc`
- [x] Allow Vercel deploy without local `.env`

## Out of scope

- `deploy-ui` dual-branch push (TICK-004)

## Done when

- [x] UI loads correctly under nested base and Vercel root
