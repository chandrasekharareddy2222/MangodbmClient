/**
 * Environment configuration for QA
 */

export const environment = {
  production: false,
  envName: 'qa',
  apiBaseUrl: 'https://qa-api.example.com/api',
  apiTimeout: 30000,
  enableLogging: true,
  enableDebugTools: true,
  features: {
    enableAnalytics: true,
    enableNotifications: true
  }
};
