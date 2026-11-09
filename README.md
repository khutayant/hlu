# HLU — Discussions

Meetings and notes that accompany tickets. Same remote as the rest of HLU.

## Branches

| Local folder | Branch |
| --- | --- |
| `discussions/` | `discussion` |

Remote: `https://github.com/khutayant/hlu.git`

## Git push

- This folder only: `npm run git:push` (branch `discussion`)
- All HLU branches: `bash /Users/aungminoo/Projects/HLU/scripts/git-push-all.sh`

## Folders

| Folder | Meaning |
| --- | --- |
| `meetings/` | Session / decision records (`MEET-NNN`) |
| `notes/` | Discussion notes (`NOTE-NNN`) |

## File names

- Meeting: `YYYY-MM-DD-MEET-NNN-short-slug.md`
- Note: `YYYY-MM-DD-NOTE-NNN-short-slug.md`

Copy `_template-meeting.md` / `_template-note.md`. Next numbers: **MEET-005**, **NOTE-005**.

## Track changes

When the user says **track changes**, update recent meetings/notes this thread affected, or create a new meeting + note when the topic is new. Link tickets. Zero loss of decisions.
