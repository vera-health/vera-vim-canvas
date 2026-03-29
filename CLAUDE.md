@AGENTS.md

# Pull requests

When opening a PR:

1. **Metadata** — always set:
   - Assignee: `maximealc`
   - Label: one of `feature`, `fix`, `refactor`, `infra`, `documentation`
2. **Description** — keep it short:
   - 1–3 bullet "what changed" summary
   - A brief "why" if it's not obvious from the title
   - A test plan (what to verify before merging)

# Planning

Before starting non-trivial work (anything touching 3+ files or introducing new patterns), propose a short plan first:
- What files you'll touch and why
- Any trade-offs or alternatives you considered
- What the verification steps are

Skip the plan for simple fixes, renames, or single-file changes.
