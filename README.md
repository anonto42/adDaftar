# adDaftar

<div align="center">

[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://www.apache.org/licenses/LICENSE-2.0)
[![Expo](https://img.shields.io/badge/Expo-SDK_54-black?logo=expo)](https://expo.dev)
[![React Native](https://img.shields.io/badge/React_Native-0.81.5-20232A?logo=react&logoColor=61DAFB)](https://reactnative.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?logo=typescript&logoColor=white)](https://www.typescriptlang.com)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/anonto42/adDaftar/pulls)

**A multi-business point-of-sale (POS) and inventory management mobile app built with Expo — offline-first, privacy-focused, and designed for small businesses.**

[Features](#-features) · [Screenshots](#-screenshots) · [Quick Start](#-quick-start) · [Documentation](#-documentation) · [Architecture](#-architecture) · [Contributing](#-contributing) · [License](#-license)

</div>

---

## What is adDaftar?

**adDaftar** (Arabic: "الدفتر" meaning "the ledger/book") is a **multi-business point-of-sale (POS) and inventory management mobile app** built with [Expo](https://expo.dev) (React Native) and [SQLite](https://www.sqlite.org). It is designed for small-to-medium businesses — particularly corner shops, local retailers, and vendors — who need a reliable, privacy-focused app that works **offline** without depending on a server or cloud service.

With adDaftar, you can:
- Manage **multiple businesses** from a single app
- Process sales with **POS checkout**, partial payments, discounts, and multiple payment methods
- Track **inventory** with low-stock alerts and categorization
- Maintain a **customer ledger** with due tracking
- Record **expenses** by category
- Generate **analytics and PDF reports**
- Switch between **light/dark themes** and multiple languages

> **No internet? No problem.** Everything is stored locally in SQLite. There are no backend servers, no subscriptions, and no data sent to the cloud.

---

## Features

### Core Features

| Category | Features |
|----------|----------|
| **Multi-Business** | Manage multiple shops/businesses from one app with per-business entity isolation |
| **Point of Sale** | Cart-based checkout, cash/due payments, partial payments, discounts |
| **Inventory** | Products, categories, low-stock alerts, cost price tracking for profit analysis |
| **Customers** | Customer management with total purchases, purchase count, and due balances |
| **Expenses** | Categorized expense tracking with monthly totals and reporting |
| **Payments** | Customer payment history for tracking due amounts |
| **Analytics** | Sales trends, top products, top customers, financial summaries |
| **Reports** | PDF report generation with customizable date ranges |

### Technical Features

| Feature | Description |
|---------|-------------|
| **Offline-First** | Full SQLite local database — zero internet dependency |
| **Multi-Language** | English, Bengali, Arabic, Hindi, Spanish, French |
| **Dark Mode** | System-aware light/dark theme with persistence |
| **Database Migrations** | Versioned schema with 6+ migration steps |
| **Transactional** | Atomic checkout with stock validation and updates |
| **Export** | Print and share receipts/reports via native sharing |

---

## Screenshots

<div align="center">
  <!-- Onboarding -->
  <img src="assets/images/onboarding-preview.png" width="200" alt="Onboarding - Language Selection" />
  <img src="assets/images/onboarding-welcome.png" width="200" alt="Onboarding - Welcome Screen" />

  <!-- Main Screens -->
  <img src="assets/images/dashboard-preview.png" width="200" alt="Dashboard" />
  <img src="assets/images/sales-screen.png" width="200" alt="Sales / POS" />
  <img src="assets/images/inventory-screen.png" width="200" alt="Inventory" />
  <img src="assets/images/analytics-screen.png" width="200" alt="Analytics" />
  <img src="assets/images/customers-screen.png" width="200" alt="Customers" />
  <img src="assets/images/expenses-screen.png" width="200" alt="Expenses" />
  <img src="assets/images/settings-screen.png" width="200" alt="Settings" />
  <img src="assets/images/reports-screen.png" width="200" alt="Reports" />
</div>

> **Note:** If the screenshot images don't exist yet, the app icon and splash screen will be shown instead. See the [Screenshots Guide](docs/SCREENSHOTS.md) for instructions on capturing app screenshots.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | [Expo](https://expo.dev) ~54.0.33, [React Native](https://reactnative.dev) 0.81.5 |
| **Language** | [TypeScript](https://www.typescriptlang.com/) 5.9 |
| **Navigation** | [Expo Router](https://docs.expo.dev/router/introduction/) v6 (file-based routing) |
| **State Management** | [Zustand](https://github.com/pmndrs/zustand) v5 |
| **Database** | [expo-sqlite](https://docs.expo.dev/versions/latest/sdk/sqlite/) — SQLite |
| **UI Styling** | [Expo Linear Gradient](https://docs.expo.dev/versions/latest/sdk/linear-gradient/), [Expo Blur](https://docs.expo.dev/versions/latest/sdk/blur/) |
| **Icons** | [@expo/vector-icons](https://icons.expo.fyi/) (Ionicons, Material Community Icons) |
| **Data Fetching** | [@tanstack/react-query](https://tanstack.com/query) v5 |
| **Storage** | [@react-native-async-storage/async-storage](https://github.com/react-native-async-storage/async-storage) |
| **Print & Share** | [expo-print](https://docs.expo.dev/versions/latest/sdk/print/), [expo-sharing](https://docs.expo.dev/versions/latest/sdk/sharing/) |
| **Build** | Expo Application Services (EAS) |
| **Package Manager** | [pnpm](https://pnpm.io) |
| **Linting** | [ESLint](https://eslint.org) 9 |

---

## Quick Start

### Prerequisites

- [Node.js](https://nodejs.org) 20+
- [pnpm](https://pnpm.io) (recommended) or npm
- [Expo CLI](https://docs.expo.dev/get-started/installation/) — `npm install -g expo-cli`
- iOS Simulator (for iOS) or Android Studio (for Android) — or use [Expo Go](https://docs.expo.dev/get-started/expo-go/)

### Development Setup

```bash
# Clone the repository
git clone https://github.com/anonto42/adDaftar.git
cd adDaftar

# Install dependencies
pnpm install

# Install git hooks (linting, commit validation)
pnpm setup

# Start the development server
pnpm start
# or: npm run start
```

This will open the Expo Dev Tools. You can then:
- Press `i` to run on iOS simulator
- Press `a` to run on Android emulator
- Scan the QR code with the **Expo Go** app on your physical device

### Building for Production

```bash
# Using EAS (recommended)
eas build --platform android
eas build --platform ios
```

See the [Deployment Guide](docs/DEPLOYMENT.md) for more details.

---

## Documentation

- [Project Structure](docs/ARCHITECTURE.md)
- [Database Schema](docs/DATABASE.md)
- [API Reference](docs/API.md)
- [Development Guide](docs/DEVELOPMENT.md)
- [Deployment Guide](docs/DEPLOYMENT.md)
- [Contributing Guidelines](../CONTRIBUTING.md)

---

## Project Structure

```text
adDaftar/
├── app/                          # Expo Router routes (file-based routing)
│   ├── _layout.tsx               # Root layout with app initialization
│   ├── onboarding.tsx            # Onboarding entry point
│   ├── privacy-policy.tsx
│   ├── settings.tsx
│   ├── sales-history.tsx
│   ├── reports.tsx
│   ├── business.tsx
│   ├── customers/
│   │   └── [id].tsx              # Customer detail screen
│   └── (tabs)/                   # Tab navigation
│       ├── _layout.tsx           # Custom side tab bar
│       ├── index.tsx             # Dashboard
│   ├── analytics.tsx
│   ├── sales.tsx
│       ├── expenses.tsx
│       ├── products.tsx
│       ├── categories.tsx
│       └── customers.tsx
├── src/
│   ├── features/                 # Feature modules (feature-sliced design)
│   │   ├── business/             # Multi-business support
│   │   ├── sales/                # POS, cart, sales history
│   │   ├── inventory/            # Products, categories
│   │   ├── customers/            # Customer management, payments
│   │   ├── expenses/             # Expense tracking
│   │   ├── analytics/            # Charts, reports, dashboards
│   │   ├── settings/             # App settings, preferences
│   │   ├── onboarding/           # First-run setup
│   │   ├── dashboard/            # Overview/dashboard
│   │       # Each feature has: api/ (repositories), model/ (stores), ui/ (screens)
│   ├── services/                 # Shared services
│   │   ├── database/             # SQLite database layer
│   │   └── api/                  # API client (optional sync)
│   ├── shared/                   # Shared modules
│   │   ├── components/           # Reusable UI components
│   │   ├── theme/                # Light/dark theme system
│   │   ├── types/                # TypeScript type definitions
│   │   ├── utils/                # Utility functions
│   │   └── i18n/                 # Localization
│   └── store/                    # Global Zustand stores
├── assets/                       # Images, icons, splash
├── doc/                          # Implementation documentation
├── .eslintrc.js                  # ESLint config
└── package.json
```

---

## Architecture

adDaftar follows a **feature-sliced design** with a clear separation of concerns:

```
┌─────────────────────────────────────────────────────────┐
│                        Presentation                      │
│                 (app/ + src/features/*/ui/)             │
└───────────────┬─────────────────────────────────────────┘
                │ React Navigation / Expo Router
┌───────────────▼─────────────────────────────────────────┐
│                       State Management                   │
│         (src/features/*/model/ + src/store/)            │
└───────────────┬─────────────────────────────────────────┘
                │ Repository pattern
┌───────────────▼─────────────────────────────────────────┐
│                   Data Access Layer                     │
│       (src/features/*/api/ + src/services/database/)   │
└───────────────┬─────────────┬───────────────────────────┘
                │             │
┌───────────────▼──┐        ┌─▼───────────────────────────┐
│     SQLite       │        │   AsyncStorage (settings)   │
│  (local DB)      │        │                             │
└──────────────────┘        └─────────────────────────────┘
```

### Key Design Patterns

1. **Repository Pattern** — Data access is encapsulated in repository classes (`*.repository.ts`) with pure SQL queries
2. **Zustand Stores** — Each feature manages its state independently via Zustand stores, hydrated on business switch
3. **Feature-Sliced Design** — Each feature folder contains `api/` (data), `model/` (state), `ui/` (screens)
4. **Database-First** — SQLite schema is the single source of truth; migrations are versioned
5. **Transactional Checkout** — Sales are processed in atomic transactions to prevent race conditions

See the [Architecture Documentation](docs/ARCHITECTURE.md) for details.

---

## Features in Detail

### Multi-Business Support

Switch between businesses seamlessly with the SideTabBar. Each business has completely isolated data (products, customers, sales, expenses). No cross-contamination of business data.

### Point of Sale (POS)

- Add products to cart with quantity adjustment
- Support for **partial payments** — record received amounts for due sales
- Discounts (amount or percentage)
- Cash or due payment types
- Customer association with sales
- Stock validation before checkout
- Profit calculation per transaction

### Analytics & Reports

- **Dashboard**: Today's sales, profit, expenses, transaction count
- **Sales Trends**: 7-day, 30-day rolling charts
- **Top Products**: Revenue and units sold ranking
- **Top Customers**: By total purchases and frequency
- **Low Stock Alerts**: Products at or below reorder level
- **Financial Summary**: Total sales, profit, expenses, net profit
- **PDF Reports**: Export with date range selection

---

## Development

### Available Scripts

```bash
pnpm start        # Start Expo dev server
pnpm android      # Run on Android emulator/device
pnpm ios          # Run on iOS simulator/device
pnpm web          # Run in web browser
pnpm lint         # Run ESLint
```

### Code Conventions

- **Feature-Sliced Design** — group files by feature, not by type
- **Zustand + React Query** — Zustand for client state, React Query for server state (when API is added)
- **TypeScript Strict** — full type safety throughout
- **Expo Router** — file-based routing with typed routes
- **Atomic UI** — reusable shared components in `src/shared/components/`

See the [Development Guide](docs/DEVELOPMENT.md) for more details.

---

## Contributing

Contributions are welcome! Please read our [Contributing Guidelines](CONTRIBUTING.md) first.

### How to Contribute

1. Fork the repository
2. Create your feature branch: `git checkout -b feat/your-feature`
3. Commit your changes: `git commit -m "feat: add your feature"`
4. Push to the branch: `git push origin feat/your-feature`
5. Open a Pull Request

### Reporting Issues

Found a bug or have a feature request? [Open an issue](https://github.com/anonto42/adDaftar/issues/new) with:
- A clear title and description
- Steps to reproduce (for bugs)
- Screenshots or logs (if applicable)

---

## Community

- **GitHub Issues**: For bugs, feature requests, and discussions
- **Discussions**: For longer conversations and Q&A

---

## License

This project is licensed under the **Apache License 2.0** — see the [LICENSE](LICENSE) file for details.

---

## Acknowledgments

- [React Native](https://reactnative.dev) community
- [Expo](https://expo.dev) team for the incredible framework
- Open-source POS projects that inspired this work:
  - [PocketPOS](https://github.com/harshithasompura/pocket-pos)
  - [InVo](https://github.com/Rakesh-ada/InVo)
  - [WooCommerce POS](https://github.com/wcpos/monorepo)

---

**Built with ❤️ using [Expo](https://expo.dev) and [React Native](https://reactnative.dev)**