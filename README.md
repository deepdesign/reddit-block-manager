# Reddit Block Manager

A powerful Chrome extension and Tampermonkey userscript for managing blocked users on Reddit with advanced selection, sorting, and bulk operations.

## Features

### 🎯 Core Functionality
- **Bulk Selection**: Select multiple users with checkboxes
- **Smart Locking**: Lock users to prevent accidental removal
- **Bulk Operations**: Remove or lock multiple users at once
- **Auto-Confirmation**: Handles Reddit's confirmation dialogs automatically

### 🔍 Advanced Selection Tools
- **Date-based Selection**: Select users blocked 1+ months, 2+ months, 3+ months, 6+ months, or 1+ year ago
- **Downvote-based Selection**: Select users by downvote ranges (0-5, 5-10, 10+)
- **RES Tag Integration**: Automatically locks users tagged as 'locked' in RES

### 📊 Sorting & Organization
- **Column Sorting**: Sort by username, date blocked, or downvotes
- **Visual Indicators**: Clear sort direction indicators (↑, ↓, ↕)
- **Smart Defaults**: Intuitive sorting behavior

### 🎨 User Experience
- **RES Dark Mode Support**: Full compatibility with Reddit Enhancement Suite dark mode
- **Old Reddit Styling**: Matches Reddit's classic design language
- **Responsive Layout**: Works on different screen sizes
- **Professional UI**: Clean, modern interface

## Installation

### Chrome Extension
1. Download or clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked" and select the `reddit-block-extension` folder
5. The extension will be available on Reddit's blocked users page

### Tampermonkey Userscript
1. Install [Tampermonkey](https://www.tampermonkey.net/) browser extension
2. Copy the contents of `reddit-block-manager.user.js`
3. Create a new script in Tampermonkey and paste the code
4. Save the script
5. Visit Reddit's blocked users page to use the extension

## Usage

### Basic Operations
1. **Select Users**: Use checkboxes to select individual users or "Select All"
2. **Bulk Remove**: Click "Remove Selected" to remove all selected users
3. **Bulk Lock**: Click "Lock Selected" to protect users from accidental removal

### Advanced Selection
1. **Date Selection**: Use "Select by date..." dropdown to select users by when they were blocked
2. **Downvote Selection**: Use "Select by downvotes..." dropdown to select users by downvote count
3. **Sorting**: Click column headers to sort by username, date, or use "Sort by Downvotes" button

### Locking Users
1. **Individual Lock**: Click the lock button (🔓/🔒) next to each user
2. **Bulk Lock**: Select multiple users and click "Lock Selected"
3. **RES Integration**: Users tagged as 'locked' in RES are automatically locked
4. **Protection**: Locked users cannot be selected or removed

## File Structure

```
reddit-block-manager/
├── reddit-block-extension/          # Chrome Extension
│   ├── manifest.json                # Extension manifest
│   ├── content.js                   # Main functionality
│   ├── styles.css                   # Styling
│   └── icon*.png                    # Extension icons
├── reddit-block-manager.user.js     # Tampermonkey userscript
├── README.md                        # This file
├── .gitignore                       # Git ignore rules
└── chrome-plugin-reference.md      # Development documentation
```

## Development

### Prerequisites
- Chrome browser for extension development
- Tampermonkey for userscript testing
- Basic knowledge of JavaScript, HTML, and CSS

### Building
The extension is ready to use without building. Simply load the `reddit-block-extension` folder in Chrome's developer mode.

### Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Technical Details

### Chrome Extension (Manifest V3)
- **Content Script**: Injects functionality into Reddit pages
- **Storage API**: Persists locked user data
- **CSP Compliance**: Handles Content Security Policy restrictions

### Tampermonkey Userscript
- **GM Storage**: Uses Tampermonkey's storage API
- **Cross-browser**: Works in any browser with Tampermonkey
- **No Installation**: Single file deployment

### RES Integration
- **Dark Mode**: Full support for RES night mode
- **Tag Reading**: Automatically locks users with 'locked' RES tags
- **Styling**: Matches RES design language

## Browser Compatibility

### Chrome Extension
- Chrome 88+ (Manifest V3 support)
- Chromium-based browsers (Edge, Brave, etc.)

### Tampermonkey Userscript
- Any browser with Tampermonkey support
- Firefox, Chrome, Safari, Edge, etc.

## License

This project is open source. Please see the license file for details.

## Support

For issues, feature requests, or questions:
1. Check the existing issues
2. Create a new issue with detailed description
3. Include browser version and extension version

## Changelog

### Version 1.0.0
- Initial release
- Bulk selection and removal
- User locking system
- Date and downvote selection
- RES dark mode support
- Chrome extension and Tampermonkey userscript

---

**Note**: This extension is not affiliated with Reddit Inc. Use responsibly and in accordance with Reddit's terms of service.
