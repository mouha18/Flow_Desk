# Flowdesk — Contributing

---

## Branch Strategy

```text
main              → production-ready, protected
dev               → integration branch, all PRs merge here first
feat/[name]       → new features (e.g. feat/invoice-generation)
fix/[name]        → bug fixes (e.g. fix/timer-calculation)
chore/[name]      → tooling, config, refactors (e.g. chore/update-deps)
```

---

## Commit Convention

```text
feat: add AI invoice generation screen
fix: correct timeSpent calculation in stopTimer mutation
chore: update Convex schema with deliverableLink field
refactor: extract TimerControl into standalone component
docs: update API_CONTRACT with invoices:update shape
style: apply spacing tokens to ContractCard component
```

---

## Development Workflow

1. Pull latest `dev` branch: `git pull origin dev`
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Write your code following the standards below
4. Run `npx expo start` and test on Expo Go (physical device preferred)
5. Run `npx convex dev` to confirm Convex functions deploy without errors
6. Commit with conventional commit message
7. Push branch and open PR targeting `dev`
8. At least one review before merge (or self-review with checklist)
9. Delete feature branch after merge

---

## Code Standards

- TypeScript strict mode — no `any`, no `@ts-ignore` without explanation
- All Convex functions use `v` validators on every argument — no unvalidated input
- All Convex functions check auth and role before any data access
- No API keys in the Expo client bundle — Anthropic and Resend keys in Convex env only
- Components use design system constants — no hardcoded hex values or pixel values
- Every screen must handle three states: loading, empty, and error
- Hooks are the only place that calls `useMutation` or `useQuery` — screens import hooks, not Convex directly
- SQLite writes happen in hooks after Convex query results, never in components

---

## Questions

Open a GitHub issue or message the team on the project chat.
