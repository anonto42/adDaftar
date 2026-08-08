# AGENTS.md — AI Assistant Guide for adDaftar

This file provides guidance for AI coding assistants (Claude Code, Cursor, OpenAI Codex, etc.) working on adDaftar.

## Project Overview

**adDaftar** is a multi-business point-of-sale (POS) and inventory management mobile app built with Expo (React Native), TypeScript, and SQLite. It is offline-first with no backend dependency.

### Key Facts

- **Framework**: Expo SDK 54, React Native 0.81, React 19
- **Language**: TypeScript 5.9 (strict mode)
- **Navigation**: Expo Router v6 (file-based, typed routes)
- **State**: Zustand v5 (per-feature stores)
- **Database**: SQLite via expo-sqlite (local only, no backend)
- **Styling**: Expo components with custom theme (light/dark)
- **Package Manager**: pnpm
- **Target**: iOS, Android (mobile/tablet)

## Architecture

```
app/           → Expo Router routes (file-based navigation)
src/
  features/   → Feature modules (business, sales, inventory, etc.)
    {feature}/
      api/    → Repository layer (SQLite queries in *.repository.ts)
      model/  → Zustand stores (*.store.ts)
      ui/     → React screens (*.tsx)
  services/   → Shared services (database, api client)
  shared/     → Shared modules (components, theme, types, utils, i18n)
  store/      → Global Zustand stores (ui.store.ts, app.store.ts)
doc/          → Implementation phase documentation
```

### Design Principles

1. **Feature-Sliced Design** — Group files by feature, not type
2. **Repository Pattern** — All SQL in `*.repository.ts` files
3. **Zustand Stores** — Each feature has its own store; hydrated on business switch
4. **Type Safety** — TypeScript strict mode; types in `src/shared/types/`
5. **Multi-Business Isolation** — All queries scoped by `business_id`
6. **No Backend** — Everything local; SQLite is the source of truth

## Development Workflow

### Running the Project

```bash
pnpm install   # Install dependencies
pnpm start     # Start Expo dev server
```

### Common Tasks

| Task | Command |
|------|---------|
| Start dev server | `pnpm start` |
| Run on Android | `pnpm android` |
| Run on iOS | `pnpm ios` |
| Run on web | `pnpm web` |
| Lint | `pnpm lint` |

### Adding a New Feature

1. Create folder: `src/features/{feature-name}/`
2. Add `api/{feature}.repository.ts` — SQLite data access
3. Add `model/{feature}.store.ts` — Zustand store
4. Add `ui/` — React screens
5. Add `index.ts` — Export from feature
6. Export from `src/features/index.ts`

### Database Operations

- All SQL goes in `src/services/database/` and `*.repository.ts` files
- Use `executeQuery`, `executeQuerySingle`, `executeStatement` from `@/src/services/database`
- All queries must be scoped by `business_id`
- New tables go in `src/services/database/schema.ts`
- Migrations go in `src/services/database/schema-v*-migration.ts`

### State Management

- Zustand stores per feature
- Hydrate from SQLite in `hydrate()` method
- Re-hydrate dependent stores on business switch
- Global UI state in `src/store/ui.store.ts`
- App settings in `src/features/settings/model/app.store.ts`

## File Naming Conventions

- **Repository files**: `{feature}.repository.ts`
- **Store files**: `{feature}.store.ts`
- **Screens**: `PascalCase.tsx`
- **Components**: `PascalCase.tsx`
- **Utilities**: `kebab-case.ts`
- **Types**: `kebab-case.ts` or `shop.types.ts`

## Import Patterns

- Shared types: `@/src/shared/types`
- Components: `@/src/shared/components`
- Database utils: `@/src/services/database`
- Theme: `@/src/shared/theme`
- Features: `@/src/features/{feature-name}`

## Common Patterns

### Repository Pattern

```typescript
import { executeQuery, executeStatement } from "@/src/services/database";
import { Product } from "@/src/shared/types";

export const productRepository = {
  findAll: async (businessId: string): Promise<Product[]> => {
    return await executeQuery<Product>(
      'SELECT * FROM products WHERE business_id = ? AND deleted_at IS NULL',
      [businessId]
    );
  },
  // ... create, update, delete
};
```

### Zustand Store Pattern

```typescript
import { create } from "zustand";
import { productRepository } from "../api/product.repository";

export const useProductStore = create<ProductState>()((set, get) => ({
  products: [],
  hydrate: async () => {
    const products = await productRepository.findAll(businessId);
    set({ products });
  },
  // ... other actions
}));
```

### Screen Pattern

```typescript
export default function ProductScreen() {
  const { theme } = useTheme();
  const products = useProductStore((state) => state.products);
  const hydrate = useProductStore((state) => state.hydrate);

  useEffect(() => {
    hydrate();
  }, []);

  // ... render UI
}
```

## Testing

Currently, there is no formal test suite. Manual testing focus areas:
- Multi-business scenarios (switching businesses)
- Offline behavior (no internet)
- Database migrations (app upgrades)
- Edge cases in POS checkout

If adding tests, use Jest + jest-expo.

## CI/CD

Currently no CI/CD pipelines configured. GitHub Actions workflows will be added for:
- Linting
- Type checking
- Building preview and production apps

## Useful References

- [Expo Documentation](https://docs.expo.dev/)
- [Expo Router](https://docs.expo.dev/router/introduction/)
- [Zustand](https://github.com/pmndrs/zustand)
- [SQLite with Expo](https://docs.expo.dev/versions/latest/sdk/sqlite/)
