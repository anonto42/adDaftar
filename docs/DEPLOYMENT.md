# Deployment Guide

## Building for Production

adDaftar is built with [Expo Application Services (EAS)](https://docs.expo.dev/eas/) for production builds.

### Prerequisites

- Expo account — [Sign up](https://expo.dev/signup) (free tier available)
- EAS CLI — `npm install -g eas-cli`
- Android SDK (for Android builds)
- Xcode (for iOS builds, macOS required)

### 1. Configure EAS

```bash
eas login
```

Update `eas.json` with your project configuration:

```json
{
  "cli": {
    "version": ">=3.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "production": {
      "android": {
        "buildType": "apk"
      }
    }
  }
}
```

### 2. Build Android (APK/AAB)

```bash
# Build APK (smaller, for direct installation)
eas build --platform android --profile production

# Build AAB (recommended for Play Store)
eas build --platform android --profile production --variant production
```

### 3. Build iOS (IPA)

```bash
eas build --platform ios
```

> **Note:** iOS builds require Apple Developer account credentials.

### 4. OTA Updates

For quick bug fixes without full app store resubmission:

```bash
eas update --branch production
```

## App Store Distribution

### Android

1. Build an AAB:
   ```bash
   eas build --platform android --profile production
   ```
2. Download from EAS dashboard
3. Upload to Google Play Console

### iOS

1. Build IPA:
   ```bash
   eas build --platform ios
   ```
2. Submit to App Store Connect via EAS Submit:
   ```bash
   eas submit --platform ios
   ```

## Versioning

Update versions in two places before each release:

1. **`package.json`**:
   ```json
   "version": "1.0.4"
   ```

2. **`app.json`**:
   ```json
   "expo": {
     "version": "1.0.4",
     ...
   }
   ```

## Environment Configuration

This project is offline-first and does not require API keys or environment variables. All data is stored locally in SQLite.

If you plan to add backend sync or external services in the future:

1. Create `.env` files (ignored by git):
   ```
   .env
   .env.production
   .env.staging
   .env.development
   ```

2. Access values via `expo-constants`:
   ```typescript
   import Constants from 'expo-constants';
   const apiUrl = Constants.expoConfig?.extra?.apiUrl;
   ```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Build fails with "No matching credentials" | Run `eas credentials` to set up signing credentials |
| "Execution failed for task ':app:processDebugResources'" | Ensure Android SDK is installed and `ANDROID_HOME` is set |
| App crashes on startup | Check EAS build logs; ensure all native modules are properly configured |
| OTA update not reflecting | Ensure you're on the correct branch; use `eas update --branch <branch>` |
