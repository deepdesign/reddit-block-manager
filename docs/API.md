# Reddit Block Manager - API Documentation

## 📋 Overview

This document describes the internal API and configuration options for the Reddit Block Manager extension.

## ⚙️ Configuration Object

### CONFIG
Main configuration object containing all constants and selectors.

```javascript
const CONFIG = {
    selectAllId: 'reddit-block-manager-select-all',
    toolbarId: 'reddit-block-manager-toolbar',
    checkboxClass: 'reddit-block-manager-checkbox',
    lockedClass: 'reddit-block-manager-locked',
    lockedUsers: new Set(),
    selectedUsers: new Set(),
    selectors: {
        infobar: '.infobar',
        enemyTable: '.enemy-table',
        table: '.enemy-table table',
        tbody: '.enemy-table table tbody',
        rows: '.enemy-table table tbody tr',
        userLink: 'td .user a[href*="/user/"]',
        removeButton: '.togglebutton',
        resTag: '.RESUserTag .userTagLink.hasTag',
        voteWeight: '.voteWeight'
    }
};
```

## 🔧 Core Functions

### Initialization

#### `init()`
Main initialization function that sets up all components.

**Returns:** `void`

**Description:** Initializes the plugin by loading locked users, adding toolbar, checkboxes, sorting, and binding events.

---

### Data Management

#### `loadLockedUsers()`
Loads locked users from Chrome storage.

**Returns:** `void`

**Description:** Retrieves locked users from `chrome.storage.local` and applies locked state to existing rows.

#### `saveLockedUsers()`
Saves locked users to Chrome storage.

**Returns:** `void`

**Description:** Persists the current locked users set to `chrome.storage.local`.

#### `applyLockedState()`
Applies locked state to existing table rows.

**Returns:** `void`

**Description:** Iterates through all table rows and applies locked styling and behavior to users in the locked set.

---

### Data Extraction

#### `extractUsername(row)`
Extracts username from a table row.

**Parameters:**
- `row` (Element): Table row element

**Returns:** `string|null` - Username or null if not found

**Description:** Attempts to extract username from checkbox dataset or user link href.

#### `extractVoteWeight(row)`
Extracts vote weight from a table row.

**Parameters:**
- `row` (Element): Table row element

**Returns:** `number` - Vote weight (0 if not found)

**Description:** Parses the title attribute of vote weight element to calculate net vote score.

#### `extractDate(row)`
Extracts block date from a table row.

**Parameters:**
- `row` (Element): Table row element

**Returns:** `Date|null` - Block date or null if not found

**Description:** Extracts date from dataset or parses from text content.

---

### UI Management

#### `addToolbar()`
Adds the main toolbar to the page.

**Returns:** `void`

**Description:** Creates and inserts the elegant toolbar with filters and action buttons.

#### `addCheckboxes()`
Adds checkboxes to table rows.

**Returns:** `void`

**Description:** Processes each table row, extracts data, and rebuilds with checkboxes and action buttons.

#### `addSorting()`
Adds sorting functionality to column headers.

**Returns:** `void`

**Description:** Binds click events to sortable column headers for table sorting.

#### `updateUI()`
Updates the user interface state.

**Returns:** `void`

**Description:** Updates button states, selection counts, and other UI elements based on current state.

---

### Event Handlers

#### `handleSelectAll(e)`
Handles select all checkbox change.

**Parameters:**
- `e` (Event): Change event

**Returns:** `void`

**Description:** Selects/deselects all visible users when select all checkbox is toggled.

#### `handleCheckboxChange(checkbox)`
Handles individual checkbox change.

**Parameters:**
- `checkbox` (Element): Checkbox element

**Returns:** `void`

**Description:** Updates selection state when individual checkboxes are toggled.

#### `handleRemoveSelected()`
Handles bulk unblock operation.

**Returns:** `void`

**Description:** Processes selected users for unblocking with rate limiting and error handling.

#### `handleLockSelected()`
Handles bulk lock operation.

**Returns:** `void`

**Description:** Locks all selected users and updates their state.

#### `handleUnlockSelected()`
Handles bulk unlock operation.

**Returns:** `void`

**Description:** Unlocks all selected users and updates their state.

#### `handleApplyFilters()`
Handles filter application.

**Returns:** `void`

**Description:** Applies date and vote weight filters to show/hide table rows.

#### `handleColumnSort(sortType)`
Handles column sorting.

**Parameters:**
- `sortType` (string): Type of sort to perform

**Returns:** `void`

**Description:** Sorts table rows based on the specified column type.

---

### Individual Actions

#### `handleIndividualLock(button)`
Handles individual user lock toggle.

**Parameters:**
- `button` (Element): Lock button element

**Returns:** `void`

**Description:** Toggles lock state for a single user and updates UI.

#### `handleIndividualRemove(button)`
Handles individual user unblock.

**Parameters:**
- `button` (Element): Unblock button element

**Returns:** `void`

**Description:** Unblocks a single user by simulating Reddit's native unblock process.

---

### Utility Functions

#### `updateSelectAllState()`
Updates select all checkbox state.

**Returns:** `void`

**Description:** Determines and sets the appropriate state (checked, unchecked, indeterminate) for the select all checkbox.

#### `updateInitialFeedback()`
Updates initial feedback text with total count.

**Returns:** `void`

**Description:** Sets the initial "Showing all X blocked users" text in the filter feedback area.

#### `checkRESTags()`
Checks for RES tags and auto-locks users.

**Returns:** `void`

**Description:** Scans for users tagged as 'locked' in RES and automatically locks them.

---

## 🎨 CSS Classes

### Main Components
- `.elegant-toolbar` - Main toolbar container
- `.filter-container` - Filter controls container
- `.filter-group` - Individual filter group
- `.right-section` - Action buttons container

### Form Elements
- `.elegant-select` - Styled select dropdowns
- `.elegant-button` - Styled buttons
- `.elegant-button.danger` - Danger/destructive buttons
- `.elegant-button.tertiary` - Tertiary action buttons

### Table Elements
- `.reddit-block-manager-header` - Table header cells
- `.reddit-block-manager-locked` - Locked user rows
- `.sortable` - Sortable column headers
- `.lock-button` - Individual lock buttons

### State Classes
- `.locked` - Applied to locked users
- `.narrow` - Narrow form elements
- `.sort-indicator` - Sort direction indicators

---

## 🔄 Data Flow

### Initialization Flow
1. `init()` called on page load
2. `loadLockedUsers()` retrieves stored data
3. `addToolbar()` creates UI elements
4. `addCheckboxes()` processes table rows
5. `addSorting()` enables column sorting
6. `bindEvents()` attaches event listeners
7. `checkRESTags()` processes RES tags

### User Interaction Flow
1. User interacts with UI element
2. Event handler processes action
3. Data structures updated (CONFIG.lockedUsers, CONFIG.selectedUsers)
4. `updateUI()` refreshes interface
5. `saveLockedUsers()` persists changes (if applicable)

### Filter Flow
1. User selects filter criteria
2. `handleApplyFilters()` called
3. Rows evaluated against criteria
4. Non-matching rows hidden (`display: none`)
5. Feedback text updated with counts

---

## 🚨 Error Handling

### Try-Catch Blocks
All major functions are wrapped in try-catch blocks for error handling.

### Console Logging
- `console.log()` - General information
- `console.warn()` - Warnings and non-critical issues
- `console.error()` - Errors and exceptions

### Graceful Degradation
- Functions continue to work even if some components fail
- User feedback provided for critical operations
- Fallback behavior for missing elements

---

## 🔧 Browser Compatibility

### Chrome Extension
- Chrome 88+ (Manifest V3 support)
- Chromium-based browsers (Edge, Brave, etc.)

### Tampermonkey Userscript
- Any browser with Tampermonkey support
- Firefox, Chrome, Safari, Edge, etc.

### Reddit Compatibility
- Old Reddit interface only
- Reddit Enhancement Suite (RES) integration
- Dark mode support via RES

---

## 📊 Performance Considerations

### Rate Limiting
- 2-second delays between bulk unblock operations
- Respects Reddit's 60-100 requests/minute limit
- Exponential backoff for failed requests

### Memory Management
- Uses Sets for efficient user tracking
- Event delegation for dynamic elements
- Minimal DOM queries with caching

### CSS Optimization
- Consolidated styles to reduce file size
- Efficient selectors
- Minimal specificity conflicts

---

## 🔍 Debugging

### Console Commands
```javascript
// Access configuration
console.log(CONFIG);

// Check locked users
console.log(Array.from(CONFIG.lockedUsers));

// Check selected users
console.log(Array.from(CONFIG.selectedUsers));

// Force UI update
updateUI();
```

### Common Issues
1. **Selectors not working:** Check if Reddit page structure changed
2. **Storage not persisting:** Verify Chrome storage permissions
3. **Styling conflicts:** Check for CSS specificity issues
4. **Rate limiting:** Increase delays between operations

---

## 📝 Notes

- All functions are designed to be self-contained and handle their own errors
- The extension respects Reddit's terms of service and rate limits
- User data is stored locally and not transmitted to external servers
- The code is optimized for performance and minimal resource usage
