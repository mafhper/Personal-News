# Personal News Aggregator

A modern, high-performance RSS feed aggregator designed to serve as a browser homepage. Built with React 19, TypeScript, and optimized with Bun runtime for superior performance and developer experience.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-blue.svg)
![React](https://img.shields.io/badge/React-19.1.0-blue.svg)
![Bun](https://img.shields.io/badge/Bun-optimized-orange.svg)

## Overview

This application provides a centralized interface for consuming RSS/Atom feeds with advanced features including intelligent caching, progressive loading, and comprehensive search capabilities. All data is stored locally using browser storage APIs, ensuring privacy and eliminating external dependencies.

![Preview: Dashboard](/assets/screen.png)

## Installation

### Prerequisites
- Bun 1.0+ (recommended) or Node.js 18+
- Modern web browser with ES2022 support

### Setup
```bash
# Clone repository
git clone <repository-url>
cd personal-news

# Install dependencies
bun install

# Start development server
bun dev
```

### Build for Production
```bash
# Type checking
bun run type-check

# Production build
bun run build

# Preview production build
bun run preview
```

### GitHub Pages Deployment
This application is fully compatible with GitHub Pages and requires no server-side dependencies:

```bash
# Build for production
bun run build

# The build output in 'dist/' directory is ready for deployment
# Simply push the repository and enable GitHub Pages pointing to the 'dist' folder
```

**Note**: The application uses public CORS proxies to fetch RSS feeds, eliminating the need for any backend server. All data is processed and stored locally in the browser.

## Development

### Available Scripts
```bash
bun dev              # Start development server
bun run build        # Production build
bun run preview      # Preview production build
bun run test         # Run core tests (133 tests, ~15s)
bun run test:all     # Run comprehensive tests
bun run test:watch   # Run tests in watch mode
bun run test:coverage # Generate coverage report
bun run type-check   # TypeScript type checking
bun run clean        # Clean build artifacts
```

### Project Structure
```
├── components/             # React components
│   ├── ui/                # Reusable UI components
│   └── icons/             # Icon components
├── contexts/              # React contexts
├── hooks/                 # Custom React hooks
├── services/              # Business logic and utilities
│   ├── rssParser.ts       # RSS/Atom parsing
│   ├── feedValidator.ts   # Feed validation
│   ├── articleCache.ts    # Caching system
│   └── performanceUtils.ts # Performance monitoring
├── types/                 # TypeScript definitions
├── utils/                 # Utility functions
├── __tests__/             # Test files
├── docs/                  # Documentation
├── App.tsx                # Main application component
├── index.tsx              # Application entry point
└── vite.config.ts         # Build configuration
```
## Configuration

### Environment Variables
```bash
# Development
NODE_ENV=development

# Production
NODE_ENV=production
```

### Build Configuration
The application uses Vite for building with the following optimizations:
- ES2022 target for modern browsers
- Code splitting for optimal loading
- Asset optimization and compression
- Source maps for debugging

### Code Standards
- TypeScript strict mode enabled
- ESLint configuration for code quality
- Prettier for code formatting
- Conventional commit messages

## Performance Metrics

- **Bundle Size**: Optimized for minimal footprint
- **Load Time**: Sub-second initial load
- **Memory Usage**: Efficient memory management with automatic cleanup
- **Test Coverage**: 100% success rate on core functionality

## Browser Compatibility

- Chrome/Chromium 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Technical Features

### Core Functionality
- **RSS/Atom Feed Processing**: Support for RSS 2.0, RSS 1.0 (RDF), and Atom 1.0 formats
- **Progressive Feed Loading**: Optimized batch processing with configurable concurrency
- **Intelligent Caching**: Multi-layer caching system with TTL and memory management
- **Advanced Search**: Full-text search with filtering and categorization
- **Offline Support**: Service worker implementation for offline functionality
- **Performance Monitoring**: Built-in performance tracking and optimization

### Security Features
- **XML Security**: Protection against XXE attacks and malicious XML content
- **Content Sanitization**: XSS prevention with secure content parsing
- **Input Validation**: Comprehensive validation using Zod schemas
- **CORS Handling**: Secure cross-origin request management

### User Interface
- **Responsive Design**: Mobile-first approach with adaptive layouts
- **Theme System**: Extensible theming with dark/light mode support
- **Accessibility**: WCAG 2.1 AA compliance with keyboard navigation
- **Progressive Web App**: Installable with offline capabilities

## Technology Stack

### Runtime & Build Tools
- **Bun 1.x**: JavaScript runtime and package manager
- **Vite 7.0**: Build tool and development server
- **TypeScript 5.8**: Static type checking
- **PostCSS**: CSS processing with Autoprefixer

### Frontend Framework
- **React 19.1**: UI framework with concurrent features
- **React DOM 19.1**: DOM rendering
- **Material-UI 7.2**: Component library
- **Emotion**: CSS-in-JS styling solution

### Styling & UI
- **Tailwind CSS 4.1**: Utility-first CSS framework
- **Lucide React**: Icon library
- **Responsive Design**: Mobile-first approach

### Testing Framework
- **Vitest 3.2**: Unit and integration testing
- **Testing Library**: React component testing utilities
- **JSDOM**: DOM environment for testing

### Validation & Utilities
- **Zod 4.0**: Runtime type validation
- **Custom Hooks**: Reusable React logic
- **Performance Utils**: Custom performance monitoring

### Testing Strategy

The project implements a tiered testing approach:

**Core Tests** (`bun run test`)
- 133 essential tests covering critical functionality
- Execution time: ~15 seconds
- Components: SearchBar, FavoriteButton, ProgressIndicator, SkeletonLoader
- Hooks: useSearch, usePagination
- Utilities: searchUtils

**Comprehensive Tests** (`bun run test:all`)
- Extended test suite including integration tests
- Additional coverage for caching, validation, and performance

### Performance Optimizations

- **Bun Runtime**: 29% faster package installation and builds
- **Code Splitting**: Lazy loading of non-critical components
- **Bundle Optimization**: Tree shaking and minification
- **Caching Strategy**: Multi-level caching with intelligent invalidation
- **Memory Management**: Automatic cleanup and garbage collection

## Default Feeds

The application comes pre-configured with a curated selection of high-quality RSS feeds organized by category:

### Technology (12 feeds)
- **The Verge** - Technology, science, art and culture
- **Wired** - How technology is transforming the world
- **TechCrunch** - Startups, venture capital and emerging technology
- **CNET** - Product reviews, tech news and buying guides
- **Tecnoblog** - Brazil's largest technology blog (Portuguese)
- **Meio Bit** - Technology with humor and irreverence (Portuguese)
- **XDA Developers** - Android development and mobile customization
- **It's FOSS** - Linux, open source and free software
- **Ars Technica** - In-depth technical analysis and tech news
- **OMG! Ubuntu!** - Ubuntu Linux news, tips and tutorials
- **OMG! Linux** - Linux world news and updates
- **Diolinux** - Linux, open source and technology in Portuguese

### Entertainment (2 feeds)
- **Polygon** - Games, entertainment and nerd culture
- **Jogabilidade** - Brazil's largest gaming portal (Portuguese)

### Science (1 feed)
- **MIT News** - Research and discoveries from MIT

### Reviews (1 feed)
- **Tom's Guide** - Detailed tech product reviews and buying guides

### Feed Management
- All feeds are automatically categorized on first load
- Users can add, remove, or recategorize feeds through the Feed Manager
- Feed validation ensures all URLs are working and accessible
- Automatic discovery helps find RSS feeds from website URLs
- **Reset to Defaults**: Users can reset to the curated feed collection anytime
- **Migration System**: Existing users are automatically upgraded to new feeds

### Testing New Feeds
To test the new default feeds on an existing installation:

1. **Option 1 - Use Reset Button**: 
   - Open Feed Manager → Click "Reset to Defaults" button
   
2. **Option 2 - Clear Browser Storage**:
   - Open browser console (F12)
   - Run: `localStorage.clear(); location.reload();`
   
3. **Option 3 - Incognito/Private Mode**:
   - Open the app in incognito/private browsing mode

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/new-feature`)
3. Implement changes with appropriate tests
4. Run test suite (`bun run test`)
5. Ensure type safety (`bun run type-check`)
6. Submit pull request

## License

MIT License. See [LICENSE](LICENSE) file for details.

