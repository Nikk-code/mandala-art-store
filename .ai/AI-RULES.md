# AI Rules & Operating Principles

This repository is developed and maintained with the assistance of AI engineering agents (e.g., Gemini, Claude, GitHub Copilot, Cursor). To preserve architectural integrity, code hygiene, and project continuity across different tools and chat sessions without relying on volatile chat history, **EVERY AI agent must strictly follow these rules.**

---

## Core Guiding Principle

> **"Reuse before creating. Extend before duplicating. Simplify before adding complexity."**

---

## 1. Mandatory Workflow for Every AI Agent

Whenever assigned a task or prompt, follow this 11-step execution workflow in order:

1. **Read `AI-RULES.md`**: Refresh operating constraints and behavioral expectations.
2. **Read `CURRENT-STATUS.md`**: Understand current project phase, active work, and pending items.
3. **Identify Relevant `.ai` Documentation**: Load only the specific documents needed for the task (e.g., `TECH-STACK.md`, `BUSINESS-RULES.md`, `COMPONENT-STANDARDS.md`). Avoid unneeded context bloat.
4. **Inspect Existing Code**: Check existing directory structure, patterns, types, and logic before making changes.
5. **Search for Reusable Functionality**: Search for existing components, hooks, services, utilities, or types that can fulfill the requirement.
6. **Plan the Smallest Appropriate Change**: Design the minimal modification or addition adhering to established conventions.
7. **Implement the Change**: Follow project coding, typing, security, and component standards.
8. **Run Appropriate Validation/Tests**: Execute linter, type checks, and tests as applicable.
9. **Update Relevant Documentation**: If contracts, data models, or patterns change, update the corresponding `.ai/` document.
10. **Update `CURRENT-STATUS.md`**: Record completed work, in-progress items, and immediate next steps.
11. **Report Exactly What Changed**: Provide a concise summary of changes, file links, decisions, and any unresolved assumptions.

---

## 2. Code Reuse & Hygiene Rules

- **Understand before coding**: Never write speculative code without inspecting the target area and dependencies.
- **Search first**: Always search the codebase for existing reusable utilities, hooks, components, or services before implementing new ones.
- **Reuse and extend**: Prefer extending an existing, well-tested module over creating a parallel implementation.
- **No duplicate functionality**: Do not introduce alternative libraries, helpers, or UI components for capabilities that already exist.
- **No unnecessary abstractions**: Do not build layers of indirection, wrappers, or generic patterns until a concrete need presents itself.
- **No unnecessary files**: Only create files that have distinct, well-defined responsibilities.
- **No unnecessary dependencies**: Do not install new packages if existing packages or standard platform features suffice.
- **Preserve working functionality**: Never delete or rewrite working functionality without clear justification.
- **No dead code**: Remove superseded code cleanly; do not leave commented-out blocks or unused imports.

---

## 3. Architecture & Convention Rules

- **Do not alter architecture arbitrarily**: Adhere to the layered modular architecture described in `ARCHITECTURE.md`.
- **Do not silently change conventions**: Respect established naming, directory, and code styling patterns.
- **Separate concerns**: Keep UI presentation, application/state logic, and data/API access strictly decoupled.
- **No over-engineering**: This is a production ecommerce store for a specialized art business. Build a clean, modular monolith—not microservices or enterprise multi-tier complexity.

---

## 4. Quality & Engineering Standards

- **Maintain strict type safety**: Never bypass TypeScript checks with arbitrary `any` types; define clear interfaces and types.
- **Handle all UI states**: Every component that renders data must gracefully handle Loading, Error, Empty, and Success states.
- **Accessibility & Responsiveness**: Maintain semantic HTML, keyboard navigability, ARIA attributes, and fluid responsiveness across mobile, tablet, laptop, and desktop.
- **Write meaningful tests**: Test core business behavior, critical customer flows, and edge cases. Do not create brittle tests purely for coverage metrics.
- **Explain WHY in comments**: If code logic requires clarification, explain the rationale or constraint, not the self-evident syntax.

---

## 5. Documentation & Governance Rules

- **Record architectural decisions**: Document significant technical or architectural choices in `DECISIONS.md`.
- **Update status after work**: Keep `CURRENT-STATUS.md` strictly accurate and up-to-date after completing work.
- **Maintain changelog**: Document user-facing and architectural milestones in `CHANGELOG.md`.
- **Be truthful in status**: Never claim a feature is complete, tested, or deployed if it has not been verified.
