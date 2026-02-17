import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

/**
 * Logger Service
 * 
 * Architecture Decision: Centralized logging
 * - Single Responsibility Principle: Handles all logging concerns
 * - Can be easily extended to send logs to remote server
 * - Environment-aware (logs only in dev if configured)
 * - Provides consistent logging interface
 */

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR'
}

@Injectable({
  providedIn: 'root'
})
export class LoggerService {
  
  debug(message: string, ...args: unknown[]): void {
    if (environment.enableLogging) {
      this.log(LogLevel.DEBUG, message, args);
    }
  }

  info(message: string, ...args: unknown[]): void {
    if (environment.enableLogging) {
      this.log(LogLevel.INFO, message, args);
    }
  }

  warn(message: string, ...args: unknown[]): void {
    if (environment.enableLogging) {
      this.log(LogLevel.WARN, message, args);
    }
  }

  error(message: string, error?: Error, ...args: unknown[]): void {
    if (environment.enableLogging) {
      this.log(LogLevel.ERROR, message, [error, ...args]);
    }
  }

  private log(level: LogLevel, message: string, args: unknown[]): void {
    const timestamp = new Date().toISOString();
    const formattedMessage = `[${timestamp}] [${level}] ${message}`;

    switch (level) {
      case LogLevel.DEBUG:
        console.debug(formattedMessage, ...args);
        break;
      case LogLevel.INFO:
        console.info(formattedMessage, ...args);
        break;
      case LogLevel.WARN:
        console.warn(formattedMessage, ...args);
        break;
      case LogLevel.ERROR:
        console.error(formattedMessage, ...args);
        break;
    }

    // Future enhancement: Send logs to remote logging service
    // this.sendToRemoteLogger(level, message, args);
  }
}
