# Technology Stack & Build System

## Core Technologies

### Frontend Stack
- **React 18** with TypeScript for UI components
- **Electron** for desktop application framework
- **CSS** for styling (no framework dependencies)
- **Webpack** for bundling and development

### Backend/Main Process
- **Node.js** with TypeScript
- **Electron Store** for persistent settings
- **Google Gemini AI** (@google/genai) for OCR and translation

### Development Tools
- **TypeScript 5.4+** with strict mode enabled
- **Jest** for testing (dual environment: jsdom + node)
- **Webpack 5** with ts-loader
- **Electron Builder** for packaging

## Build System

### Key Scripts
```bash
# Development
npm run dev          # Concurrent webpack watch + electron
npm run watch        # Webpack watch mode only
npm start           # Build and run application

# Building
npm run build       # Full build (renderer + main)
npm run build:renderer  # Webpack build only
npm run build:main     # TypeScript compile main process

# Testing
npm test            # Run all tests
npm run test:watch  # Jest watch mode
npm run test:coverage  # Coverage report
npm run test:renderer  # Frontend tests only
npm run test:main      # Main process tests only

# Packaging
npm run package     # Build for macOS and Windows
npm run package:mac # macOS only
npm run package:win # Windows only
```

### Build Configuration
- **Webpack**: Targets `electron-renderer`, uses ts-loader, generates source maps
- **TypeScript**: Separate configs for main (`electron/tsconfig.json`) and renderer (`src/tsconfig.json`)
- **Output**: All builds go to `build/` directory
- **Assets**: Icons and resources copied from `assets/`

## Architecture Patterns

### IPC Communication
- Secure context isolation with preload scripts
- Handle-based async IPC for main operations
- Event-based communication for real-time updates

### State Management
- React Context for global application state
- Electron Store for persistent settings
- No external state management libraries

### Error Handling
- Comprehensive error boundaries in React
- Graceful permission handling (especially macOS)
- User-friendly error messages with retry options

### Testing Strategy
- Dual Jest projects (renderer + main process)
- Component testing with React Testing Library
- Mock implementations for Electron APIs and Gemini service
- Coverage thresholds: 70% across all metrics