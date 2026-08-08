# Contributing to adDaftar

First off, thank you for considering contributing to adDaftar! It's people like you that make this project great.

This document outlines how to contribute to the project, including setting up a development environment, coding standards, and the process for submitting contributions.

---

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Environment](#development-environment)
- [Project Structure](#project-structure)
- [Coding Standards](#coding-standards)
- [How to Contribute](#how-to-contribute)
- [Pull Request Process](#pull-request-process)
- [Testing](#testing)
- [Reporting Bugs](#reporting-bugs)
- [Feature Requests](#feature-requests)
- [Code of Conduct Violations](#code-of-conduct-violations)

---

## Code of Conduct

By participating in this project, you agree to abide by the [Code of Conduct](CODE_OF_CONDUCT.md). Be respectful and constructive in all interactions.

---

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

- **Node.js** 20+ — [Download](https://nodejs.org)
- **pnpm** 9+ — `npm install -g pnpm`
- **Expo CLI** — `npm install -g expo-cli`
- **Android Studio** (for Android) or **Xcode** (for iOS) — for device emulators
- **Expo Go** app on your physical device (optional, for quick testing)

### Setup

```bash
# 1. Fork and clone the repository
git clone https://github.com/YOUR-USERNAME/adDaftar.git
cd adDaftar

# 2. Install dependencies
pnpm install

# 3. Install git hooks (linting, commit validation)
pnpm setup

# 4. Start the development server
pnpm start
```

You can now:
- Press `i` to run on the iOS simulator
- Press `a` to run on the Android emulator
- Scan the QR code with Expo Go on your physical device

---

## Development Environment

### Installing Dependencies

We recommend using **pnpm** for consistent, fast dependency resolution:

```bash
pnpm install    # Install all dependencies
pnpm add <package>   # Add a new dependency
pnpm add -D <package>  # Add a dev dependency
```

### Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm start` | Start the Expo dev server |
| `pnpm android` | Run on Android emulator/device |
| `pnpm ios` | Run on iOS simulator/device |
| `pnpm web` | Run in web browser |
| `pnpm lint` | Run ESLint to check code quality |

### Environment Variables

This project does not require any environment variables for local development. All data is stored locally in SQLite. If you plan to add API integration, use a `.env` file (see `.gitignore` for ignored patterns) and access values via `expo-constants`.

---

## Project Structure

The project follows a **feature-sliced design** pattern. If you're adding a new feature, follow the existing structure:

```text
src/
├── features/                 # Feature modules (feature-sliced design)
│   ├── {feature-name}/
│   │   ├── api/              # Data access (repository pattern)
│   │   │   └── *.repository.ts
│   │   ├── model/            # State management (Zustand stores)
│   │   │   └── *.store.ts
│   │   ├── ui/               # UI screens
│   │   │   └── *.tsx
│   │   └── index.ts          # Feature exports
├── services/                 # Shared services
│   ├── database/             # SQLite database layer
│   └── api/                  # API clients (future)
├── shared/                   # Shared modules
│   ├── components/           # Reusable UI components
│   ├── theme/                # Theme system
│   ├── types/                # TypeScript types
│   ├── utils/                # Utility functions
│   └── i18n/                 # Localization
└── store/                    # Global Zustand stores
```

See the [Architecture Documentation](docs/ARCHITECTURE.md) for more details.

---

## Coding Standards

### TypeScript

- Use **TypeScript** for all new code — no plain JavaScript.
- Use strict typing. Avoid `any` unless absolutely necessary.
- Use interfaces for complex types (see `src/shared/types/`).

### Naming Conventions

- **Files**: `kebab-case.ts` for TypeScript files, `PascalCase.tsx` for React components
- **Variables/Functions**: `camelCase`
- **Components**: `PascalCase`
- **Constants**: `UPPER_SNAKE_CASE` for module-level constants
- **Stores**: `useStoreName` (e.g., `useProductStore`, `useSalesStore`)
- **Repositories**: `featureRepository` (e.g., `productRepository`, `salesRepository`)

### Code Style

- Run `pnpm lint` before committing to ensure your code follows the style guide.
- Use the existing import patterns (e.g., `@/src/shared/types` for shared types).
- Keep functions small and focused (single responsibility).
- Add JSDoc comments for exported functions, especially repository methods.

### Database Conventions

- All new tables must be added to `src/services/database/schema.ts`.
- Database operations should be in repository files (`*.repository.ts`).
- Use `executeQuery`, `executeQuerySingle`, and `executeStatement` from the database service.
- Always scope queries by `business_id` for multi-business isolation.

---

## How to Contribute

### Reporting Issues

Before reporting an issue:

1. Check the [existing issues](https://github.com/anonto42/adDaftar/issues) to avoid duplicates.
2. Test on the latest code to see if the issue has been fixed.

When reporting a bug, use the **Bug Report** template and include:
- A clear title and description
- Steps to reproduce
- Expected and actual behavior
- Screenshots or error messages
- Environment (device, OS, app version)

### Feature Requests

Use the **Feature Request** template to suggest new features. Be specific about:
- What problem the feature solves
- How it should work
- Any alternatives you've considered

### Types of Contributions

We welcome the following types of contributions:

- 🐛 **Bug fixes** — Fix issues from the bug tracker
- ✨ **New features** — Implement features from the backlog
- 📚 **Documentation** — Improve docs, add examples, fix typos
- 🎨 **UI/UX** — Improve the user interface or experience
- 🧪 **Testing** — Add or improve test coverage
- 🌍 **Internationalization** — Add new languages or fix translations

---

## Pull Request Process

### 1. Fork and Branch

```bash
git fork https://github.com/anonto42/adDaftar.git  # if using GitHub CLI
# or use the GitHub website to fork, then:
git clone https://github.com/YOUR-USERNAME/adDaftar.git
cd adDaftar
```

Create a branch for your feature:

```bash
git checkout -b feat/your-feature-name
# or for a bugfix:
git checkout -b fix/issue-description
```

### 2. Make Your Changes

- Follow the project structure and coding standards.
- Make atomic, focused commits:
  ```
  feat(sales): add partial payment support
  fix(inventory): correct low stock alert threshold
  docs(analytics): update report generation docs
  ```
- Commit messages should follow [Conventional Commits](https://www.conventionalcommits.org/).

### 3. Run Checks

Before submitting, ensure:

```bash
pnpm lint     # Passes without errors
```

### 4. Push and Open a PR

```bash
git push origin feat/your-feature-name
```

Then open a Pull Request on GitHub.

### 5. PR Review Process

- A maintainer will review your PR.
- We aim to respond to PRs within **48 hours**.
- Address feedback promptly or ask for clarification if needed.
- Once approved and CI passes, your PR will be merged.

---

## Testing

This project is currently pre-release and does not have a formal test suite yet. Testing is done manually during development. If you'd like to help set up a testing framework, please open a feature request issue!

### Manual Testing Guidelines

- Test on both iOS and Android simulators/devices
- Verify multi-business scenarios (switch between businesses)
- Test offline behavior (no internet)
- Verify database migrations work correctly when upgrading

---

## Reporting Bugs

Use the **Bug Report** GitHub issue template. If possible, include:

- The app version
- Device model and OS version
- Steps to reproduce
- Expected behavior
- Actual behavior
- Screenshots or error logs

---

## Feature Requests

Use the **Feature Request** GitHub issue template. Describe:

- The problem your feature request solves
- Proposed solution
- Alternatives considered

---

## Code of Conduct Violations

If you believe someone is violating the Code of Conduct, please report it to `hello@sohidul.com`. All reports will be reviewed and investigated.

---

Thank you for contributing to adDaftar! 🚀
