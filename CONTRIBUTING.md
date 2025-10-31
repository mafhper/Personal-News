# Contributing to Personal News Dashboard

Thank you for your interest in contributing to Personal News Dashboard! This document provides guidelines and information for contributors.

## Code of Conduct

By participating in this project, you agree to abide by our Code of Conduct. Please be respectful and constructive in all interactions.

## How to Contribute

### Reporting Issues

1. **Search existing issues** first to avoid duplicates
2. **Use the issue template** when creating new issues
3. **Provide detailed information** including:
   - Steps to reproduce
   - Expected vs actual behavior
   - Browser and OS information
   - Screenshots if applicable

### Suggesting Features

1. **Check existing feature requests** to avoid duplicates
2. **Describe the problem** your feature would solve
3. **Explain your proposed solution** in detail
4. **Consider the impact** on existing users

### Contributing Code

#### Prerequisites

- Node.js 18.0.0 or higher
- npm 9.0.0 or higher
- Git
- Basic knowledge of React, TypeScript, and Tailwind CSS

#### Development Setup

1. **Fork the repository**

   ```bash
   git clone https://github.com/YOUR_USERNAME/personal-news-dashboard.git
   cd personal-news-dashboard
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Start development server**

   ```bash
   npm start
   ```

4. **Run tests**
   ```bash
   npm test
   ```

#### Making Changes

1. **Create a feature branch**

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**

   - Follow the existing code style
   - Write tests for new functionality
   - Update documentation as needed

3. **Test your changes**

   ```bash
   npm test
   npm run build
   ```

4. **Commit your changes**

   ```bash
   git commit -m "feat: add your feature description"
   ```

5. **Push to your fork**

   ```bash
   git push origin feature/your-feature-name
   ```

6. **Create a Pull Request**
   - Use the PR template
   - Provide a clear description
   - Link related issues

## Development Guidelines

### Code Style

- **TypeScript**: Use strict mode and proper typing
- **React**: Functional components with hooks
- **Styling**: Tailwind CSS utility classes
- **Naming**: Use descriptive, camelCase names
- **Comments**: Document complex logic and public APIs

### Component Structure

```typescript
import React from 'react';
import { ComponentProps } from './types';

interface Props extends ComponentProps {
  // Component-specific props
}

export const ComponentName: React.FC<Props> = ({
  // Props destructuring
}) => {
  // Hooks and state

  // Event handlers

  // Effects

  // Render helpers

  return (
    // JSX with proper accessibility
  );
};
```

### Testing

- **Unit tests** for utilities and hooks
- **Integration tests** for components
- **Accessibility tests** for UI components
- **Performance tests** for critical paths

#### Test Structure

```typescript
import { render, screen } from "@testing-library/react";
import { ComponentName } from "./ComponentName";

describe("ComponentName", () => {
  it("should render correctly", () => {
    render(<ComponentName />);
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("should handle user interactions", async () => {
    // Test user interactions
  });

  it("should be accessible", async () => {
    // Accessibility tests
  });
});
```

### Accessibility

- **Semantic HTML**: Use proper HTML elements
- **ARIA labels**: Add labels for screen readers
- **Keyboard navigation**: Ensure all functionality is keyboard accessible
- **Color contrast**: Maintain WCAG AA compliance
- **Focus management**: Proper focus handling

### Performance

- **React.memo**: Use for expensive components
- **useMemo/useCallback**: Optimize expensive calculations
- **Lazy loading**: Implement for large components
- **Bundle size**: Monitor and optimize imports

## Commit Messages

Use conventional commit format:

- `feat:` new features
- `fix:` bug fixes
- `docs:` documentation changes
- `style:` formatting changes
- `refactor:` code refactoring
- `test:` test changes
- `chore:` maintenance tasks
- `perf:` performance improvements

Examples:

```
feat: add dark mode toggle
fix: resolve RSS parsing issue
docs: update installation guide
```

## Pull Request Process

1. **Update documentation** if needed
2. **Add tests** for new functionality
3. **Ensure all tests pass**
4. **Update CHANGELOG.md** if applicable
5. **Request review** from maintainers

### PR Checklist

- [ ] Code follows project style guidelines
- [ ] Tests pass locally
- [ ] New tests added for new functionality
- [ ] Documentation updated
- [ ] Accessibility considerations addressed
- [ ] Performance impact considered
- [ ] Breaking changes documented

## Release Process

1. **Version bump** following semantic versioning
2. **Update CHANGELOG.md** with new features and fixes
3. **Create release tag** with release notes
4. **Deploy to production** after testing

## Getting Help

- **Documentation**: Check the docs/ directory
- **Issues**: Search existing issues for solutions
- **Discussions**: Use GitHub Discussions for questions
- **Discord**: Join our community Discord (if available)

## Recognition

Contributors will be recognized in:

- README.md contributors section
- Release notes
- Project documentation

Thank you for contributing to Personal News Dashboard! 🎉
