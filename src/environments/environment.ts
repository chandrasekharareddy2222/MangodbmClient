/**
 * Environment configuration for development
 * 
 * Architecture Decision: Centralized environment configuration
 * - Enables easy switching between environments
 * - Type-safe configuration
 * - Prevents hardcoded values in components/services
 */

export const environment = {
  production: false,
  envName: 'dev',
  apiBaseUrl: 'http://localhost:3000/api',
  apiUrl: 'http://localhost:5000/api/v1',
  apiTimeout: 30000,
  enableLogging: true,
  enableDebugTools: true,
  features: {
    enableAnalytics: false,
    enableNotifications: true
  }
};
