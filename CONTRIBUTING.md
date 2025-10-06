# Contributing to BigOlogy

Thank you for your interest in contributing! This document provides guidelines for contributing to this project.

## 🤝 How to Contribute

### Reporting Bugs

If you find a bug, please create an issue with:
- Clear description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Screenshots (if applicable)
- Browser version and OS

### Suggesting Features

Feature suggestions are welcome! Please:
- Check if the feature already exists
- Describe the use case clearly
- Explain why this feature would be useful

### Code Contributions

1. **Fork the repository**
   ```bash
   git clone https://github.com/adithyapaib/BigOlogy
   ```

2. **Create a feature branch**
   ```bash
   git checkout -b feature/YourFeatureName
   ```

3. **Make your changes**
   - Write clean, readable code
   - Add comments for complex logic
   - Follow existing code style

4. **Test thoroughly**
   - Test on LeetCode with different problems
   - Test in both light and dark modes
   - Verify no console errors

5. **Commit your changes**
   ```bash
   git commit -m "Add: Brief description of changes"
   ```

6. **Push to your fork**
   ```bash
   git push origin feature/YourFeatureName
   ```

7. **Create a Pull Request**
   - Describe what your changes do
   - Reference any related issues
   - Include screenshots if UI changes

## 📝 Code Style Guidelines

### JavaScript
- Use meaningful variable names
- Add JSDoc comments for functions
- Use `const` and `let` (avoid `var`)
- Handle errors gracefully
- Log important events to console

### CSS
- Use LeetCode's CSS variables when possible
- Support both light and dark themes
- Keep selectors specific to avoid conflicts
- Add comments for complex styles

### HTML
- Use semantic HTML elements
- Ensure accessibility (ARIA labels where needed)
- Keep markup clean and minimal

## 🧪 Testing Checklist

Before submitting a PR, verify:
- [ ] Extension loads without errors
- [ ] Works on multiple LeetCode problems
- [ ] Handles API failures gracefully
- [ ] UI looks good in light mode
- [ ] UI looks good in dark mode
- [ ] No console errors
- [ ] Code is commented
- [ ] Follows project structure

## 📋 Commit Message Format

Use clear, descriptive commit messages:
- `Add: New feature or functionality`
- `Fix: Bug fix`
- `Update: Improvement to existing feature`
- `Refactor: Code restructuring`
- `Docs: Documentation changes`
- `Style: CSS/UI changes`

Example: `Add: Support for contest problems`

## 🔍 Code Review Process

1. Maintainer will review your PR
2. Address any requested changes
3. Once approved, PR will be merged
4. Your contribution will be credited

## 💡 Ideas for Contributions

- Add detailed complexity explanations
- Support for more coding platforms
- Caching for faster repeated analysis
- Complexity comparison with optimal solutions
- Export analysis history
- Settings/options page
- Multiple language support for UI

## 🐛 Found a Security Issue?

Please report security vulnerabilities privately via email to the maintainer rather than creating public issues.

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

## ❓ Questions?

Feel free to reach out:
- Open an issue for discussion
- Visit [adithyapaib.com](https://adithyapaib.com)

---

**Thank you for contributing! 🎉**
