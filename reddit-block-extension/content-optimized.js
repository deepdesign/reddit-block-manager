// Reddit Block Manager - Enhanced blocked users management
// Based on actual Reddit page structure analysis
(function() {
    'use strict';

    /**
     * Configuration object containing all constants and selectors
     * @type {Object}
     */
    const CONFIG = {
        selectAllId: 'reddit-block-manager-select-all',
        toolbarId: 'reddit-block-manager-toolbar',
        checkboxClass: 'reddit-block-manager-checkbox',
        lockedClass: 'reddit-block-manager-locked',
        lockedUsers: new Set(),
        selectedUsers: new Set(),
        // Correct selectors based on actual HTML structure
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

    /**
     * Utility functions for common operations
     */
    const Utils = {
        /**
         * Safe query selector with error handling
         * @param {string} selector - CSS selector
         * @param {Element} context - Context element (default: document)
         * @returns {Element|null} Found element or null
         */
        safeQuerySelector(selector, context = document) {
            try {
                return context.querySelector(selector);
            } catch (error) {
                console.warn(`Reddit Block Manager: Invalid selector "${selector}":`, error);
                return null;
            }
        },

        /**
         * Safe query selector all with error handling
         * @param {string} selector - CSS selector
         * @param {Element} context - Context element (default: document)
         * @returns {NodeList} Found elements or empty NodeList
         */
        safeQuerySelectorAll(selector, context = document) {
            try {
                return context.querySelectorAll(selector);
            } catch (error) {
                console.warn(`Reddit Block Manager: Invalid selector "${selector}":`, error);
                return document.createDocumentFragment().querySelectorAll('*');
            }
        },

        /**
         * Debounce function to limit function calls
         * @param {Function} func - Function to debounce
         * @param {number} wait - Wait time in milliseconds
         * @returns {Function} Debounced function
         */
        debounce(func, wait) {
            let timeout;
            return function executedFunction(...args) {
                const later = () => {
                    clearTimeout(timeout);
                    func(...args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        },

        /**
         * Safe async operation with error handling
         * @param {Function} operation - Async operation to perform
         * @param {string} operationName - Name for logging
         * @returns {Promise} Promise that resolves to operation result
         */
        async safeAsync(operation, operationName) {
            try {
                return await operation();
            } catch (error) {
                console.error(`Reddit Block Manager: ${operationName} failed:`, error);
                return null;
            }
        },

        /**
         * Validate username format
         * @param {string} username - Username to validate
         * @returns {boolean} True if valid
         */
        isValidUsername(username) {
            return typeof username === 'string' && username.length > 0 && username.length <= 20;
        }
    };

    /**
     * Initialize the plugin with enhanced error handling
     */
    function init() {
        console.log('Reddit Block Manager: Initializing...');
        
        try {
            // Wait for the table to be present with retry logic
            const table = Utils.safeQuerySelector(CONFIG.selectors.table);
            if (!table) {
                console.log('Reddit Block Manager: Table not found, retrying...');
                setTimeout(init, 1000);
                return;
            }

            // Initialize components in order
            const initSteps = [
                () => loadLockedUsers(),
                () => addToolbar(),
                () => addCheckboxes(),
                () => addSorting(),
                () => bindEvents(),
                () => checkRESTags(),
                () => updateInitialFeedback()
            ];

            // Execute initialization steps
            initSteps.forEach(step => {
                try {
                    step();
                } catch (error) {
                    console.error('Reddit Block Manager: Initialization step failed:', error);
                }
            });
            
            console.log('Reddit Block Manager: Initialized successfully');
        } catch (error) {
            console.error('Reddit Block Manager: Initialization error:', error);
        }
    }

    /**
     * Update initial feedback text with total count
     */
    function updateInitialFeedback() {
        try {
            const rows = Utils.safeQuerySelectorAll(CONFIG.selectors.rows);
            const totalUsers = rows.length;
            
            const feedbackElement = Utils.safeQuerySelector('#filter-feedback');
            if (feedbackElement) {
                feedbackElement.textContent = `Showing all ${totalUsers} blocked users`;
            }
        } catch (error) {
            console.error('Reddit Block Manager: Failed to update initial feedback:', error);
        }
    }

    /**
     * Load locked users from storage with error handling
     */
    function loadLockedUsers() {
        try {
            chrome.storage.local.get(['lockedUsers'], (result) => {
                if (chrome.runtime.lastError) {
                    console.error('Reddit Block Manager: Storage error:', chrome.runtime.lastError);
                    return;
                }
                
                if (result.lockedUsers) {
                    CONFIG.lockedUsers = new Set(result.lockedUsers);
                    applyLockedState();
                }
            });
        } catch (error) {
            console.error('Reddit Block Manager: Failed to load locked users:', error);
        }
    }

    /**
     * Save locked users to storage with error handling
     */
    function saveLockedUsers() {
        try {
            chrome.storage.local.set({
                lockedUsers: Array.from(CONFIG.lockedUsers)
            }, () => {
                if (chrome.runtime.lastError) {
                    console.error('Reddit Block Manager: Failed to save locked users:', chrome.runtime.lastError);
                }
            });
        } catch (error) {
            console.error('Reddit Block Manager: Failed to save locked users:', error);
        }
    }

    /**
     * Apply locked state to existing rows
     */
    function applyLockedState() {
        try {
            const rows = Utils.safeQuerySelectorAll(CONFIG.selectors.rows);
            rows.forEach(row => {
                const username = extractUsername(row);
                if (!username || !Utils.isValidUsername(username)) return;

                if (CONFIG.lockedUsers.has(username)) {
                    row.classList.add(CONFIG.lockedClass);
                    
                    const lockButton = row.querySelector('.lock-button');
                    if (lockButton) {
                        lockButton.classList.add('locked');
                        lockButton.innerHTML = '🔒';
                    }
                    
                    const unblockButton = row.querySelector('.elegant-button.danger');
                    if (unblockButton) {
                        unblockButton.disabled = true;
                        unblockButton.style.opacity = '0.5';
                    }
                    
                    const checkbox = row.querySelector(`.${CONFIG.checkboxClass}`);
                    if (checkbox) {
                        checkbox.checked = false;
                    }
                }
            });
            
            updateUI();
        } catch (error) {
            console.error('Reddit Block Manager: Failed to apply locked state:', error);
        }
    }

    /**
     * Extract username from a table row
     * @param {Element} row - Table row element
     * @returns {string|null} Username or null if not found
     */
    function extractUsername(row) {
        try {
            if (!row) return null;

            // First try to get from checkbox dataset
            const checkbox = row.querySelector(`.${CONFIG.checkboxClass}`);
            if (checkbox && checkbox.dataset.username) {
                return checkbox.dataset.username;
            }

            // Fallback to user link
            const userLink = row.querySelector(CONFIG.selectors.userLink);
            if (userLink) {
                const href = userLink.getAttribute('href');
                const match = href.match(/\/user\/([^\/]+)/);
                return match ? match[1] : null;
            }

            return null;
        } catch (error) {
            console.error('Reddit Block Manager: Failed to extract username:', error);
            return null;
        }
    }

    /**
     * Extract vote weight from a table row
     * @param {Element} row - Table row element
     * @returns {number} Vote weight (0 if not found)
     */
    function extractVoteWeight(row) {
        try {
            if (!row) return 0;

            const voteElement = row.querySelector(CONFIG.selectors.voteWeight);
            if (!voteElement) return 0;

            const title = voteElement.getAttribute('title');
            if (!title) return 0;

            // Parse the title attribute for vote data
            const match = title.match(/(\d+)\s*upvotes?[,\s]*(\d+)\s*downvotes?/i);
            if (match) {
                const upvotes = parseInt(match[1], 10);
                const downvotes = parseInt(match[2], 10);
                return upvotes + downvotes; // Net vote weight
            }

            return 0;
        } catch (error) {
            console.error('Reddit Block Manager: Failed to extract vote weight:', error);
            return 0;
        }
    }

    /**
     * Extract block date from a table row
     * @param {Element} row - Table row element
     * @returns {Date|null} Block date or null if not found
     */
    function extractDate(row) {
        try {
            if (!row) return null;

            // First try to get from dataset
            if (row.dataset.blockDate) {
                return new Date(row.dataset.blockDate);
            }

            // Fallback to parsing from text content
            const dateCell = row.querySelector('td:nth-child(2)');
            if (dateCell) {
                const dateText = dateCell.textContent.trim();
                const date = new Date(dateText);
                return isNaN(date.getTime()) ? null : date;
            }

            return null;
        } catch (error) {
            console.error('Reddit Block Manager: Failed to extract date:', error);
            return null;
        }
    }

    /**
     * Add the main toolbar with enhanced error handling
     */
    function addToolbar() {
        try {
            const infobar = Utils.safeQuerySelector(CONFIG.selectors.infobar);
            if (!infobar) {
                console.error('Reddit Block Manager: Infobar not found');
                return;
            }

            // Check if toolbar already exists
            if (Utils.safeQuerySelector(`#${CONFIG.toolbarId}`)) {
                console.log('Reddit Block Manager: Toolbar already exists');
                return;
            }

            const toolbar = document.createElement('div');
            toolbar.id = CONFIG.toolbarId;
            toolbar.className = 'elegant-toolbar';
            toolbar.innerHTML = `
                <div class="filter-container">
                    <div class="filter-group">
                        <label class="filter-label">Blocked</label>
                        <select id="date-filter" class="narrow">
                            <option value="all">Any time</option>
                            <option value="1month">1+ months</option>
                            <option value="2months">2+ months</option>
                            <option value="3months">3+ months</option>
                            <option value="6months">6+ months</option>
                            <option value="1year">1+ year</option>
                        </select>
                    </div>
                    <div class="filter-group">
                        <label class="filter-label">Vote weight <span title="Better than: users with vote scores better than threshold. Worse than: users with vote scores worse than threshold.">?</span></label>
                        <select id="vote-filter" class="narrow">
                            <option value="all">Any score</option>
                            <option value="positive">Positive only</option>
                            <option value="zero+">Zero or greater</option>
                            <option value="negative">All negative</option>
                            <option value="better-5">Better than -5</option>
                            <option value="better-10">Better than -10</option>
                            <option value="better-15">Better than -15</option>
                            <option value="worse-5">Worse than -5</option>
                            <option value="worse-10">Worse than -10</option>
                            <option value="worse-15">Worse than -15</option>
                        </select>
                    </div>
                    <button id="apply-filters" class="elegant-button">Apply</button>
                    <div class="selection-info">
                        <span id="filter-feedback">Loading...</span>
                    </div>
                </div>
                <div class="right-section">
                    <button id="lock-selected" class="elegant-button">Lock</button>
                    <button id="unlock-selected" class="elegant-button">Unlock</button>
                    <button id="remove-selected" class="elegant-button danger">Unblock</button>
                    <button id="clear-selection" class="elegant-button tertiary">Clear</button>
                </div>
            `;

            infobar.appendChild(toolbar);
            console.log('Reddit Block Manager: Toolbar added successfully');
        } catch (error) {
            console.error('Reddit Block Manager: Failed to add toolbar:', error);
        }
    }

    /**
     * Add checkboxes to table rows with enhanced error handling
     */
    function addCheckboxes() {
        try {
            const table = Utils.safeQuerySelector(CONFIG.selectors.table);
            if (!table) {
                console.error('Reddit Block Manager: Table not found');
                return;
            }

            // Add header checkbox
            const headerRow = table.querySelector('thead tr');
            if (headerRow) {
                const checkboxHeader = document.createElement('th');
                checkboxHeader.className = 'reddit-block-manager-checkbox-header';
                checkboxHeader.innerHTML = `
                    <input type="checkbox" id="${CONFIG.selectAllId}" class="${CONFIG.checkboxClass}">
                `;
                headerRow.insertBefore(checkboxHeader, headerRow.firstChild);

                // Add other headers
                const headers = ['User', 'Date blocked', 'Vote weight', 'Lock', 'Unblock'];
                headers.forEach(headerText => {
                    const th = document.createElement('th');
                    th.className = 'reddit-block-manager-header';
                    th.innerHTML = `
                        <span class="reddit-block-manager-header-text">${headerText}</span>
                        <span class="sort-indicator">↕</span>
                    `;
                    th.classList.add('sortable');
                    th.dataset.sort = headerText.toLowerCase().replace(' ', '');
                    headerRow.appendChild(th);
                });
            }

            // Process each row
            const rows = Utils.safeQuerySelectorAll(CONFIG.selectors.rows);
            rows.forEach((row, index) => {
                try {
                    processRow(row, index);
                } catch (error) {
                    console.error(`Reddit Block Manager: Failed to process row ${index}:`, error);
                }
            });

            console.log(`Reddit Block Manager: Processed ${rows.length} rows`);
        } catch (error) {
            console.error('Reddit Block Manager: Failed to add checkboxes:', error);
        }
    }

    /**
     * Process a single table row
     * @param {Element} row - Table row element
     * @param {number} index - Row index
     */
    function processRow(row, index) {
        try {
            // Extract data before clearing
            const username = extractUsername(row);
            const voteWeight = extractVoteWeight(row);
            const blockDate = extractDate(row);
            const originalUserDisplay = row.querySelector(CONFIG.selectors.userLink)?.parentElement?.innerHTML || '';
            const originalRemoveForm = row.querySelector('form')?.outerHTML || '';

            if (!username || !Utils.isValidUsername(username)) {
                console.warn(`Reddit Block Manager: Invalid username for row ${index}: ${username}`);
                return;
            }

            // Store data in dataset
            row.dataset.username = username;
            row.dataset.voteWeight = voteWeight;
            if (blockDate) {
                row.dataset.blockDate = blockDate.toISOString();
            }

            // Clear and rebuild row
            row.innerHTML = '';

            // Add checkbox
            const checkboxCell = document.createElement('td');
            checkboxCell.innerHTML = `
                <input type="checkbox" class="${CONFIG.checkboxClass}" data-username="${username}">
            `;
            row.appendChild(checkboxCell);

            // Add user cell
            const userCell = document.createElement('td');
            userCell.innerHTML = originalUserDisplay;
            row.appendChild(userCell);

            // Add date cell
            const dateCell = document.createElement('td');
            dateCell.textContent = blockDate ? blockDate.toLocaleDateString() : 'Unknown';
            row.appendChild(dateCell);

            // Add vote weight cell
            const voteCell = document.createElement('td');
            voteCell.textContent = voteWeight;
            voteCell.className = 'vote-weight-cell';
            row.appendChild(voteCell);

            // Add lock cell
            const lockCell = document.createElement('td');
            lockCell.innerHTML = `
                <button class="lock-button" data-username="${username}">🔓</button>
            `;
            row.appendChild(lockCell);

            // Add unblock cell
            const unblockCell = document.createElement('td');
            unblockCell.innerHTML = `
                <button class="elegant-button danger" data-username="${username}">Unblock</button>
            `;
            row.appendChild(unblockCell);

            // Apply locked state if needed
            if (CONFIG.lockedUsers.has(username)) {
                row.classList.add(CONFIG.lockedClass);
                const lockButton = row.querySelector('.lock-button');
                if (lockButton) {
                    lockButton.classList.add('locked');
                    lockButton.innerHTML = '🔒';
                }
                const unblockButton = row.querySelector('.elegant-button.danger');
                if (unblockButton) {
                    unblockButton.disabled = true;
                    unblockButton.style.opacity = '0.5';
                }
            }
        } catch (error) {
            console.error(`Reddit Block Manager: Failed to process row ${index}:`, error);
        }
    }

    /**
     * Add sorting functionality to column headers
     */
    function addSorting() {
        try {
            const sortableHeaders = Utils.safeQuerySelectorAll('.sortable');
            sortableHeaders.forEach(header => {
                header.addEventListener('click', () => {
                    const sortType = header.dataset.sort;
                    if (sortType) {
                        handleColumnSort(sortType);
                    }
                });
            });
            console.log('Reddit Block Manager: Sorting functionality added');
        } catch (error) {
            console.error('Reddit Block Manager: Failed to add sorting:', error);
        }
    }

    /**
     * Handle column sorting
     * @param {string} sortType - Type of sort to perform
     */
    function handleColumnSort(sortType) {
        try {
            const tbody = Utils.safeQuerySelector(CONFIG.selectors.tbody);
            if (!tbody) return;

            const rows = Array.from(Utils.safeQuerySelectorAll(CONFIG.selectors.rows));
            
            // Sort rows based on type
            rows.sort((a, b) => {
                switch (sortType) {
                    case 'user':
                        const usernameA = extractUsername(a) || '';
                        const usernameB = extractUsername(b) || '';
                        return usernameA.localeCompare(usernameB);
                    
                    case 'dateblocked':
                        const dateA = extractDate(a) || new Date(0);
                        const dateB = extractDate(b) || new Date(0);
                        return dateA - dateB;
                    
                    case 'voteweight':
                        const weightA = extractVoteWeight(a);
                        const weightB = extractVoteWeight(b);
                        return weightA - weightB;
                    
                    case 'lock':
                        const lockedA = a.classList.contains(CONFIG.lockedClass) ? 1 : 0;
                        const lockedB = b.classList.contains(CONFIG.lockedClass) ? 1 : 0;
                        return lockedA - lockedB;
                    
                    default:
                        return 0;
                }
            });

            // Reorder DOM elements
            rows.forEach(row => tbody.appendChild(row));
            
            console.log(`Reddit Block Manager: Sorted by ${sortType}`);
        } catch (error) {
            console.error('Reddit Block Manager: Failed to sort columns:', error);
        }
    }

    /**
     * Bind all event listeners with enhanced error handling
     */
    function bindEvents() {
        try {
            // Event delegation for dynamic elements
            document.addEventListener('change', (e) => {
                if (e.target.classList.contains(CONFIG.checkboxClass)) {
                    handleCheckboxChange(e.target);
                }
            });

            document.addEventListener('click', (e) => {
                if (e.target.classList.contains('lock-button')) {
                    handleIndividualLock(e.target);
                } else if (e.target.classList.contains('elegant-button.danger')) {
                    handleIndividualRemove(e.target);
                }
            });

            // Bind specific button events
            const buttonEvents = [
                { id: CONFIG.selectAllId, event: 'change', handler: handleSelectAll },
                { id: 'remove-selected', event: 'click', handler: handleRemoveSelected },
                { id: 'clear-selection', event: 'click', handler: handleClearSelection },
                { id: 'lock-selected', event: 'click', handler: handleLockSelected },
                { id: 'unlock-selected', event: 'click', handler: handleUnlockSelected },
                { id: 'apply-filters', event: 'click', handler: handleApplyFilters }
            ];

            buttonEvents.forEach(({ id, event, handler }) => {
                const element = Utils.safeQuerySelector(`#${id}`);
                if (element) {
                    element.addEventListener(event, handler);
                } else {
                    console.warn(`Reddit Block Manager: Element #${id} not found for event binding`);
                }
            });

            console.log('Reddit Block Manager: Event listeners bound successfully');
        } catch (error) {
            console.error('Reddit Block Manager: Failed to bind events:', error);
        }
    }

    // ... (Continue with remaining functions using the same optimized pattern)

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();