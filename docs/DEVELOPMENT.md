# Reddit Block Manager - Development Guide

## 🏗️ Project Structure

```
reddit-block-manager/
├── reddit-block-extension/          # Chrome Extension
│   ├── manifest.json                # Extension manifest (Manifest V3)
│   ├── content.js                   # Main functionality script
│   ├── styles.css                   # Styling (optimized)
│   ├── content-backup.js            # Backup of original content.js
│   ├── content-optimized.js         # Optimized version (WIP)
│   ├── styles-optimized.css         # Optimized CSS (WIP)
│   └── icon*.png                    # Extension icons
├── reddit-block-manager.user.js     # Tampermonkey userscript
├── docs/                            # Documentation
│   ├── DEVELOPMENT.md               # This file
│   ├── API.md                       # API documentation
│   └── CONTRIBUTING.md              # Contributing guidelines
├── examples/                        # Example files
│   └── test-page.html               # Test page for development
├── archive/                         # Archived files
│   ├── block page - selected/       # Old saved pages
│   └── saved block page/            # Development references
├── README.md                        # Main documentation
├── .gitignore                       # Git ignore rules
└── chrome-plugin-reference.md      # Reddit API reference
```

## 🔧 Development Setup

### Prerequisites
- Chrome browser (for extension development)
- Tampermonkey (for userscript testing)
- Basic knowledge of JavaScript, HTML, and CSS
- Git for version control

### Local Development

1. **Chrome Extension Development:**
   ```bash
   # Load the extension in Chrome
   1. Open chrome://extensions/
   2. Enable "Developer mode"
   3. Click "Load unpacked"
   4. Select the reddit-block-extension folder
   ```

2. **Tampermonkey Userscript Development:**
   ```bash
   # Install and test the userscript
   1. Install Tampermonkey browser extension
   2. Copy contents of reddit-block-manager.user.js
   3. Create new script in Tampermonkey
   4. Paste and save the code
   ```

## 📝 Code Standards

### JavaScript
- Use `'use strict';` at the top of all files
- Follow JSDoc commenting standards
- Use meaningful variable and function names
- Implement proper error handling with try-catch blocks
- Use const/let instead of var
- Prefer arrow functions for callbacks

### CSS
- Use BEM-like naming convention
- Group related styles together
- Include RES dark mode support
- Use CSS custom properties for theming
- Optimize for performance (minimize selectors)

### HTML
- Use semantic HTML elements
- Include proper ARIA labels
- Ensure accessibility compliance
- Validate HTML structure

## 🧪 Testing

### Manual Testing Checklist
- [ ] Extension loads without errors
- [ ] Toolbar appears on Reddit blocked users page
- [ ] Checkboxes work for individual and bulk selection
- [ ] Filtering works correctly (date and vote weight)
- [ ] Sorting works for all columns
- [ ] Lock/unlock functionality works
- [ ] Bulk unblock works with rate limiting
- [ ] RES dark mode compatibility
- [ ] Responsive design on different screen sizes

### Test Scenarios
1. **Basic Functionality:**
   - Select individual users
   - Use "Select All" checkbox
   - Apply date and vote weight filters
   - Sort by different columns

2. **Lock System:**
   - Lock individual users
   - Bulk lock selected users
   - Verify locked users can't be unblocked
   - Test unlock functionality

3. **Bulk Operations:**
   - Select multiple users
   - Test bulk unblock with rate limiting
   - Verify confirmation dialogs are handled

4. **Edge Cases:**
   - Empty user list
   - Network errors during bulk operations
   - Invalid user data
   - RES tag detection

## 🐛 Debugging

### Console Logging
The extension uses structured logging:
- `console.log()` for general information
- `console.warn()` for warnings
- `console.error()` for errors

### Common Issues
1. **Extension not loading:**
   - Check manifest.json syntax
   - Verify file paths are correct
   - Check Chrome extension console for errors

2. **Functionality not working:**
   - Check if Reddit page structure has changed
   - Verify selectors in CONFIG.selectors
   - Check for JavaScript errors in console

3. **Styling issues:**
   - Verify CSS selectors match HTML structure
   - Check for conflicting styles
   - Test in both light and dark modes

## 📦 Building and Deployment

### Chrome Extension
1. Ensure all files are in `reddit-block-extension/` folder
2. Test thoroughly in development mode
3. Create ZIP file for distribution
4. Submit to Chrome Web Store (if desired)

### Tampermonkey Userscript
1. Test userscript in Tampermonkey
2. Update version number in userscript header
3. Distribute via userscript hosting sites

## 🔄 Version Control

### Git Workflow
1. Create feature branches for new features
2. Use descriptive commit messages
3. Test before merging to main
4. Tag releases with version numbers

### Commit Message Format
```
type(scope): description

- feat: new feature
- fix: bug fix
- docs: documentation changes
- style: formatting changes
- refactor: code refactoring
- test: adding tests
- chore: maintenance tasks
```

## 🚀 Performance Optimization

### JavaScript
- Use event delegation for dynamic elements
- Debounce frequent operations
- Minimize DOM queries
- Use efficient selectors

### CSS
- Minimize CSS file size
- Use efficient selectors
- Avoid deep nesting
- Group related styles

### General
- Minimize API calls
- Implement proper rate limiting
- Use efficient data structures
- Cache frequently used data

## 📚 Resources

### Documentation
- [Chrome Extensions API](https://developer.chrome.com/docs/extensions/reference/api/)
- [Tampermonkey Documentation](https://www.tampermonkey.net/documentation.php)
- [Reddit API Documentation](https://www.reddit.com/dev/api/)
- [Reddit Enhancement Suite](https://github.com/honestbleeps/Reddit-Enhancement-Suite)

### Tools
- Chrome DevTools for debugging
- Tampermonkey for userscript testing
- Git for version control
- VS Code for development

## 🤝 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed contribution guidelines.

## 📄 License

This project is open source. Please see the license file for details.
