---
name: hots-monitor-workflow
description: Use when working in the hots-monitor repository on code, tests, migrations, documentation, configuration, project skills, or verification tasks.
---

# Hots Monitor Workflow

Use this repository's existing architecture and finish each completed task with a git commit.

## Project Shape

- Monorepo managed by `pnpm`.
- Backend: `apps/api`, NestJS, Prisma, SQLite, Jest.
- Frontend: `apps/web`, React, Vite, TypeScript, Vitest.
- Shared contracts: `packages/shared`, Zod schemas and shared TypeScript types.
- Agent skills: `skills/*/SKILL.md`; skills should call backend APIs instead of duplicating collection, AI, or scoring logic.

## Task Workflow

1. Inspect relevant files before changing behavior.
2. Check `git status --short` before editing; treat existing user changes as off-limits unless the task requires working with them.
3. For features, bug fixes, refactors, and behavior changes, write or update the focused test first and watch it fail for the expected reason.
4. Make the smallest scoped change that satisfies the task and follows nearby patterns.
5. Run focused verification first, then broader verification when the change has wider reach.
6. Review `git diff` and ensure only intended files are staged.
7. Commit every completed task before final response or before starting a separate task.

Do not mark a task complete if the relevant verification is failing. If unrelated pre-existing failures block verification, report them clearly and commit only the finished, reviewed change set.

## Commit Discipline

Every completed task requires a git commit.

Before committing:

- Run `git status --short`.
- Stage only files changed for the task. Do not stage unrelated user work from the dirty worktree.
- Run `git diff --cached --check`.
- Use a concise message matching project history, such as `feat: add monitor lifecycle`, `fix(web): correct trend state`, or `docs: add workflow skill`.

If a task includes multiple independent deliverables, complete and commit them one at a time. Do not bundle unrelated backend, frontend, and documentation changes into one commit unless they are one logical change.

## Verification Commands

Use the narrowest command that proves the change, then broaden as needed:

```powershell
pnpm --filter @hots-monitor/api test
pnpm --filter @hots-monitor/web test
pnpm --filter @hots-monitor/shared test
pnpm typecheck
pnpm build
```

For API-only changes, prefer `pnpm --filter @hots-monitor/api test` and `pnpm --filter @hots-monitor/api typecheck`.

For web-only changes, prefer `pnpm --filter @hots-monitor/web test` and `pnpm --filter @hots-monitor/web typecheck`.

For shared contracts, Prisma schema changes, or cross-package changes, run affected package tests plus `pnpm typecheck`.

## Backend Rules

- Keep business logic in services and controllers thin.
- Validate AI JSON with Zod schemas from `packages/shared` where possible.
- A failed source, AI analysis, or notification send should not fail an entire collection job unless the caller explicitly requested that single operation.
- For Prisma schema changes, create a migration and regenerate the client when needed:

```powershell
pnpm prisma:migrate
pnpm prisma:generate
```

- Keep scheduled jobs idempotent; jobs may run repeatedly and should respect monitor intervals and enabled flags.

## Frontend Rules

- Build operational dashboard UI, not a landing page.
- Keep pages dense, scannable, and responsive.
- Put API access in `apps/web/src/api/client.ts` or nearby established client helpers.
- Use shared types when API response shapes are already represented in `packages/shared`.
- Add or update Vitest/Testing Library coverage for user-visible behavior.

## Skill Rules

- Keep project skills concise and API-backed.
- Do not reimplement backend source collection, DeepSeek prompts, scoring, or notification logic in a skill.
- Validate skill folders with:

```powershell
python C:\Users\32652\.codex\skills\.system\skill-creator\scripts\quick_validate.py skills\<skill-name>
```

## Common Mistakes

| Mistake | Correction |
| --- | --- |
| Finishing without a commit | Commit the completed task before final response. |
| Staging the whole dirty tree | Stage only files owned by the current task. |
| Adding frontend-only types for API contracts | Prefer shared Zod/type definitions when the shape is cross-package. |
| Duplicating backend logic in skills | Call the existing backend endpoints. |
| Running only broad tests after code changes | Start with focused tests so failures are easier to diagnose. |
