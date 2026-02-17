import { Injectable } from '@angular/core';
import { LoggerService } from './logger.service';

/**
 * Storage Service
 * 
 * Architecture Decision: Abstraction over localStorage
 * - Dependency Inversion: Components depend on abstraction, not concrete implementation
 * - Easy to swap implementation (localStorage -> sessionStorage -> IndexedDB)
 * - Type-safe storage operations
 * - Centralized error handling
 */

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  
  constructor(private logger: LoggerService) {}

  set<T>(key: string, value: T): void {
    try {
      const serializedValue = JSON.stringify(value);
      localStorage.setItem(key, serializedValue);
    } catch (error) {
      this.logger.error(`Error storing item: ${key}`, error as Error);
    }
  }

  get<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(key);
      if (item === null) {
        return null;
      }
      return JSON.parse(item) as T;
    } catch (error) {
      this.logger.error(`Error retrieving item: ${key}`, error as Error);
      return null;
    }
  }

  remove(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      this.logger.error(`Error removing item: ${key}`, error as Error);
    }
  }

  clear(): void {
    try {
      localStorage.clear();
    } catch (error) {
      this.logger.error('Error clearing storage', error as Error);
    }
  }

  has(key: string): boolean {
    return localStorage.getItem(key) !== null;
  }
}
