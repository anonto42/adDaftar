import Constants from 'expo-constants';

/**
 * Environment Configuration
 *
 * Centralizes all environment variables and app configuration.
 * Supports different environments (development, staging, production).
 */

const getDevApiUrl = () => {
  if (process.env.EXPO_PUBLIC_API_BASE_URL) {
    return process.env.EXPO_PUBLIC_API_BASE_URL;
  }

  // Get the machine's IP address from Expo's constants
  // This allows connecting to the dev server when running on a physical device via Expo Go
  const debuggerHost = Constants.expoConfig?.hostUri;
  const localhost = debuggerHost?.split(':').shift() || 'localhost';

  return `http://${localhost}:8089/api/v1`;
};

const ENV = {
  development: {
    API_BASE_URL: getDevApiUrl(),
    USE_MOCK_DATA: false,
    MOCK_DELAY_MS: 500,
    ENABLE_LOGGING: true,
  },
  staging: {
    API_BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL || 'https://staging-api.example.com/api/v1',
    USE_MOCK_DATA: false,
    MOCK_DELAY_MS: 0,
    ENABLE_LOGGING: true,
  },
  production: {
    API_BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL || 'https://api.example.com/api/v1',
    USE_MOCK_DATA: false,
    MOCK_DELAY_MS: 0,
    ENABLE_LOGGING: false,
  },
} as const;

type Environment = keyof typeof ENV;

// Determine current environment
const getCurrentEnvironment = (): Environment => {
  const env = process.env.EXPO_PUBLIC_APP_ENV as Environment;
  if (env && ENV[env]) {
    return env;
  }
  return __DEV__ ? 'development' : 'production';
};

export const APP_ENV = getCurrentEnvironment();
export const config = ENV[APP_ENV];

// Feature flags for future features
export const featureFlags = {
  enableStories: true,
  enableReels: false,
  enableDirectMessages: false,
  enableLiveStreaming: false,
  enablePushNotifications: false,
  enableOfflineMode: false,
  enableAnalytics: false,
} as const;

// App constants
export const APP_CONSTANTS = {
  APP_NAME: 'SocialMedia',
  APP_VERSION: '1.0.2',
  PAGINATION_LIMIT: 20,
  MAX_IMAGE_SIZE_MB: 10,
  MAX_VIDEO_SIZE_MB: 100,
  MAX_CAPTION_LENGTH: 2200,
  MAX_COMMENT_LENGTH: 1000,
  MAX_BIO_LENGTH: 150,
  STORIES_DURATION_SECONDS: 5,
} as const;
