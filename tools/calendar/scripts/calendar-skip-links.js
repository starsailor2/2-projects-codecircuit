// Function to add accessibility skip link
function addAccessibilitySkipLink() {
    const calendarContainer = document.querySelector('.calendar-container');
    if (calendarContainer) {
        // Add a skip link for keyboard users
        const skipLink = document.createElement('a');
        skipLink.href = '#';
        skipLink.className = 'skip-link';
        skipLink.textContent = 'Skip to current day';
        skipLink.setAttribute('aria-label', 'Skip to current day in calendar');
        
        skipLink.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Find today's column
            const today = new Date();
            const todayFormatted = formatDate(today);
            const todayColumn = document.querySelector(`.day-column[data-date="${todayFormatted}"]`);
            
            if (todayColumn) {
                todayColumn.focus();
                
                // Scroll to current time
                const currentTimeIndicator = document.querySelector('.current-time-indicator');
                if (currentTimeIndicator) {
                    currentTimeIndicator.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            } else {
                // If today is not in view, go to current week
                currentWeekStart = getMonday(new Date());
                renderCalendar();
                
                // After rendering, focus on today
                setTimeout(() => {
                    const todayCol = document.querySelector('.day-column.today');
                    if (todayCol) {
                        todayCol.focus();
                    }
                }, 100);
            }
        });
        
        // Add to calendar container parent
        const calendarSection = calendarContainer.parentElement;
        calendarSection.insertBefore(skipLink, calendarContainer);
    }
}
