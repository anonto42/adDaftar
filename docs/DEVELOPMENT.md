# Development Guide

## Getting Started

### Prerequisites

- **Node.js** 20+ — [Download](https://nodejs.org)
- **pnpm** 9+ — Install with `npm install -g pnpm`
- **Expo CLI** — Install with `npm install -g expo-cli`
- **iOS Simulator** (macOS only) or **Android Studio** for device emulation
- **Expo Go** app on your physical device (optional, for quick testing)

### Setup

```bash
# Clone the repository
git clone https://github.com/anonto42/adDaftar.git
cd adDaftar

# Install dependencies
pnpm install

# Start the development server
pnpm start
```

In the Expo Dev Tools menu:
- Press `i` to run on the iOS simulator
- Press `a` to run on the Android emulator
- Scan the QR code with Expo Go on your physical device

## Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm start` | Start the Expo development server |
| `pnpm android` | Run on Android emulator/device |
| `pnpm ios` | Run on iOS simulator/device |
| `pnpm web` | Run in web browser |
| `pnpm lint` | Run ESLint to check code quality |

## Development Workflow

### 1. Creating a New Feature

Follow the feature-sliced design pattern:

```bash
# 1. Create feature directory
mkdir -p src/features/my-feature/{api,model,ui}

# 2. Create repository (data access)
touch src/features/my-feature/api/my-feature.repository.ts

# 3. Create store (state management)
touch src/features/my-feature/model/my-feature.store.ts

# 4. Create UI screens
touch src/features/my-feature/ui/MyFeatureScreen.tsx

# 5. Export from index
echo "export * from './api/my-feature.repository';
export * from './model/my-feature.store';" > src/features/my-feature/index.ts

# 6. Add to features barrel export
```

### 2. Adding Database Tables

1. Add the table creation SQL to `src/services/database/schema.ts`
2. Add table to `TABLE_STATEMENTS` array
3. If adding indexes, add to `INDEX_STATEMENTS` array
4. Create a migration file if this is a schema change (`schema-vN-migration.ts`)

### 3. Adding a New Screen

1. Create a new `.tsx` file in the appropriate feature's `ui/` directory
2. Add a route in `app/(tabs)/` or `app/` (if it's a standalone screen)
3. Export from the feature's `index.ts` if needed

### 4. Multi-Business Data Access

Every repository method that accesses data must accept and use `businessId`:

```typescript
export const productRepository = {
  findAll: async (businessId: string): Promise<Product[]> => {
    return await executeQuery<Product>(
      'SELECT * FROM products WHERE business_id = ? ORDER BY name ASC',
      [businessId]
    );
  },
};
```

## Code Conventions

### TypeScript

- Use TypeScript strictly. No plain JavaScript.
- Avoid `any` — use proper typing with interfaces.
- Import types using `@/src/shared/types`.

### Naming

| Element | Convention | Example |
|---------|------------|---------|
| Files (TS) | `kebab-case.ts` | `product.repository.ts` |
| Files (TSX) | `PascalCase.tsx` | `ProductScreen.tsx` |
| Variables | `camelCase` | `productList` |
| Functions | `camelCase` | `getProductById()` |
| Components | `PascalCase` | `ProductCard` |
| Stores | `useStoreName` | `useProductStore` |
| Repositories | `entityRepository` | `productRepository` |

### Import Patterns

```typescript
// Shared types
import { Product, Customer } from '@/src/shared/types';

// Shared components
import { Button, Input } from '@/src/shared/components';

// Feature imports
import { useProductStore } from '@/src/features/inventory';

// Database utilities
import { executeQuery, executeStatement } from '@/src/services/database';
```

## Git Hooks

The project includes git hooks for code quality and commit message validation. Install them after cloning:

```bash
pnpm setup
```

### Hooks Installed

| Hook | What It Checks |
|------|----------------|
| **pre-commit** | Runs ESLint, checks for large files, sensitive files, and macOS metadata |
| **commit-msg** | Validates conventional commit format (e.g., `feat(scope): description`) |
| **pre-push** | Runs linting, prevents direct pushes to `main` branch |

## Testing

There is currently no formal test suite. Tests are run manually during development.

### Manual Testing Checklist

- [ ] Multi-business scenarios (switch between businesses)
- [ ] Offline behavior (app works without internet)
- [ ] Database migrations (upgrading from older versions)
- [ ] POS checkout flow (add products, apply discount, complete sale)
- [ ] Inventory management (add/edit/delete products, categories)
- [ ] Customer ledger (track dues, make payments)
- [ ] Expense tracking (add, edit, delete expenses)
- [ ] Analytics and reports (verify data accuracy)
- [ ] Dark/light theme switching
- [ ] Language switching

## Debugging

### Database Inspector

SQLite data is stored in the app's local storage. To inspect the database:

**Android:**
```bash
# Forward device port
adb forward tcp:8080 localfilesystem:/data/data/com.addaftar.com/files/expo-db/port

# Then use any SQLite browser to connect to the forwarded port
```

**iOS (Simulator):**
The database file is in the simulator's data directory. Use Xcode's Devices window to access it.

### Logs

The app uses `console.log` for development logging. Key log tags:
- `[DB]` — Database operations
- `[App]` — App lifecycle and initialization
- `[BusinessStore]`, `[ProductStore]`, etc. — Feature-specific logs

### Common Issues

| Issue | Solution |
|-------|----------|
| "database is locked" | Should not happen — writes are queued. If it does, restart the app. |
| Store not updating | Check if `hydrate()` was called or if business was switched. |
| Migration failed | The app will still start. Check schema version in `app_settings` table. |
| Theme not applying | Ensure `ThemeProvider` wraps the component tree (it's in `_layout.tsx`). |

## CI/CD (Future)

Planned GitHub Actions workflows:
- `lint.yml` — ESLint checks on every PR
- `typecheck.yml` — TypeScript type checking
- `build.yml` — EAS builds on release

## Best Practices

1. **Keep stores hydrated** — Always re-hydrate stores on business switch
2. **Scope by business_id** — Never query without `business_id` filter
3. **Use transactions** — For operations that must be atomic (checkout, etc.)
4. **Handle errors gracefully** — Don't let database errors crash the UI
5. **Optimize queries** — Use indexes for frequently queried columns
6. **Clean up data** — Consider data retention for logs, search history, etc.
