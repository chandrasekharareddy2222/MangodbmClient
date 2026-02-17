# Enterprise Angular Application

A production-ready Angular application demonstrating best practices, clean architecture, and enterprise-level patterns.

**Angular Version:** 20.3.15 (Latest Stable)

## 📋 Table of Contents

- [Project Structure](#project-structure)
- [Architectural Decisions](#architectural-decisions)
- [Features](#features)
- [Getting Started](#getting-started)
- [Development](#development)
- [Testing](#testing)
- [Production Build](#production-build)
- [Environment Configuration](#environment-configuration)

## 🏗️ Project Structure

```
enterprise-angular-app/
├── src/
│   ├── app/
│   │   ├── core/                    # Singleton services (imported once)
│   │   │   ├── guards/
│   │   │   │   ├── auth.guard.ts           # Authentication guard
│   │   │   │   └── role.guard.ts           # Role-based authorization guard
│   │   │   ├── interceptors/
│   │   │   │   ├── auth.interceptor.ts     # JWT token attachment
│   │   │   │   └── error.interceptor.ts    # Global error handling
│   │   │   ├── models/
│   │   │   │   ├── user.model.ts           # User & auth models
│   │   │   │   └── api-response.model.ts   # API response types
│   │   │   ├── services/
│   │   │   │   ├── auth.service.ts         # Authentication service (Signal-based)
│   │   │   │   ├── logger.service.ts       # Centralized logging
│   │   │   │   ├── storage.service.ts      # LocalStorage abstraction
│   │   │   │   ├── loading.service.ts      # Global loading state
│   │   │   │   └── global-error-handler.service.ts
│   │   │   ├── state/                      # Global state management
│   │   │   └── core.module.ts              # Core module definition
│   │   │
│   │   ├── shared/                  # Reusable components & utilities
│   │   │   ├── components/
│   │   │   │   ├── loading-spinner/        # Loading spinner component
│   │   │   │   └── not-found/              # 404 page component
│   │   │   ├── directives/
│   │   │   │   └── has-role.directive.ts   # Role-based UI rendering
│   │   │   ├── pipes/
│   │   │   │   └── truncate.pipe.ts        # Text truncation pipe
│   │   │   └── shared.module.ts
│   │   │
│   │   ├── features/                # Feature modules (lazy loaded)
│   │   │   ├── auth/
│   │   │   │   ├── login/
│   │   │   │   │   ├── login.component.ts
│   │   │   │   │   ├── login.component.html
│   │   │   │   │   └── login.component.scss
│   │   │   │   ├── auth-routing.module.ts
│   │   │   │   └── auth.module.ts
│   │   │   │
│   │   │   └── dashboard/
│   │   │       ├── dashboard-home/
│   │   │       │   ├── dashboard.component.ts
│   │   │       │   ├── dashboard.component.html
│   │   │       │   └── dashboard.component.scss
│   │   │       ├── dashboard.service.ts    # Feature-specific service
│   │   │       ├── dashboard-routing.module.ts
│   │   │       └── dashboard.module.ts
│   │   │
│   │   ├── layout/                  # Layout components
│   │   │   ├── header/
│   │   │   │   ├── header.component.ts
│   │   │   │   ├── header.component.html
│   │   │   │   └── header.component.scss
│   │   │   ├── footer/
│   │   │   │   └── footer.component.ts
│   │   │   └── main/
│   │   │       └── main-layout.component.ts
│   │   │
│   │   ├── app.routes.ts            # Application routing
│   │   ├── app-module.ts            # Root module
│   │   ├── app.ts                   # Root component
│   │   ├── app.html
│   │   └── app.scss
│   │
│   ├── environments/                # Environment configuration
│   │   ├── environment.ts           # Development
│   │   ├── environment.qa.ts        # QA/Staging
│   │   └── environment.prod.ts      # Production
│   │
│   ├── index.html
│   ├── main.ts
│   └── styles.scss                  # Global styles
│
├── angular.json                     # Angular CLI configuration
├── tsconfig.json                    # TypeScript configuration
├── package.json
└── README.md
```

## 🎯 Architectural Decisions

### 1. **Module Architecture**

#### Core Module (Singleton Pattern)
- **Purpose:** Contains singleton services used throughout the app
- **Import:** Once in AppModule only
- **Prevention:** Guards against re-import using constructor check
- **Contains:** Guards, Interceptors, Global services

```typescript
// Prevents multiple imports
constructor(@Optional() @SkipSelf() parentModule: CoreModule) {
  if (parentModule) {
    throw new Error('CoreModule is already loaded. Import it in the AppModule only.');
  }
}
```

**Why:** Ensures services like AuthService, LoggerService are true singletons across the application.

#### Shared Module (Reusable Components)
- **Purpose:** Houses reusable components, directives, and pipes
- **Import:** Can be imported in multiple feature modules
- **Contains:** UI components, utility directives, pipes

**Why:** Promotes code reuse and DRY (Don't Repeat Yourself) principle.

#### Feature Modules (Lazy Loading)
- **Purpose:** Self-contained features with their own routing
- **Loading:** Lazy loaded for optimal performance
- **Examples:** AuthModule, DashboardModule

**Why:** Reduces initial bundle size, improves performance, and enables code splitting.

### 2. **State Management with Signals**

```typescript
// Signal-based reactive state
private currentUserSignal = signal<User | null>(null);
readonly currentUser = this.currentUserSignal.asReadonly();

// Computed values
readonly isAdmin = computed(() => this.userRoles().includes('ADMIN'));
```

**Why Signals over NgRx for this project:**
- **Simpler API:** Less boilerplate than NgRx
- **Built-in:** Part of Angular core (v16+)
- **Performance:** Fine-grained reactivity
- **Type-safe:** Full TypeScript support
- **Learning curve:** Easier for teams new to reactive state

**When to use NgRx:**
- Complex state dependencies
- Time-travel debugging needed
- Multiple state sources
- Large team with established NgRx patterns

### 3. **HTTP Interceptors**

#### Auth Interceptor
```typescript
// Automatically attaches JWT token to requests
if (token) {
  request = request.clone({
    setHeaders: { Authorization: `Bearer ${token}` }
  });
}
```

**Why:** Centralized auth header management, follows DRY principle.

#### Error Interceptor
```typescript
// Global error handling with logging
catchError((error: HttpErrorResponse) => {
  this.logger.error('Server-side error', error);
  this.loadingService.hide();
  return throwError(() => ({ message: errorMessage, originalError: error }));
})
```

**Why:** Consistent error handling, automatic loading state management, user-friendly error messages.

### 4. **Route Guards (Functional Guards)**

```typescript
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  // Modern inject() function instead of class-based guards
};
```

**Why Functional Guards:**
- **Modern approach:** Angular 15+ recommended pattern
- **Simpler:** No class boilerplate
- **Testable:** Easier to unit test
- **Composable:** Can combine multiple guards easily

### 5. **Environment Configuration**

```typescript
// environment.ts, environment.qa.ts, environment.prod.ts
export const environment = {
  production: false,
  apiBaseUrl: 'http://localhost:3000/api',
  // ... other config
};
```

**File Replacement in angular.json:**
```json
"fileReplacements": [
  {
    "replace": "src/environments/environment.ts",
    "with": "src/environments/environment.prod.ts"
  }
]
```

**Why:** Type-safe configuration, prevents hardcoded values, easy environment switching.

### 6. **SOLID Principles Implementation**

#### Single Responsibility Principle (SRP)
- Each service has one clear purpose
- `AuthService`: Authentication only
- `LoggerService`: Logging only
- `StorageService`: Storage abstraction only

#### Open/Closed Principle (OCP)
- `roleGuard()` factory: Open for extension (different roles), closed for modification

#### Liskov Substitution Principle (LSP)
- Interfaces used for models ensure substitutability

#### Interface Segregation Principle (ISP)
- Small, focused interfaces (e.g., `LoginRequest`, `LoginResponse`)

#### Dependency Inversion Principle (DIP)
- Components depend on abstractions (services) via dependency injection
- `StorageService` provides abstraction over `localStorage`

### 7. **TypeScript Best Practices**

✅ **No "any" type** - All types explicitly defined
✅ **Interfaces for all models** - Type safety throughout
✅ **Readonly signals** - Immutable state exposure
✅ **Strict null checks** - Handles nullable values properly
✅ **Enums for constants** - Type-safe role definitions

### 8. **Lazy Loading Strategy**

```typescript
{
  path: 'dashboard',
  loadChildren: () => import('./features/dashboard/dashboard.module')
    .then(m => m.DashboardModule),
  canActivate: [authGuard]
}
```

**Benefits:**
- Initial bundle size reduced
- Faster initial load time
- Code splitting per feature
- Features loaded on-demand

### 9. **Error Handling Strategy**

**Three-layer approach:**

1. **HTTP Interceptor:** Catches API errors
2. **Global Error Handler:** Catches unhandled JavaScript errors
3. **Service-level:** Specific error handling in services

### 10. **Responsive Design**

- Mobile-first CSS approach
- Flexbox/Grid layouts
- Media queries for responsive breakpoints
- Touch-friendly UI elements

## 🚀 Features

✅ **Authentication Module**
- Login/Logout functionality
- JWT token management
- Auto-login from stored credentials

✅ **Authorization**
- Route guards (functional guards)
- Role-based guards
- Directive for conditional UI rendering

✅ **HTTP Interceptors**
- Automatic token attachment
- Global error handling
- Loading state management

✅ **State Management**
- Signal-based reactive state
- Computed values
- Type-safe state operations

✅ **Logging Service**
- Environment-aware logging
- Multiple log levels (debug, info, warn, error)
- Extensible for remote logging

✅ **Loading Indicator**
- Global loading state
- Reference counting for concurrent requests
- Customizable spinner component

✅ **404 Page**
- User-friendly error page
- Navigation options
- Professional design

✅ **Responsive Layout**
- Header with navigation
- Footer
- Main content area
- Mobile-responsive

## 🛠️ Getting Started

### Prerequisites

- Node.js 24.13.0 or higher
- npm 11.6.2 or higher
- Angular CLI 20.3.15

### Installation

```bash
# Navigate to project directory
cd enterprise-angular-app

# Install dependencies
npm install

# Start development server
npm start
```

Application will be available at `http://localhost:4200`

## 💻 Development

### Development Server

```bash
# Start dev server with default environment (development)
ng serve

# Start with specific port
ng serve --port 4300

# Open browser automatically
ng serve --open
```

### Code Generation

```bash
# Generate a new component
ng generate component features/users/user-list

# Generate a new service
ng generate service core/services/notification

# Generate a new guard
ng generate guard core/guards/admin

# Generate a new module
ng generate module features/products --routing
```

### Linting  

```bash
# Run linter
ng lint

# Fix linting issues
ng lint --fix
```

## 🧪 Testing

### Unit Tests

```bash
# Run tests once
ng test

# Run tests in headless mode
ng test --browsers=ChromeHeadless

# Run tests with code coverage
ng test --code-coverage
```

### Coverage Reports

Coverage reports are generated in `coverage/` directory.

### Example Test Structure

```typescript
describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AuthService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('should login successfully', () => {
    // Test implementation
  });
});
```

## 📦 Production Build

### Build Commands

```bash
# Build for development
ng build

# Build for QA environment
ng build --configuration=qa

# Build for production
ng build --configuration=production
```

### Build Optimization

Production build includes:
- **Ahead-of-Time (AOT) compilation**
- **Tree shaking** - Remove unused code
- **Minification** - Reduce file size
- **Bundle optimization** - Optimal chunk sizes
- **Source maps disabled** - Security
- **Output hashing** - Cache busting

### Bundle Size Budgets

```json
{
  "type": "initial",
  "maximumWarning": "500kB",
  "maximumError": "1MB"
}
```

Build will warn/error if bundles exceed these sizes.

## 🌍 Environment Configuration

### Available Environments

1. **Development** (`environment.ts`)
   - Local API: `http://localhost:3000/api`
   - Logging enabled
   - Debug tools enabled

2. **QA** (`environment.qa.ts`)
   - QA API: `https://qa-api.example.com/api`
   - Logging enabled
   - Analytics enabled

3. **Production** (`environment.prod.ts`)
   - Production API: `https://api.example.com/api`
   - Logging disabled
   - Optimizations enabled

### Serving Different Environments

```bash
# Development (default)
ng serve

# QA
ng serve --configuration=qa

# Production
ng serve --configuration=production
```

## 📚 Key Files Explained

### Core Services

#### AuthService
- Manages user authentication state
- Handles login/logout
- Token management
- Signal-based state

#### LoggerService
- Centralized logging
- Environment-aware
- Multiple log levels
- Extensible for remote logging

#### LoadingService
- Global loading state
- Reference counting
- Automatic show/hide

### Guards

#### authGuard
- Protects routes requiring authentication
- Redirects to login if not authenticated
- Stores return URL

#### roleGuard
- Higher-order function for role-based access
- Flexible role checking
- Redirects to unauthorized page

### Interceptors

#### AuthInterceptor
- Attaches JWT token to requests
- Handles 401 unauthorized errors

#### ErrorInterceptor
- Global error handling
- User-friendly error messages
- Automatic loading state management

## 🏆 Best Practices Implemented

1. ✅ **Lazy Loading** - Feature modules loaded on-demand
2. ✅ **Signal-based State** - Modern reactive state management
3. ✅ **Functional Guards** - Modern Angular guard pattern
4. ✅ **HTTP Interceptors** - Centralized request/error handling
5. ✅ **Environment Config** - Type-safe configuration
6. ✅ **SOLID Principles** - Clean architecture
7. ✅ **No 'any' Types** - Fully typed TypeScript
8. ✅ **Responsive Design** - Mobile-first approach
9. ✅ **Error Handling** - Three-layer error strategy
10. ✅ **Testing Setup** - Unit test examples

## 📝 Next Steps

### Recommended Enhancements

1. **Add E2E Testing** - Implement Cypress or Playwright
2. **API Integration** - Connect to real backend
3. **Internationalization (i18n)** - Multi-language support
4. **PWA Features** - Service workers, offline support
5. **Accessibility (a11y)** - WCAG compliance
6. **Performance Monitoring** - Integrate analytics
7. **CI/CD Pipeline** - Automated deployment
8. **Docker Support** - Containerization
9. **Documentation Site** - Compodoc for code documentation
10. **Storybook** - Component documentation

## 📄 License

MIT License - feel free to use this as a template for your projects.

## 👥 Contributing

This is a template project. Fork it and customize for your needs!

---

**Built with ❤️ using Angular 20.3.15**
