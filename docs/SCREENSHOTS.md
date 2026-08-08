# Screenshots Guide

## Capturing Screenshots

To capture clean, professional screenshots for the README and store listings:

1. **Run the app** on a simulator or physical device
2. **Complete the onboarding** flow (language selection, welcome, business setup)
3. **Navigate through all screens** and capture:

   | Screen | File Name |
   |--------|-----------|
   | Onboarding - Language Selection | `onboarding-language.png` |
   | Onboarding - Welcome | `onboarding-welcome.png` |
   | Onboarding - Business Setup | `onboarding-business.png` |
   | Dashboard | `dashboard.png` |
   | POS/Sales Screen | `sales-screen.png` |
   | Cart/Checkout | `cart-checkout.png` |
   | Products List | `inventory-screen.png` |
   | Product Detail/Edit | `product-detail.png` |
   | Categories | `categories-screen.png` |
   | Customers List | `customers-screen.png` |
   | Customer Detail | `customer-detail.png` |
   | Add/Edit Customer | `customer-edit.png` |
   | Sales History | `sales-history.png` |
   | Analytics Dashboard | `analytics-screen.png` |
   | Expense Tracking | `expenses-screen.png` |
   | Add/Edit Expense | `expense-edit.png` |
   | Reports | `reports-screen.png` |
   | Settings | `settings-screen.png` |
   | Business Switcher | `business-switcher.png` |
   | AI Assistant | `ai-screen.png` |

4. **Save screenshots** in the `assets/images/` directory
5. **Update README** with the correct image paths

## Screenshot Guidelines

- Use device frames for a professional look (e.g., iPhone 15 Pro frame)
- Capture in both light and dark mode if possible
- Ensure no personal or sensitive data is shown
- Use consistent screen sizes (e.g., 1170x2532 for iPhone)

## Placeholder Strategy

If real screenshots are not available yet, use the existing app icon and splash screen:

```markdown
<img src="assets/images/icon.png" width="200" alt="App Icon" />
```

## Automated Screenshot Tools

For automated screenshot capture, consider:
- **Device Preview** for Expo/React Native
- **Playwright** with device emulation
- Manual capture on simulators (Cmd+S on iOS Simulator, Ctrl+S on Android Emulator)
