// Reddit Block Manager - Enhanced blocked users management
// Based on actual Reddit page structure analysis
(function() {
    'use strict';
    
    console.log('Reddit Block Manager: Script loaded on', window.location.href);

    // Configuration
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
     * Initialize the plugin with enhanced error handling
     * @description Main initialization function that sets up all components
     */
    function init() {
        console.log('Reddit Block Manager: Initializing...');
        console.log('Reddit Block Manager: Current URL:', window.location.href);
        console.log('Reddit Block Manager: Document ready state:', document.readyState);
        
        try {
            // Wait for the table to be present
            const table = document.querySelector(CONFIG.selectors.table);
            if (!table) {
                console.log('Reddit Block Manager: Table not found, retrying...');
                setTimeout(init, 1000);
                return;
            }

            loadLockedUsers();
            addToolbar();
            addCheckboxes();
            addSorting();
            bindEvents();
            checkRESTags();
            
            // Update initial feedback text with total count
            updateInitialFeedback();
            
            console.log('Reddit Block Manager: Initialized successfully');
        } catch (error) {
            console.error('Reddit Block Manager: Initialization error:', error);
        }
    }

    // Update initial feedback text with total count
    function updateInitialFeedback() {
        const rows = document.querySelectorAll(CONFIG.selectors.rows);
        const totalUsers = rows.length;
        
        const feedbackElement = document.getElementById('filter-feedback');
        if (feedbackElement) {
            feedbackElement.textContent = `Showing all ${totalUsers} blocked users`;
        }
    }

    // Load locked users from storage
    function loadLockedUsers() {
        chrome.storage.local.get(['lockedUsers'], (result) => {
            if (result.lockedUsers) {
                CONFIG.lockedUsers = new Set(result.lockedUsers);
                applyLockedState();
            }
        });
    }

    // Save locked users to storage
    function saveLockedUsers() {
        chrome.storage.local.set({
            lockedUsers: Array.from(CONFIG.lockedUsers)
        });
    }

    // Apply locked state to existing rows
    function applyLockedState() {
        const rows = document.querySelectorAll(CONFIG.selectors.rows);
        rows.forEach(row => {
            const username = extractUsername(row);
            if (!username) return;

            if (CONFIG.lockedUsers.has(username)) {
                row.classList.add(CONFIG.lockedClass);
                
                const lockButton = row.querySelector('.lock-button');
                if (lockButton) {
                    lockButton.classList.add('locked');
                    lockButton.innerHTML = '🔒';
                }
                
                // Disable and grey out the unblock button for locked users
                const unblockButton = row.querySelector('.reddit-button-danger');
                if (unblockButton) {
                    unblockButton.disabled = true;
                    unblockButton.style.opacity = '0.5';
                    unblockButton.style.cursor = 'not-allowed';
                    unblockButton.title = 'User is locked - cannot be unblocked';
                }
                
                // Remove from selection if locked
                const checkbox = row.querySelector('.reddit-block-manager-checkbox-cell input[type="checkbox"]');
                if (checkbox) {
                    checkbox.checked = false;
                }
                CONFIG.selectedUsers.delete(username);
            }
        });
    }

    // Add the management table header
    function addToolbar() {
        const table = document.querySelector(CONFIG.selectors.table);
        if (!table) return;

        // Create tools toolbar above the table
        const toolsToolbar = document.createElement('div');
        toolsToolbar.className = 'elegant-toolbar';
        toolsToolbar.innerHTML = `
            <div class="filter-container">
                <div class="filter-group">
                    <label for="date-filter" class="filter-label">
                        Blocked
                        <span class="help-icon" title="Select users blocked within a specific time period. '6+ months' targets users blocked long ago (safer to unblock).">?</span>
                    </label>
                    <select id="date-filter" class="elegant-select narrow">
                        <option value="all" selected>Any time</option>
                        <option value="1month">1+ months</option>
                        <option value="2months">2+ months</option>
                        <option value="3months">3+ months</option>
                        <option value="6months">6+ months</option>
                        <option value="1year">1+ year</option>
                    </select>
                </div>

                <div class="filter-group">
                    <label for="vote-filter" class="filter-label">
                        Vote weight
                        <span class="help-icon" title="Filter by your vote history with these users. Negative scores = downvotes, positive = upvotes. Use 'Better than' options to find safer users to unblock, or 'Worse than' options to find problematic users to lock.">?</span>
                    </label>
                    <select id="vote-filter" class="elegant-select narrow">
                        <option value="all" selected>Any score</option>
                        <option value="positive">Positive only</option>
                        <option value="zero-or-greater">Zero or greater</option>
                        <option value="all-negative">All negative</option>
                        <option value="5">Better than -5</option>
                        <option value="10">Better than -10</option>
                        <option value="15">Better than -15</option>
                        <option value="worse-5">Worse than -5</option>
                        <option value="worse-10">Worse than -10</option>
                        <option value="worse-15">Worse than -15</option>
                    </select>
                </div>

                <button id="apply-filters" class="elegant-button">
                    Apply
                </button>

                <span id="selected-count" class="selection-info">0 selected</span>
            </div>
            
            <div class="right-section">
                <span id="filter-feedback" class="filter-feedback">Loading...</span>
                <button id="lock-selected" class="elegant-button warning" disabled>
                    Lock
                </button>
                <button id="unlock-selected" class="elegant-button secondary" disabled>
                    Unlock
                </button>
                <button id="remove-selected" class="elegant-button danger" disabled>
                    Unblock
                </button>
                <button id="clear-selection" class="elegant-button tertiary">
                    Clear
                </button>
            </div>
        `;

        // Insert tools toolbar before the table
        table.parentNode.insertBefore(toolsToolbar, table);

        // Create the header row
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        headerRow.className = 'reddit-block-manager-header';
        
        headerRow.innerHTML = `
            <td class="reddit-block-manager-checkbox-header">
                <label class="select-all-container">
                    <input type="checkbox" id="${CONFIG.selectAllId}" class="select-all-checkbox">
                    <span class="checkmark"></span>
                </label>
            </td>
            <td class="reddit-block-manager-user-header sortable" data-sort="date">
                <span class="reddit-block-manager-header-text">
                    User
                    <span class="sort-indicator">↕</span>
                </span>
            </td>
            <td class="reddit-block-manager-date-header sortable" data-sort="date">
                <span class="reddit-block-manager-header-text">
                    Date blocked
                    <span class="sort-indicator">↕</span>
                </span>
            </td>
            <td class="reddit-block-manager-vote-header sortable" data-sort="votes">
                <span class="reddit-block-manager-header-text">
                    Vote weight
                    <span class="sort-indicator">↕</span>
                </span>
            </td>
            <td class="reddit-block-manager-lock-header sortable" data-sort="lock">
                <span class="reddit-block-manager-header-text">
                    Lock
                    <span class="sort-indicator">↕</span>
                </span>
            </td>
            <td class="reddit-block-manager-remove-header">
                <span class="reddit-block-manager-header-text">Unblock</span>
            </td>
        `;

        thead.appendChild(headerRow);
        
        // Insert the thead before tbody
        const tbody = table.querySelector('tbody');
        if (tbody) {
            table.insertBefore(thead, tbody);
        }
    }

    // Add checkboxes to each user row
    function addCheckboxes() {
        const tbody = document.querySelector(CONFIG.selectors.tbody);
        if (!tbody) return;

        const rows = tbody.querySelectorAll('tr');
        let totalUsers = 0;

        rows.forEach((row, index) => {
            const username = extractUsername(row);
            if (!username) return;

            totalUsers++;

            // Extract data BEFORE clearing the row
            const timeElement = row.querySelector('time');
            const dateText = timeElement ? (timeElement.textContent || timeElement.getAttribute('datetime') || 'Unknown') : 'Unknown';
            const blockDate = timeElement && timeElement.getAttribute('datetime') ? new Date(timeElement.getAttribute('datetime')) : null;
            
            const voteWeightElement = row.querySelector('.voteWeight');
            let downvotes = 0;
            if (voteWeightElement) {
                const title = voteWeightElement.getAttribute('title');
                if (title) {
                    const match = title.match(/-(\d+)$/);
                    if (match) {
                        downvotes = -parseInt(match[1]); // Store as negative number
                    }
                }
            }

            // Extract original user display (with RES tags) BEFORE clearing
            const originalUserDisplay = row.querySelector('a[href*="/user/"]')?.parentElement;
            const userDisplayHTML = originalUserDisplay ? originalUserDisplay.innerHTML : `<span class="username">${username}</span>`;

            // Store reference to original remove form BEFORE clearing
            const originalRemoveForm = row.querySelector('.toggle.unfriend-button');

            // Clear the row and rebuild it properly
            row.innerHTML = '';
            
            // Add checkbox cell
            const checkboxCell = document.createElement('td');
            checkboxCell.className = 'reddit-block-manager-checkbox-cell';
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = CONFIG.checkboxClass;
            checkbox.dataset.username = username;
            checkbox.dataset.rowIndex = index;

            const label = document.createElement('label');
            label.className = 'checkbox-label';
            label.appendChild(checkbox);
            label.appendChild(document.createElement('span'));

            checkboxCell.appendChild(label);
            row.appendChild(checkboxCell);

            // Add user cell (preserve original Reddit display with RES tags)
            const userCell = document.createElement('td');
            userCell.className = 'reddit-block-manager-user-cell';
            userCell.innerHTML = userDisplayHTML;
            row.appendChild(userCell);

            // Add date cell
            const dateCell = document.createElement('td');
            dateCell.className = 'reddit-block-manager-date-cell';
            dateCell.innerHTML = `<span class="date">${dateText}</span>`;
            // Store the actual date object in a data attribute for filtering
            if (blockDate) {
                row.dataset.blockDate = blockDate.getTime();
            }
            row.appendChild(dateCell);

            // Add vote score cell
            const voteCell = document.createElement('td');
            voteCell.className = 'reddit-block-manager-vote-cell';
            const voteScoreText = downvotes === 0 ? '0' : (downvotes > 0 ? `+${downvotes}` : downvotes.toString());
            voteCell.innerHTML = `<span class="vote-score">${voteScoreText}</span>`;
            row.appendChild(voteCell);

            // Add lock button
            const lockCell = document.createElement('td');
            lockCell.className = 'reddit-block-manager-lock-cell';
            
            const lockButton = document.createElement('button');
            lockButton.className = 'lock-button';
            lockButton.dataset.username = username;
            lockButton.innerHTML = '🔓';
            lockButton.title = 'Lock/Unlock user';
            
            lockCell.appendChild(lockButton);
            row.appendChild(lockCell);

            // Add unblock button
            const unblockCell = document.createElement('td');
            unblockCell.className = 'reddit-block-manager-remove-cell';
            
            const unblockButton = document.createElement('button');
            unblockButton.className = 'elegant-button danger';
            unblockButton.dataset.username = username;
            unblockButton.innerHTML = 'Unblock';
            unblockButton.title = 'Unblock user';
            
            // Re-append the original remove form if it exists
            if (originalRemoveForm) {
                originalRemoveForm.style.display = 'none';
                unblockCell.appendChild(originalRemoveForm);
            }
            
            unblockCell.appendChild(unblockButton);
            row.appendChild(unblockCell);

            // Hide the original remove link and remove its inline onclick handler
            const originalRemoveLink = row.querySelector('.togglebutton');
            if (originalRemoveLink) {
                originalRemoveLink.style.display = 'none';
                // Remove inline onclick handler to avoid CSP issues
                originalRemoveLink.removeAttribute('onclick');
            }

            // Apply locked state if user is locked
            if (CONFIG.lockedUsers.has(username)) {
                row.classList.add(CONFIG.lockedClass);
                lockButton.classList.add('locked');
                lockButton.innerHTML = '🔒';
            }

            // Add downvote weight indicator
            addDownvoteIndicator(row, username);
        });

        // Update total count
        const totalUsersElement = document.getElementById('total-users');
        if (totalUsersElement) {
            totalUsersElement.textContent = totalUsers;
        }
    }

    // Extract username from row - corrected for actual HTML structure
    function extractUsername(row) {
        // First try to get from our checkbox dataset (after row rebuild)
        const checkbox = row.querySelector('.reddit-block-manager-checkbox-cell input[type="checkbox"]');
        if (checkbox && checkbox.dataset.username) {
            return checkbox.dataset.username;
        }
        
        // Fallback: try to find original user link (before row rebuild)
        const userLink = row.querySelector(CONFIG.selectors.userLink);
        if (userLink) {
            const href = userLink.getAttribute('href');
            const match = href.match(/\/user\/([^\/]+)/);
            return match ? match[1] : null;
        }
        
        return null;
    }

    // Apply locked state to existing rows
    function applyLockedState() {
        const rows = document.querySelectorAll(CONFIG.selectors.rows);
        rows.forEach(row => {
            const username = extractUsername(row);
            if (username && CONFIG.lockedUsers.has(username)) {
                row.classList.add(CONFIG.lockedClass);
                const lockButton = row.querySelector('.lock-button');
                if (lockButton) {
                    lockButton.classList.add('locked');
                    lockButton.innerHTML = '🔒'; // Fixed: should be locked icon, not unlocked
                }
                
                // Ensure locked users are not selected
                const checkbox = row.querySelector('.reddit-block-manager-checkbox-cell input[type="checkbox"]');
                if (checkbox) {
                    checkbox.checked = false;
                }
                CONFIG.selectedUsers.delete(username);
            }
        });
        
        // Update UI after applying locked state
        updateUI();
    }

    // Add sorting functionality
    function addSorting() {
        try {
            const sortableHeaders = document.querySelectorAll('.sortable');
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

    // Bind event listeners
    function bindEvents() {
        // Select all checkbox
        const selectAllCheckbox = document.getElementById(CONFIG.selectAllId);
        if (selectAllCheckbox) {
            selectAllCheckbox.addEventListener('change', handleSelectAll);
        }

        // Individual checkboxes
        document.addEventListener('change', (e) => {
            if (e.target.classList.contains(CONFIG.checkboxClass)) {
                handleCheckboxChange(e.target);
            }
        });

        // Remove selected button
        const removeButton = document.getElementById('remove-selected');
        if (removeButton) {
            removeButton.addEventListener('click', handleRemoveSelected);
        }

        // Clear selection button
        const clearButton = document.getElementById('clear-selection');
        if (clearButton) {
            clearButton.addEventListener('click', handleClearSelection);
        }

        // Lock button
        const lockButton = document.getElementById('lock-selected');
        if (lockButton) {
            lockButton.addEventListener('click', handleLockSelected);
        }

        // Unlock button
        const unlockButton = document.getElementById('unlock-selected');
        if (unlockButton) {
            unlockButton.addEventListener('click', handleUnlockSelected);
        }

        // Apply filters button
        const applyFiltersButton = document.getElementById('apply-filters');
        if (applyFiltersButton) {
            applyFiltersButton.addEventListener('click', handleApplyFilters);
        }

        // No need for date operator change handler - simplified to single dropdown

        // Individual lock buttons
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('lock-button')) {
                handleIndividualLock(e.target);
            }
        });

        // Individual remove buttons
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('reddit-button-danger') && e.target.dataset.username) {
                handleIndividualRemove(e.target);
            }
        });

        // Sortable column headers
        document.addEventListener('click', (e) => {
            if (e.target.closest('.sortable')) {
                const sortableHeader = e.target.closest('.sortable');
                const sortType = sortableHeader.dataset.sort;
                handleColumnSort(sortType, sortableHeader);
            }
        });

        // Removed redundant dropdown event listeners - now using recipe builder
    }

    // Handle select all checkbox
    function handleSelectAll(e) {
        const isChecked = e.target.checked;
        const checkboxes = document.querySelectorAll(`.${CONFIG.checkboxClass}`);
        
        checkboxes.forEach(checkbox => {
            const row = checkbox.closest('tr');
            const username = checkbox.dataset.username;
            
            // Only select visible users (including locked users)
            if (row.style.display !== 'none') {
                checkbox.checked = isChecked;
                if (isChecked) {
                    CONFIG.selectedUsers.add(username);
                } else {
                    CONFIG.selectedUsers.delete(username);
                }
            }
        });

        updateUI();
    }

    // Handle individual checkbox change
    function handleCheckboxChange(checkbox) {
        const username = checkbox.dataset.username;
        const row = checkbox.closest('tr');
        
        if (checkbox.checked) {
            CONFIG.selectedUsers.add(username);
        } else {
            CONFIG.selectedUsers.delete(username);
        }
        
        updateSelectAllState();
        updateUI();
    }

    // Update select all checkbox state
    function updateSelectAllState() {
        const selectAllCheckbox = document.getElementById(CONFIG.selectAllId);
        const checkboxes = document.querySelectorAll(`.${CONFIG.checkboxClass}`);
        const visibleCheckboxes = Array.from(checkboxes).filter(cb => {
            const row = cb.closest('tr');
            return row.style.display !== 'none';
        });
        
        const checkedCount = visibleCheckboxes.filter(cb => cb.checked).length;
        
        if (checkedCount === 0) {
            selectAllCheckbox.indeterminate = false;
            selectAllCheckbox.checked = false;
        } else if (checkedCount === visibleCheckboxes.length) {
            selectAllCheckbox.indeterminate = false;
            selectAllCheckbox.checked = true;
        } else {
            selectAllCheckbox.indeterminate = true;
        }
    }

    // Handle remove selected
    function handleRemoveSelected() {
        // Filter out locked users from the selection
        const selectedUsernames = Array.from(CONFIG.selectedUsers).filter(username => {
            const checkbox = document.querySelector(`[data-username="${username}"]`);
            if (checkbox) {
                const row = checkbox.closest('tr');
                return !row.classList.contains(CONFIG.lockedClass);
            }
            return false;
        });
        
        if (selectedUsernames.length === 0) {
            alert('No unlocked users selected for unblocking.');
            return;
        }

        const confirmed = confirm(`Are you sure you want to unblock ${selectedUsernames.length} selected users? (Locked users will be skipped)`);
        if (!confirmed) return;

        // Override the native confirm dialog to automatically handle Reddit's confirmations
        let confirmCount = 0;
        const originalConfirm = window.confirm;
        const originalAlert = window.alert;
        
        // Override both confirm and alert to handle all Reddit dialogs
        window.confirm = function(message) {
            confirmCount++;
            console.log(`Auto-confirming Reddit dialog ${confirmCount}/${selectedUsernames.length}: ${message}`);
            return true; // Always return true to auto-confirm
        };
        
        window.alert = function(message) {
            console.log(`Auto-dismissing Reddit alert: ${message}`);
            return; // Dismiss alerts silently
        };

        // Process users with staggered timing and better error handling
        let successCount = 0;
        let errorCount = 0;
        
        selectedUsernames.forEach((username, index) => {
            setTimeout(() => {
                const checkbox = document.querySelector(`[data-username="${username}"]`);
                if (checkbox) {
                    const row = checkbox.closest('tr');
                    
                    // Find and trigger the original remove form (same logic as individual removal)
                    const originalRemoveForm = row.querySelector('.toggle.unfriend-button');
                    if (originalRemoveForm) {
                        try {
                            // First, try to click the original remove link to trigger the confirmation
                            const originalRemoveLink = row.querySelector('.togglebutton');
                            if (originalRemoveLink) {
                                // Temporarily show and click the original link
                                originalRemoveLink.style.display = 'inline';
                                originalRemoveLink.click();
                                
                                // Wait longer for the confirmation to appear, then click yes
                                setTimeout(() => {
                                    const yesLink = originalRemoveForm.querySelector('.yes');
                                    if (yesLink) {
                                        console.log(`Unblocking user ${index + 1}/${selectedUsernames.length}: ${username}`);
                                        yesLink.click();
                                        successCount++;
                                        
                                        // Add a small delay after clicking yes to let Reddit process
                                        setTimeout(() => {
                                            // Hide the original link again
                                            originalRemoveLink.style.display = 'none';
                                        }, 200);
                                    } else {
                                        console.warn(`No confirmation found for user: ${username}`);
                                        errorCount++;
                                    }
                                }, 300); // Increased delay for confirmation to appear
                            } else {
                                console.warn(`No remove link found for user: ${username}`);
                                errorCount++;
                            }
                        } catch (error) {
                            console.error(`Error removing user ${username}:`, error);
                            errorCount++;
                        }
                    } else {
                        console.warn(`No remove form found for user: ${username}`);
                        errorCount++;
                    }
                }
            }, index * 2000); // Increased delay to 2 seconds between users to respect Reddit's 60 requests/minute limit
        });

        // Restore original functions after processing and show results
        setTimeout(() => {
            window.confirm = originalConfirm;
            window.alert = originalAlert;
            console.log(`Bulk unblock completed. Success: ${successCount}, Errors: ${errorCount}, Total: ${selectedUsernames.length}`);
            
            if (errorCount > 0) {
                console.warn(`⚠️ ${errorCount} users could not be unblocked. This might be due to Reddit rate limiting or network issues.`);
                console.warn(`Consider running the unblock process again for the remaining users.`);
            }
        }, selectedUsernames.length * 2000 + 2000); // Wait for all processes to complete

        // Clear selection
        CONFIG.selectedUsers.clear();
        updateUI();
    }

    // Handle select all button
    function handleSelectAllButton() {
        const tbody = document.querySelector(CONFIG.selectors.tbody);
        if (!tbody) return;

        const rows = tbody.querySelectorAll('tr');
        let selectedCount = 0;

        rows.forEach(row => {
            // Skip locked users
            if (row.classList.contains(CONFIG.lockedClass)) return;

            const checkbox = row.querySelector('.reddit-block-manager-checkbox-cell input[type="checkbox"]');
            if (checkbox && !checkbox.checked) {
                checkbox.checked = true;
                const username = extractUsername(row);
                if (username) {
                    CONFIG.selectedUsers.add(username);
                    selectedCount++;
                }
            }
        });

        updateUI();
        console.log(`Selected ${selectedCount} additional users`);
    }

    // Handle clear selection
    function handleClearSelection() {
        console.log('Clear button clicked - starting clear process');
        
        CONFIG.selectedUsers.clear();
        console.log('Cleared selectedUsers set');
        
        // Uncheck all checkboxes
        const checkboxes = document.querySelectorAll('.reddit-block-manager-checkbox-cell input[type="checkbox"]');
        console.log(`Found ${checkboxes.length} checkboxes to uncheck`);
        checkboxes.forEach(checkbox => {
            checkbox.checked = false;
        });

        // Uncheck select all
        const selectAllCheckbox = document.getElementById(CONFIG.selectAllId);
        if (selectAllCheckbox) {
            selectAllCheckbox.checked = false;
            console.log('Unchecked select all checkbox');
        } else {
            console.log('Select all checkbox not found');
        }

        updateUI();
        console.log('Selection cleared - UI updated');
    }

    // Handle sort by votes
    function handleSortByVotes() {
        const tbody = document.querySelector(CONFIG.selectors.tbody);
        if (!tbody) return;

        const rows = Array.from(tbody.querySelectorAll('tr'));
        
        rows.sort((a, b) => {
            const aVoteWeight = extractVoteWeight(a);
            const bVoteWeight = extractVoteWeight(b);
            return aVoteWeight - bVoteWeight; // Sort by most negative (most downvotes)
        });

        // Reorder rows
        rows.forEach(row => tbody.appendChild(row));
        console.log('Table sorted by vote score (highest downvotes first)');
    }

    // Handle column sorting
    function handleColumnSort(sortType, headerElement) {
        const tbody = document.querySelector(CONFIG.selectors.tbody);
        if (!tbody) return;

        const rows = Array.from(tbody.querySelectorAll('tr'));
        const currentSort = headerElement.dataset.currentSort || 'none';
        
        // Determine new sort direction
        let newSort = 'asc';
        if (currentSort === 'asc') {
            newSort = 'desc';
        } else if (currentSort === 'desc') {
            newSort = 'none';
        }

        // Update sort indicators
        document.querySelectorAll('.sortable').forEach(header => {
            header.dataset.currentSort = 'none';
            const indicator = header.querySelector('.sort-indicator');
            indicator.textContent = '↕';
        });

        if (newSort !== 'none') {
            headerElement.dataset.currentSort = newSort;
            const indicator = headerElement.querySelector('.sort-indicator');
            indicator.textContent = newSort === 'asc' ? '↑' : '↓';
        }

        // Sort rows based on type and direction
        if (newSort !== 'none') {
            rows.sort((a, b) => {
                let comparison = 0;
                
                switch (sortType) {
                    case 'username':
                        const aUsername = extractUsername(a).toLowerCase();
                        const bUsername = extractUsername(b).toLowerCase();
                        comparison = aUsername.localeCompare(bUsername);
                        break;
                    case 'date':
                        const aDate = extractDate(a);
                        const bDate = extractDate(b);
                        comparison = aDate - bDate;
                        break;
                    case 'votes':
                        const aVotes = extractVoteWeight(a);
                        const bVotes = extractVoteWeight(b);
                        comparison = aVotes - bVotes;
                        break;
                    case 'lock':
                        const aLocked = a.classList.contains(CONFIG.lockedClass);
                        const bLocked = b.classList.contains(CONFIG.lockedClass);
                        comparison = aLocked - bLocked; // false (0) comes before true (1)
                        break;
                }
                
                return newSort === 'desc' ? -comparison : comparison;
            });

            // Reorder rows
            rows.forEach(row => tbody.appendChild(row));
        }
    }

    // Extract date from row for sorting
    function extractDate(row) {
        const timeElement = row.querySelector('time');
        if (timeElement && timeElement.getAttribute('datetime')) {
            return new Date(timeElement.getAttribute('datetime')).getTime();
        }
        return 0;
    }

    // Extract vote weight from row for sorting
    function extractVoteWeight(row) {
        // First try to find the original voteWeight element
        const voteWeightElement = row.querySelector('.voteWeight');
        if (voteWeightElement) {
            const title = voteWeightElement.getAttribute('title');
            if (title) {
                // Parse title like "your votes for JackHoff13: +0 -5"
                const match = title.match(/-(\d+)$/);
                if (match) {
                    return -parseInt(match[1]); // Return negative number for downvotes
                }
            }
        }
        
        // If not found, try to get from our vote score cell
        const voteScoreElement = row.querySelector('.vote-score');
        if (voteScoreElement) {
            const text = voteScoreElement.textContent;
            // Parse text like "-5", "+3", "0"
            const match = text.match(/^([+-]?\d+)$/);
            if (match) {
                return parseInt(match[1]);
            }
        }
        
        return 0;
    }

    // Removed handleDateSelection - now using recipe builder

    // Get cutoff date based on selection
    function getCutoffDate(selectedValue) {
        const now = new Date();
        const cutoffDate = new Date(now);
        
        switch (selectedValue) {
            case '1month':
                cutoffDate.setMonth(now.getMonth() - 1);
                break;
            case '2months':
                cutoffDate.setMonth(now.getMonth() - 2);
                break;
            case '3months':
                cutoffDate.setMonth(now.getMonth() - 3);
                break;
            case '6months':
                cutoffDate.setMonth(now.getMonth() - 6);
                break;
            case '1year':
                cutoffDate.setFullYear(now.getFullYear() - 1);
                break;
        }
        
        return cutoffDate.getTime();
    }

    // Removed handleDownvoteSelection - now using recipe builder

    // Handle recipe selection - flexible criteria builder
    function handleRecipeSelection() {
        const tbody = document.querySelector(CONFIG.selectors.tbody);
        if (!tbody) return;

        // Get recipe parameters
        const action = document.getElementById('recipe-action').value;
        const dateOperator = document.getElementById('date-operator').value;
        const datePeriod = document.getElementById('date-period').value;
        const downvoteOperator = document.getElementById('downvote-operator').value;

        const rows = tbody.querySelectorAll('tr');
        const cutoffDate = getCutoffDate(datePeriod);
        
        // Clear all selections first
        CONFIG.selectedUsers.clear();
        
        let processedCount = 0;
        let totalEligible = 0;
        
        // Process users based on recipe criteria
        rows.forEach(row => {
            const username = extractUsername(row);
            const blockDate = extractDate(row);
            const downvotes = extractVoteWeight(row);
            
                // Check date criteria
                let dateMatches = false;
                if (dateOperator === 'any') {
                    dateMatches = true; // Match all users regardless of date
                } else if (dateOperator === 'more') {
                    dateMatches = blockDate && blockDate < cutoffDate;
                } else if (dateOperator === 'less') {
                    dateMatches = blockDate && blockDate > cutoffDate;
                }
            
            // Check downvote criteria
            let downvoteMatches = false;
            if (downvoteOperator === 'any') {
                downvoteMatches = true;
            } else {
                const downvoteComparison = document.getElementById('downvote-comparison').value;
                const threshold = parseInt(downvoteOperator);
                
                // Handle special case for "0 or higher" (includes positive scores)
                if (downvoteOperator === '0' && downvoteComparison === 'up-to') {
                    downvoteMatches = downvotes >= 0; // Include positive scores
                } else if (downvoteComparison === 'up-to') {
                    // For negative thresholds: -5 >= -10 means "up to -10" includes -5, -6, -7, -8, -9, -10
                    downvoteMatches = downvotes >= threshold;
                } else if (downvoteComparison === 'greater-than') {
                    // For negative thresholds: -5 < -10 means "greater than -10" includes -11, -12, etc.
                    downvoteMatches = downvotes < threshold;
                }
            }
            
            // Check if user matches recipe criteria
            const isEligible = dateMatches && downvoteMatches;
            
            if (isEligible) {
                totalEligible++;
                
                // Apply the action
                switch (action) {
                    case 'remove':
                        // For remove, we need to select users first
                        if (!row.classList.contains(CONFIG.lockedClass)) {
                            CONFIG.selectedUsers.add(username);
                            const checkbox = row.querySelector('.reddit-block-manager-checkbox-cell input[type="checkbox"]');
                            if (checkbox) {
                                checkbox.checked = true;
                                processedCount++;
                            }
                        }
                        break;
                        
                    case 'lock':
                        if (!CONFIG.lockedUsers.has(username)) {
                            CONFIG.lockedUsers.add(username);
                            row.classList.add(CONFIG.lockedClass);
                            const lockButton = row.querySelector('.lock-button');
                            if (lockButton) {
                                lockButton.classList.add('locked');
                                lockButton.innerHTML = '🔒';
                            }
                            
                            // Remove from selection when locking
                            const checkbox = row.querySelector('.reddit-block-manager-checkbox-cell input[type="checkbox"]');
                            if (checkbox) {
                                checkbox.checked = false;
                            }
                            CONFIG.selectedUsers.delete(username);
                            
                            processedCount++;
                        }
                        break;
                        
                    case 'unlock':
                        if (CONFIG.lockedUsers.has(username)) {
                            CONFIG.lockedUsers.delete(username);
                            row.classList.remove(CONFIG.lockedClass);
                            const lockButton = row.querySelector('.lock-button');
                            if (lockButton) {
                                lockButton.classList.remove('locked');
                                lockButton.innerHTML = '🔓';
                            }
                            processedCount++;
                        }
                        break;
                        
                    case 'select':
                        if (!row.classList.contains(CONFIG.lockedClass)) {
                            CONFIG.selectedUsers.add(username);
                            const checkbox = row.querySelector('.reddit-block-manager-checkbox-cell input[type="checkbox"]');
                            if (checkbox) {
                                checkbox.checked = true;
                                processedCount++;
                            }
                        }
                        break;
                }
            }
        });

        // Show user feedback
        const actionText = action === 'remove' ? 'selected for unblocking' : 
                          action === 'lock' ? 'locked' : 
                          action === 'unlock' ? 'unlocked' : 'selected';
        
        const message = `Recipe Applied: Found ${totalEligible} eligible users, ${actionText} ${processedCount} users`;
        console.log(message);
        
        // Add validation warnings for potentially dangerous recipes
        if (action === 'remove' && downvoteOperator !== 'any') {
            const downvoteComparison = document.getElementById('downvote-comparison').value;
            const threshold = parseInt(downvoteOperator);
            
            if (downvoteComparison === 'greater-than' && threshold < -10) {
                console.warn('⚠️ WARNING: This recipe will UNBLOCK users with high downvote scores (serious trolls). Consider using "lock" instead.');
            } else if (downvoteComparison === 'up-to' && threshold > -5) {
                console.warn('⚠️ WARNING: This recipe will unblock users with low downvote scores. Make sure this is intentional.');
            }
        }
        
        if (processedCount > 0) {
            console.log(`✅ Recipe executed successfully: ${processedCount} users ${actionText}`);
        } else {
            console.log('ℹ️ No users match the recipe criteria');
        }

        // Save locked users if we modified them
        if (action === 'lock' || action === 'unlock') {
            saveLockedUsers();
        }

        updateUI();
    }

    // Add downvote weight indicator to row
    function addDownvoteIndicator(row, username) {
        const downvotes = extractVoteWeight(row);
        const userCell = row.querySelector(CONFIG.selectors.userCell);
        if (!userCell) return;

        // Remove existing indicator if any
        const existingIndicator = userCell.querySelector('.downvote-indicator');
        if (existingIndicator) {
            existingIndicator.remove();
        }

        // Create indicator based on downvote weight
        let indicator = '';
        let title = '';
        
        if (downvotes === 0) {
            indicator = '⚪'; // White circle for no downvotes
            title = 'No downvotes - Safe to remove';
        } else if (downvotes <= 5) {
            indicator = '🟢'; // Green circle for low downvotes
            title = `${downvotes} downvotes - Safe to remove`;
        } else if (downvotes <= 10) {
            indicator = '🟡'; // Yellow circle for medium downvotes
            title = `${downvotes} downvotes - Use caution`;
        } else {
            indicator = '🔴'; // Red circle for high downvotes
            title = `${downvotes} downvotes - Probably keep`;
        }

        // Create indicator element
        const indicatorElement = document.createElement('span');
        indicatorElement.className = 'downvote-indicator';
        indicatorElement.innerHTML = indicator;
        indicatorElement.title = title;
        indicatorElement.style.marginLeft = '5px';
        indicatorElement.style.cursor = 'help';

        // Add to user cell
        userCell.appendChild(indicatorElement);
    }

    // Extract vote weight from row - corrected for actual HTML structure
    function extractVoteWeight(row) {
        const voteWeightElement = row.querySelector(CONFIG.selectors.voteWeight);
        if (!voteWeightElement) return 0;
        
        // First try to get from title attribute (more reliable)
        const title = voteWeightElement.getAttribute('title');
        if (title) {
            // Title format: "your votes for username: +0 -18"
            const match = title.match(/\+(\d+)\s+(-?\d+)/);
            if (match) {
                const upvotes = parseInt(match[1]);
                const downvotes = parseInt(match[2]);
                return upvotes + downvotes; // Return net vote weight (upvotes + downvotes)
            }
        }
        
        // Fallback to text content
        const text = voteWeightElement.textContent;
        const textMatch = text.match(/\[(-?\d+)\]/);
        return textMatch ? parseInt(textMatch[1]) : 0;
    }

    // Handle lock selected
    function handleLockSelected() {
        const selectedUsernames = Array.from(CONFIG.selectedUsers);
        selectedUsernames.forEach(username => {
            CONFIG.lockedUsers.add(username);
            const row = document.querySelector(`[data-username="${username}"]`).closest('tr');
            row.classList.add(CONFIG.lockedClass);
            
            const lockButton = row.querySelector('.lock-button');
            if (lockButton) {
                lockButton.classList.add('locked');
                lockButton.innerHTML = '🔒';
            }
        });

        saveLockedUsers();
        updateUI();
    }

    // Handle unlock selected
    function handleUnlockSelected() {
        const selectedUsernames = Array.from(CONFIG.selectedUsers);
        selectedUsernames.forEach(username => {
            CONFIG.lockedUsers.delete(username);
            const row = document.querySelector(`[data-username="${username}"]`).closest('tr');
            row.classList.remove(CONFIG.lockedClass);
            
            const lockButton = row.querySelector('.lock-button');
            if (lockButton) {
                lockButton.classList.remove('locked');
                lockButton.innerHTML = '🔓';
            }
        });

        saveLockedUsers();
        updateUI();
    }

    // Handle individual lock/unlock
    function handleIndividualLock(button) {
        const username = button.dataset.username;
        const row = button.closest('tr');
        
        if (CONFIG.lockedUsers.has(username)) {
            // Currently locked, so unlock
            CONFIG.lockedUsers.delete(username);
            row.classList.remove(CONFIG.lockedClass);
            button.classList.remove('locked');
            button.innerHTML = '🔓';
            
            // Re-enable the unblock button
            const unblockButton = row.querySelector('.reddit-button-danger');
            if (unblockButton) {
                unblockButton.disabled = false;
                unblockButton.style.opacity = '1';
                unblockButton.style.cursor = 'pointer';
                unblockButton.title = 'Unblock user';
            }
        } else {
            // Currently unlocked, so lock
            CONFIG.lockedUsers.add(username);
            row.classList.add(CONFIG.lockedClass);
            button.classList.add('locked');
            button.innerHTML = '🔒';
            
            // Disable and grey out the unblock button
            const unblockButton = row.querySelector('.reddit-button-danger');
            if (unblockButton) {
                unblockButton.disabled = true;
                unblockButton.style.opacity = '0.5';
                unblockButton.style.cursor = 'not-allowed';
                unblockButton.title = 'User is locked - cannot be unblocked';
            }
            
            // Remove from selection when locking
            const checkbox = row.querySelector('.reddit-block-manager-checkbox-cell input[type="checkbox"]');
            if (checkbox) {
                checkbox.checked = false;
            }
            CONFIG.selectedUsers.delete(username);
        }

        saveLockedUsers();
        updateUI();
    }

    // Handle individual remove
    function handleIndividualRemove(button) {
        const username = button.dataset.username;
        const row = button.closest('tr');
        
        // Check if user is locked
        if (CONFIG.lockedUsers.has(username)) {
            alert(`${username} is locked and cannot be unblocked. Unlock the user first if you want to unblock them.`);
            return;
        }
        
        const confirmed = confirm(`Are you sure you want to unblock ${username}?`);
        if (!confirmed) return;

        // Find and trigger the original remove form
        const originalRemoveForm = row.querySelector('.toggle.unfriend-button');
        if (originalRemoveForm) {
            // Try to trigger the form submission by simulating the original flow
            try {
                // First, try to click the original remove link to trigger the confirmation
                const originalRemoveLink = row.querySelector('.togglebutton');
                if (originalRemoveLink) {
                    // Temporarily show and click the original link
                    originalRemoveLink.style.display = 'inline';
                    originalRemoveLink.click();
                    
                    // Wait a moment for the confirmation to appear, then click yes
                    setTimeout(() => {
                        const yesLink = originalRemoveForm.querySelector('.yes');
                        if (yesLink) {
                            yesLink.click();
                        }
                        // Hide the original link again
                        originalRemoveLink.style.display = 'none';
                    }, 100);
                } else {
                    // Fallback: try to submit the form directly
                    originalRemoveForm.submit();
                }
            } catch (error) {
                console.error('Error removing user:', error);
                // Final fallback: try direct form submission
                if (originalRemoveForm.submit) {
                    originalRemoveForm.submit();
                }
            }
        } else {
            console.error('Could not find remove form for user:', username);
        }
    }

    // Get cutoff date for filtering
    function getCutoffDate(period) {
        const now = new Date();
        switch (period) {
            case '1month':
                return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            case '2months':
                return new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
            case '3months':
                return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
            case '6months':
                return new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
            case '1year':
                return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
            default:
                return null;
        }
    }

    // Extract date from row
    function extractDate(row) {
        // First try to get from our stored data attribute (after row rebuild)
        if (row.dataset.blockDate) {
            return new Date(parseInt(row.dataset.blockDate));
        }
        
        // Fallback: try to find the original time element (before row rebuild)
        const timeElement = row.querySelector('time');
        if (timeElement) {
            const datetime = timeElement.getAttribute('datetime');
            if (datetime) {
                return new Date(datetime);
            }
        }
        
        // Final fallback: try to get from our date cell text
        const dateElement = row.querySelector('.reddit-block-manager-date-cell .date');
        if (dateElement) {
            const dateText = dateElement.textContent;
            // Try to parse the date text
            const parsedDate = new Date(dateText);
            if (!isNaN(parsedDate.getTime())) {
                return parsedDate;
            }
        }
        
        return null;
    }

    // Handle apply filters
    function handleApplyFilters() {
        console.log('Applying filters...');
        const dateFilter = document.getElementById('date-filter').value;
        const voteFilter = document.getElementById('vote-filter').value;
        
        console.log('Date filter:', dateFilter, 'Vote filter:', voteFilter);
        
        const tbody = document.querySelector(CONFIG.selectors.tbody);
        if (!tbody) {
            console.log('No tbody found');
            return;
        }

        const rows = tbody.querySelectorAll('tr');
        console.log(`Found ${rows.length} rows`);
        let visibleCount = 0;
        let totalUsers = 0;

        // First, clear all existing selections
        CONFIG.selectedUsers.clear();

        rows.forEach((row, index) => {
            const username = extractUsername(row);
            if (!username) {
                console.log(`Row ${index}: No username found`);
                console.log('Row HTML:', row.outerHTML.substring(0, 200) + '...');
                return;
            }

            totalUsers++;
            console.log(`Row ${index}: Found username: ${username}`);

            // Check date filter
            let dateMatches = true;
            if (dateFilter !== 'all') {
                const cutoffDate = getCutoffDate(dateFilter);
                const blockDate = extractDate(row);
                dateMatches = blockDate && blockDate < cutoffDate;
                console.log(`Row ${index} (${username}): Date check - blockDate: ${blockDate}, cutoffDate: ${cutoffDate}, matches: ${dateMatches}`);
            }

            // Check vote filter
            let voteMatches = true;
            if (voteFilter !== 'all') {
                const downvotes = extractVoteWeight(row);
                console.log(`Row ${index} (${username}): Vote weight: ${downvotes}`);
                
                switch (voteFilter) {
                    case 'positive':
                        voteMatches = downvotes > 0;
                        break;
                    case 'zero-or-greater':
                        voteMatches = downvotes >= 0;
                        break;
                    case 'all-negative':
                        voteMatches = downvotes < 0;
                        break;
                    case '5':
                        voteMatches = downvotes > -5; // >-5 means better than -5
                        break;
                    case '10':
                        voteMatches = downvotes > -10; // >-10 means better than -10
                        break;
                    case '15':
                        voteMatches = downvotes > -15; // >-15 means better than -15
                        break;
                    case 'worse-5':
                        voteMatches = downvotes < -5; // <-5 means worse than -5
                        break;
                    case 'worse-10':
                        voteMatches = downvotes < -10; // <-10 means worse than -10
                        break;
                    case 'worse-15':
                        voteMatches = downvotes < -15; // <-15 means worse than -15
                        break;
                }
                console.log(`Row ${index} (${username}): Vote check - downvotes: ${downvotes}, filter: ${voteFilter}, matches: ${voteMatches}`);
            }

            // Show/hide row based on filter criteria
            if (dateMatches && voteMatches) {
                row.style.display = '';
                visibleCount++;
                console.log(`Row ${index} (${username}): Showing`);
            } else {
                row.style.display = 'none';
                console.log(`Row ${index} (${username}): Hiding`);
            }
        });

        // Update feedback text
        const feedbackElement = document.getElementById('filter-feedback');
        if (feedbackElement) {
            if (dateFilter === 'all' && voteFilter === 'all') {
                feedbackElement.textContent = `Showing all ${totalUsers} blocked users`;
            } else {
                feedbackElement.textContent = `Showing ${visibleCount} of ${totalUsers} blocked users`;
            }
        }

        updateUI();
        console.log(`Applied filters: ${visibleCount} users visible out of ${totalUsers} total`);
    }

    // Update UI elements
    function updateUI() {
        const selectedCount = CONFIG.selectedUsers.size;
        const removeButton = document.getElementById('remove-selected');
        const lockButton = document.getElementById('lock-selected');
        const unlockButton = document.getElementById('unlock-selected');
        const selectedCountSpan = document.getElementById('selected-count');

        if (removeButton) {
            removeButton.disabled = selectedCount === 0;
        }
        
        if (lockButton) {
            lockButton.disabled = selectedCount === 0;
        }

        if (unlockButton) {
            unlockButton.disabled = selectedCount === 0;
        }
        
        if (selectedCountSpan) {
            selectedCountSpan.textContent = `${selectedCount} users selected`;
        }
    }

    // Check for RES tags and auto-lock users with 'locked' tag
    function checkRESTags() {
        const rows = document.querySelectorAll(CONFIG.selectors.rows);
        rows.forEach(row => {
            const username = extractUsername(row);
            if (!username) return;

            // Check for RES tag with 'locked' text - corrected selector
            const resTag = row.querySelector(CONFIG.selectors.resTag);
            if (resTag && resTag.textContent.toLowerCase().includes('locked')) {
                if (!CONFIG.lockedUsers.has(username)) {
                    CONFIG.lockedUsers.add(username);
                    row.classList.add(CONFIG.lockedClass);
                    
                    const lockButton = row.querySelector('.lock-button');
                    if (lockButton) {
                        lockButton.classList.add('locked');
                        lockButton.innerHTML = '🔓';
                    }
                }
            }
        });

        saveLockedUsers();
    }

    // Initialize when page loads with better error handling
    function safeInit() {
        try {
            init();
        } catch (error) {
            console.error('Reddit Block Manager initialization error:', error);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', safeInit);
    } else {
        // Use setTimeout to ensure DOM is fully ready
        setTimeout(safeInit, 100);
    }

    // Check for RES tags after a short delay to ensure they're loaded
    setTimeout(() => {
        try {
            checkRESTags();
        } catch (error) {
            console.error('Reddit Block Manager RES tags check error:', error);
        }
    }, 2000);

})();
