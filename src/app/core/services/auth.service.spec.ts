import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { AuthService } from './auth.service';
import { StorageService } from './storage.service';
import { LoggerService } from './logger.service';
import { provideRouter } from '@angular/router';

/**
 * Unit Test Example: Auth Service
 * 
 * Tests authentication service with HTTP mocking
 */

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let storageService: jasmine.SpyObj<StorageService>;
  let loggerService: jasmine.SpyObj<LoggerService>;

  beforeEach(() => {
    const storageSpy = jasmine.createSpyObj('StorageService', ['get', 'set', 'remove', 'clear']);
    const loggerSpy = jasmine.createSpyObj('LoggerService', ['info', 'error', 'warn', 'debug']);

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: StorageService, useValue: storageSpy },
        { provide: LoggerService, useValue: loggerSpy }
      ]
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    storageService = TestBed.inject(StorageService) as jasmine.SpyObj<StorageService>;
    loggerService = TestBed.inject(LoggerService) as jasmine.SpyObj<LoggerService>;
    
    // Default return values
    storageService.get.and.returnValue(null);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return null when no token is stored', () => {
    const token = service.getToken();
    expect(token).toBeNull();
  });

  it('should call logout and clear storage', () => {
    service.logout();
    expect(storageService.remove).toHaveBeenCalled();
  });
});
