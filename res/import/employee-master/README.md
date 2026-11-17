# Employee master CSV import

Reference for bulk importing employees via **HLU Work** → Staff → Employees → **Import** (`/staff/employee/import`).

## Sample file

- [`employee-master.sample.csv`](./employee-master.sample.csv)

## Columns

### Mandatory (required)

| Column | Rules |
|--------|--------|
| `displayName` | Full display name (max 255). Not first/last. Empty → invalid row. |
| `focalNo` | Unique. Uppercased. Pattern `^[A-Z]+[0-9]+$` only (e.g. `A91`, `M003`). Max **9**. Empty, bad format, already in DB, or duplicated in the file → invalid row. |
| `gender` | `MALE`, `FEMALE`, or `OTHER` (case-insensitive). Aliases: `M` / `F` / `O`. Empty or unknown → invalid row. |
| `townshipName` | Township name (max 255). Free text for now; later will become a TownshipMaster relationship. Empty → invalid row. |
| `position` | Job position title (max 255). Free text for now; later managed via a dedicated position master. Empty → invalid row. |
| `experience` | Work experience text (max 255, e.g. `3 years`). Free text for now; later managed via a dedicated experience model. Empty → invalid row. |

### Optional

Leave blank if unused. Header may still be present.

| Column | Rules |
|--------|--------|
| `email` | Max 255. If set, must look like an email. |
| `phone` | Max 32. |
| `hireDate` | If set, must be `YYYY-MM-DD`. |
| `endDate` | If set, must be `YYYY-MM-DD`. |
| `remark` | Max 512. |

### Not in CSV (do not include)

| Field | Notes |
|-------|--------|
| `employeeNo` | Auto-generated on create (`H` + 4 digits, e.g. `H0001`). |
| `profileImage` / `user` | Set later in the employee form. |

## Header aliases (UI parser)

These header spellings are also accepted:

- `displayName` / `name` / `display_name`
- `focalNo` / `focal` / `focal_no`
- `gender` / `sex`
- `townshipName` / `township` / `township_name`
- `position` / `job` / `job_title`
- `experience` / `exp`
- `hireDate` / `hire_date`
- `endDate` / `end_date`
- `remark` / `remarks`

## Import flow (UI)

1. Pick CSV → rows load into an editable table.
2. Fix invalid rows (Valid / Invalid filter). Invalid when required fields fail, focal format fails, gender missing/invalid, or focal already exists / is duplicated in the file.
3. **Import** only valid rows into the DB (one create per row).

## Encoding

- UTF-8 CSV
- Comma-separated
- First row = header
- Quoted fields allowed (`"..."`); escape quotes as `""`
