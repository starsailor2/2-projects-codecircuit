// Weekly Calendar Functionality
let calendarEvents = [];
let currentWeekStart = new Date();
let selectedTimeCell = null;
let draggedEvent = null;
let resizingEvent = null;
let resizeStartY = 0;
let originalEventHeight = 0;
let calendarHistory = new HistoryManager(20);
let isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);

// Set the current week start to Monday
function getMonday(date) {
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    return new Date(date.setDate(diff));
}

// Helper function to add main.css styles for RGB support
function addRGBVariables() {
    const root = document.documentElement;
    const style = getComputedStyle(root);
    const primaryColor = style.getPropertyValue('--primary-color').trim();
    
    // Convert hex to RGB and add as CSS variable
    const hexToRgb = (hex) => {
        const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
        hex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);
        
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? 
            `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : 
            "58, 54, 224"; // Default if parsing fails
    };
    
    // Add RGB versions of the colors for transparency support
    if (primaryColor) {
        root.style.setProperty('--primary-color-rgb', hexToRgb(primaryColor));
    }
    
    // Also add accent color RGB
    const accentColor = style.getPropertyValue('--accent-color').trim();
    if (accentColor) {
        root.style.setProperty('--accent-color-rgb', hexToRgb(accentColor));
    }
}

function initCalendar() {
    // Initialize with the current week
    currentWeekStart = getMonday(new Date());
    
    // Load saved events
    calendarEvents = JSON.parse(localStorage.getItem('calendarEvents')) || [];
    
    // Save initial state to history
    saveToCalendarHistory('Initial calendar state');    // Add event listeners
    document.getElementById('prev-week-btn').addEventListener('click', () => changeWeek(-7));
    document.getElementById('next-week-btn').addEventListener('click', () => changeWeek(7));
    document.getElementById('undo-calendar').addEventListener('click', undoCalendarAction);
    document.getElementById('redo-calendar').addEventListener('click', redoCalendarAction);
    
    // Add accessibility skip link
    addAccessibilitySkipLink();
    
    // Add keyboard shortcut for adding events
    document.addEventListener('keydown', (e) => {
        // Only process if calendar section is active
        const calendarSection = document.getElementById('calendar');
        if (!calendarSection.classList.contains('active')) return;
        
    // Ctrl+E to add event when a time cell is selected
        if (e.ctrlKey && e.key === 'e' && selectedTimeCell) {
            e.preventDefault();
            const column = selectedTimeCell.closest('.day-column');
            const dateStr = column.getAttribute('data-date');
            const date = new Date(dateStr);
            const hour = parseInt(selectedTimeCell.getAttribute('data-hour'));
            showEventCreationModal(date, hour);
        }
        
        // Ctrl+Z for undo
        if (e.ctrlKey && e.key === 'z') {
            e.preventDefault();
            undoCalendarAction();
        }
        
        // Ctrl+Y for redo
        if (e.ctrlKey && e.key === 'y') {
            e.preventDefault();
            redoCalendarAction();
        }        // Escape key to deselect
        if (e.key === 'Escape') {
            if (selectedTimeCell) {
                selectedTimeCell.style.backgroundColor = '';
                selectedTimeCell.classList.remove('selected-cell');
                selectedTimeCell = null;
            }
        }
        
        // Left arrow: Previous week
        if (e.ctrlKey && e.key === 'ArrowLeft') {
            e.preventDefault();
            changeWeek(-7);
        }
        
        // Right arrow: Next week
        if (e.ctrlKey && e.key === 'ArrowRight') {
            e.preventDefault();
            changeWeek(7);
        }
        
        // 'T' key: Go to today
        if (e.ctrlKey && e.key === 't') {
            e.preventDefault();
            currentWeekStart = getMonday(new Date());
            renderCalendar();
            showNotification('Showing current week', 'info');
        }
        
        // 'C' key: Focus on the current time indicator (if visible)
        if (e.ctrlKey && e.key === 'c') {
            e.preventDefault();
            const indicator = document.querySelector('.current-time-indicator');
            if (indicator) {
                indicator.scrollIntoView({ behavior: 'smooth', block: 'center' });
                // Flash the indicator
                indicator.style.animation = 'none';
                setTimeout(() => {
                    indicator.style.animation = 'pulse 1.5s';
                }, 10);
            }
        }
    });
    
    // Add touch support for mobile devices
    if (isTouchDevice) {
        enableCalendarTouchSupport();
    }
    
    // Add RGB variables for CSS transparency
    addRGBVariables();
    
    // Show keyboard shortcuts tooltip toggle
    document.getElementById('show-calendar-shortcuts').addEventListener('click', () => {
        const tooltip = document.getElementById('calendar-shortcuts-tooltip');
        tooltip.style.visibility = tooltip.style.visibility === 'visible' ? 'hidden' : 'visible';
    });
      // Render calendar
    renderCalendar();
    
    // Set up an interval to update the current time indicator every minute
    setInterval(updateCurrentTimeIndicator, 60000); // Update every minute

    // Enhance calendar accessibility
    enhanceCalendarAccessibility();
}

// Save current state to history
function saveToCalendarHistory(actionDescription) {
    calendarHistory.addState({
        events: JSON.parse(JSON.stringify(calendarEvents)),
        weekStart: new Date(currentWeekStart)
    }, actionDescription);
}

// Undo last calendar action
function undoCalendarAction() {
    const previousState = calendarHistory.undo();
    if (previousState) {
        calendarEvents = previousState.events;
        currentWeekStart = new Date(previousState.weekStart);
        
        localStorage.setItem('calendarEvents', JSON.stringify(calendarEvents));
        renderCalendar();
        
        // Show notification
        showNotification('Undo: ' + calendarHistory.getUndoDescription(), 'info');
    } else {
        showNotification('Nothing to undo', 'info');
    }
}

// Redo last undone calendar action
function redoCalendarAction() {
    const futureState = calendarHistory.redo();
    if (futureState) {
        calendarEvents = futureState.events;
        currentWeekStart = new Date(futureState.weekStart);
        
        localStorage.setItem('calendarEvents', JSON.stringify(calendarEvents));
        renderCalendar();
        
        // Show notification
        showNotification('Redo: ' + calendarHistory.getRedoDescription(), 'info');
    } else {
        showNotification('Nothing to redo', 'info');
    }
}

// Export calendar as PNG
function exportCalendar() {
    // Check if html2canvas is available, if not, load it
    if (typeof html2canvas === 'undefined') {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
        script.onload = generateCalendarImage;
        document.head.appendChild(script);
    } else {
        generateCalendarImage();
    }
    
    function generateCalendarImage() {
        const calendarContainer = document.querySelector('.calendar-container');
        if (!calendarContainer) return;
        
        // Show loading indicator
        showNotification('Generating calendar image...', 'info');
        
        // Create a clean copy of the calendar for export
        const exportContainer = calendarContainer.cloneNode(true);
        exportContainer.style.width = calendarContainer.offsetWidth + 'px';
        exportContainer.style.height = 'auto';
        exportContainer.style.position = 'absolute';
        exportContainer.style.top = '-9999px';
        exportContainer.style.backgroundColor = getComputedStyle(calendarContainer).backgroundColor;
        
        // Add title with date range
        const titleDiv = document.createElement('div');
        titleDiv.textContent = document.getElementById('current-week-display').textContent;
        titleDiv.style.textAlign = 'center';
        titleDiv.style.padding = '15px';
        titleDiv.style.fontSize = '18px';
        titleDiv.style.fontWeight = 'bold';
        
        // Create wrapper
        const wrapper = document.createElement('div');
        wrapper.style.backgroundColor = getComputedStyle(calendarContainer).backgroundColor;
        wrapper.style.padding = '20px';
        wrapper.style.borderRadius = '12px';
        wrapper.appendChild(titleDiv);
        wrapper.appendChild(exportContainer);
        
        document.body.appendChild(wrapper);
        
        // Use html2canvas to capture the calendar
        html2canvas(wrapper, {
            scale: 2,
            logging: false,
            backgroundColor: getComputedStyle(calendarContainer).backgroundColor
        }).then(canvas => {
            // Convert to image
            const image = canvas.toDataURL('image/png');
            
            // Create download link
            const link = document.createElement('a');
            link.download = 'calendar-' + formatDateForFilename(currentWeekStart) + '.png';
            link.href = image;
            link.click();
            
            // Clean up
            document.body.removeChild(wrapper);
            
            // Show success notification
            showNotification('Calendar exported as PNG', 'success');
        }).catch(error => {
            console.error('Export failed:', error);
            document.body.removeChild(wrapper);
            showNotification('Export failed', 'error');
        });
    }
}

// Print calendar
function printCalendar() {
    // Show notification
    showNotification('Preparing calendar for printing...', 'info');
    
    // Create a clone of the calendar container
    const calendarContainer = document.querySelector('.calendar-container');
    const printContainer = calendarContainer.cloneNode(true);
    
    // Get the current week display information
    const weekDisplay = document.getElementById('current-week-display').textContent;
    
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    const printDoc = printWindow.document;
    
    // Write the HTML for the print page
    printDoc.write(`
        <html>
            <head>
                <title>Weekly Calendar - ${weekDisplay}</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        padding: 20px;
                        background-color: white;
                        color: black;
                    }
                    h2 {
                        text-align: center;
                        margin-bottom: 20px;
                    }
                    .calendar-container {
                        display: flex;
                        border: 1px solid #ddd;
                        border-radius: 8px;
                        overflow: hidden;
                    }
                    .time-labels {
                        width: 80px;
                        background-color: #f9f9f9;
                        border-right: 1px solid #ddd;
                    }
                    .time-slot {
                        height: 60px;
                        padding: 5px;
                        text-align: right;
                        font-size: 12px;
                        border-bottom: 1px solid #eee;
                    }
                    .calendar-grid {
                        display: flex;
                        flex-grow: 1;
                    }
                    .day-column {
                        flex: 1;
                        min-width: 0;
                        border-right: 1px solid #ddd;
                    }
                    .day-column:last-child {
                        border-right: none;
                    }
                    .day-header {
                        padding: 10px;
                        text-align: center;
                        font-weight: bold;
                        border-bottom: 1px solid #ddd;
                        background-color: #f9f9f9;
                    }
                    .day-content {
                        position: relative;
                    }
                    .time-cell {
                        height: 60px;
                        border-bottom: 1px solid #eee;
                    }
                    .calendar-event {
                        position: absolute;
                        width: calc(100% - 6px);
                        margin: 3px;
                        border-radius: 4px;
                        padding: 5px;
                        font-size: 12px;
                        overflow: hidden;
                        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                    }
                    .event-title {
                        font-weight: bold;
                        margin-bottom: 4px;
                    }
                    .event-time {
                        font-size: 10px;
                        opacity: 0.7;
                    }
                    @media print {
                        @page {
                            size: landscape;
                            margin: 10mm;
                        }
                        .no-print {
                            display: none;
                        }
                    }
                </style>
            </head>
            <body>
                <div class="no-print" style="margin-bottom:20px;">
                    <button onclick="window.print()">Print Calendar</button>
                    <button onclick="window.close()">Close</button>
                </div>
                <h2>Weekly Calendar: ${weekDisplay}</h2>
            </body>
        </html>
    `);
    
    // Add the calendar to the body
    printDoc.body.appendChild(printContainer);
    
    // Set the events to their proper colors
    const eventElements = printDoc.querySelectorAll('.calendar-event');
    eventElements.forEach(element => {
        const eventId = element.getAttribute('data-id');
        const event = calendarEvents.find(e => e.id === eventId);
        if (event) {
            element.style.backgroundColor = event.color || '#5B8FF9';
        }
    });
    
    // Clean up the print window when closed
    printWindow.addEventListener('beforeunload', () => {
        printWindow.close();
    });
    
    // Show success notification
    showNotification('Calendar ready to print', 'success');
}

// Format date for filename (YYYY-MM-DD)
function formatDateForFilename(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

// Enable touch support for calendar events
function enableCalendarTouchSupport() {
    const calendarGrid = document.getElementById('calendar-grid');
    
    // Track touch positions
    let touchStartX = 0;
    let touchStartY = 0;
    let touchedEvent = null;
    let touchedEventOffsetX = 0;
    let touchedEventOffsetY = 0;
    let isResizing = false;
    let isMoving = false;
    let lastTapTime = 0;
    let resizeStartTime = 0;
    let touchStartTime = 0;
    let longPressTimer = null;
    const longPressDelay = 600; // ms
    
    // Handle event touches
    calendarGrid.addEventListener('touchstart', (e) => {
        const touch = e.touches[0];
        touchStartX = touch.clientX;
        touchStartY = touch.clientY;
        touchStartTime = Date.now();
        
        // Check if event was touched
        const elementUnderTouch = document.elementFromPoint(touchStartX, touchStartY);
        
        // Start long-press timer for context menu
        clearTimeout(longPressTimer);
        
        if (elementUnderTouch) {
            // Long-press for right-click context menu
            if (elementUnderTouch.classList.contains('calendar-task') || 
                elementUnderTouch.closest('.calendar-task')) {
                
                const eventElement = elementUnderTouch.classList.contains('calendar-task') ? 
                    elementUnderTouch : elementUnderTouch.closest('.calendar-task');
                    
                if (eventElement) {
                    const eventId = parseInt(eventElement.getAttribute('data-event-id'));
                    const event = calendarEvents.find(e => e.id === eventId);
                    
                    if (event) {
                        longPressTimer = setTimeout(() => {
                            // Vibrate if available (for tactile feedback)
                            if (navigator.vibrate) {
                                navigator.vibrate(50);
                            }
                            
                            const rect = eventElement.getBoundingClientRect();
                            showContextMenu(
                                rect.left + rect.width / 2, 
                                rect.top + rect.height / 2, 
                                event
                            );
                            
                            // Prevent any other actions
                            isResizing = false;
                            isMoving = false;
                        }, longPressDelay);
                    }
                }
            }
            
            // Check if we're touching the resize handle
            if (elementUnderTouch.classList.contains('resize-handle')) {
                e.preventDefault(); // Prevent scrolling
                isResizing = true;
                
                // Clear long press timer
                clearTimeout(longPressTimer);
                
                // Find the parent event element
                const eventElement = elementUnderTouch.closest('.calendar-task');
                if (eventElement) {
                    const eventId = parseInt(eventElement.getAttribute('data-event-id'));
                    touchedEvent = calendarEvents.find(event => event.id === eventId);
                    
                    if (touchedEvent) {
                        resizeStartTime = touchedEvent.duration;
                        const eventRect = eventElement.getBoundingClientRect();
                        touchedEventOffsetY = touchStartY - eventRect.bottom;
                    }
                }
            } 
            // Check if we're touching an event (for moving)
            else if (elementUnderTouch.classList.contains('calendar-task') || 
                    elementUnderTouch.closest('.calendar-task')) {
                
                e.preventDefault(); // Prevent scrolling
                isMoving = true;
                
                // Get the event element
                const eventElement = elementUnderTouch.classList.contains('calendar-task') ? 
                    elementUnderTouch : elementUnderTouch.closest('.calendar-task');
                
                if (eventElement) {
                    const eventId = parseInt(eventElement.getAttribute('data-event-id'));
                    touchedEvent = calendarEvents.find(event => event.id === eventId);
                    
                    if (touchedEvent) {
                        const eventRect = eventElement.getBoundingClientRect();
                        touchedEventOffsetX = touchStartX - eventRect.left;
                        touchedEventOffsetY = touchStartY - eventRect.top;
                        
                        // Add visual feedback
                        eventElement.classList.add('dragging');
                    }
                }
            }
            // Check if we're touching a time cell (for selection)
            else if (elementUnderTouch.classList.contains('time-cell')) {
                const now = Date.now();
                const doubleTapDelay = 300; // ms
                
                // Clear long press timer
                clearTimeout(longPressTimer);
                
                // Set up long press for new event creation
                longPressTimer = setTimeout(() => {
                    // Clear the timer
                    longPressTimer = null;
                    
                    // Vibrate for feedback if available
                    if (navigator.vibrate) {
                        navigator.vibrate(50);
                    }
                    
                    const timeCell = elementUnderTouch;
                    const column = timeCell.closest('.day-column');
                    
                    if (column) {
                        const date = column.getAttribute('data-date');
                        const hour = parseInt(timeCell.getAttribute('data-hour'));
                        
                        selectTimeCell(timeCell, new Date(date), hour);
                    }
                }, longPressDelay);
                
                if (now - lastTapTime < doubleTapDelay) {
                    // Double tap on time cell - create new event
                    clearTimeout(longPressTimer); // Cancel long press
                    const timeCell = elementUnderTouch;
                    const column = timeCell.closest('.day-column');
                    
                    if (column) {
                        const date = column.getAttribute('data-date');
                        const hour = parseInt(timeCell.getAttribute('data-hour'));
                        
                        selectTimeCell(timeCell, new Date(date), hour);
                    }
                }
                lastTapTime = now;
            }
        }
    });
    
    // Cancel long press when the user moves their finger
    calendarGrid.addEventListener('touchmove', (e) => {
        // If we move more than 10px, cancel the long press
        const touchMove = e.touches[0];
        const deltaX = Math.abs(touchMove.clientX - touchStartX);
        const deltaY = Math.abs(touchMove.clientY - touchStartY);
        
        if (deltaX > 10 || deltaY > 10) {
            clearTimeout(longPressTimer);
        }
        
        // Continue with regular touch move handling
        if (!isResizing && !isMoving || !touchedEvent) return;
        
        const touch = e.touches[0];
        
        if (isResizing) {
            // Handle resizing event
            const calendarGridRect = calendarGrid.getBoundingClientRect();
            const cellHeight = calendarGridRect.height / 11; // 11 hour slots (8AM-7PM)
            
            // Calculate new height based on touch position
            const touchY = touch.clientY - touchedEventOffsetY;
            const touchDeltaY = touchY - touchStartY;
            
            // Convert to hours (each cell is 1 hour)
            const hourDelta = Math.round(touchDeltaY / cellHeight);
            const newDuration = Math.max(1, resizeStartTime + hourDelta);
            
            // Update the event duration preview
            const eventElement = document.querySelector(`.calendar-task[data-event-id="${touchedEvent.id}"]`);
            if (eventElement) {
                eventElement.style.height = `${newDuration * cellHeight}px`;
            }
        } else if (isMoving) {
            // Handle moving event
            const calendarGridRect = calendarGrid.getBoundingClientRect();
            const cellHeight = calendarGridRect.height / 11; // 11 hour slots
            const columnWidth = calendarGridRect.width / 7; // 7 days
            
            // Calculate which cell we're over
            const relativeX = touch.clientX - calendarGridRect.left;
            const relativeY = touch.clientY - calendarGridRect.top;
            
            const dayIndex = Math.floor(relativeX / columnWidth);
            const hourIndex = Math.floor(relativeY / cellHeight);
            
            // Only move within calendar boundaries
            if (dayIndex >= 0 && dayIndex < 7 && hourIndex >= 0 && hourIndex < 11) {
                // Find the column and cell
                const columns = calendarGrid.querySelectorAll('.day-column');
                if (columns[dayIndex]) {
                    const cells = columns[dayIndex].querySelectorAll('.time-cell');
                    if (cells[hourIndex]) {
                        // Highlight the target cell
                        document.querySelectorAll('.drop-target').forEach(el => {
                            el.classList.remove('drop-target');
                        });
                        cells[hourIndex].classList.add('drop-target');
                        
                        // Move the event element for visual feedback
                        const eventElement = document.querySelector(`.calendar-task[data-event-id="${touchedEvent.id}"]`);
                        if (eventElement) {
                            // Preview the move
                            eventElement.style.position = 'absolute';
                            eventElement.style.left = `${dayIndex * columnWidth}px`;
                            eventElement.style.top = `${hourIndex * cellHeight}px`;
                            eventElement.style.width = `${columnWidth - 8}px`; // Account for padding
                            eventElement.style.zIndex = '100';
                        }
                    }
                }
            }
        }
    });
    
    // Handle touch end events
    calendarGrid.addEventListener('touchend', (e) => {
        // Clear any long press timers
        clearTimeout(longPressTimer);
        
        // Check for quick tap (less than 100ms) on time cell for cell selection
        const touchDuration = Date.now() - touchStartTime;
        if (touchDuration < 100) {
            const touchEnd = e.changedTouches[0];
            const elementAtTouch = document.elementFromPoint(touchEnd.clientX, touchEnd.clientY);
            
            if (elementAtTouch && elementAtTouch.classList.contains('time-cell') && 
                !elementAtTouch.classList.contains('selected-cell')) {
                // Simple tap on time cell - just select it
                const timeCell = elementAtTouch;
                const column = timeCell.closest('.day-column');
                
                if (column) {
                    // Clear any previous selection
                    document.querySelectorAll('.selected-cell').forEach(cell => {
                        cell.classList.remove('selected-cell');
                        cell.style.backgroundColor = '';
                    });
                    
                    // Mark this cell as selected
                    timeCell.classList.add('selected-cell');
                    timeCell.style.backgroundColor = 'rgba(var(--accent-color-rgb), 0.2)';
                    selectedTimeCell = timeCell;
                }
            }
        }
        
        if (touchedEvent) {
            if (isResizing) {
                // Finalize resize
                const calendarGridRect = calendarGrid.getBoundingClientRect();
                const cellHeight = calendarGridRect.height / 11; // 11 hour slots
                
                // Get the touch position
                const touchEnd = e.changedTouches[0];
                const touchY = touchEnd.clientY - touchedEventOffsetY;
                const touchDeltaY = touchY - touchStartY;
                
                // Convert to hours
                const hourDelta = Math.round(touchDeltaY / cellHeight);
                const newDuration = Math.max(1, resizeStartTime + hourDelta);
                
                // Apply the resize
                if (newDuration !== touchedEvent.duration) {
                    // Save state for undo
                    saveToCalendarHistory('Resize event');
                    
                    // Update event
                    touchedEvent.duration = newDuration;
                    localStorage.setItem('calendarEvents', JSON.stringify(calendarEvents));
                    renderEvents();
                    
                    // Show notification with haptic feedback
                    if (navigator.vibrate) {
                        navigator.vibrate(50);
                    }
                    showNotification('Event resized', 'success');
                }
            } else if (isMoving) {
                // Finalize move
                document.querySelectorAll('.drop-target').forEach(el => {
                    el.classList.remove('drop-target');
                });
                
                const calendarGridRect = calendarGrid.getBoundingClientRect();
                const columnWidth = calendarGridRect.width / 7; // 7 days
                const cellHeight = calendarGridRect.height / 11; // 11 hour slots
                
                // Get the touch position
                const touchEnd = e.changedTouches[0];
                const relativeX = touchEnd.clientX - calendarGridRect.left;
                const relativeY = touchEnd.clientY - calendarGridRect.top;
                
                const dayIndex = Math.floor(relativeX / columnWidth);
                const hourIndex = Math.floor(relativeY / cellHeight);
                
                // Only move within calendar boundaries
                if (dayIndex >= 0 && dayIndex < 7 && hourIndex >= 0 && hourIndex < 11) {
                    // Find the column and cell
                    const columns = calendarGrid.querySelectorAll('.day-column');
                    if (columns[dayIndex]) {
                        const date = columns[dayIndex].getAttribute('data-date');
                        const hour = 8 + hourIndex; // Start at 8 AM
                        
                        // Move the event
                        if (date && (touchedEvent.date !== date || touchedEvent.startHour !== hour)) {
                            // Save state for undo
                            saveToCalendarHistory('Move event');
                            
                            moveEvent(touchedEvent.id, date, hour);
                            
                            // Haptic feedback
                            if (navigator.vibrate) {
                                navigator.vibrate(50);
                            }
                        } else {
                            // Just re-render to reset position
                            renderEvents();
                        }
                    }
                } else {
                    // Out of bounds, reset
                    renderEvents();
                }
                
                // Remove dragging class
                document.querySelectorAll('.calendar-task.dragging').forEach(el => {
                    el.classList.remove('dragging');
                });
            }
            
            // Reset state
            touchedEvent = null;
            isResizing = false;
            isMoving = false;
        }
    });
    
    // Swipe gesture for changing weeks
    let xDown = null;
    let yDown = null;
    
    calendarGrid.addEventListener('touchstart', (e) => {
        const firstTouch = e.touches[0];
        xDown = firstTouch.clientX;
        yDown = firstTouch.clientY;
    });
    
    calendarGrid.addEventListener('touchend', (e) => {
        if (!xDown || !yDown) {
            return;
        }
        
        if (touchedEvent) {
            // Skip swipe handling if we were interacting with an event
            xDown = null;
            yDown = null;
            return;
        }
        
        const xUp = e.changedTouches[0].clientX;
        const yUp = e.changedTouches[0].clientY;
        
        const xDiff = xDown - xUp;
        const yDiff = yDown - yUp;
        
        // Detect horizontal swipe (must be greater than vertical movement to avoid confusion with scrolling)
        if (Math.abs(xDiff) > Math.abs(yDiff) && Math.abs(xDiff) > 100) {
            if (xDiff > 0) {
                // Swipe left -> Next week
                changeWeek(7);
            } else {
                // Swipe right -> Previous week
                changeWeek(-7);
            }
        }
        
        xDown = null;
        yDown = null;
    });
    
    // Double tap on an event to edit it
    calendarGrid.addEventListener('touchend', (e) => {
        const now = Date.now();
        const doubleTapDelay = 300; // ms
        
        if (now - lastTapTime < doubleTapDelay) {
            // Double tap detected
            const touchEnd = e.changedTouches[0];
            const elementUnderTouch = document.elementFromPoint(touchEnd.clientX, touchEnd.clientY);
            const eventElement = elementUnderTouch?.closest('.calendar-task');
            
            if (eventElement) {
                const eventId = parseInt(eventElement.getAttribute('data-event-id'));
                const event = calendarEvents.find(e => e.id === eventId);
                
                if (event) {
                    // Open edit dialog
                    openEventEditModal(event);
                    
                    // Haptic feedback
                    if (navigator.vibrate) {
                        navigator.vibrate([25, 25, 25]);
                    }
                }
            }
        }
        lastTapTime = now;
    });
    
    // Enhanced scrolling for mobile devices
    const calendarContainer = document.querySelector('.calendar-container');
    if (calendarContainer) {
        // Apply smooth scrolling behavior
        calendarContainer.style.scrollBehavior = 'smooth';
        
        // Add iOS-style momentum scrolling
        calendarContainer.style.WebkitOverflowScrolling = 'touch';
        
        // Add scroll optimization to prevent jank during scrolling
        calendarContainer.addEventListener('touchmove', function(e) {
            // Allow default scrolling but with optimizations
            if (isResizing || isMoving) {
                e.preventDefault(); // Prevent scrolling while resizing/moving
            } else {
                // Use passive listener for better performance
                // This is done via the attribute, no need to add anything here
            }
        }, { passive: !isResizing && !isMoving });
        
        // Add snapping behavior after scrolling finishes for better UX
        let scrollTimeout;
        calendarContainer.addEventListener('scroll', function() {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(function() {
                // Find the closest time cell to the viewport center
                const viewportHeight = calendarContainer.clientHeight;
                const scrollTop = calendarContainer.scrollTop;
                const viewportCenter = scrollTop + viewportHeight / 2;
                
                const timeCells = document.querySelectorAll('.time-cell');
                let closestCell = null;
                let minDistance = Infinity;
                
                timeCells.forEach(cell => {
                    const rect = cell.getBoundingClientRect();
                    const cellTop = rect.top;
                    const distance = Math.abs(cellTop - viewportCenter);
                    
                    if (distance < minDistance) {
                        minDistance = distance;
                        closestCell = cell;
                    }
                });
                
                // Snap to the closest cell if we found one and we're not in the middle of another interaction
                if (closestCell && !isResizing && !isMoving && !touchedEvent) {
                    closestCell.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 300);
        });
    }
}

// Show notification
function showNotification(message, type = 'info') {
    // Check if notification container exists, if not create it
    let notificationContainer = document.getElementById('notification-container');
    if (!notificationContainer) {
        notificationContainer = document.createElement('div');
        notificationContainer.id = 'notification-container';
        notificationContainer.style.position = 'fixed';
        notificationContainer.style.bottom = '20px';
        notificationContainer.style.right = '20px';
        notificationContainer.style.zIndex = '9999';
        document.body.appendChild(notificationContainer);
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerText = message;
    
    // Add to container
    notificationContainer.appendChild(notification);
    
    // Remove after delay
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => {
            if (notification.parentNode === notificationContainer) {
                notificationContainer.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

function changeWeek(dayDiff) {
    // Save current state before changing week
    saveToCalendarHistory('Change week');
    
    // Create a new date object to avoid modifying the original
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() + dayDiff);
    
    // Update the current week start
    currentWeekStart = newDate;
    
    // Render the updated calendar
    renderCalendar();
    
    // Show notification when changing weeks
    const direction = dayDiff > 0 ? 'next' : 'previous';
    showNotification(`Viewing ${direction} week`, 'info');
}

function renderCalendar() {
    const calendarGrid = document.getElementById('calendar-grid');
    if (!calendarGrid) {
        console.error('Calendar grid not found!');
        return;
    }
    
    console.log('Rendering calendar...');
    calendarGrid.innerHTML = '';
    
    // Update week display
    updateWeekDisplay();
    
    // Create day columns
    for (let i = 0; i < 7; i++) {
        const date = new Date(currentWeekStart);
        date.setDate(date.getDate() + i);
        
        const dayColumn = document.createElement('div');
        dayColumn.className = 'day-column';
        dayColumn.style.width = '100%'; // Ensure columns take full width
          // Create day header with visible styling
        const dayHeader = document.createElement('div');
        dayHeader.className = 'day-header';
        dayHeader.style.borderBottom = '2px solid var(--border-color)';
        dayHeader.style.backgroundColor = 'var(--card-bg)';
        
        const dayOfWeek = new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(date);
        const dayOfMonth = date.getDate();
        const month = new Intl.DateTimeFormat('en-US', { month: 'short' }).format(date);
        
        // Create day of week element
        const dayOfWeekElement = document.createElement('div');
        dayOfWeekElement.className = 'day-of-week';
        dayOfWeekElement.textContent = dayOfWeek;
        
        // Create date element with circle for current day
        const dateElement = document.createElement('div');
        dateElement.className = 'date';
        
        // For today's date, wrap the date in a circle
        if (isToday(date)) {
            const dateCircle = document.createElement('div');
            dateCircle.className = 'date-circle';
            dateCircle.textContent = dayOfMonth;
            dateElement.appendChild(dateCircle);
            dateElement.appendChild(document.createTextNode(` ${month}`));
        } else {
            dateElement.textContent = `${dayOfMonth} ${month}`;
        }
        
        // Add elements to header
        dayHeader.appendChild(dayOfWeekElement);
        dayHeader.appendChild(dateElement);
        
        // Check if it's today
        if (isToday(date)) {
            dayHeader.classList.add('today');
        }
        
        dayColumn.appendChild(dayHeader);
        
        // Create day content with time cells
        const dayContent = document.createElement('div');
        dayContent.className = 'day-content';
        dayColumn.setAttribute('data-date', formatDate(date));
        
        for (let hour = 8; hour < 19; hour++) {
            const timeCell = document.createElement('div');
            timeCell.className = 'time-cell';
            timeCell.setAttribute('data-hour', hour);
            
            // Add time indicator for first column only
            if (i === 0) {
                const timeIndicator = document.createElement('div');
                timeIndicator.className = 'time-indicator';
                timeIndicator.textContent = `${hour > 12 ? hour - 12 : hour}${hour >= 12 ? 'pm' : 'am'}`;
                timeIndicator.style.position = 'absolute';
                timeIndicator.style.left = '-40px';
                timeIndicator.style.fontSize = '0.7rem';
                timeIndicator.style.opacity = '0.7';
                timeCell.appendChild(timeIndicator);
            }
            
            // Highlight current hour
            const now = new Date();
            if (isToday(date) && now.getHours() === hour) {
                timeCell.classList.add('current-hour');
            }
              // Make time cells clickable to add events and show the "+" sign
            timeCell.addEventListener('click', (e) => {
                // Only handle direct clicks on the cell, not on events
                if (e.target === timeCell) {
                    // Show the event creation modal directly
                    showEventCreationModal(date, hour);
                }
            });
              // Add drop zone handling
            timeCell.addEventListener('dragover', (e) => {
                e.preventDefault();
                timeCell.classList.add('drop-target');
                
                // Show more precise drop position with a line indicator
                const cellRect = timeCell.getBoundingClientRect();
                const relativeY = e.clientY - cellRect.top;
                const cellHeight = cellRect.height;
                
                // Remove any existing drop indicators
                const existingIndicator = timeCell.querySelector('.drop-position-indicator');
                if (existingIndicator) {
                    timeCell.removeChild(existingIndicator);
                }
                
                // Create position indicator for more precise placement
                const indicator = document.createElement('div');
                indicator.className = 'drop-position-indicator';
                indicator.style.position = 'absolute';
                indicator.style.left = '0';
                indicator.style.right = '0';
                indicator.style.top = `${relativeY}px`;
                indicator.style.height = '2px';
                indicator.style.backgroundColor = 'var(--primary-color)';
                indicator.style.zIndex = '10';
                timeCell.appendChild(indicator);
                
                // Store the relative position for drop
                timeCell.dataset.dropPosition = relativeY / cellHeight;
            });
            
            timeCell.addEventListener('dragleave', () => {
                timeCell.classList.remove('drop-target');
                // Remove drop indicator
                const indicator = timeCell.querySelector('.drop-position-indicator');
                if (indicator) {
                    timeCell.removeChild(indicator);
                }
            });
            
            timeCell.addEventListener('drop', (e) => {
                e.preventDefault();
                timeCell.classList.remove('drop-target');
                
                if (draggedEvent) {
                    // Update the event with new position
                    const column = timeCell.closest('.day-column');
                    const date = column.getAttribute('data-date');
                    const hour = parseInt(timeCell.getAttribute('data-hour'));
                      // Calculate minutes based on drop position within cell
                    // and snap to 15-minute intervals
                    const dropPosition = parseFloat(timeCell.dataset.dropPosition) || 0;
                    const exactMinutes = dropPosition * 60; // Convert to exact minutes
                    
                    // Snap to nearest 15-minute interval (0, 15, 30, 45)
                    const snappedMinutes = Math.round(exactMinutes / 15) * 15;
                    const preciseHour = hour + (snappedMinutes / 60); // Hour with fraction
                    
                    moveEvent(draggedEvent.id, date, preciseHour);
                    
                    // Remove drop indicator
                    const indicator = timeCell.querySelector('.drop-position-indicator');
                    if (indicator) {
                        timeCell.removeChild(indicator);
                    }
                }
            });
            
            dayContent.appendChild(timeCell);
        }
        
        dayColumn.appendChild(dayContent);
        calendarGrid.appendChild(dayColumn);
    }    // Render events
    renderEvents();
    
    // Add the current time indicator
    updateCurrentTimeIndicator();
    
    // Add the current time indicator
    updateCurrentTimeIndicator();
}

function selectTimeCell(cell, date, hour) {
    // Remove previous selection if any
    if (selectedTimeCell) {
        selectedTimeCell.classList.remove('selected-cell');
        selectedTimeCell.style.backgroundColor = '';
    }
    
    // Set new selection
    selectedTimeCell = cell;
    selectedTimeCell.classList.add('selected-cell');
    selectedTimeCell.style.backgroundColor = 'rgba(var(--accent-color-rgb), 0.2)';
    
    // Show the new event creation modal
    showEventCreationModal(date, hour);
}

function addCalendarEvent() {
    // If a time cell is selected, use it to show the creation modal
    if (selectedTimeCell) {
        const column = selectedTimeCell.closest('.day-column');
        const dateStr = column.getAttribute('data-date');
        const date = new Date(dateStr);
        const hour = parseInt(selectedTimeCell.getAttribute('data-hour'));
        showEventCreationModal(date, hour);
    } else {
        // If no time cell is selected, show notification
        showNotification('Please click on a time slot in the calendar first', 'error');
    }
}

function moveEvent(eventId, newDate, newHour) {
    const eventIndex = calendarEvents.findIndex(e => e.id === eventId);
    if (eventIndex === -1) return;
    
    // Store old values for notification
    const oldDate = calendarEvents[eventIndex].date;
    const oldHour = calendarEvents[eventIndex].startHour;
    
    // Update the event with new position
    calendarEvents[eventIndex].date = newDate;
    calendarEvents[eventIndex].startHour = newHour;
    
    // Make sure the event stays within valid hours (8am-7pm)
    // Allow fractional hours for more precise positioning
    calendarEvents[eventIndex].startHour = Math.max(8, Math.min(18.75, calendarEvents[eventIndex].startHour));
    
    // Update the duration if it would extend past the end of the day
    const maxPossibleDuration = 19 - calendarEvents[eventIndex].startHour; // 7pm is the cutoff
    if (calendarEvents[eventIndex].duration > maxPossibleDuration) {
        calendarEvents[eventIndex].duration = maxPossibleDuration;
    }
    
    localStorage.setItem('calendarEvents', JSON.stringify(calendarEvents));
    renderEvents();
      // Highlight the moved event
    setTimeout(() => {
        const eventElement = document.querySelector(`[data-event-id="${eventId}"]`);
        if (eventElement) {
            eventElement.classList.add('highlight');
            setTimeout(() => eventElement.classList.remove('highlight'), 2000);
            
            // Show a success notification
            const event = calendarEvents.find(e => e.id === eventId);
            if (event) {
                const startTimeStr = formatTime(event.startHour);
                showNotification(`Event moved to ${startTimeStr}`, 'success');
            }
        }
    }, 100);
}

function deleteEvent(eventId) {
    // Save current state before deletion
    saveToCalendarHistory('Delete event');
    
    const eventElement = document.querySelector(`[data-event-id="${eventId}"]`);
    const eventToDelete = calendarEvents.find(e => e.id === eventId);
    
    if (!eventToDelete) {
        showNotification('Event not found', 'error');
        return;
    }
    
    const eventTitle = eventToDelete.title;
    
    // Animate removal
    if (eventElement) {
        eventElement.style.transform = 'scale(0.8)';
        eventElement.style.opacity = '0';
        
        setTimeout(() => {
            calendarEvents = calendarEvents.filter(e => e.id !== eventId);
            localStorage.setItem('calendarEvents', JSON.stringify(calendarEvents));
            renderEvents();
            showNotification(`"${eventTitle}" deleted`, 'info');
        }, 300);
    } else {
        // No animation if element not found
        calendarEvents = calendarEvents.filter(e => e.id !== eventId);
        localStorage.setItem('calendarEvents', JSON.stringify(calendarEvents));
        renderEvents();
        showNotification(`"${eventTitle}" deleted`, 'info');
    }
}

function resizeEvent(eventId, newDuration) {
    const eventIndex = calendarEvents.findIndex(e => e.id === eventId);
    if (eventIndex === -1) return;
    
    // Ensure minimum duration of 0.25 hours (15 minutes) and maximum of 10 hours
    newDuration = Math.max(0.25, Math.min(10, newDuration));
    
    // Update the event with new duration
    calendarEvents[eventIndex].duration = newDuration;
    
    localStorage.setItem('calendarEvents', JSON.stringify(calendarEvents));
    renderEvents();
}

function renderEvents() {
    // Clear existing event elements
    document.querySelectorAll('.calendar-task').forEach(el => el.remove());
    
    calendarEvents.forEach(event => {
        // Find the column for this date
        const column = document.querySelector(`.day-column[data-date="${event.date}"]`);
        if (!column) return; // Date not in current view
        
        const dayContent = column.querySelector('.day-content');
          // Create event element
        const eventElement = document.createElement('div');
        eventElement.className = 'calendar-task';
        eventElement.setAttribute('data-event-id', event.id);
        eventElement.style.backgroundColor = event.color || 'var(--accent-color)';
        
        // Create title element
        const titleElement = document.createElement('div');
        titleElement.className = 'calendar-task-title';
        titleElement.textContent = event.title;
        eventElement.appendChild(titleElement);
          // Create time element
        const timeElement = document.createElement('div');
        timeElement.className = 'calendar-task-time';
        
        // Format start time with minutes for fractional hours
        const startHourWhole = Math.floor(event.startHour);
        const startMinutes = Math.round((event.startHour - startHourWhole) * 60);
        const startHour12 = startHourWhole > 12 ? startHourWhole - 12 : startHourWhole;
        const startAmPm = event.startHour >= 12 ? 'pm' : 'am';
        const formattedStartTime = startMinutes > 0 ? 
            `${startHour12}:${startMinutes.toString().padStart(2, '0')}` : 
            `${startHour12}`;
        
        // Format end time with minutes for fractional hours
        const endTime = event.startHour + event.duration;
        const endHourWhole = Math.floor(endTime);
        const endMinutes = Math.round((endTime - endHourWhole) * 60);
        const endHour12 = endHourWhole > 12 ? endHourWhole - 12 : endHourWhole;
        const endAmPm = endTime >= 12 ? 'pm' : 'am';
        const formattedEndTime = endMinutes > 0 ? 
            `${endHour12}:${endMinutes.toString().padStart(2, '0')}` : 
            `${endHour12}`;
        
        timeElement.textContent = `${formattedStartTime}${startAmPm} - ${formattedEndTime}${endAmPm}`;
        eventElement.appendChild(timeElement);
        
        // Add action buttons
        const actionsElement = document.createElement('div');
        actionsElement.className = 'calendar-task-actions';
        
        // Edit button
        const editButton = document.createElement('div');
        editButton.className = 'calendar-task-action';
        editButton.innerHTML = '<i class="fas fa-edit"></i>';
        editButton.title = "Edit Event";
        editButton.addEventListener('click', (e) => {
            e.stopPropagation();
            editEvent(event.id);
        });
        actionsElement.appendChild(editButton);
          // Delete button
        const deleteButton = document.createElement('div');
        deleteButton.className = 'calendar-task-action';
        deleteButton.innerHTML = '<i class="fas fa-trash"></i>';
        deleteButton.title = "Delete Event";
        deleteButton.addEventListener('click', (e) => {
            e.stopPropagation();
            if (confirm(`Delete event "${event.title}"?`)) {
                deleteEvent(event.id);
            }
        });
        actionsElement.appendChild(deleteButton);
        
        eventElement.appendChild(actionsElement);
          // Position the event - support fractional hours for precise positioning
        const topPosition = (event.startHour - 8) * 60; // Convert hours to pixels (60px per hour)
        const height = event.duration * 60; // Height based on duration
        
        eventElement.style.top = `${topPosition}px`;
        eventElement.style.height = `${height}px`;
          // Make event draggable
        eventElement.draggable = true;
        
        // Dragging events
        eventElement.addEventListener('dragstart', (e) => {
            draggedEvent = event;
            eventElement.classList.add('dragging');
            e.dataTransfer.setData('text/plain', event.id);
            e.dataTransfer.effectAllowed = 'move';
            
            // Set a custom drag image that looks better
            const dragImage = eventElement.cloneNode(true);
            dragImage.style.width = eventElement.offsetWidth + 'px';
            dragImage.style.height = eventElement.offsetHeight + 'px';
            dragImage.style.opacity = '0.8';
            dragImage.style.position = 'absolute';
            dragImage.style.top = '-1000px';
            document.body.appendChild(dragImage);
            e.dataTransfer.setDragImage(dragImage, 10, 10);
            
            // Remove the drag image after a short delay
            setTimeout(() => {
                if (document.body.contains(dragImage)) {
                    document.body.removeChild(dragImage);
                }
            }, 100);
        });
        
        eventElement.addEventListener('dragend', () => {
            eventElement.classList.remove('dragging');
            draggedEvent = null;
            
            // Clean up any drop targets and indicators
            document.querySelectorAll('.time-cell').forEach(cell => {
                cell.classList.remove('drop-target');
                const indicator = cell.querySelector('.drop-position-indicator');
                if (indicator) {
                    cell.removeChild(indicator);
                }
            });
        });
          // Double-click to edit
        eventElement.addEventListener('dblclick', (e) => {
            e.stopPropagation();
            editEvent(event.id);
        });
        
        // Right-click context menu
        eventElement.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            e.stopPropagation();
            showContextMenu(e.clientX, e.clientY, event);
        });
        
        // Add resize handle
        const resizeHandle = document.createElement('div');
        resizeHandle.className = 'resize-handle';
        resizeHandle.style.position = 'absolute';
        resizeHandle.style.bottom = '0';
        resizeHandle.style.left = '0';
        resizeHandle.style.right = '0';
        resizeHandle.style.height = '6px';
        resizeHandle.style.cursor = 'ns-resize';
        
        // Resizing functionality
        resizeHandle.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            e.preventDefault();
            
            resizingEvent = event;
            resizeStartY = e.clientY;
            originalEventHeight = eventElement.offsetHeight;
            
            document.addEventListener('mousemove', handleResize);
            document.addEventListener('mouseup', stopResize);
        });
        
        eventElement.appendChild(resizeHandle);
        dayContent.appendChild(eventElement);
    });
}

function handleResize(e) {
    if (!resizingEvent) return;
    
    const eventElement = document.querySelector(`[data-event-id="${resizingEvent.id}"]`);
    if (!eventElement) {
        stopResize();
        return;
    }
    
    // Calculate new height based on mouse movement
    const deltaY = e.clientY - resizeStartY;
    let newHeight = Math.max(30, originalEventHeight + deltaY); // Minimum height of 30px
    
    // Snap to 15-minute intervals (15 min = 15px)
    const snapInterval = 15;
    newHeight = Math.round(newHeight / snapInterval) * snapInterval;
    
    // Update visual height
    eventElement.style.height = `${newHeight}px`;
    
    // Update duration text
    const newDuration = newHeight / 60; // Convert pixels back to hours
    const timeElement = eventElement.querySelector('.calendar-task-time');
    if (timeElement) {
        const startHour = resizingEvent.startHour > 12 ? resizingEvent.startHour - 12 : resizingEvent.startHour;
        const endHour = resizingEvent.startHour + newDuration > 12 ? 
            (resizingEvent.startHour + newDuration) - 12 : 
            resizingEvent.startHour + newDuration;
        const startAmPm = resizingEvent.startHour >= 12 ? 'pm' : 'am';
        const endAmPm = resizingEvent.startHour + newDuration >= 12 ? 'pm' : 'am';
        
        // Format end time with minutes if not a whole hour
        const endMinutes = Math.round((endHour % 1) * 60);
        const formattedEndHour = endMinutes > 0 ? 
            `${Math.floor(endHour)}:${endMinutes.toString().padStart(2, '0')}` : 
            endHour;
            
        timeElement.textContent = `${startHour}${startAmPm} - ${formattedEndHour}${endAmPm}`;
    }
}

function stopResize() {
    if (!resizingEvent) return;
    
    const eventElement = document.querySelector(`[data-event-id="${resizingEvent.id}"]`);
    if (eventElement) {
        // Calculate new duration from the element's height
        const newHeight = eventElement.offsetHeight;
        const newDuration = newHeight / 60; // Convert pixels to hours
        
        // Save current state before resizing
        saveToCalendarHistory('Resize event');
        
        // Update the event
        resizeEvent(resizingEvent.id, newDuration);
    }
    
    // Clean up
    document.removeEventListener('mousemove', handleResize);
    document.removeEventListener('mouseup', stopResize);
    resizingEvent = null;
    resizeStartY = 0;
    originalEventHeight = 0;
}

// Wrapper function to open the event edit modal
function openEventEditModal(event) {
    if (event && event.id) {
        editEvent(event.id);
    }
}

function editEvent(eventId) {
    const event = calendarEvents.find(e => e.id === eventId);
    if (!event) {
        showNotification('Event not found', 'error');
        return;
    }
    
    // Save current state before editing
    saveToCalendarHistory('Edit event');
    
    // Create a modal dialog for editing
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'modal-overlay';
    modalOverlay.style.position = 'fixed';
    modalOverlay.style.top = '0';
    modalOverlay.style.left = '0';
    modalOverlay.style.width = '100%';
    modalOverlay.style.height = '100%';
    modalOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    modalOverlay.style.display = 'flex';
    modalOverlay.style.justifyContent = 'center';
    modalOverlay.style.alignItems = 'center';
    modalOverlay.style.zIndex = '1000';
    
    const modal = document.createElement('div');
    modal.className = 'event-edit-modal';
    modal.style.backgroundColor = 'var(--card-bg)';
    modal.style.padding = '1.5rem';
    modal.style.borderRadius = '12px';
    modal.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.2)';
    modal.style.width = '350px';
    modal.style.animation = 'fadeIn 0.3s ease';
    
    const modalTitle = document.createElement('h3');
    modalTitle.textContent = 'Edit Event';
    modalTitle.style.marginTop = '0';
    modalTitle.style.marginBottom = '1rem';
    
    const titleInput = document.createElement('input');
    titleInput.type = 'text';
    titleInput.value = event.title;
    titleInput.placeholder = 'Event title';
    titleInput.style.width = '100%';
    titleInput.style.padding = '0.5rem';
    titleInput.style.marginBottom = '1rem';
    titleInput.style.boxSizing = 'border-box';
    
    // Focus the input when the modal appears
    setTimeout(() => titleInput.focus(), 100);
      // Create time label with more detail
    const timeLabel = document.createElement('div');
    const startTimeStr = formatTime(event.startHour);
    const endTimeStr = formatTime(event.startHour + event.duration);
    timeLabel.style.marginBottom = '1rem';
    
    // Create time display with icon
    const timeDisplay = document.createElement('div');
    timeDisplay.style.display = 'flex';
    timeDisplay.style.alignItems = 'center';
    timeDisplay.style.gap = '8px';
    
    const timeIcon = document.createElement('span');
    timeIcon.innerHTML = '<i class="fas fa-clock"></i>';
    timeIcon.style.color = 'var(--text-color-secondary)';
    
    const timeText = document.createElement('span');
    timeText.textContent = `${startTimeStr} - ${endTimeStr}`;
    
    timeDisplay.appendChild(timeIcon);
    timeDisplay.appendChild(timeText);
    timeLabel.appendChild(timeDisplay);
    
    const durationInput = document.createElement('input');
    durationInput.type = 'range';
    durationInput.min = '0.25';
    durationInput.max = '10';
    durationInput.step = '0.25';
    durationInput.value = event.duration;
    durationInput.style.width = '100%';
    durationInput.style.marginBottom = '0.5rem';
    
    const durationLabel = document.createElement('div');
    durationLabel.textContent = `Duration: ${event.duration} hour${event.duration !== 1 ? 's' : ''}`;
    durationLabel.style.marginBottom = '1rem';
    durationLabel.style.fontSize = '0.9rem';
    
    // Update duration label as slider changes
    durationInput.addEventListener('input', () => {
        const duration = parseFloat(durationInput.value);
        durationLabel.textContent = `Duration: ${duration} hour${duration !== 1 ? 's' : ''}`;
        timeLabel.textContent = `Time: ${formatTime(event.startHour)} - ${formatTime(event.startHour + duration)}`;
    });
    
    // Color picker
    const colorLabel = document.createElement('div');
    colorLabel.textContent = 'Event color:';
    colorLabel.style.marginBottom = '0.5rem';
    
    const colorPicker = document.createElement('div');
    colorPicker.className = 'color-picker';
    colorPicker.style.display = 'flex';
    colorPicker.style.gap = '0.5rem';
    colorPicker.style.flexWrap = 'wrap';
    colorPicker.style.marginBottom = '1.5rem';
    
    const colors = [
        '#5B8FF9', // Blue
        '#5AD8A6', // Green
        '#5D7092', // Navy
        '#F6BD16', // Yellow
        '#E8684A', // Red
        '#6DC8EC', // Light Blue
        '#9270CA', // Purple
        '#FF9D4D', // Orange
        '#269A99', // Teal
        '#FF99C3'  // Pink
    ];
    
    colors.forEach(color => {
        const colorOption = document.createElement('div');
        colorOption.style.width = '25px';
        colorOption.style.height = '25px';
        colorOption.style.backgroundColor = color;
        colorOption.style.borderRadius = '50%';
        colorOption.style.cursor = 'pointer';
        colorOption.style.border = color === event.color ? '3px solid var(--primary-color)' : '3px solid transparent';
        
        colorOption.addEventListener('click', () => {
            // Deselect all
            colorPicker.querySelectorAll('div').forEach(opt => {
                opt.style.border = '3px solid transparent';
            });
            
            // Select this one
            colorOption.style.border = '3px solid var(--primary-color)';
            event.color = color;
        });
        
        colorPicker.appendChild(colorOption);
    });
    
    // Buttons
    const buttonContainer = document.createElement('div');
    buttonContainer.style.display = 'flex';
    buttonContainer.style.justifyContent = 'space-between';
    buttonContainer.style.marginTop = '1rem';
    
    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Cancel';
    cancelBtn.style.backgroundColor = 'transparent';
    cancelBtn.style.border = '1px solid var(--border-color)';
    cancelBtn.style.padding = '0.5rem 1rem';
    cancelBtn.style.borderRadius = '8px';
    cancelBtn.style.cursor = 'pointer';
    
    const saveBtn = document.createElement('button');
    saveBtn.textContent = 'Save Changes';
    saveBtn.style.backgroundColor = 'var(--primary-color)';
    saveBtn.style.color = 'white';
    saveBtn.style.border = 'none';
    saveBtn.style.padding = '0.5rem 1rem';
    saveBtn.style.borderRadius = '8px';
    saveBtn.style.cursor = 'pointer';
    
    buttonContainer.appendChild(cancelBtn);
    buttonContainer.appendChild(saveBtn);
    
    // Add everything to modal
    modal.appendChild(modalTitle);
    modal.appendChild(titleInput);
    modal.appendChild(timeLabel);
    modal.appendChild(durationInput);
    modal.appendChild(durationLabel);
    modal.appendChild(colorLabel);
    modal.appendChild(colorPicker);
    modal.appendChild(buttonContainer);
    
    modalOverlay.appendChild(modal);
    document.body.appendChild(modalOverlay);
    
    // Focus title input
    titleInput.focus();
    
    // Handle button clicks
    cancelBtn.addEventListener('click', () => {
        document.body.removeChild(modalOverlay);
    });
      saveBtn.addEventListener('click', () => {
        // Save current state before editing event
        saveToCalendarHistory('Edit event');
        
        // Update the event
        const eventIndex = calendarEvents.findIndex(e => e.id === eventId);
        if (eventIndex !== -1) {
            // Validate title
            if (!titleInput.value.trim()) {
                titleInput.classList.add('error');
                setTimeout(() => titleInput.classList.remove('error'), 800);
                showNotification('Event title cannot be empty', 'error');
                return;
            }
            
            calendarEvents[eventIndex].title = titleInput.value;
            calendarEvents[eventIndex].duration = parseFloat(durationInput.value);
            calendarEvents[eventIndex].color = event.color;
            
            localStorage.setItem('calendarEvents', JSON.stringify(calendarEvents));
            document.body.removeChild(modalOverlay);
            renderEvents();
            
            // Show notification
            showNotification('Event updated successfully', 'success');
            
            // Highlight the updated event
            setTimeout(() => {
                const eventElement = document.querySelector(`[data-event-id="${eventId}"]`);
                if (eventElement) {
                    eventElement.classList.add('highlight');
                    setTimeout(() => eventElement.classList.remove('highlight'), 2000);
                }
            }, 100);
        }
    });
}

// Utility function to format time with improved handling of fractional hours
function formatTime(hour) {
    const isAM = hour < 12;
    const hour12 = hour % 12 === 0 ? 12 : hour % 12;
    const minutes = Math.round((hour % 1) * 60);
    
    // Handle fractional hours properly
    let formattedHour = Math.floor(hour12);
    let formattedMinutes = '';
    
    // Always show minutes in the format HH:MM for consistency
    formattedMinutes = ':' + minutes.toString().padStart(2, '0');
    
    return `${formattedHour}${formattedMinutes}${isAM ? 'am' : 'pm'}`;
}

function updateWeekDisplay() {
    const endOfWeek = new Date(currentWeekStart);
    endOfWeek.setDate(endOfWeek.getDate() + 6);
    
    const startMonth = new Intl.DateTimeFormat('en-US', { month: 'short' }).format(currentWeekStart);
    const endMonth = new Intl.DateTimeFormat('en-US', { month: 'short' }).format(endOfWeek);
    
    const startDay = currentWeekStart.getDate();
    const endDay = endOfWeek.getDate();
    const year = currentWeekStart.getFullYear();
    
    let displayText = '';
    if (startMonth === endMonth) {
        displayText = `${startMonth} ${startDay}-${endDay}, ${year}`;
    } else {
        displayText = `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${year}`;
    }
    
    document.getElementById('current-week-display').textContent = displayText;
}

// Utility functions
function formatDate(date) {
    return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
}

function isToday(date) {
    const today = new Date();
    return date.getDate() === today.getDate() && 
           date.getMonth() === today.getMonth() && 
           date.getFullYear() === today.getFullYear();
}

// Google Calendar-like event creation modal
function showEventCreationModal(date, hour) {
    // Save the datetime for later use
    const dateStr = formatDate(date);
    
    // Create modal overlay
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'calendar-modal-overlay';
    modalOverlay.style.position = 'fixed';
    modalOverlay.style.top = '0';
    modalOverlay.style.left = '0';
    modalOverlay.style.width = '100%';
    modalOverlay.style.height = '100%';
    modalOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    modalOverlay.style.display = 'flex';
    modalOverlay.style.justifyContent = 'center';
    modalOverlay.style.alignItems = 'center';
    modalOverlay.style.zIndex = '1000';
      // Create modal
    const modal = document.createElement('div');
    modal.className = 'calendar-event-modal';
    modal.style.position = 'relative';
    modal.style.maxHeight = '90vh';
    modal.style.overflow = 'auto';
    
    // Create header with close button
    const header = document.createElement('div');
    header.style.borderBottom = '1px solid var(--border-color)';
    header.style.padding = '12px 16px';
    header.style.display = 'flex';
    header.style.justifyContent = 'space-between';
    header.style.alignItems = 'center';
    
    const headerTitle = document.createElement('h3');
    headerTitle.textContent = 'Add Event';
    headerTitle.style.margin = '0';
    headerTitle.style.fontSize = '18px';
    
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '&times;';
    closeBtn.style.background = 'none';
    closeBtn.style.border = 'none';
    closeBtn.style.fontSize = '20px';
    closeBtn.style.cursor = 'pointer';
    closeBtn.style.color = 'var(--text-color)';
    closeBtn.style.padding = '4px 8px';
    closeBtn.style.borderRadius = '4px';
    closeBtn.title = 'Close';
    closeBtn.onclick = () => {
        document.body.removeChild(modalOverlay);
    };
    
    header.appendChild(headerTitle);
    header.appendChild(closeBtn);
    modal.appendChild(header);
    
    // Create form content
    const form = document.createElement('form');
    form.style.padding = '16px';
    
    // Title input
    const titleGroup = document.createElement('div');
    titleGroup.style.marginBottom = '16px';
    
    const titleInput = document.createElement('input');
    titleInput.type = 'text';
    titleInput.placeholder = 'Add title';
    titleInput.style.width = '100%';
    titleInput.style.padding = '12px 16px';
    titleInput.style.borderRadius = '6px';
    titleInput.style.border = '1px solid var(--border-color)';
    titleInput.style.fontSize = '18px';
    titleInput.style.boxSizing = 'border-box';
    titleInput.style.boxShadow = 'inset 0 1px 3px rgba(0,0,0,0.05)';
    titleInput.style.transition = 'border-color 0.2s, box-shadow 0.2s';
    
    // Add focus effect
    titleInput.addEventListener('focus', () => {
        titleInput.style.borderColor = 'var(--primary-color)';
        titleInput.style.boxShadow = '0 0 0 3px rgba(var(--primary-color-rgb), 0.2)';
    });
    
    titleInput.addEventListener('blur', () => {
        titleInput.style.borderColor = 'var(--border-color)';
        titleInput.style.boxShadow = 'inset 0 1px 3px rgba(0,0,0,0.05)';
    });
    
    titleGroup.appendChild(titleInput);
    form.appendChild(titleGroup);
      // Time information display with custom time selection
    const timeInfoGroup = document.createElement('div');
    timeInfoGroup.style.marginBottom = '16px';
    timeInfoGroup.style.display = 'flex';
    timeInfoGroup.style.alignItems = 'center';
    timeInfoGroup.style.flexDirection = 'column';
    timeInfoGroup.style.alignItems = 'flex-start';
    
    const dayStr = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    
    // Day display
    const dayDisplay = document.createElement('div');
    dayDisplay.style.marginBottom = '10px';
    dayDisplay.style.display = 'flex';
    dayDisplay.style.alignItems = 'center';
    
    const calendarIcon = document.createElement('span');
    calendarIcon.innerHTML = '<i class="fas fa-calendar-alt"></i>';
    calendarIcon.style.marginRight = '8px';
    calendarIcon.style.color = 'var(--text-color-secondary)';
    
    const dayInfo = document.createElement('span');
    dayInfo.textContent = dayStr;
    
    dayDisplay.appendChild(calendarIcon);
    dayDisplay.appendChild(dayInfo);
    timeInfoGroup.appendChild(dayDisplay);
    
    // Time selection
    const timeSelectionGroup = document.createElement('div');
    timeSelectionGroup.style.display = 'flex';
    timeSelectionGroup.style.alignItems = 'center';
    timeSelectionGroup.style.gap = '10px';
    timeSelectionGroup.style.marginBottom = '5px';
    
    const timeIcon = document.createElement('span');
    timeIcon.innerHTML = '<i class="fas fa-clock"></i>';
    timeIcon.style.color = 'var(--text-color-secondary)';
    
    // Create start time selector
    let startHour = hour;
    let startMinute = 0;
    
    const startTimeSelect = document.createElement('div');
    startTimeSelect.className = 'time-select';
    startTimeSelect.style.display = 'flex';
    startTimeSelect.style.alignItems = 'center';
    startTimeSelect.style.padding = '4px 8px';
    startTimeSelect.style.border = '1px solid var(--border-color)';
    startTimeSelect.style.borderRadius = '4px';
    startTimeSelect.style.cursor = 'pointer';
    
    const formatTimeForDisplay = (h, m) => {
        const hour12 = h > 12 ? h - 12 : h;
        const amPm = h >= 12 ? 'pm' : 'am';
        return `${hour12}:${m.toString().padStart(2, '0')}${amPm}`;
    };
    
    const startTimeText = document.createElement('span');
    startTimeText.textContent = formatTimeForDisplay(startHour, startMinute);
    startTimeSelect.appendChild(startTimeText);
    
    // Dash between times
    const timeDash = document.createElement('span');
    timeDash.textContent = '–';
    timeDash.style.margin = '0 5px';
    
    // Create end time display (calculated based on duration)
    const endTimeText = document.createElement('div');
    endTimeText.className = 'time-select';
    endTimeText.style.padding = '4px 8px';
    endTimeText.style.border = '1px solid var(--border-color)';
    endTimeText.style.borderRadius = '4px';
    
    const updateEndTimeDisplay = (h, m, duration) => {
        // Calculate end time based on start time and duration
        const totalMinutes = h * 60 + m + duration * 60;
        const endHour = Math.floor(totalMinutes / 60);
        const endMinute = totalMinutes % 60;
        endTimeText.textContent = formatTimeForDisplay(endHour, endMinute);
    };
    
    updateEndTimeDisplay(startHour, startMinute, 1); // Default 1 hour duration
    
    // Time picker popup
    startTimeSelect.addEventListener('click', () => {
        const timePickerPopup = document.createElement('div');
        timePickerPopup.className = 'time-picker-popup';
        timePickerPopup.style.position = 'absolute';
        timePickerPopup.style.backgroundColor = 'var(--card-bg)';
        timePickerPopup.style.border = '1px solid var(--border-color)';
        timePickerPopup.style.borderRadius = '4px';
        timePickerPopup.style.padding = '10px';
        timePickerPopup.style.boxShadow = '0 5px 15px rgba(0,0,0,0.2)';
        timePickerPopup.style.zIndex = '1010';
        timePickerPopup.style.maxHeight = '300px';
        timePickerPopup.style.overflowY = 'auto';
        
        // Position the popup
        const rect = startTimeSelect.getBoundingClientRect();
        timePickerPopup.style.top = `${rect.bottom + 5}px`;
        timePickerPopup.style.left = `${rect.left}px`;
        
        // Generate time options in 15-minute intervals
        for (let h = 8; h < 19; h++) {
            [0, 15, 30, 45].forEach(m => {
                const timeOption = document.createElement('div');
                timeOption.textContent = formatTimeForDisplay(h, m);
                timeOption.style.padding = '5px 10px';
                timeOption.style.cursor = 'pointer';
                timeOption.style.borderRadius = '2px';
                
                // Highlight current selection
                if (h === startHour && m === startMinute) {
                    timeOption.style.backgroundColor = 'rgba(var(--primary-color-rgb), 0.2)';
                }
                
                timeOption.addEventListener('mouseover', () => {
                    timeOption.style.backgroundColor = 'rgba(var(--primary-color-rgb), 0.1)';
                });
                
                timeOption.addEventListener('mouseout', () => {
                    if (h === startHour && m === startMinute) {
                        timeOption.style.backgroundColor = 'rgba(var(--primary-color-rgb), 0.2)';
                    } else {
                        timeOption.style.backgroundColor = '';
                    }
                });
                
                timeOption.addEventListener('click', () => {
                    startHour = h;
                    startMinute = m;
                    startTimeText.textContent = formatTimeForDisplay(h, m);
                    
                    // Update end time display
                    const duration = parseFloat(durationInput.value);
                    updateEndTimeDisplay(h, m, duration);
                    
                    document.body.removeChild(timePickerPopup);
                });
                
                timePickerPopup.appendChild(timeOption);
            });
        }
        
        document.body.appendChild(timePickerPopup);
        
        // Close when clicking outside
        document.addEventListener('click', function closePopup(e) {
            if (!timePickerPopup.contains(e.target) && e.target !== startTimeSelect) {
                if (document.body.contains(timePickerPopup)) {
                    document.body.removeChild(timePickerPopup);
                }
                document.removeEventListener('click', closePopup);
            }
        });
    });
    
    timeSelectionGroup.appendChild(timeIcon);
    timeSelectionGroup.appendChild(startTimeSelect);
    timeSelectionGroup.appendChild(timeDash);
    timeSelectionGroup.appendChild(endTimeText);
    
    timeInfoGroup.appendChild(timeSelectionGroup);
    form.appendChild(timeInfoGroup);
    
    // Color picker
    const colorGroup = document.createElement('div');
    colorGroup.style.marginBottom = '16px';
    
    const colorLabel = document.createElement('div');
    colorLabel.textContent = 'Event color:';
    colorLabel.style.marginBottom = '8px';
    
    const colorPicker = document.createElement('div');
    colorPicker.className = 'event-color-picker';
    colorPicker.style.display = 'flex';
    colorPicker.style.gap = '8px';
    colorPicker.style.flexWrap = 'wrap';
    
    let selectedColor = '#5B8FF9'; // Default blue
    
    const colors = [
        '#5B8FF9', // Blue
        '#5AD8A6', // Green
        '#5D7092', // Navy
        '#F6BD16', // Yellow
        '#E8684A', // Red
        '#6DC8EC', // Light Blue
        '#9270CA', // Purple
        '#FF9D4D', // Orange
        '#269A99', // Teal
        '#FF99C3'  // Pink
    ];
    
    colors.forEach(color => {
        const colorOption = document.createElement('div');
        colorOption.style.width = '24px';
        colorOption.style.height = '24px';
        colorOption.style.backgroundColor = color;
        colorOption.style.borderRadius = '50%';
        colorOption.style.cursor = 'pointer';
        colorOption.style.transition = 'transform 0.2s';
        colorOption.style.border = color === selectedColor ? '2px solid var(--primary-color)' : '2px solid transparent';
        
        colorOption.addEventListener('click', () => {
            // Deselect all
            colorPicker.querySelectorAll('div').forEach(opt => {
                opt.style.border = '2px solid transparent';
            });
            
            // Select this one
            colorOption.style.border = '2px solid var(--primary-color)';
            selectedColor = color;
        });
        
        // Hover effect
        colorOption.addEventListener('mouseover', () => {
            colorOption.style.transform = 'scale(1.1)';
        });
        
        colorOption.addEventListener('mouseout', () => {
            colorOption.style.transform = 'scale(1)';
        });
        
        colorPicker.appendChild(colorOption);
    });
    
    colorGroup.appendChild(colorLabel);
    colorGroup.appendChild(colorPicker);
    form.appendChild(colorGroup);
    
    // Duration picker
    const durationGroup = document.createElement('div');
    durationGroup.style.marginBottom = '16px';
    
    const durationLabel = document.createElement('div');
    durationLabel.textContent = 'Duration:';
    durationLabel.style.marginBottom = '8px';
    
    const durationInput = document.createElement('input');
    durationInput.type = 'range';
    durationInput.min = '0.25';
    durationInput.max = '10';
    durationInput.step = '0.25';
    durationInput.value = '1';
    durationInput.style.width = '100%';
    
    const durationValue = document.createElement('div');
    durationValue.textContent = '1 hour';
    durationValue.style.textAlign = 'center';
    durationValue.style.marginTop = '4px';
    durationValue.style.fontSize = '14px';
      durationInput.addEventListener('input', () => {
        const duration = parseFloat(durationInput.value);
        durationValue.textContent = `${duration} hour${duration !== 1 ? 's' : ''}`;
        
        // Update end time display when duration changes
        updateEndTimeDisplay(startHour, startMinute, duration);
    });
    
    durationGroup.appendChild(durationLabel);
    durationGroup.appendChild(durationInput);
    durationGroup.appendChild(durationValue);
    form.appendChild(durationGroup);
    
    // Buttons
    const buttonGroup = document.createElement('div');
    buttonGroup.style.display = 'flex';
    buttonGroup.style.justifyContent = 'flex-end';
    buttonGroup.style.gap = '8px';
    buttonGroup.style.marginTop = '16px';
      const cancelButton = document.createElement('button');
    cancelButton.textContent = 'Cancel';
    cancelButton.type = 'button';
    cancelButton.style.padding = '8px 16px';
    cancelButton.style.borderRadius = '4px';
    cancelButton.style.border = '1px solid var(--border-color)';
    cancelButton.style.backgroundColor = 'transparent';
    cancelButton.style.color = 'var(--text-color)'; // Ensure text color works in both light/dark modes
    cancelButton.style.cursor = 'pointer';
    
    const saveButton = document.createElement('button');
    saveButton.textContent = 'Save';
    saveButton.type = 'button';
    saveButton.style.padding = '10px 20px';
    saveButton.style.borderRadius = '6px';
    saveButton.style.border = 'none';
    saveButton.style.backgroundColor = 'var(--primary-color)';
    saveButton.style.color = 'white';
    saveButton.style.cursor = 'pointer';
    saveButton.style.fontWeight = 'bold';
    saveButton.style.transition = 'transform 0.1s, background-color 0.2s';
    saveButton.style.boxShadow = '0 2px 5px rgba(var(--primary-color-rgb), 0.3)';
    
    // Add hover effect
    saveButton.addEventListener('mouseover', () => {
        saveButton.style.transform = 'translateY(-1px)';
        saveButton.style.boxShadow = '0 4px 8px rgba(var(--primary-color-rgb), 0.4)';
    });
    
    saveButton.addEventListener('mouseout', () => {
        saveButton.style.transform = 'translateY(0)';
        saveButton.style.boxShadow = '0 2px 5px rgba(var(--primary-color-rgb), 0.3)';
    });
    
    // Add active effect
    saveButton.addEventListener('mousedown', () => {
        saveButton.style.transform = 'translateY(1px)';
        saveButton.style.boxShadow = '0 1px 3px rgba(var(--primary-color-rgb), 0.3)';
    });
    
    cancelButton.onclick = () => {
        document.body.removeChild(modalOverlay);
    };
    
    saveButton.onclick = () => {
        const title = titleInput.value.trim();
        
        if (!title) {
            titleInput.style.border = '1px solid red';
            titleInput.focus();
            return;
        }
        
        // Save current state before adding event
        saveToCalendarHistory('Add calendar event');
        
        const duration = parseFloat(durationInput.value);
          const newEvent = {
            id: Date.now(),
            title: title,
            date: dateStr,
            startHour: startHour + (startMinute / 60), // Convert to decimal hours
            duration: duration,
            color: selectedColor
        };
        
        // Add event to events array
        calendarEvents.push(newEvent);
        localStorage.setItem('calendarEvents', JSON.stringify(calendarEvents));
        
        // Close modal and render the updated events
        document.body.removeChild(modalOverlay);
        renderEvents();
        
        // Show notification
        showNotification(`Event "${title}" added successfully`, 'success');
        
        // Highlight the newly created event
        setTimeout(() => {
            const eventElement = document.querySelector(`[data-event-id="${newEvent.id}"]`);
            if (eventElement) {
                eventElement.classList.add('highlight');
                setTimeout(() => eventElement.classList.remove('highlight'), 2000);
            }
        }, 100);
    };
    
    buttonGroup.appendChild(cancelButton);
    buttonGroup.appendChild(saveButton);
    form.appendChild(buttonGroup);
    
    modal.appendChild(form);
    modalOverlay.appendChild(modal);
    document.body.appendChild(modalOverlay);
    
    // Focus on the title input
    setTimeout(() => {
        titleInput.focus();
    }, 100);
}

// Enable touch support for mobile devices
function enableCalendarTouchSupport() {
    const calendarGrid = document.getElementById('calendar-grid');
    
    // Track touch positions
    let touchStartX = 0;
    let touchStartY = 0;
    let touchedEvent = null;
    let touchedEventOffsetX = 0;
    let touchedEventOffsetY = 0;
    let isResizing = false;
    let isMoving = false;
    let lastTapTime = 0;
    let resizeStartTime = 0;
    let touchStartTime = 0;
    let longPressTimer = null;
    const longPressDelay = 600; // ms
    
    // Handle event touches
    calendarGrid.addEventListener('touchstart', (e) => {
        const touch = e.touches[0];
        touchStartX = touch.clientX;
        touchStartY = touch.clientY;
        touchStartTime = Date.now();
        
        // Check if event was touched
        const elementUnderTouch = document.elementFromPoint(touchStartX, touchStartY);
        
        // Start long-press timer for context menu
        clearTimeout(longPressTimer);
        
        if (elementUnderTouch) {
            // Long-press for right-click context menu
            if (elementUnderTouch.classList.contains('calendar-task') || 
                elementUnderTouch.closest('.calendar-task')) {
                
                const eventElement = elementUnderTouch.classList.contains('calendar-task') ? 
                    elementUnderTouch : elementUnderTouch.closest('.calendar-task');
                    
                if (eventElement) {
                    const eventId = parseInt(eventElement.getAttribute('data-event-id'));
                    const event = calendarEvents.find(e => e.id === eventId);
                    
                    if (event) {
                        longPressTimer = setTimeout(() => {
                            // Vibrate if available (for tactile feedback)
                            if (navigator.vibrate) {
                                navigator.vibrate(50);
                            }
                            
                            const rect = eventElement.getBoundingClientRect();
                            showContextMenu(
                                rect.left + rect.width / 2, 
                                rect.top + rect.height / 2, 
                                event
                            );
                            
                            // Prevent any other actions
                            isResizing = false;
                            isMoving = false;
                        }, longPressDelay);
                    }
                }
            }
            
            // Check if we're touching the resize handle
            if (elementUnderTouch.classList.contains('resize-handle')) {
                e.preventDefault(); // Prevent scrolling
                isResizing = true;
                
                // Clear long press timer
                clearTimeout(longPressTimer);
                
                // Find the parent event element
                const eventElement = elementUnderTouch.closest('.calendar-task');
                if (eventElement) {
                    const eventId = parseInt(eventElement.getAttribute('data-event-id'));
                    touchedEvent = calendarEvents.find(event => event.id === eventId);
                    
                    if (touchedEvent) {
                        resizeStartTime = touchedEvent.duration;
                        const eventRect = eventElement.getBoundingClientRect();
                        touchedEventOffsetY = touchStartY - eventRect.bottom;
                    }
                }
            } 
            // Check if we're touching an event (for moving)
            else if (elementUnderTouch.classList.contains('calendar-task') || 
                    elementUnderTouch.closest('.calendar-task')) {
                
                e.preventDefault(); // Prevent scrolling
                isMoving = true;
                
                // Get the event element
                const eventElement = elementUnderTouch.classList.contains('calendar-task') ? 
                    elementUnderTouch : elementUnderTouch.closest('.calendar-task');
                
                if (eventElement) {
                    const eventId = parseInt(eventElement.getAttribute('data-event-id'));
                    touchedEvent = calendarEvents.find(event => event.id === eventId);
                    
                    if (touchedEvent) {
                        const eventRect = eventElement.getBoundingClientRect();
                        touchedEventOffsetX = touchStartX - eventRect.left;
                        touchedEventOffsetY = touchStartY - eventRect.top;
                        
                        // Add visual feedback
                        eventElement.classList.add('dragging');
                    }
                }
            }
            // Check if we're touching a time cell (for selection)
            else if (elementUnderTouch.classList.contains('time-cell')) {
                const now = Date.now();
                const doubleTapDelay = 300; // ms
                
                // Clear long press timer
                clearTimeout(longPressTimer);
                
                // Set up long press for new event creation
                longPressTimer = setTimeout(() => {
                    // Clear the timer
                    longPressTimer = null;
                    
                    // Vibrate for feedback if available
                    if (navigator.vibrate) {
                        navigator.vibrate(50);
                    }
                    
                    const timeCell = elementUnderTouch;
                    const column = timeCell.closest('.day-column');
                    
                    if (column) {
                        const date = column.getAttribute('data-date');
                        const hour = parseInt(timeCell.getAttribute('data-hour'));
                        
                        selectTimeCell(timeCell, new Date(date), hour);
                    }
                }, longPressDelay);
                
                if (now - lastTapTime < doubleTapDelay) {
                    // Double tap on time cell - create new event
                    clearTimeout(longPressTimer); // Cancel long press
                    const timeCell = elementUnderTouch;
                    const column = timeCell.closest('.day-column');
                    
                    if (column) {
                        const date = column.getAttribute('data-date');
                        const hour = parseInt(timeCell.getAttribute('data-hour'));
                        
                        selectTimeCell(timeCell, new Date(date), hour);
                    }
                }
                lastTapTime = now;
            }
        }
    });
    
    // Cancel long press when the user moves their finger
    calendarGrid.addEventListener('touchmove', (e) => {
        // If we move more than 10px, cancel the long press
        const touchMove = e.touches[0];
        const deltaX = Math.abs(touchMove.clientX - touchStartX);
        const deltaY = Math.abs(touchMove.clientY - touchStartY);
        
        if (deltaX > 10 || deltaY > 10) {
            clearTimeout(longPressTimer);
        }
        
        // Continue with regular touch move handling
        if (!isResizing && !isMoving || !touchedEvent) return;
        
        const touch = e.touches[0];
        
        if (isResizing) {
            // Handle resizing event
            const calendarGridRect = calendarGrid.getBoundingClientRect();
            const cellHeight = calendarGridRect.height / 11; // 11 hour slots (8AM-7PM)
            
            // Calculate new height based on touch position
            const touchY = touch.clientY - touchedEventOffsetY;
            const touchDeltaY = touchY - touchStartY;
            
            // Convert to hours (each cell is 1 hour)
            const hourDelta = Math.round(touchDeltaY / cellHeight);
            const newDuration = Math.max(1, resizeStartTime + hourDelta);
            
            // Update the event duration preview
            const eventElement = document.querySelector(`.calendar-task[data-event-id="${touchedEvent.id}"]`);
            if (eventElement) {
                eventElement.style.height = `${newDuration * cellHeight}px`;
            }
        } else if (isMoving) {
            // Handle moving event
            const calendarGridRect = calendarGrid.getBoundingClientRect();
            const cellHeight = calendarGridRect.height / 11; // 11 hour slots
            const columnWidth = calendarGridRect.width / 7; // 7 days
            
            // Calculate which cell we're over
            const relativeX = touch.clientX - calendarGridRect.left;
            const relativeY = touch.clientY - calendarGridRect.top;
            
            const dayIndex = Math.floor(relativeX / columnWidth);
            const hourIndex = Math.floor(relativeY / cellHeight);
            
            // Only move within calendar boundaries
            if (dayIndex >= 0 && dayIndex < 7 && hourIndex >= 0 && hourIndex < 11) {
                // Find the column and cell
                const columns = calendarGrid.querySelectorAll('.day-column');
                if (columns[dayIndex]) {
                    const cells = columns[dayIndex].querySelectorAll('.time-cell');
                    if (cells[hourIndex]) {
                        // Highlight the target cell
                        document.querySelectorAll('.drop-target').forEach(el => {
                            el.classList.remove('drop-target');
                        });
                        cells[hourIndex].classList.add('drop-target');
                        
                        // Move the event element for visual feedback
                        const eventElement = document.querySelector(`.calendar-task[data-event-id="${touchedEvent.id}"]`);
                        if (eventElement) {
                            // Preview the move
                            eventElement.style.position = 'absolute';
                            eventElement.style.left = `${dayIndex * columnWidth}px`;
                            eventElement.style.top = `${hourIndex * cellHeight}px`;
                            eventElement.style.width = `${columnWidth - 8}px`; // Account for padding
                            eventElement.style.zIndex = '100';
                        }
                    }
                }
            }
        }
    });
    
    // Handle touch end events
    calendarGrid.addEventListener('touchend', (e) => {
        // Clear any long press timers
        clearTimeout(longPressTimer);
        
        // Check for quick tap (less than 100ms) on time cell for cell selection
        const touchDuration = Date.now() - touchStartTime;
        if (touchDuration < 100) {
            const touchEnd = e.changedTouches[0];
            const elementAtTouch = document.elementFromPoint(touchEnd.clientX, touchEnd.clientY);
            
            if (elementAtTouch && elementAtTouch.classList.contains('time-cell') && 
                !elementAtTouch.classList.contains('selected-cell')) {
                // Simple tap on time cell - just select it
                const timeCell = elementAtTouch;
                const column = timeCell.closest('.day-column');
                
                if (column) {
                    // Clear any previous selection
                    document.querySelectorAll('.selected-cell').forEach(cell => {
                        cell.classList.remove('selected-cell');
                        cell.style.backgroundColor = '';
                    });
                    
                    // Mark this cell as selected
                    timeCell.classList.add('selected-cell');
                    timeCell.style.backgroundColor = 'rgba(var(--accent-color-rgb), 0.2)';
                    selectedTimeCell = timeCell;
                }
            }
        }
        
        if (touchedEvent) {
            if (isResizing) {
                // Finalize resize
                const calendarGridRect = calendarGrid.getBoundingClientRect();
                const cellHeight = calendarGridRect.height / 11; // 11 hour slots
                
                // Get the touch position
                const touchEnd = e.changedTouches[0];
                const touchY = touchEnd.clientY - touchedEventOffsetY;
                const touchDeltaY = touchY - touchStartY;
                
                // Convert to hours
                const hourDelta = Math.round(touchDeltaY / cellHeight);
                const newDuration = Math.max(1, resizeStartTime + hourDelta);
                
                // Apply the resize
                if (newDuration !== touchedEvent.duration) {
                    // Save state for undo
                    saveToCalendarHistory('Resize event');
                    
                    // Update event
                    touchedEvent.duration = newDuration;
                    localStorage.setItem('calendarEvents', JSON.stringify(calendarEvents));
                    renderEvents();
                    
                    // Show notification with haptic feedback
                    if (navigator.vibrate) {
                        navigator.vibrate(50);
                    }
                    showNotification('Event resized', 'success');
                }
            } else if (isMoving) {
                // Finalize move
                document.querySelectorAll('.drop-target').forEach(el => {
                    el.classList.remove('drop-target');
                });
                
                const calendarGridRect = calendarGrid.getBoundingClientRect();
                const columnWidth = calendarGridRect.width / 7; // 7 days
                const cellHeight = calendarGridRect.height / 11; // 11 hour slots
                
                // Get the touch position
                const touchEnd = e.changedTouches[0];
                const relativeX = touchEnd.clientX - calendarGridRect.left;
                const relativeY = touchEnd.clientY - calendarGridRect.top;
                
                const dayIndex = Math.floor(relativeX / columnWidth);
                const hourIndex = Math.floor(relativeY / cellHeight);
                
                // Only move within calendar boundaries
                if (dayIndex >= 0 && dayIndex < 7 && hourIndex >= 0 && hourIndex < 11) {
                    // Find the column and cell
                    const columns = calendarGrid.querySelectorAll('.day-column');
                    if (columns[dayIndex]) {
                        const date = columns[dayIndex].getAttribute('data-date');
                        const hour = 8 + hourIndex; // Start at 8 AM
                        
                        // Move the event
                        if (date && (touchedEvent.date !== date || touchedEvent.startHour !== hour)) {
                            // Save state for undo
                            saveToCalendarHistory('Move event');
                            
                            moveEvent(touchedEvent.id, date, hour);
                            
                            // Haptic feedback
                            if (navigator.vibrate) {
                                navigator.vibrate(50);
                            }
                        } else {
                            // Just re-render to reset position
                            renderEvents();
                        }
                    }
                } else {
                    // Out of bounds, reset
                    renderEvents();
                }
                
                // Remove dragging class
                document.querySelectorAll('.calendar-task.dragging').forEach(el => {
                    el.classList.remove('dragging');
                });
            }
            
            // Reset state
            touchedEvent = null;
            isResizing = false;
            isMoving = false;
        }
    });
    
    // Swipe gesture for changing weeks
    let xDown = null;
    let yDown = null;
    
    calendarGrid.addEventListener('touchstart', (e) => {
        const firstTouch = e.touches[0];
        xDown = firstTouch.clientX;
        yDown = firstTouch.clientY;
    });
    
    calendarGrid.addEventListener('touchend', (e) => {
        if (!xDown || !yDown) {
            return;
        }
        
        if (touchedEvent) {
            // Skip swipe handling if we were interacting with an event
            xDown = null;
            yDown = null;
            return;
        }
        
        const xUp = e.changedTouches[0].clientX;
        const yUp = e.changedTouches[0].clientY;
        
        const xDiff = xDown - xUp;
        const yDiff = yDown - yUp;
        
        // Detect horizontal swipe (must be greater than vertical movement to avoid confusion with scrolling)
        if (Math.abs(xDiff) > Math.abs(yDiff) && Math.abs(xDiff) > 100) {
            if (xDiff > 0) {
                // Swipe left -> Next week
                changeWeek(7);
            } else {
                // Swipe right -> Previous week
                changeWeek(-7);
            }
        }
        
        xDown = null;
        yDown = null;
    });
    
    // Double tap on an event to edit it
    calendarGrid.addEventListener('touchend', (e) => {
        const now = Date.now();
        const doubleTapDelay = 300; // ms
        
        if (now - lastTapTime < doubleTapDelay) {
            // Double tap detected
            const touchEnd = e.changedTouches[0];
            const elementUnderTouch = document.elementFromPoint(touchEnd.clientX, touchEnd.clientY);
            const eventElement = elementUnderTouch?.closest('.calendar-task');
            
            if (eventElement) {
                const eventId = parseInt(eventElement.getAttribute('data-event-id'));
                const event = calendarEvents.find(e => e.id === eventId);
                
                if (event) {
                    // Open edit dialog
                    openEventEditModal(event);
                    
                    // Haptic feedback
                    if (navigator.vibrate) {
                        navigator.vibrate([25, 25, 25]);
                    }
                }
            }
        }
        lastTapTime = now;
    });
    
    // Enhanced scrolling for mobile devices
    const calendarContainer = document.querySelector('.calendar-container');
    if (calendarContainer) {
        // Apply smooth scrolling behavior
        calendarContainer.style.scrollBehavior = 'smooth';
        
        // Add iOS-style momentum scrolling
        calendarContainer.style.WebkitOverflowScrolling = 'touch';
        
        // Add scroll optimization to prevent jank during scrolling
        calendarContainer.addEventListener('touchmove', function(e) {
            // Allow default scrolling but with optimizations
            if (isResizing || isMoving) {
                e.preventDefault(); // Prevent scrolling while resizing/moving
            } else {
                // Use passive listener for better performance
                // This is done via the attribute, no need to add anything here
            }
        }, { passive: !isResizing && !isMoving });
        
        // Add snapping behavior after scrolling finishes for better UX
        let scrollTimeout;
        calendarContainer.addEventListener('scroll', function() {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(function() {
                // Find the closest time cell to the viewport center
                const viewportHeight = calendarContainer.clientHeight;
                const scrollTop = calendarContainer.scrollTop;
                const viewportCenter = scrollTop + viewportHeight / 2;
                
                const timeCells = document.querySelectorAll('.time-cell');
                let closestCell = null;
                let minDistance = Infinity;
                
                timeCells.forEach(cell => {
                    const rect = cell.getBoundingClientRect();
                    const cellTop = rect.top;
                    const distance = Math.abs(cellTop - viewportCenter);
                    
                    if (distance < minDistance) {
                        minDistance = distance;
                        closestCell = cell;
                    }
                });
                
                // Snap to the closest cell if we found one and we're not in the middle of another interaction
                if (closestCell && !isResizing && !isMoving && !touchedEvent) {
                    closestCell.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 300);
        });
    }
}

// Function to show context menu
function showContextMenu(x, y, event) {
    // Remove any existing context menus
    const existingMenu = document.querySelector('.calendar-context-menu');
    if (existingMenu) {
        document.body.removeChild(existingMenu);
    }
    
    // Create context menu
    const contextMenu = document.createElement('div');
    contextMenu.className = 'calendar-context-menu';
    contextMenu.style.position = 'fixed';
    contextMenu.style.left = `${x}px`;
    contextMenu.style.top = `${y}px`;
    contextMenu.style.backgroundColor = 'var(--card-bg)';
    contextMenu.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.2)';
    contextMenu.style.borderRadius = '8px';
    contextMenu.style.padding = '8px 0';
    contextMenu.style.zIndex = '1000';
    contextMenu.style.minWidth = '200px';
    contextMenu.style.border = '1px solid rgba(0,0,0,0.1)';
    // Add a small animation
    contextMenu.animate([
        { opacity: 0, transform: 'scale(0.9)' },
        { opacity: 1, transform: 'scale(1)' }
    ], { 
        duration: 150,
        easing: 'ease-out',
        fill: 'forwards'
    });
    
    // Event title display
    const titleItem = document.createElement('div');
    titleItem.className = 'context-menu-title';
    titleItem.textContent = event.title;
    titleItem.style.padding = '8px 16px';
    titleItem.style.borderBottom = '1px solid var(--border-color)';
    titleItem.style.fontWeight = 'bold';
    titleItem.style.fontSize = '14px';
    titleItem.style.whiteSpace = 'nowrap';
    titleItem.style.overflow = 'hidden';
    titleItem.style.textOverflow = 'ellipsis';
    titleItem.style.maxWidth = '200px';
    contextMenu.appendChild(titleItem);
      // Edit option
    const editItem = document.createElement('div');
    editItem.className = 'context-menu-item';
    editItem.innerHTML = '<i class="fas fa-edit"></i> Edit';
    editItem.style.padding = '10px 16px';
    editItem.style.cursor = 'pointer';
    editItem.style.display = 'flex';
    editItem.style.alignItems = 'center';
    editItem.style.gap = '10px';
    editItem.style.fontSize = '14px';
    editItem.style.transition = 'all 0.15s ease';
      // Add icon style
    const editIcon = editItem.querySelector('i');
    if (editIcon) {
        editIcon.style.width = '18px';
        editIcon.style.textAlign = 'center';
        editIcon.style.color = 'var(--primary-color)';
    }
    
    editItem.addEventListener('mouseenter', () => {
        editItem.style.backgroundColor = 'rgba(var(--primary-color-rgb), 0.1)';
        editItem.style.paddingLeft = '20px';
    });
    
    editItem.addEventListener('mouseleave', () => {
        editItem.style.backgroundColor = '';
        editItem.style.paddingLeft = '16px';
    });
    
    editItem.addEventListener('click', () => {
        document.body.removeChild(contextMenu);
        editEvent(event.id);
    });
    
    contextMenu.appendChild(editItem);
      // Delete option
    const deleteItem = document.createElement('div');
    deleteItem.className = 'context-menu-item';
    deleteItem.innerHTML = '<i class="fas fa-trash"></i> Delete';
    deleteItem.style.padding = '10px 16px';
    deleteItem.style.cursor = 'pointer';
    deleteItem.style.color = '#e74c3c'; // Red color for delete
    deleteItem.style.display = 'flex';
    deleteItem.style.alignItems = 'center';
    deleteItem.style.gap = '10px';
    deleteItem.style.fontSize = '14px';
    deleteItem.style.transition = 'all 0.15s ease';
      // Add icon style
    const deleteIcon = deleteItem.querySelector('i');
    if (deleteIcon) {
        deleteIcon.style.width = '18px';
        deleteIcon.style.textAlign = 'center';
        deleteIcon.style.color = '#e74c3c';
    }
    
    deleteItem.addEventListener('mouseenter', () => {
        deleteItem.style.backgroundColor = 'rgba(231, 76, 60, 0.1)';
        deleteItem.style.paddingLeft = '20px';
    });
    
    deleteItem.addEventListener('mouseleave', () => {
        deleteItem.style.backgroundColor = '';
        deleteItem.style.paddingLeft = '16px';
    });
    
    deleteItem.addEventListener('click', () => {
        document.body.removeChild(contextMenu);
        if (confirm(`Delete event "${event.title}"?`)) {
            deleteEvent(event.id);
        }
    });
    
    contextMenu.appendChild(deleteItem);
    
    // Add to document
    document.body.appendChild(contextMenu);
    
    // Close menu when clicking outside
    function handleClickOutside(e) {
        if (!contextMenu.contains(e.target)) {
            document.body.removeChild(contextMenu);
            document.removeEventListener('click', handleClickOutside);
        }
    }
    
    // Use setTimeout to prevent immediate closing
    setTimeout(() => {
        document.addEventListener('click', handleClickOutside);
    }, 0);
    
    // Ensure the menu fits on the screen
    const menuRect = contextMenu.getBoundingClientRect();
    if (menuRect.right > window.innerWidth) {
        contextMenu.style.left = `${x - menuRect.width}px`;
    }
    
    if (menuRect.bottom > window.innerHeight) {
        contextMenu.style.top = `${y - menuRect.height}px`;
    }
}

// Create and update the current time indicator
function updateCurrentTimeIndicator() {
    // Remove any existing time indicators
    const existingIndicators = document.querySelectorAll('.current-time-indicator, .current-time-indicator-text, .current-time-dot');
    existingIndicators.forEach(indicator => indicator.remove());
    
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    // Only show indicator if it's within calendar view hours (8am-7pm)
    if (currentHour >= 8 && currentHour < 19) {
        // Find today's column
        const today = new Date();
        const todayFormatted = formatDate(today);
        const todayColumn = document.querySelector(`.day-column[data-date="${todayFormatted}"]`);
        
        if (todayColumn) {
            const dayContent = todayColumn.querySelector('.day-content');
            if (dayContent) {
                // Create the indicator element
                const indicator = document.createElement('div');
                indicator.className = 'current-time-indicator';
                
                // Add accessibility attributes
                indicator.setAttribute('role', 'mark');
                indicator.setAttribute('aria-label', `Current time: ${now.toLocaleTimeString()}`);
                
                // Calculate position: each hour is 60px tall
                const hoursSince8am = currentHour - 8;
                const minuteFraction = currentMinute / 60;
                const topPosition = (hoursSince8am + minuteFraction) * 60;
                
                indicator.style.top = `${topPosition}px`;
                
                // Add time text
                const timeText = document.createElement('div');
                timeText.className = 'current-time-indicator-text';
                timeText.textContent = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
                timeText.style.top = `${topPosition - 10}px`;
                
                // Create dot element
                const dot = document.createElement('div');
                dot.className = 'current-time-dot';
                dot.style.top = `${topPosition - 3}px`;
                dot.style.left = '-4px';
                
                // Add screen reader information (hidden from visual display)
                const srInfo = document.createElement('span');
                srInfo.className = 'sr-only';
                srInfo.textContent = `Current time is ${now.toLocaleTimeString()}`;
                dot.appendChild(srInfo);
                
                // Get all day columns to extend the line across the calendar
                const allColumns = document.querySelectorAll('.day-column');
                if (allColumns.length > 0) {
                    // Extend the line across all columns
                    const totalWidth = allColumns[allColumns.length - 1].getBoundingClientRect().right - 
                                      allColumns[0].getBoundingClientRect().left;
                    indicator.style.width = `${totalWidth}px`;
                }
                
                // Add elements to the DOM
                dayContent.appendChild(indicator);
                dayContent.appendChild(dot);
                dayContent.appendChild(timeText);
                
                // Add a subtle pulsing animation to help focus on current time
                indicator.style.animation = 'pulseTime 2s infinite';
                dot.style.animation = 'pulseTime 2s infinite';
                
                // Make the indicator focusable for accessibility
                indicator.tabIndex = 0;
                
                // Auto-scroll to the current time when it first appears
                if (!window.hasScrolledToCurrentTime) {
                    setTimeout(() => {
                        indicator.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        window.hasScrolledToCurrentTime = true;
                        
                        // Announce to screen readers
                        const announcement = document.createElement('div');
                        announcement.setAttribute('role', 'status');
                        announcement.setAttribute('aria-live', 'polite');
                        announcement.className = 'sr-only';
                        announcement.textContent = `Calendar showing current time: ${now.toLocaleTimeString()}`;
                        document.body.appendChild(announcement);
                        
                        // Remove after announcement
                        setTimeout(() => {
                            if (announcement.parentNode === document.body) {
                                document.body.removeChild(announcement);
                            }                        }, 3000);
                    }, 500);
                }
            }
        }
    }
}
