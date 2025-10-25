// Reddit Block Manager - Enhanced blocked users management
// Based on actual Reddit page structure analysis
(function() {
    'use strict';

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

    // Initialize the plugin
    function init() {
        console.log('Reddit Block Manager: Initializing...');
        
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
        
        console.log('Reddit Block Manager: Initialized successfully');
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

    // Add the management table header
    function addToolbar() {
        const table = document.querySelector(CONFIG.selectors.table);
        if (!table) return;

        // Create tools toolbar above the table
        const toolsToolbar = document.createElement('div');
        toolsToolbar.className = 'reddit-block-manager-tools';
        toolsToolbar.innerHTML = `
            <div class="reddit-block-manager-tools-content">
                <div class="reddit-block-manager-tools-left">
                    <select id="select-by-date" class="reddit-select">
                        <option value="">Select by date...</option>
                        <option value="1month">1+ months ago</option>
                        <option value="2months">2+ months ago</option>
                        <option value="3months">3+ months ago</option>
                        <option value="6months">6+ months ago</option>
                        <option value="1year">1+ year ago</option>
                    </select>
                    <select id="select-by-downvotes" class="reddit-select">
                        <option value="">Select by downvotes...</option>
                        <option value="0-5">0-5 downvotes</option>
                        <option value="5-10">5-10 downvotes</option>
                        <option value="10+">10+ downvotes</option>
                    </select>
                </div>
                <div class="reddit-block-manager-tools-right">
                    <button id="sort-by-downvotes" class="reddit-button reddit-button-secondary">
                        Sort by Downvotes
                    </button>
                    <button id="lock-selected" class="reddit-button reddit-button-warning" disabled>
                        Lock Selected
                    </button>
                </div>
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
            <td class="reddit-block-manager-user-header sortable" data-sort="username">
                <span class="reddit-block-manager-header-text">
                    Username
                    <span class="sort-indicator">↕</span>
                </span>
            </td>
            <td class="reddit-block-manager-date-header sortable" data-sort="date">
                <span class="reddit-block-manager-header-text">
                    Date blocked
                    <span class="sort-indicator">↕</span>
                </span>
            </td>
            <td class="reddit-block-manager-actions-header">
                <span class="reddit-block-manager-header-text">Actions</span>
            </td>
            <td class="reddit-block-manager-lock-header">
                <span class="reddit-block-manager-header-text">Lock</span>
            </td>
            <td class="reddit-block-manager-remove-header">
                <button id="remove-selected" class="reddit-button reddit-button-danger reddit-button-compact" disabled>
                    Remove (<span id="selected-count">0</span>)
                </button>
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
            row.insertBefore(checkboxCell, row.firstChild);

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

            // Add remove button (replace the original remove link)
            const removeCell = document.createElement('td');
            removeCell.className = 'reddit-block-manager-remove-cell';
            
            const removeButton = document.createElement('button');
            removeButton.className = 'reddit-button reddit-button-danger reddit-button-small';
            removeButton.dataset.username = username;
            removeButton.innerHTML = 'Remove';
            removeButton.title = 'Remove user';
            
            // Store reference to original remove form for later use
            const originalRemoveForm = row.querySelector('.toggle.unfriend-button');
            if (originalRemoveForm) {
                removeButton.dataset.originalForm = 'true';
            }
            
            removeCell.appendChild(removeButton);
            row.appendChild(removeCell);

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
        });

        // Update total count
        const totalUsersElement = document.getElementById('total-users');
        if (totalUsersElement) {
            totalUsersElement.textContent = totalUsers;
        }
    }

    // Extract username from row - corrected for actual HTML structure
    function extractUsername(row) {
        const userLink = row.querySelector(CONFIG.selectors.userLink);
        if (!userLink) return null;
        
        const href = userLink.getAttribute('href');
        const match = href.match(/\/user\/([^\/]+)/);
        return match ? match[1] : null;
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
                    lockButton.innerHTML = '🔓';
                }
            }
        });
    }

    // Add sorting functionality
    function addSorting() {
        // This will be implemented to sort by downvote scores
        // The vote weight data is available in the HTML
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

        // Sort button
        const sortButton = document.getElementById('sort-by-downvotes');
        if (sortButton) {
            sortButton.addEventListener('click', handleSortByDownvotes);
        }

        // Lock button
        const lockButton = document.getElementById('lock-selected');
        if (lockButton) {
            lockButton.addEventListener('click', handleLockSelected);
        }

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

        // Date selection dropdown
        document.addEventListener('change', (e) => {
            if (e.target.id === 'select-by-date') {
                handleDateSelection(e.target.value);
            }
        });

        // Downvote selection dropdown
        document.addEventListener('change', (e) => {
            if (e.target.id === 'select-by-downvotes') {
                handleDownvoteSelection(e.target.value);
            }
        });
    }

    // Handle select all checkbox
    function handleSelectAll(e) {
        const isChecked = e.target.checked;
        const checkboxes = document.querySelectorAll(`.${CONFIG.checkboxClass}`);
        
        checkboxes.forEach(checkbox => {
            const row = checkbox.closest('tr');
            const username = checkbox.dataset.username;
            
            // Don't select locked users
            if (!row.classList.contains(CONFIG.lockedClass)) {
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
        
        // Don't allow selection of locked users
        if (row.classList.contains(CONFIG.lockedClass)) {
            checkbox.checked = false;
            return;
        }
        
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
        const unlockedCheckboxes = Array.from(checkboxes).filter(cb => 
            !cb.closest('tr').classList.contains(CONFIG.lockedClass)
        );
        
        const checkedCount = unlockedCheckboxes.filter(cb => cb.checked).length;
        
        if (checkedCount === 0) {
            selectAllCheckbox.indeterminate = false;
            selectAllCheckbox.checked = false;
        } else if (checkedCount === unlockedCheckboxes.length) {
            selectAllCheckbox.indeterminate = false;
            selectAllCheckbox.checked = true;
        } else {
            selectAllCheckbox.indeterminate = true;
        }
    }

    // Handle remove selected
    function handleRemoveSelected() {
        const selectedUsernames = Array.from(CONFIG.selectedUsers);
        if (selectedUsernames.length === 0) return;

        const confirmed = confirm(`Are you sure you want to remove ${selectedUsernames.length} selected users?`);
        if (!confirmed) return;

        // Override the native confirm dialog to automatically handle Reddit's confirmations
        let confirmCount = 0;
        const originalConfirm = window.confirm;
        
        window.confirm = function(message) {
            confirmCount++;
            console.log(`Auto-confirming Reddit dialog ${confirmCount}/${selectedUsernames.length}: ${message}`);
            return true; // Always return true to auto-confirm
        };

        // Find and click remove buttons for selected users
        selectedUsernames.forEach((username, index) => {
            setTimeout(() => {
                const checkbox = document.querySelector(`[data-username="${username}"]`);
                if (checkbox) {
                    const row = checkbox.closest('tr');
                    const removeButton = row.querySelector(CONFIG.selectors.removeButton);
                    if (removeButton) {
                        removeButton.click();
                    }
                }
            }, index * 100); // Small delay between clicks to avoid overwhelming Reddit
        });

        // Restore original confirm function after processing
        setTimeout(() => {
            window.confirm = originalConfirm;
            console.log(`Bulk remove completed. Processed ${confirmCount} confirmations.`);
        }, selectedUsernames.length * 150);

        // Clear selection
        CONFIG.selectedUsers.clear();
        updateUI();
    }

    // Handle sort by downvotes
    function handleSortByDownvotes() {
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

    // Handle date selection dropdown
    function handleDateSelection(selectedValue) {
        if (!selectedValue) return;

        const tbody = document.querySelector(CONFIG.selectors.tbody);
        if (!tbody) return;

        const rows = tbody.querySelectorAll('tr');
        const cutoffDate = getCutoffDate(selectedValue);
        
        // Clear all selections first
        CONFIG.selectedUsers.clear();
        
        // Select users blocked before the cutoff date (excluding locked users)
        rows.forEach(row => {
            const username = extractUsername(row);
            const blockDate = extractDate(row);
            
            // Don't select locked users
            if (blockDate && blockDate < cutoffDate && !row.classList.contains(CONFIG.lockedClass)) {
                CONFIG.selectedUsers.add(username);
                const checkbox = row.querySelector('.reddit-block-manager-checkbox-cell input[type="checkbox"]');
                if (checkbox) {
                    checkbox.checked = true;
                }
            }
        });

        updateUI();
    }

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

    // Handle downvote selection dropdown
    function handleDownvoteSelection(selectedValue) {
        if (!selectedValue) return;

        const tbody = document.querySelector(CONFIG.selectors.tbody);
        if (!tbody) return;

        const rows = tbody.querySelectorAll('tr');
        
        // Clear all selections first
        CONFIG.selectedUsers.clear();
        
        // Select users based on downvote range (excluding locked users)
        rows.forEach(row => {
            const username = extractUsername(row);
            const downvotes = extractVoteWeight(row);
            
            let shouldSelect = false;
            
            switch (selectedValue) {
                case '0-5':
                    shouldSelect = downvotes >= 0 && downvotes <= 5;
                    break;
                case '5-10':
                    shouldSelect = downvotes > 5 && downvotes <= 10;
                    break;
                case '10+':
                    shouldSelect = downvotes > 10;
                    break;
            }
            
            // Don't select locked users
            if (shouldSelect && !row.classList.contains(CONFIG.lockedClass)) {
                CONFIG.selectedUsers.add(username);
                const checkbox = row.querySelector('.reddit-block-manager-checkbox-cell input[type="checkbox"]');
                if (checkbox) {
                    checkbox.checked = true;
                }
            }
        });

        updateUI();
    }

    // Extract vote weight from row - corrected for actual HTML structure
    function extractVoteWeight(row) {
        const voteWeightElement = row.querySelector(CONFIG.selectors.voteWeight);
        if (!voteWeightElement) return 0;
        
        const text = voteWeightElement.textContent;
        const match = text.match(/\[(-?\d+)\]/);
        return match ? parseInt(match[1]) : 0;
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
        } else {
            // Currently unlocked, so lock
            CONFIG.lockedUsers.add(username);
            row.classList.add(CONFIG.lockedClass);
            button.classList.add('locked');
            button.innerHTML = '🔒';
        }

        saveLockedUsers();
        updateUI();
    }

    // Handle individual remove
    function handleIndividualRemove(button) {
        const username = button.dataset.username;
        const row = button.closest('tr');
        
        const confirmed = confirm(`Are you sure you want to remove ${username}?`);
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

    // Update UI elements
    function updateUI() {
        const selectedCount = CONFIG.selectedUsers.size;
        const removeButton = document.getElementById('remove-selected');
        const lockButton = document.getElementById('lock-selected');
        const selectedCountSpan = document.getElementById('selected-count');

        if (removeButton) {
            removeButton.disabled = selectedCount === 0;
        }
        
        if (lockButton) {
            lockButton.disabled = selectedCount === 0;
        }
        
        if (selectedCountSpan) {
            selectedCountSpan.textContent = selectedCount;
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

    // Initialize when page loads
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Check for RES tags after a short delay to ensure they're loaded
    setTimeout(checkRESTags, 2000);

})();
