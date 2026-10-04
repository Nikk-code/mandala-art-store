# Git Standards & Version Control Guidelines

## 1. Branching Strategy

The repository follows a clean, lightweight Git branching workflow tailored for practical development without bureaucratic overhead:

```
main (Production releases)
  ▲
develop (Active integration & staging)
  ▲
feature/*  |  fix/*  |  refactor/*  |  docs/*
```

### Branch Categories

- **`main`**: Represents the stable, production-ready release state. Only merged via tested pull requests or vetted integration milestones.
- **`develop`**: The primary integration branch where completed features, fixes, and docs converge.
- **`feature/<short-description>`**: Dedicated branches for implementing specific features (e.g., `feature/catalog-filters`, `feature/razorpay-checkout`).
- **`fix/<short-description>`**: Dedicated branches for resolving defects (e.g., `fix/cart-quantity-calc`, `fix/mobile-nav-scroll`).
- **`refactor/<short-description>`**: Targeted branches for code cleanup, deduplication, or restructuring without user-facing behavioral changes.
- **`docs/<short-description>`**: Dedicated branches for documentation and AI governance updates.

---

## 2. Commit Message Standards

Commits must follow the **Conventional Commits** specification. Messages should be concise, written in the imperative mood, and lowercase.

### Format

```
<type>: <short summary>

[optional body explaining motivation or context]
```

### Allowed Types

- **`feat:`** A new user-facing or system capability.
  - _Example_: `feat: add product catalog filtering by art category`
- **`fix:`** A bug fix or defect resolution.
  - _Example_: `fix: correct cart subtotal calculation on item removal`
- **`refactor:`** Code changes that neither fix a bug nor add a feature (e.g., extracting components, renaming for clarity).
  - _Example_: `refactor: extract reusable product card component`
- **`test:`** Adding new tests or correcting existing tests.
  - _Example_: `test: add unit tests for discount coupon validation`
- **`docs:`** Documentation changes, guides, or `.ai/` updates.
  - _Example_: `docs: update tech stack and testing standards`
- **`chore:`** Maintenance tasks, build tool configuration, package updates.
  - _Example_: `chore: configure vitest and testing-library setup`

---

## 3. Hygiene & Collaboration Rules

- **Atomic Commits**: Each commit should represent a single logical change. Do not bundle unrelated refactorings with feature implementations.
- **Clean Diffs**: Avoid committing spurious whitespace adjustments, temporary debug logs (`console.log`), or unformatted files.
- **Never Force Push to Shared Branches**: Never run `git push --force` against `main` or `develop`.
- **Review Before Merging**: Ensure tests pass, types check (`tsc --noEmit`), and relevant `.ai` documentation is updated before completing a branch.
