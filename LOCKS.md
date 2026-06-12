# Session Lock File

## Purpose
Prevents two Claude sessions from editing the same file at the same time.
Both the Tech Head session and Marketing Head session must follow these rules.

## Active Locks
<!-- Sessions write their lock here when they start editing a file -->
<!-- Format: | filename | session | started | -->

| File | Session | Started |
|------|---------|---------|
| *(none)* | | |

---

## Rules (MANDATORY for all sessions)

### Before editing ANY file:
1. Read this file first
2. Check the Active Locks table above
3. If the file you want to edit is listed → **STOP. Tell the user:**
   > "⚠️ Another session (Marketing Head / Tech Head) is currently working on `[filename]`. Wait for them to finish before I edit it — otherwise we'll get a conflict."
4. If the file is NOT listed → add your lock, then proceed

### When you start editing a file:
Replace the `*(none)*` row (or add a new row) with:
| `filename` | `Tech Head` or `Marketing Head` | current date/time |

Example:
| src/app/api/research-lead/route.js | Marketing Head | 2026-06-07 14:32 |

### When you finish editing and push:
Remove your row from the table. If no locks remain, restore the `*(none)*` row.

---

## File Ownership (default — can be overridden)

| File | Default Owner |
|------|--------------|
| src/app/api/research-lead/route.js | Marketing Head |
| src/app/api/linkedin-intelligence/route.js | Marketing Head |
| src/app/smart-outreach/page.js | Tech Head |
| src/app/api/send-email/route.js | Tech Head |
| CLAUDE.md | Either (coordinate first) |
| LOCKS.md | Either |
