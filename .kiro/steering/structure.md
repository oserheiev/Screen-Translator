# Project Structure & Organization

## Directory Layout

```
screen-translator/
├── electron/                    # Electron main process
│   ├── main.ts                 # Main process entry point
│   ├── preload.ts              # Secure IPC preload script
│   ├── types.ts                # Electron-specific types
│   ├── tsconfig.json           # Main process TypeScript config
│   └── *.test.ts               # Main process tests
├── src/                        # React renderer process
│   ├── components/             # React UI components
│   ├── contexts/               # React Context providers
│   ├── services/               # Business logic services
│   ├── types/                  # Shared TypeScript definitions
│   ├── mocks/                  # Test mocks
│   ├── App.tsx                 # Main React component
│   ├── index.tsx               # React entry point
│   ├── capture.html            # Screen capture overlay
│   ├── styles.css              # Global styles
│   └── tsconfig.json           # Renderer TypeScript config
├── assets/                     # Static assets
│   └── icons/                  # Application icons
├── build/                      # Compiled output
├── dist/                       # Packaged applications
└── node_modules/               # Dependencies
```

## Code Organization Principles

### Component Structure
- **Single Responsibility**: Each component handles one specific UI concern
- **Props Interface**: All components use TypeScript interfaces for props
- **Test Co-location**: `.test.tsx` files alongside components
- **Naming Convention**: PascalCase for components, camelCase for functions

### Service Layer
- **Business Logic Separation**: Services handle API calls and data processing
- **Error Handling**: Consistent error handling patterns across services
- **Testability**: Services are easily mockable for testing
- **Single Purpose**: Each service handles one domain (clipboard, gemini, etc.)

### Type Definitions
- **Shared Types**: Common types in `src/types/index.ts`
- **Domain-Specific**: Electron types in `electron/types.ts`
- **Strict Typing**: No `any` types, comprehensive interfaces

## File Naming Conventions

### Components
- `ComponentName.tsx` - React component
- `ComponentName.test.tsx` - Component tests
- `index.tsx` - Entry points and re-exports

### Services
- `service-name.service.ts` - Service implementation
- `service-name.service.test.ts` - Service tests

### Configuration
- `tsconfig.json` - TypeScript configuration
- `webpack.config.js` - Webpack bundling config
- `jest.config.js` - Testing configuration

## Import/Export Patterns

### Preferred Import Style
```typescript
// Named imports for utilities
import { useState, useEffect } from 'react';

// Default imports for components
import CaptureButton from './components/CaptureButton';

// Type-only imports
import type { SupportedLanguage } from './types';
```

### Module Resolution
- **Relative Imports**: For local files (`./`, `../`)
- **Absolute Imports**: From node_modules
- **Path Mapping**: Configured in tsconfig.json for clean imports

## Testing Organization

### Test Structure
- **Co-located Tests**: Tests next to source files
- **Separate Projects**: Jest configured for renderer vs main process
- **Mock Strategy**: Comprehensive mocks in `src/mocks/`
- **Test Utilities**: Shared test helpers in `src/test-utils.tsx`

### Coverage Requirements
- **Minimum 70%**: Lines, functions, branches, statements
- **Critical Paths**: Screen capture and translation flows
- **Component Testing**: React Testing Library for UI components
- **Integration Testing**: IPC communication between processes