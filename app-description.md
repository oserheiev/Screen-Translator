# AI Screen Translator - Application Documentation

## Application Overview

### Purpose and Functionality
The AI Screen Translator is a cross-platform desktop application built with Electron and React that enables users to capture text from any area of their screen and translate it between multiple languages using Google's Gemini AI. The application provides a seamless workflow for screen-based text extraction and translation, making it ideal for translating content from websites, documents, images, or any visual content displayed on screen.

### Key Features and Capabilities
- **Screen Capture**: Advanced screen capture functionality with multi-display support
- **OCR Text Extraction**: Intelligent text recognition from captured screen areas using Gemini AI
- **Multi-Language Translation**: Support for 11 languages including English, Russian, Ukrainian, Spanish, French, German, Italian, Portuguese, Chinese (Simplified), Japanese, and Korean
- **Global Hotkeys**: Customizable keyboard shortcuts for quick screen capture
- **System Tray Integration**: Minimizes to system tray for easy access
- **Cross-Platform**: Supports macOS, Windows, and Linux
- **High-DPI Support**: Optimized for Retina and 4K displays
- **Permission Management**: Robust handling of screen recording permissions, especially on macOS

### Target Use Cases
- Translating foreign language content from websites or applications
- Converting text from images or PDFs that cannot be copied
- Quick translation of interface elements in foreign software
- Academic research requiring translation of visual content
- Business communication with international content

## Technical Architecture

### Electron Main Process Structure
The application follows a clean separation between the main process and renderer processes:

**Main Process (`electron/main.ts`)**:
- **Window Management**: Creates and manages main application window and capture overlay windows
- **IPC Communication**: Handles inter-process communication between main and renderer processes
- **System Integration**: Manages system tray, global shortcuts, and platform-specific features
- **Settings Management**: Persistent storage using `electron-store`
- **Screen Capture Orchestration**: Coordinates the complex screen capture workflow
- **Permission Handling**: Manages macOS screen recording permissions with user-friendly error messages

**Key Main Process Components**:
- `createWindow()`: Main application window setup with security configurations
- `createTray()`: System tray integration with context menu
- `startScreenCapture()`: Orchestrates the complete screen capture workflow
- `registerGlobalShortcut()`: Manages customizable hotkey registration
- `requestScreenCapturePermission()`: Handles macOS permission requirements

### React Frontend Architecture
The frontend is built with modern React patterns and TypeScript:

**Component Structure**:
- `App.tsx`: Main application component orchestrating the user interface
- `CaptureButton.tsx`: Initiates screen capture process
- `TextDisplay.tsx`: Displays and allows editing of extracted text
- `TranslationDisplay.tsx`: Shows translated text with copy functionality
- `LanguageSelector.tsx`: Language selection interface
- `SettingsModal.tsx`: Configuration interface for API keys and preferences
- `ErrorMessage.tsx`: User-friendly error display with retry options

**State Management**:
- `AppContext.tsx`: Centralized state management using React Context
- Manages application state including text, translations, settings, and processing status
- Handles integration with Gemini AI service
- Provides error handling and loading states

### IPC Communication Patterns
The application uses a well-defined IPC interface for secure communication:

**Main → Renderer**:
- `image-captured`: Sends captured image data for processing
- `capture-error`: Communicates capture-related errors

**Renderer → Main**:
- `start-screen-capture`: Initiates screen capture process
- `get-settings`/`save-settings`: Settings persistence
- `get-screens`/`get-sources`: Screen and source enumeration
- `capture-completed`: Sends processed capture results
- `clipboard-write-text`: System clipboard integration

### Service Integrations

**Gemini AI Service (`src/services/gemini.service.ts`)**:
- Integrates with Google's Gemini 2.0 Flash Lite model
- Handles both image-to-text extraction and text translation
- Implements retry logic with exponential backoff
- Provides comprehensive error handling for API failures
- Supports structured JSON responses for better data extraction

## Screen Capture Implementation

### Modern API Usage and Best Practices
The screen capture system has been completely modernized with the following improvements:

**Modern getUserMedia Constraints**:
```javascript
const constraints = {
  audio: false,
  video: {
    chromeMediaSource: 'desktop',
    chromeMediaSourceId: source.id,
    maxWidth: 3840, // 4K support
    maxHeight: 2160,
    frameRate: { max: 1 } // Single frame capture
  }
};
```

**Key Improvements**:
- Replaced deprecated `mandatory` constraints with modern format
- Added support for 4K displays (3840x2160)
- Optimized for single-frame capture instead of continuous streaming
- Implemented proper resource cleanup to prevent memory leaks

### Permission Handling for macOS
Comprehensive macOS screen recording permission management:

**Permission States**:
- `granted`: Full access, capture proceeds normally
- `denied`: Clear error message directing users to System Preferences
- `not-determined`: Guidance for first-time permission requests

**User Guidance**:
- Specific instructions for enabling permissions in System Preferences
- Clear error messages explaining permission requirements
- Graceful fallback when permission API is unavailable

### Multi-Display Support Details
Advanced multi-display handling:

**Display Detection**:
- Automatic detection of the display containing the main window
- Fallback to primary display when main window display cannot be determined
- Support for various display configurations and arrangements

**Coordinate Transformation**:
- Accurate mapping between screen coordinates and capture sources
- Proper scaling for different display resolutions and pixel densities
- High-DPI awareness for Retina and 4K displays

**Capture Window Management**:
- Full-screen overlay windows positioned correctly on target displays
- Proper bounds setting to ensure complete screen coverage
- Always-on-top behavior with appropriate z-index management

## Project Structure

### File Organization and Key Directories

```
AI Screen Translator/
├── electron/                    # Electron main process
│   ├── main.ts                 # Main process entry point
│   ├── preload.ts              # Preload script for secure IPC
│   ├── types.ts                # Electron-specific type definitions
│   └── tsconfig.json           # TypeScript config for main process
├── src/                        # React frontend
│   ├── components/             # React components
│   │   ├── CaptureButton.tsx
│   │   ├── ErrorMessage.tsx
│   │   ├── LanguageSelector.tsx
│   │   ├── SettingsModal.tsx
│   │   ├── TextDisplay.tsx
│   │   ├── ThemeProvider.tsx
│   │   └── TranslationDisplay.tsx
│   ├── contexts/               # React context providers
│   │   └── AppContext.tsx
│   ├── services/               # Business logic services
│   │   ├── clipboard.service.ts
│   │   └── gemini.service.ts
│   ├── types/                  # TypeScript definitions
│   │   └── index.ts
│   ├── App.tsx                 # Main React component
│   ├── capture.html            # Screen capture interface
│   ├── index.html              # Main app HTML template
│   ├── index.tsx               # React entry point
│   ├── styles.css              # Global styles
│   └── tsconfig.json           # TypeScript config for renderer
├── assets/                     # Application assets
│   └── icons/                  # Application icons
├── build/                      # Compiled output
├── package.json                # Dependencies and scripts
├── webpack.config.js           # Webpack configuration
└── tsconfig.json               # Root TypeScript configuration
```

### Build System (Webpack, TypeScript)
**Webpack Configuration**:
- Targets `electron-renderer` for proper Electron integration
- TypeScript compilation with `ts-loader`
- CSS processing with `style-loader` and `css-loader`
- Asset handling for images and icons
- Dual HTML template generation for main app and capture interface
- Source map generation for debugging

**TypeScript Setup**:
- Separate configurations for main process and renderer
- Strict type checking enabled
- Modern ES target with appropriate lib configurations
- Path resolution for clean imports

### Development and Production Workflows

**Development Scripts**:
- `npm start`: Build and run the application
- `npm run build`: Full build (renderer + main process)
- `npm run watch`: Watch mode for renderer development
- `npm run dev`: Concurrent build watching and Electron execution

**Production Scripts**:
- `npm run package`: Build for both macOS and Windows
- `npm run package:mac`: macOS-specific build
- `npm run package:win`: Windows-specific build

**Build Process**:
1. Webpack compiles React frontend to `build/`
2. TypeScript compiles Electron main process to `build/electron/`
3. Assets are copied to build directory
4. Electron-builder packages the application for distribution

## Key Components

### Main Process Components and Services

**Window Management**:
- `createWindow()`: Main application window with security configurations
- `createCaptureWindow()`: Overlay window for screen selection
- Proper window lifecycle management and cleanup

**System Integration**:
- `createTray()`: System tray with context menu
- `registerGlobalShortcut()`: Hotkey registration with validation
- Platform-specific icon and behavior handling

**Screen Capture Services**:
- `startScreenCapture()`: Main capture orchestration
- `getTargetDisplay()`: Display detection logic
- `requestScreenCapturePermission()`: Permission management

### React Components and Responsibilities

**Core Components**:
- **App**: Main application orchestrator, handles global state and event coordination
- **CaptureButton**: Initiates screen capture with loading states
- **TextDisplay**: Editable text display with copy functionality
- **TranslationDisplay**: Read-only translation results with copy support
- **LanguageSelector**: Dropdown for target language selection
- **SettingsModal**: Configuration interface for API keys, hotkeys, and themes
- **ErrorMessage**: User-friendly error display with retry mechanisms

**Component Features**:
- Consistent error handling across all components
- Loading states and user feedback
- Accessibility considerations
- Responsive design principles

### Context Providers and State Management

**AppContext Provider**:
- Centralized state management for the entire application
- Handles settings persistence through Electron store
- Manages Gemini AI service lifecycle
- Provides error handling and loading states
- Coordinates between text extraction and translation

**State Structure**:
```typescript
interface AppContextType {
  originalText: string;
  translatedText: string;
  targetLanguage: SupportedLanguage;
  apiKey: string;
  hotkey: string;
  theme: Theme;
  isProcessing: boolean;
  error: string | null;
  // ... methods for state updates
}
```

## Configuration and Settings

### Application Settings and Preferences
**Persistent Settings** (stored via `electron-store`):
- **API Key**: Gemini AI API key for service access
- **Target Language**: Default translation target language
- **Hotkey**: Customizable global shortcut (platform-aware defaults)
- **Theme**: Light, dark, or system theme preference

**Default Configurations**:
- macOS: `Command+Alt+T` hotkey
- Windows/Linux: `Ctrl+Alt+T` hotkey
- System theme following OS preferences
- English as default target language

### Hotkey Configuration
**Hotkey Management**:
- Platform-aware default shortcuts
- Validation before registration
- Graceful handling of conflicts with existing shortcuts
- User-friendly error messages for invalid combinations
- Automatic re-registration when settings change

**Supported Formats**:
- Single keys: `F1`, `Escape`
- Modifier combinations: `Ctrl+Alt+T`, `Command+Shift+S`
- Platform-specific modifiers automatically handled

### Tray Integration
**System Tray Features**:
- Platform-specific icon sizing and formats
- Context menu with essential actions
- Click behavior for show/hide toggle
- Proper cleanup on application exit

**Tray Menu Actions**:
- Capture Screen: Direct access to screen capture
- Open: Show main application window
- Quit: Complete application termination

## Development Guidelines

### Development Environment Setup
**Prerequisites**:
- Node.js 16+ with npm
- Platform-specific development tools (Xcode for macOS, Visual Studio for Windows)

**Installation Steps**:
```bash
# Clone repository
git clone [repository-url]
cd ai-screen-translator

# Install dependencies
npm install

# Start development
npm run dev
```

**Development Tools**:
- TypeScript for type safety
- Webpack for bundling and hot reload
- Electron for desktop application framework
- React for user interface

### Build and Testing Procedures
**Build Commands**:
```bash
# Development build
npm run build

# Watch mode for development
npm run watch

# Production packaging
npm run package
```

**Testing Approach**:
- Manual testing across different platforms
- Screen capture testing on various display configurations
- Permission testing on macOS
- Error scenario testing
- Performance testing for memory leaks

### Code Organization Principles
**Architecture Principles**:
- Clear separation between main and renderer processes
- Modular component design with single responsibilities
- Centralized state management through React Context
- Comprehensive error handling at all levels
- Type safety throughout the application

**Code Quality Standards**:
- TypeScript strict mode enabled
- Consistent error handling patterns
- Proper resource cleanup and memory management
- User-friendly error messages
- Comprehensive logging for debugging

## Recent Improvements

### Screen Capture Fixes Implemented
**Major Overhaul** (documented in `SCREEN_CAPTURE_FIXES.md`):

1. **Removed Duplicate Implementations**: Eliminated unused service classes and simplified architecture
2. **Modernized getUserMedia Usage**: Updated from deprecated `mandatory` constraints to modern format
3. **Improved Permission Handling**: Enhanced macOS permission management with better user guidance
4. **Simplified Capture Flow**: Refactored into clean, modular functions
5. **Fixed Multi-Display Support**: Centralized display detection and improved source matching
6. **Added Comprehensive Error Handling**: User-friendly messages with actionable guidance
7. **Optimized Performance**: Proper resource cleanup and memory leak prevention

### Performance Optimizations Made
**Memory Management**:
- Proper cleanup of video streams after capture
- Immediate removal of video elements after use
- Canvas optimization with device pixel ratio support
- Efficient event listener management

**Capture Quality**:
- Support for 4K displays (3840x2160)
- High-quality image rendering with proper scaling
- Device pixel ratio awareness for crisp captures
- Single-frame capture instead of continuous streaming

### Security Enhancements
**Electron Security**:
- Context isolation enabled in all renderer processes
- Node integration disabled for security
- Preload scripts for secure IPC communication
- Content Security Policy for capture interface

**API Security**:
- Secure storage of API keys using electron-store
- Input validation for all user-provided data
- Error handling that doesn't expose sensitive information

## Future Considerations

### Potential Enhancements
**Feature Additions**:
- **Batch Processing**: Support for multiple screen captures in sequence
- **History Management**: Save and recall previous translations
- **Custom Language Models**: Support for additional AI providers
- **Text Formatting**: Preserve formatting in extracted text
- **Export Options**: Save translations to various file formats
- **Cloud Sync**: Synchronize settings and history across devices

**Technical Improvements**:
- **Offline OCR**: Local text extraction for privacy-sensitive use cases
- **Performance Monitoring**: Built-in performance metrics and optimization
- **Plugin System**: Extensible architecture for third-party integrations
- **Advanced Hotkeys**: Support for complex hotkey combinations and sequences

### Maintenance Recommendations
**Regular Maintenance Tasks**:
- Update Electron to latest stable version for security patches
- Monitor Gemini AI API changes and update integration accordingly
- Test compatibility with new operating system versions
- Review and update dependencies for security vulnerabilities
- Performance profiling to identify potential optimizations

**Code Maintenance**:
- Regular refactoring to maintain code quality
- Documentation updates as features evolve
- Test coverage expansion for critical paths
- Error handling improvements based on user feedback

### Known Limitations
**Current Limitations**:
- **API Dependency**: Requires internet connection and valid Gemini API key
- **Platform Permissions**: macOS requires manual permission setup for screen recording
- **Language Support**: Limited to 11 predefined languages
- **Text Formatting**: Basic text extraction without formatting preservation
- **Batch Operations**: Single capture workflow only

**Technical Constraints**:
- Electron framework overhead for simple functionality
- Screen capture performance dependent on display resolution
- Memory usage scales with capture area size
- Network dependency for AI processing

## Conclusion

The AI Screen Translator represents a mature, well-architected desktop application that successfully combines modern web technologies with native desktop capabilities. The recent comprehensive overhaul of the screen capture system has resulted in a robust, performant, and user-friendly application that handles edge cases gracefully and provides excellent user experience across different platforms and display configurations.

The application demonstrates best practices in Electron development, React architecture, and TypeScript usage, making it a solid foundation for future enhancements and a reference implementation for similar desktop applications requiring screen capture and AI integration capabilities.