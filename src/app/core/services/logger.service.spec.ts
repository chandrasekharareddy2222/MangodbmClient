import { TestBed } from '@angular/core/testing';
import { LoggerService } from './logger.service';

/**
 * Unit Test Example: Logger Service
 * 
 * Architecture Decision: Comprehensive testing
 * - Tests for each public method
 * - Verifies behavior and side effects
 * - Uses Angular Testing utilities
 */

describe('LoggerService', () => {
  let service: LoggerService;
  let consoleDebugSpy: jasmine.Spy;
  let consoleInfoSpy: jasmine.Spy;
  let consoleWarnSpy: jasmine.Spy;
  let consoleErrorSpy: jasmine.Spy;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [LoggerService]
    });
    
    service = TestBed.inject(LoggerService);
    
    // Spy on console methods
    consoleDebugSpy = spyOn(console, 'debug');
    consoleInfoSpy = spyOn(console, 'info');
    consoleWarnSpy = spyOn(console, 'warn');
    consoleErrorSpy = spyOn(console, 'error');
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should log debug messages when logging is enabled', () => {
    service.debug('Test debug message', { data: 'test' });
    expect(consoleDebugSpy).toHaveBeenCalled();
  });

  it('should log info messages when logging is enabled', () => {
    service.info('Test info message');
    expect(consoleInfoSpy).toHaveBeenCalled();
  });

  it('should log warning messages when logging is enabled', () => {
    service.warn('Test warn message');
    expect(consoleWarnSpy).toHaveBeenCalled();
  });

  it('should log error messages when logging is enabled', () => {
    const error = new Error('Test error');
    service.error('Test error message', error);
    expect(consoleErrorSpy).toHaveBeenCalled();
  });
});
