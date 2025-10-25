# Chrome Plugin Development Reference Guide

## Overview

This document serves as a comprehensive reference for developing Chrome plugins, emphasizing the importance of consulting the specified resources before implementing any code changes. The primary references include:

- [Tampermonkey Documentation](https://www.tampermonkey.net/documentation.php?locale=en)
- [Chrome Extensions API Reference](https://developer.chrome.com/docs/extensions/reference/api)
- [Reddit API Documentation](https://www.reddit.com/dev/api/)
- [Reddit Enhancement Suite](https://github.com/honestbleeps/Reddit-Enhancement-Suite)

## Tampermonkey Documentation

Tampermonkey is a popular userscript manager that allows for the execution of custom scripts to enhance web functionality. Key aspects include:

### Userscript Headers
Define metadata for scripts using directives:

```javascript
// @name        Script Name
// @namespace   http://tampermonkey.net/
// @version     1.0
// @description A brief description of the script
// @author      Your Name
// @match       https://www.reddit.com/*
// @grant       GM_setValue
// @grant       GM_getValue
// @grant       unsafeWindow
```

### Key Directives
- **@name**: Script name
- **@namespace**: Script namespace
- **@version**: Version number for update checks
- **@description**: Script description
- **@author**: Script author
- **@match**: URL patterns where script should run
- **@grant**: Permissions for GM_* functions and unsafeWindow access

### Resource Management
- **@require**: Load external JavaScript files before script execution
- **@resource**: Preload resources accessible via GM_getResourceURL and GM_getResourceText

### GM_* Functions
- `GM_setValue(key, value)`: Store data
- `GM_getValue(key, defaultValue)`: Retrieve stored data
- `GM_xmlhttpRequest()`: Make HTTP requests
- `GM_addStyle()`: Inject CSS styles

## Chrome Extensions API Reference

### Manifest V3
The latest extension manifest format with enhanced security:

```json
{
  "manifest_version": 3,
  "name": "Extension Name",
  "version": "1.0",
  "description": "Extension description",
  "permissions": ["activeTab", "storage"],
  "action": {
    "default_popup": "popup.html",
    "default_title": "Extension Title"
  },
  "content_scripts": [{
    "matches": ["https://www.reddit.com/*"],
    "js": ["content.js"]
  }],
  "background": {
    "service_worker": "background.js"
  }
}
```

### Key APIs

#### chrome.action
Controls the extension's toolbar icon:
```javascript
chrome.action.setIcon({ path: "icon.png" });
chrome.action.setTitle({ title: "New Title" });
```

#### chrome.tabs
Interact with browser tabs:
```javascript
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  console.log(tabs[0].url);
});
```

#### chrome.storage
Store and retrieve data:
```javascript
chrome.storage.local.set({ key: "value" });
chrome.storage.local.get(["key"], (result) => {
  console.log(result.key);
});
```

#### chrome.alarms
Schedule periodic tasks:
```javascript
chrome.alarms.create("myAlarm", { delayInMinutes: 1 });
chrome.alarms.onAlarm.addListener((alarm) => {
  console.log("Alarm triggered:", alarm.name);
});
```

### Asynchronous Methods
Most Chrome APIs are asynchronous and return promises:
```javascript
// Promise-based
chrome.tabs.query({ active: true, currentWindow: true })
  .then((tabs) => console.log(tabs[0].url));

// Callback-based (legacy)
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  console.log(tabs[0].url);
});
```

## Reddit API Documentation

### Authentication
Reddit uses OAuth2 for API access. Key endpoints:

- **Authorization**: `https://www.reddit.com/api/v1/authorize`
- **Token**: `https://www.reddit.com/api/v1/access_token`

### Key Endpoints

#### Account Management
- `GET /api/v1/me` - Get authenticated user info
- `GET /api/v1/me/karma` - Get user karma
- `GET /api/v1/me/trophies` - Get user trophies

#### Content Interaction
- `POST /api/submit` - Submit new post
- `POST /api/comment` - Submit comment
- `POST /api/vote` - Vote on post/comment
- `POST /api/save` - Save post/comment
- `POST /api/hide` - Hide post

#### Subreddit Operations
- `GET /r/{subreddit}/new` - Get new posts
- `GET /r/{subreddit}/hot` - Get hot posts
- `GET /r/{subreddit}/top` - Get top posts
- `GET /r/{subreddit}/about` - Get subreddit info

#### Search and Discovery
- `GET /search` - Search Reddit
- `GET /subreddits/popular` - Get popular subreddits
- `GET /subreddits/new` - Get new subreddits

### Rate Limits
- **60 requests per minute** for most endpoints
- **100 requests per minute** for OAuth-authenticated requests
- Implement exponential backoff for rate limit handling

### Request Headers
```javascript
const headers = {
  'User-Agent': 'YourApp/1.0 by YourUsername',
  'Authorization': 'Bearer YOUR_ACCESS_TOKEN',
  'Content-Type': 'application/x-www-form-urlencoded'
};
```

## Best Practices

### Security
- Always validate and sanitize user inputs
- Use HTTPS for all API requests
- Implement proper error handling
- Store sensitive data securely

### Performance
- Minimize DOM manipulation
- Use efficient selectors
- Implement debouncing for frequent events
- Cache API responses when appropriate

### Compliance
- Follow Chrome Web Store policies
- Respect Reddit's API terms of service
- Implement proper rate limiting
- Handle errors gracefully

### Testing
- Test across different browsers and versions
- Verify functionality with various Reddit pages
- Test with different user permissions
- Validate error handling scenarios

## Development Workflow

1. **Planning**: Define requirements and API needs
2. **Setup**: Create manifest and basic structure
3. **Development**: Implement core functionality
4. **Testing**: Test across different scenarios
5. **Documentation**: Document usage and configuration
6. **Deployment**: Package and distribute

## Common Patterns

### Content Script Injection
```javascript
// Inject script into page context
const script = document.createElement('script');
script.textContent = `
  // Your code here
`;
document.documentElement.appendChild(script);
```

### Message Passing
```javascript
// Content script to background
chrome.runtime.sendMessage({ action: 'getData' }, (response) => {
  console.log(response);
});

// Background to content script
chrome.tabs.sendMessage(tabId, { action: 'updateUI' });
```

### Storage Management
```javascript
// Save data
chrome.storage.local.set({ userSettings: settings });

// Load data
chrome.storage.local.get(['userSettings'], (result) => {
  if (result.userSettings) {
    // Use settings
  }
});
```

## Troubleshooting

### Common Issues
- **CORS errors**: Use content scripts or background pages
- **Permission denied**: Check manifest permissions
- **API rate limits**: Implement proper throttling
- **Script conflicts**: Use unique namespaces

### Debugging
- Use Chrome DevTools for debugging
- Check extension console for errors
- Monitor network requests
- Test in incognito mode

---

**Remember**: Always consult the official documentation before implementing any code changes to ensure compliance with best practices and current API specifications.

