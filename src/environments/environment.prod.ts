/**
 * Environment configuration for production
 */

export const environment = {
  production: true,
  envName: 'prod',
  apiBaseUrl: 'https://api.example.com/api',
  apiTimeout: 30000,
  enableLogging: false,
  enableDebugTools: false,
  features: {
    enableAnalytics: true,
    enableNotifications: true
  }
};
