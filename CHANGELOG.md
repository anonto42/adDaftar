# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial open-source release setup
- LICENSE file (Apache 2.0)
- Comprehensive README documentation
- Contributing guidelines
- Code of Conduct
- GitHub issue and PR templates
- Architecture and development documentation

### Changed
- Removed `"private": true` from package.json

## [1.0.3] - 2025-08-07

### Added
- **Multi-Business Support** — Manage multiple businesses from a single app with entity isolation
- **SideTabBar** — Global business switcher with instant transitions between shops
- **Product & Category Tabs** — Tab navigation for products and categories
- **Expense Categories** — Categorized expense tracking with monthly totals
- **Payment History** — Track customer payment history
- **Low Stock Alerts** — Products at or below reorder level
- **Analytics Dashboard** — Sales trends, top products, top customers, financial summary
- **PDF Reports** — Report generation with customizable date ranges
- **Currency Support** — Multiple currency options (USD, BDT, EUR, GBP, INR, JPY, SAR, AED)
- **Internationalization** — Support for English, Bengali, Arabic, Hindi, Spanish, French
- **Onboarding Flow** — First-run setup with business creation
- **Dark Mode** — Light/dark theme with system preference detection
- **Privacy Policy Screen** — In-app privacy policy display

### Changed
- **Partial Payments** — Support for `receivedAmount` at POS checkout
- **Customizable Reports** — Report generation with date range selection
- **Database Migrations** — Versioned SQLite schema migrations (v1-v6)
- **Database Architecture** — Professional SQLite with WAL mode, busy timeout, foreign keys
- **Schema Version** — Current version 6 with migrations for multi-business, partial payments, and sync timestamps

### Fixed
- Side tab bar styling
- Warning messages
- Database lock contention issues with write queue

## [1.0.0] - 2025-06-27

### Added
- **Initial Release** — Basic shop management app
- **Sales/POS** — Cart-based checkout with cash and due payment types
- **Inventory** — Product management with quantity tracking
- **Customer Management** — Customer records with purchase history
- **Analytics** — Basic sales charts and product performance
- **Database** — AsyncStorage to SQLite migration
- **Navigation** — Expo Router with tab navigation
- **Authentication** — Basic onboarding and business setup

---

## Release Process

Releases are managed via GitHub releases and semantic versioning:

1. Update version in `package.json` and `app.json`
2. Update `CHANGELOG.md` with changes
3. Create a GitHub release with notes
4. Tag the release (`git tag v{version}`)

---

*Note: Versions 1.0.0 through 1.0.3 were developed prior to open-sourcing. This changelog consolidates their changes for the initial public release.*
