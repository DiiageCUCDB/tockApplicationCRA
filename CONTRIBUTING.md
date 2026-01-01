# Contributing to Tock UI

Thank you for your interest in contributing to Tock UI! This document provides guidelines and instructions for contributing.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/tockApplicationCRA.git`
3. Create a new branch: `git checkout -b feature/your-feature-name`

## Development Setup

### Prerequisites

- Node.js (v18 or later)
- Rust (latest stable)
- Tock CLI installed and in PATH
- Platform-specific dependencies (see README)

### Install Dependencies

```bash
cd tock-ui
npm install
```

### Running in Development Mode

```bash
npm run tauri dev
```

This starts the development server with hot-reload enabled.

## Code Style

### TypeScript/React
- Use TypeScript for type safety
- Follow existing code formatting
- Use functional components with hooks
- Keep components focused and reusable

### Rust
- Follow Rust standard conventions
- Run `cargo fmt` before committing
- Run `cargo clippy` to catch common mistakes
- Write descriptive error messages

## Making Changes

1. **Write clear commit messages**
   - Use present tense ("Add feature" not "Added feature")
   - Be descriptive but concise
   - Reference issues if applicable

2. **Test your changes**
   - Manually test the application
   - Ensure all features work as expected
   - Test on your platform (Windows/macOS/Linux if possible)

3. **Update documentation**
   - Update README if adding new features
   - Add code comments for complex logic
   - Update user-facing documentation

## Pull Request Process

1. Update the README.md with details of changes if applicable
2. Ensure your code builds successfully
3. Create a pull request with a clear title and description
4. Link any related issues
5. Wait for review and address any feedback

## Bug Reports

When filing a bug report, include:
- Clear description of the issue
- Steps to reproduce
- Expected vs actual behavior
- Platform/OS version
- Tock CLI version
- Screenshots if applicable

## Feature Requests

When suggesting a new feature:
- Explain the use case
- Describe the expected behavior
- Consider backward compatibility
- Be open to discussion and alternatives

## Code of Conduct

- Be respectful and inclusive
- Welcome newcomers
- Focus on constructive feedback
- Assume good intentions

## Questions?

Feel free to open an issue for questions or join discussions!

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
