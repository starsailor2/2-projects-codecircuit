// Calendar Accessibility Enhancements

function enhanceCalendarAccessibility() {
    // Add ARIA roles and labels to calendar elements
    const calendarContainer = document.querySelector('.calendar-container');
    if (calendarContainer) {
        calendarContainer.setAttribute('role', 'application');
        calendarContainer.setAttribute('aria-label', 'Calendar');
        
        // Add keyboard focus management
        calendarContainer.tabIndex = 0;
        calendarContainer.addEventListener('keydown', handleCalendarKeyboard);
        
        // Add accessibility to day columns
        const dayColumns = document.querySelectorAll('.day-column');
        dayColumns.forEach((column, index) => {
            const date = new Date(column.getAttribute('data-date'));
            const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
            const monthDay = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
            
            column.setAttribute('role', 'region');
            column.setAttribute('aria-label', `${dayName}, ${monthDay}`);
            
            // Make day columns navigable
            column.tabIndex = 0;
            
            // Add titles to headers for tooltips
            const header = column.querySelector('.day-header');
            if (header) {
                header.setAttribute('title', `${dayName}, ${monthDay}`);
            }
        });
        
        // Add accessibility to time cells
        const timeCells = document.querySelectorAll('.time-cell');
        timeCells.forEach(cell => {
            const hour = parseInt(cell.getAttribute('data-hour'));
            const column = cell.closest('.day-column');
            const date = new Date(column.getAttribute('data-date'));
            const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
            const monthDay = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
            
            // Format time
            const timeStr = formatTime(hour);
            
            cell.setAttribute('role', 'button');
            cell.setAttribute('aria-label', `Create event at ${timeStr} on ${dayName}, ${monthDay}`);
            cell.tabIndex = 0;
            
            // Add keyboard event for creating events with keyboard
            cell.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    showEventCreationModal(date, hour);
                }
            });
        });
        
        // Add accessibility to events
        enhanceEventAccessibility();
    }
    
    // Make keyboard shortcuts visible in the UI
    updateKeyboardShortcutsUI();
}

// Function to enhance existing events with accessibility features
function enhanceEventAccessibility() {
    const events = document.querySelectorAll('.calendar-task');
    events.forEach(event => {
        const eventId = event.getAttribute('data-event-id');
        const calEvent = calendarEvents.find(e => e.id.toString() === eventId);
        
        if (calEvent) {
            const startTime = formatTime(calEvent.startHour);
            const endTime = formatTime(calEvent.startHour + calEvent.duration);
            const date = new Date(calEvent.date);
            const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
            const monthDay = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
            
            event.setAttribute('role', 'button');
            event.setAttribute('aria-label', `Event: ${calEvent.title}, ${startTime} to ${endTime} on ${dayName}, ${monthDay}`);
            event.setAttribute('aria-description', `Double-click or press Enter to edit this event`);
            event.tabIndex = 0;
            
            // Add keyboard interaction
            event.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    editEvent(calEvent.id);
                } else if (e.key === 'Delete' || e.key === 'Backspace') {
                    e.preventDefault();
                    if (confirm(`Delete event "${calEvent.title}"?`)) {
                        deleteEvent(calEvent.id);
                    }
                }
            });
        }
    });
}

// Keyboard handler for navigating the calendar
function handleCalendarKeyboard(e) {
    if (e.altKey && e.key === 'c') {
        // Alt+C: Focus on the current day
        const today = new Date();
        const todayFormatted = formatDate(today);
        const todayColumn = document.querySelector(`.day-column[data-date="${todayFormatted}"]`);
        
        if (todayColumn) {
            todayColumn.focus();
        }
    }
}

// Update keyboard shortcuts UI
function updateKeyboardShortcutsUI() {
    const shortcutsTooltip = document.getElementById('calendar-shortcuts-tooltip');
    if (!shortcutsTooltip) {
        // Create shortcuts tooltip if it doesn't exist
        const tooltip = document.createElement('div');
        tooltip.id = 'calendar-shortcuts-tooltip';
        tooltip.className = 'shortcuts-tooltip';
        tooltip.style.position = 'absolute';
        tooltip.style.top = '60px';
        tooltip.style.right = '20px';
        tooltip.style.backgroundColor = 'var(--card-bg)';
        tooltip.style.padding = '15px';
        tooltip.style.borderRadius = '8px';
        tooltip.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.2)';
        tooltip.style.visibility = 'hidden';
        tooltip.style.zIndex = '100';
        tooltip.style.minWidth = '250px';
        tooltip.style.border = '1px solid var(--border-color)';
        
        const heading = document.createElement('h3');
        heading.textContent = 'Keyboard Shortcuts';
        heading.style.marginTop = '0';
        heading.style.marginBottom = '10px';
        tooltip.appendChild(heading);
        
        const shortcutsList = document.createElement('div');
        shortcutsList.innerHTML = `
            <div class="shortcut-item">
                <span class="shortcut-key">Ctrl+ArrowLeft</span>
                <span class="shortcut-desc">Previous week</span>
            </div>
            <div class="shortcut-item">
                <span class="shortcut-key">Ctrl+ArrowRight</span>
                <span class="shortcut-desc">Next week</span>
            </div>
            <div class="shortcut-item">
                <span class="shortcut-key">Ctrl+T</span>
                <span class="shortcut-desc">Go to current week</span>
            </div>
            <div class="shortcut-item">
                <span class="shortcut-key">Ctrl+C</span>
                <span class="shortcut-desc">Focus on current time</span>
            </div>
            <div class="shortcut-item">
                <span class="shortcut-key">Ctrl+E</span>
                <span class="shortcut-desc">Create event (when cell selected)</span>
            </div>
            <div class="shortcut-item">
                <span class="shortcut-key">Ctrl+Z</span>
                <span class="shortcut-desc">Undo action</span>
            </div>
            <div class="shortcut-item">
                <span class="shortcut-key">Ctrl+Y</span>
                <span class="shortcut-desc">Redo action</span>
            </div>
            <div class="shortcut-item">
                <span class="shortcut-key">Enter</span>
                <span class="shortcut-desc">Open selected event</span>
            </div>
            <div class="shortcut-item">
                <span class="shortcut-key">Alt+C</span>
                <span class="shortcut-desc">Focus on today's column</span>
            </div>
            <div class="shortcut-item">
                <span class="shortcut-key">Tab</span>
                <span class="shortcut-desc">Navigate between elements</span>
            </div>
        `;
        shortcutsList.querySelectorAll('.shortcut-item').forEach(item => {
            item.style.display = 'flex';
            item.style.justifyContent = 'space-between';
            item.style.margin = '8px 0';
        });
        
        shortcutsList.querySelectorAll('.shortcut-key').forEach(key => {
            key.style.backgroundColor = 'var(--border-color)';
            key.style.padding = '2px 6px';
            key.style.borderRadius = '4px';
            key.style.fontFamily = 'monospace';
            key.style.fontWeight = 'bold';
            key.style.fontSize = '12px';
        });
        
        tooltip.appendChild(shortcutsList);
        
        // Add to document
        const calendarContainer = document.querySelector('.calendar-container');
        calendarContainer.parentNode.appendChild(tooltip);
        
        // Add button to toggle shortcuts if it doesn't exist
        if (!document.getElementById('show-calendar-shortcuts')) {
            const shortcutsBtn = document.createElement('button');
            shortcutsBtn.id = 'show-calendar-shortcuts';
            shortcutsBtn.innerHTML = '<i class="fas fa-keyboard"></i> Keyboard Shortcuts';
            shortcutsBtn.style.marginLeft = 'auto';
            shortcutsBtn.style.backgroundColor = 'var(--card-bg)';
            shortcutsBtn.style.border = '1px solid var(--border-color)';
            shortcutsBtn.style.borderRadius = '6px';
            shortcutsBtn.style.padding = '6px 12px';
            shortcutsBtn.style.cursor = 'pointer';
            
            const calendarHeader = document.querySelector('.calendar-header');
            if (calendarHeader) {
                calendarHeader.appendChild(shortcutsBtn);
            }
        }
    } else {
        // Update existing shortcuts tooltip
        const shortcutsContent = `
            <h3 style="margin-top: 0; margin-bottom: 10px;">Keyboard Shortcuts</h3>
            <div class="shortcut-item">
                <span class="shortcut-key">Ctrl+ArrowLeft</span>
                <span class="shortcut-desc">Previous week</span>
            </div>
            <div class="shortcut-item">
                <span class="shortcut-key">Ctrl+ArrowRight</span>
                <span class="shortcut-desc">Next week</span>
            </div>
            <div class="shortcut-item">
                <span class="shortcut-key">Ctrl+T</span>
                <span class="shortcut-desc">Go to current week</span>
            </div>
            <div class="shortcut-item">
                <span class="shortcut-key">Ctrl+C</span>
                <span class="shortcut-desc">Focus on current time</span>
            </div>
            <div class="shortcut-item">
                <span class="shortcut-key">Ctrl+E</span>
                <span class="shortcut-desc">Create event (when cell selected)</span>
            </div>
            <div class="shortcut-item">
                <span class="shortcut-key">Ctrl+Z</span>
                <span class="shortcut-desc">Undo action</span>
            </div>
            <div class="shortcut-item">
                <span class="shortcut-key">Ctrl+Y</span>
                <span class="shortcut-desc">Redo action</span>
            </div>
            <div class="shortcut-item">
                <span class="shortcut-key">Enter</span>
                <span class="shortcut-desc">Open selected event</span>
            </div>
            <div class="shortcut-item">
                <span class="shortcut-key">Alt+C</span>
                <span class="shortcut-desc">Focus on today's column</span>
            </div>
            <div class="shortcut-item">
                <span class="shortcut-key">Tab</span>
                <span class="shortcut-desc">Navigate between elements</span>
            </div>
        `;
        
        shortcutsTooltip.innerHTML = shortcutsContent;
        
        // Apply styles
        shortcutsTooltip.querySelectorAll('.shortcut-item').forEach(item => {
            item.style.display = 'flex';
            item.style.justifyContent = 'space-between';
            item.style.margin = '8px 0';
        });
        
        shortcutsTooltip.querySelectorAll('.shortcut-key').forEach(key => {
            key.style.backgroundColor = 'var(--border-color)';
            key.style.padding = '2px 6px';
            key.style.borderRadius = '4px';
            key.style.fontFamily = 'monospace';
            key.style.fontWeight = 'bold';
            key.style.fontSize = '12px';
        });
    }
}
