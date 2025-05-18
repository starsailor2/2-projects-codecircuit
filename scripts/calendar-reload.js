// Calendar reload script to ensure features are applied
document.addEventListener('DOMContentLoaded', function() {
    // Find the calendar tab link
    const calendarTab = document.querySelector('a[data-tool="calendar"]');
    if (calendarTab) {
        // Add a click handler to force refresh when this tab is clicked
        calendarTab.addEventListener('click', function() {
            // Short timeout to ensure the tab is visible before refreshing
            setTimeout(() => {
                // Re-render calendar to ensure new styles are applied
                if (typeof renderCalendar === 'function') {
                    renderCalendar();
                    console.log("Calendar re-rendered with enhanced features");
                }
            }, 100);
        });
    }
});
