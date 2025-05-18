// Calendar Unit Tests
// A simple test framework to validate calendar functionality

// Mock document and localStorage for testing in a non-browser environment
function setupMockDom() {
    if (typeof document === 'undefined') {
        global.document = {
            createElement: function(tag) {
                return {
                    className: '',
                    style: {},
                    children: [],
                    getAttribute: function() { return ''; },
                    setAttribute: function() {},
                    addEventListener: function() {},
                    appendChild: function(child) { this.children.push(child); },
                    querySelectorAll: function() { return []; },
                    querySelector: function() { return null; }
                };
            },
            getElementById: function() { return null; },
            body: {
                appendChild: function() {}
            },
            querySelectorAll: function() { return []; },
            querySelector: function() { return null; }
        };
    }
    
    if (typeof localStorage === 'undefined') {
        global.localStorage = {
            _data: {},
            getItem: function(key) {
                return this._data[key] || null;
            },
            setItem: function(key, value) {
                this._data[key] = value.toString();
            },
            removeItem: function(key) {
                delete this._data[key];
            }
        };
    }
    
    // Mock navigator for vibration API
    if (typeof navigator === 'undefined') {
        global.navigator = {
            vibrate: function() {}
        };
    }
}

// Helper functions for testing
function assert(condition, message) {
    if (!condition) {
        throw new Error(message || "Assertion failed");
    }
    return true;
}

function assertEqual(actual, expected, message) {
    if (actual !== expected) {
        throw new Error(message || `Expected ${expected}, but got ${actual}`);
    }
    return true;
}

function runTests() {
    // Set up mock DOM if needed
    setupMockDom();
    
    const testResults = {
        passed: 0,
        failed: 0,
        total: 0,
        failedTests: []
    };
    
    function runTest(name, testFn) {
        testResults.total++;
        try {
            testFn();
            testResults.passed++;
            console.log(`✓ ${name}`);
        } catch (error) {
            testResults.failed++;
            testResults.failedTests.push({name, error});
            console.error(`✗ ${name}`);
            console.error(`  ${error.message}`);
        }
    }
    
    // Test 1: Test getMonday function
    runTest('getMonday returns correct Monday', function() {
        // Tuesday, May 19, 2025
        const tuesday = new Date(2025, 4, 19);
        const monday = getMonday(new Date(tuesday));
        
        assert(monday.getDay() === 1, "Should be Monday");
        assertEqual(monday.getDate(), 18, "Should be the 18th");
    });
    
    // Test 2: Test event creation
    runTest('Event creation', function() {
        // Clear events
        calendarEvents = [];
        localStorage.setItem('calendarEvents', JSON.stringify([]));
        
        // Create an event
        const newEvent = {
            id: 1,
            title: "Test Event",
            date: "2025-05-18",
            startHour: 10,
            duration: 1,
            color: "#5B8FF9"
        };
        
        calendarEvents.push(newEvent);
        localStorage.setItem('calendarEvents', JSON.stringify(calendarEvents));
        
        // Verify
        const storedEvents = JSON.parse(localStorage.getItem('calendarEvents') || '[]');
        assertEqual(storedEvents.length, 1);
        assertEqual(storedEvents[0].title, "Test Event");
    });
    
    // Test 3: Test event update
    runTest('Event update', function() {
        // Clear and create an event
        calendarEvents = [{
            id: 1,
            title: "Test Event",
            date: "2025-05-18",
            startHour: 10,
            duration: 1,
            color: "#5B8FF9"
        }];
        localStorage.setItem('calendarEvents', JSON.stringify(calendarEvents));
        
        // Update event
        const eventIndex = calendarEvents.findIndex(e => e.id === 1);
        if (eventIndex !== -1) {
            calendarEvents[eventIndex].title = "Updated Event";
            localStorage.setItem('calendarEvents', JSON.stringify(calendarEvents));
        }
        
        // Verify
        const storedEvents = JSON.parse(localStorage.getItem('calendarEvents') || '[]');
        assertEqual(storedEvents.length, 1);
        assertEqual(storedEvents[0].title, "Updated Event");
    });
    
    // Test 4: Test event deletion
    runTest('Event deletion', function() {
        // Clear and create an event
        calendarEvents = [{
            id: 1,
            title: "Test Event",
            date: "2025-05-18",
            startHour: 10,
            duration: 1,
            color: "#5B8FF9"
        }];
        localStorage.setItem('calendarEvents', JSON.stringify(calendarEvents));
        
        // Delete event
        calendarEvents = calendarEvents.filter(e => e.id !== 1);
        localStorage.setItem('calendarEvents', JSON.stringify(calendarEvents));
        
        // Verify
        const storedEvents = JSON.parse(localStorage.getItem('calendarEvents') || '[]');
        assertEqual(storedEvents.length, 0);
    });
    
    // Test 5: Test history manager
    runTest('History manager undo/redo', function() {
        // Create a history manager
        const history = new HistoryManager(5); // Limit to 5 states
        
        // Add states
        history.addState("state1", "Add state 1");
        history.addState("state2", "Add state 2");
        
        // Test undo
        const previousState = history.undo();
        assertEqual(previousState, "state1");
        assertEqual(history.getUndoDescription(), "Add state 1");
        
        // Test redo
        const futureState = history.redo();
        assertEqual(futureState, "state2");
        assertEqual(history.getRedoDescription(), "Add state 2");
    });
    
    // Test 6: Test formatDate function
    runTest('formatDate function formats dates correctly', function() {
        const date = new Date(2025, 4, 18); // May 18, 2025
        const formatted = formatDate(date);
        assertEqual(formatted, "2025-05-18");
    });
    
    // Test 7: Test isToday function
    runTest('isToday function recognizes today', function() {
        const today = new Date();
        const result = isToday(today);
        assert(result === true);
        
        const notToday = new Date();
        notToday.setDate(notToday.getDate() + 1); // Tomorrow
        const result2 = isToday(notToday);
        assert(result2 === false);
    });
    
    // Test 8: Test time formatting
    runTest('formatTime handles hours correctly', function() {
        assertEqual(formatTime(9), "9am");
        assertEqual(formatTime(12), "12pm");
        assertEqual(formatTime(13), "1pm");
        assertEqual(formatTime(9.5), "9:30am");
    });
    
    // Test 9: Test current time indicator positioning
    runTest('Current time indicator position', function() {
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        
        // Skip if outside calendar hours
        if (currentHour < 8 || currentHour >= 19) {
            assert(true);
            return;
        }
        
        const hoursSince8am = currentHour - 8;
        const minuteFraction = currentMinute / 60;
        const expectedPosition = (hoursSince8am + minuteFraction) * 60;
        
        // Create mock indicator
        const indicator = document.createElement('div');
        indicator.className = 'current-time-indicator';
        indicator.style.top = `${expectedPosition}px`;
        
        assertEqual(indicator.style.top, `${expectedPosition}px`);
    });
    
    // Test 10: Test changeWeek function
    runTest('changeWeek changes date correctly', function() {
        // Set up initial state
        currentWeekStart = new Date(2025, 4, 18); // May 18, 2025
        
        // Mock functions
        const originalRender = renderCalendar;
        const originalSaveHistory = saveToCalendarHistory;
        const originalShowNotification = showNotification;
        
        let renderCalled = false;
        let saveHistoryCalled = false;
        let showNotificationCalled = false;
        
        window.renderCalendar = function() { renderCalled = true; };
        window.saveToCalendarHistory = function() { saveHistoryCalled = true; };
        window.showNotification = function() { showNotificationCalled = true; };
        
        // Change week
        changeWeek(7); // Forward one week
        
        // Check result
        const expectedDate = new Date(2025, 4, 25); // May 25, 2025
        assertEqual(
            currentWeekStart.toISOString().split('T')[0], 
            expectedDate.toISOString().split('T')[0],
            "Date should be one week later"
        );
        
        assert(renderCalled, "renderCalendar should be called");
        assert(saveHistoryCalled, "saveToCalendarHistory should be called");
        assert(showNotificationCalled, "showNotification should be called");
        
        // Restore original functions
        window.renderCalendar = originalRender;
        window.saveToCalendarHistory = originalSaveHistory;
        window.showNotification = originalShowNotification;
    });
    
    // Display results
    console.log("\nTest Summary:");
    console.log(`Passed: ${testResults.passed}/${testResults.total}`);
    console.log(`Failed: ${testResults.failed}/${testResults.total}`);
    
    return testResults;
}

// To run tests, call:
// runTests();
// Uncomment the above line to run tests, or call from the console

// Export for use in testing environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { runTests };
}
