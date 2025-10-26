# Reddit Block Manager

A powerful Chrome extension and Tampermonkey userscript for managing blocked users on Reddit with advanced filtering, sorting, and bulk operations.

## Features

### 🎯 Core Functionality
- **Bulk Selection**: Select multiple users with checkboxes
- **Smart Locking**: Lock users to prevent accidental unblocking
- **Bulk Operations**: Unblock or lock multiple users at once
- **Auto-Confirmation**: Handles Reddit's confirmation dialogs automatically
- **Persistent Locks**: Lock status persists across browser sessions

### 🔍 Advanced Filtering & Selection
- **Date-based Filtering**: Filter users blocked 1+ months, 2+ months, 3+ months, 6+ months, or 1+ year ago
- **Vote Weight Filtering**: Filter by vote score ranges (positive, zero+, negative, better/worse than thresholds)
- **Visual Filtering**: Hide/show rows based on filter criteria (not just selection)
- **Smart Selection**: Select all works only on visible users
- **RES Tag Integration**: Automatically locks users tagged as 'locked' in RES

### 📊 Sorting & Organization
- **Column Sorting**: Sort by username, date blocked, vote weight, or lock status
- **Visual Indicators**: Clear sort direction indicators (↑, ↓, ↕)
- **Multi-directional**: Ascending, descending, or reset to original order
- **Lock Column Sorting**: Group locked and unlocked users together

### 🎨 User Experience
- **RES Dark Mode Support**: Full compatibility with Reddit Enhancement Suite dark mode
- **Old Reddit Styling**: Matches Reddit's classic design language
- **Responsive Layout**: Works on different screen sizes
- **Professional UI**: Clean, modern interface with elegant buttons
- **Helpful Tooltips**: Contextual help for filtering options
- **Visual Feedback**: Clear indication of selected users and filter results

### 🔒 Lock System
- **Individual Locking**: Click lock button (🔓/🔒) to lock/unlock individual users
- **Bulk Locking**: Select multiple users and lock/unlock them together
- **Persistent Storage**: Lock status saved across browser sessions
- **Visual Protection**: Locked users have disabled unblock buttons
- **RES Integration**: Users tagged as 'locked' in RES are automatically locked

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
2. **Bulk Unblock**: Click "Unblock Selected" to unblock all selected users
3. **Bulk Lock**: Click "Lock Selected" to protect users from accidental unblocking
4. **Bulk Unlock**: Click "Unlock Selected" to unlock selected users

### Advanced Filtering
1. **Date Filter**: Use "Blocked" dropdown to filter by when users were blocked
2. **Vote Weight Filter**: Use "Vote weight" dropdown to filter by vote scores
3. **Apply Filters**: Click "Apply" to hide/show users based on criteria
4. **Clear Selection**: Click "Clear" to deselect all users

### Sorting
1. **Column Headers**: Click any column header to sort by that field
2. **Sort Indicators**: Look for ↑ (ascending), ↓ (descending), or ↕ (unsorted)
3. **Lock Sorting**: Click "Lock" column to group locked/unlocked users
4. **Multi-click**: Click again to change sort direction, third click resets

### Locking Users
1. **Individual Lock**: Click the lock button (🔓/🔒) next to each user
2. **Bulk Lock**: Select multiple users and click "Lock Selected"
3. **Bulk Unlock**: Select locked users and click "Unlock Selected"
4. **RES Integration**: Users tagged as 'locked' in RES are automatically locked
5. **Protection**: Locked users have disabled unblock buttons but can still be selected for unlocking

## Filter Options

### Date Filtering
- **Any time**: Show all users (default)
- **1+ months**: Users blocked 1+ months ago
- **2+ months**: Users blocked 2+ months ago
- **3+ months**: Users blocked 3+ months ago
- **6+ months**: Users blocked 6+ months ago
- **1+ year**: Users blocked 1+ year ago

### Vote Weight Filtering
- **Any score**: Show all users (default)
- **Positive only**: Users with positive vote scores
- **Zero or greater**: Users with zero or positive vote scores
- **All negative**: Users with negative vote scores
- **Better than -5/-10/-15**: Users with vote scores better than threshold
- **Worse than -5/-10/-15**: Users with vote scores worse than threshold

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
- **Storage API**: Persists locked user data across sessions
- **CSP Compliance**: Handles Content Security Policy restrictions
- **Rate Limiting**: Respects Reddit's API rate limits (60-100 requests/minute)

### Tampermonkey Userscript
- **GM Storage**: Uses Tampermonkey's storage API for persistence
- **Cross-browser**: Works in any browser with Tampermonkey
- **No Installation**: Single file deployment
- **Rate Limiting**: Built-in delays to respect Reddit's limits

### RES Integration
- **Dark Mode**: Full support for RES night mode
- **Tag Reading**: Automatically locks users with 'locked' RES tags
- **Styling**: Matches RES design language and color schemes

## Browser Compatibility

### Chrome Extension
- Chrome 88+ (Manifest V3 support)
- Chromium-based browsers (Edge, Brave, etc.)

### Tampermonkey Userscript
- Any browser with Tampermonkey support
- Firefox, Chrome, Safari, Edge, etc.

## Rate Limiting

The extension respects Reddit's API rate limits:
- **60-100 requests per minute** for unblocking operations
- **2-second delays** between bulk unblock requests
- **Automatic retry logic** for failed requests
- **Progress feedback** during bulk operations

## License

This project is open source. Please see the license file for details.

## Support

For issues, feature requests, or questions:
1. Check the existing issues
2. Create a new issue with detailed description
3. Include browser version and extension version

## Changelog

### Version 2.0.0 (Latest)
- **Major UI Overhaul**: Elegant, streamlined interface
- **Advanced Filtering**: Visual filtering with hide/show functionality
- **Lock Persistence**: Lock status persists across browser sessions
- **Column Sorting**: Added lock column sorting
- **Improved Selection**: Select all works only on visible users
- **Better UX**: Removed smart defaults, added helpful tooltips
- **Rate Limiting**: Enhanced bulk operations with proper rate limiting
- **Visual Protection**: Disabled unblock buttons for locked users
- **Consistent Styling**: All buttons use elegant design system

### Version 1.0.0
- Initial release
- Bulk selection and removal
- User locking system
- Date and downvote selection
- RES dark mode support
- Chrome extension and Tampermonkey userscript

---

**Note**: This extension is not affiliated with Reddit Inc. Use responsibly and in accordance with Reddit's terms of service.