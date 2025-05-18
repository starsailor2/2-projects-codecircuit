// Script to run calendar unit tests
document.addEventListener('DOMContentLoaded', function() {
    // Add a test button to the calendar section
    const calendarSection = document.getElementById('calendar');
    if (calendarSection) {
        const testBtn = document.createElement('button');
        testBtn.id = 'calendar-test-button';
        testBtn.innerHTML = '<i class="fas fa-vial"></i> Run Tests';
        testBtn.style.marginLeft = '10px';
        testBtn.style.backgroundColor = 'var(--card-bg)';
        testBtn.style.border = '1px solid var(--border-color)';
        testBtn.style.borderRadius = '6px';
        testBtn.style.padding = '6px 12px';
        testBtn.style.cursor = 'pointer';
        
        // Add event listener
        testBtn.addEventListener('click', function() {
            runCalendarTests();
        });
        
        // Add to calendar header
        const calendarHeader = calendarSection.querySelector('.section-header');
        if (calendarHeader) {
            calendarHeader.appendChild(testBtn);
        }
    }
});

// Function to run tests and display results
function runCalendarTests() {
    console.log('Running calendar tests...');
    
    // Check if test function exists (loaded from calendar-tests.js)
    if (typeof runTests !== 'function') {
        alert('Test functions not loaded. Please check that calendar-tests.js is included.');
        return;
    }
    
    try {
        // Create modal dialog for test results
        const modalOverlay = document.createElement('div');
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
        modal.style.backgroundColor = 'var(--card-bg)';
        modal.style.padding = '20px';
        modal.style.borderRadius = '8px';
        modal.style.maxWidth = '600px';
        modal.style.width = '80%';
        modal.style.maxHeight = '80vh';
        modal.style.overflow = 'auto';
        
        const heading = document.createElement('h2');
        heading.textContent = 'Calendar Tests';
        heading.style.borderBottom = '1px solid var(--border-color)';
        heading.style.paddingBottom = '10px';
        
        const resultsDiv = document.createElement('div');
        resultsDiv.id = 'test-results';
        resultsDiv.style.marginTop = '15px';
        
        const closeButton = document.createElement('button');
        closeButton.textContent = 'Close';
        closeButton.style.marginTop = '20px';
        closeButton.style.padding = '8px 16px';
        closeButton.style.backgroundColor = 'var(--primary-color)';
        closeButton.style.color = 'white';
        closeButton.style.border = 'none';
        closeButton.style.borderRadius = '4px';
        closeButton.style.cursor = 'pointer';
        
        closeButton.addEventListener('click', () => {
            document.body.removeChild(modalOverlay);
        });
        
        modal.appendChild(heading);
        modal.appendChild(resultsDiv);
        modal.appendChild(closeButton);
        modalOverlay.appendChild(modal);
        document.body.appendChild(modalOverlay);
        
        // Capture console.log output
        const originalLog = console.log;
        const originalError = console.error;
        let testOutput = '';
        
        console.log = function(message) {
            testOutput += message + '<br>';
            originalLog.apply(console, arguments);
        };
        
        console.error = function(message) {
            testOutput += '<span style="color: red;">' + message + '</span><br>';
            originalError.apply(console, arguments);
        };
        
        // Run the tests
        const results = runTests();
        
        // Restore console
        console.log = originalLog;
        console.error = originalError;
        
        // Display results
        resultsDiv.innerHTML = `
            <p>Total Tests: ${results.total}</p>
            <p style="color: green;">Passed: ${results.passed}</p>
            <p style="color: red;">Failed: ${results.failed}</p>
            <h3>Test Log:</h3>
            <div style="margin-top: 10px; padding: 10px; border: 1px solid var(--border-color); 
                        background-color: var(--bg-color); border-radius: 4px; 
                        font-family: monospace; white-space: pre-wrap; overflow: auto;
                        max-height: 300px;">
                ${testOutput}
            </div>
        `;
        
    } catch (error) {
        alert('An error occurred while running tests: ' + error.message);
        console.error('Test error:', error);
    }
}
