# Testing Guide - Content Filter Pro

## Overview

This extension now includes comprehensive unit tests using Jest to ensure code quality and prevent regressions.

## Setup

### Install Dependencies

```bash
npm install
```

This will install:
- `jest` - Testing framework
- `jest-environment-jsdom` - DOM environment for tests
- `@types/chrome` - TypeScript definitions for Chrome APIs

## Running Tests

### Run All Tests
```bash
npm test
```

### Watch Mode (Re-run on file changes)
```bash
npm run test:watch
```

### Coverage Report
```bash
npm run test:coverage
```

This generates a coverage report showing which parts of your code are tested.

## Test Structure

```
tests/
├── setup.js              # Jest configuration and Chrome API mocks
├── rule-engine.test.js   # Tests for rule evaluation logic
├── adapters.test.js      # Tests for site adapters
└── storage.test.js       # Tests for storage utilities
```

## What's Tested

### ✅ Rule Engine (`rule-engine.test.js`)
- Rule evaluation with different operators (equals, contains, starts_with, ends_with, regex)
- AND/OR condition logic
- Site-specific rule matching
- Case-insensitive matching
- Edge cases (empty rules, disabled rules, missing fields)

### ✅ Adapters (`adapters.test.js`)
- BaseAdapter methods (hide, show, highlight)
- LinkedInAdapter data extraction
- Error handling for missing DOM elements
- Connection degree extraction

### ✅ Storage (`storage.test.js`)
- CRUD operations for rules
- Settings management
- Chrome storage API integration

## Test Coverage Goals

| Component | Coverage Target |
|-----------|----------------|
| Rule Engine | 100% |
| Adapters | 90% |
| Storage | 100% |
| Overall | 85%+ |

## Writing New Tests

When adding new features, follow this pattern:

```javascript
describe('FeatureName', () => {
  beforeEach(() => {
    // Setup code
  });

  test('should do something specific', () => {
    // Arrange
    const input = 'test data';
    
    // Act
    const result = functionToTest(input);
    
    // Assert
    expect(result).toBe('expected output');
  });
});
```

## Continuous Integration

You can add these tests to your CI/CD pipeline:

```yaml
# Example GitHub Actions workflow
- name: Run tests
  run: npm test

- name: Check coverage
  run: npm run test:coverage
```

## Debugging Tests

### Run a Single Test File
```bash
npx jest tests/rule-engine.test.js
```

### Run Tests Matching a Pattern
```bash
npx jest -t "should match rule"
```

### Verbose Output
```bash
npm test -- --verbose
```

## Mocked Chrome APIs

The tests mock the following Chrome APIs:
- `chrome.storage.local.get()`
- `chrome.storage.local.set()`
- `chrome.storage.onChanged.addListener()`
- `chrome.runtime.*`
- `chrome.tabs.query()`

These mocks are defined in `tests/setup.js`.

## Best Practices

1. **Test behavior, not implementation** - Focus on what the code does, not how it does it
2. **Keep tests isolated** - Each test should be independent
3. **Use descriptive test names** - "should hide post when rule matches"
4. **Test edge cases** - Empty inputs, null values, missing data
5. **Mock external dependencies** - Chrome APIs, DOM elements
6. **Aim for high coverage** - But don't sacrifice quality for 100%

## Known Limitations

- **Content script not tested** - The bundled content-script.js is excluded from coverage because it's an IIFE and harder to test in isolation
- **UI files not tested** - popup.js and options.js are also bundled IIFEs
- **DOM manipulation** - Limited testing of actual DOM interactions

## Future Improvements

- [ ] Add E2E tests using Puppeteer
- [ ] Test content script in isolation
- [ ] Add visual regression tests for UI
- [ ] Set up automated testing in CI/CD
- [ ] Add performance benchmarks
