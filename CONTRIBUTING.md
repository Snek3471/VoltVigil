# Contributing to VoltVigil

Thank you for contributing! Please follow this Git workflow to keep the codebase clean and prevent conflicts.

---

## Git Workflow

### 1. Always branch from `dev`

```bash
git checkout dev
git pull origin dev
git checkout -b feature/your-feature-name
```

Use a descriptive prefix:
- `feature/` – new functionality
- `fix/` – bug fixes
- `docs/` – documentation only
- `chore/` – tooling, config, dependencies

### 2. Make your changes and commit

```bash
git add .
git commit -m "feat: describe what you did"
```

Follow [Conventional Commits](https://www.conventionalcommits.org/) where possible.

### 3. Push your feature branch

```bash
git push origin feature/your-feature-name
```

### 4. Open a Pull Request into `dev`

- Go to GitHub and open a PR from your feature branch **into `dev`** (not `main`).
- Fill in the PR template with a description of what changed and why.
- At least one team member must review and approve before merging.
- Delete the feature branch after merging.

### 5. Merging `dev` into `main`

Only stable, tested code moves from `dev` → `main`.  
This is done by the project lead via a PR after team review.

---

## Rules

| Rule | Detail |
|------|--------|
| ❌ Never push directly to `main` | `main` is protected |
| ❌ Never push directly to `dev` | Always use a PR |
| ✅ All work starts on a feature branch from `dev` | |
| ✅ All PRs require at least one approval | |
| ✅ CODEOWNERS are automatically requested as reviewers | |

---

## Code Ownership

| Path | Owner |
|------|-------|
| `/frontend/**` | Person 1 |
| `/backend/**` | Person 1 |
| `/firmware/**` | Persons 2 & 3 |
| `/hardware/**` | Persons 2 & 3 |

---

## Questions?

Open an issue or reach out to the team lead.
