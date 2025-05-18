// Time Zone Converter Functionality
const timeZones = [
    { id: 'UTC', name: 'UTC (Coordinated Universal Time)' },
    { id: 'America/New_York', name: 'New York (EST/EDT)' },
    { id: 'America/Los_Angeles', name: 'Los Angeles (PST/PDT)' },
    { id: 'America/Chicago', name: 'Chicago (CST/CDT)' },
    { id: 'Europe/London', name: 'London (GMT/BST)' },
    { id: 'Europe/Paris', name: 'Paris (CET/CEST)' },
    { id: 'Europe/Berlin', name: 'Berlin (CET/CEST)' },
    { id: 'Asia/Tokyo', name: 'Tokyo (JST)' },
    { id: 'Asia/Shanghai', name: 'Shanghai (CST)' },
    { id: 'Asia/Kolkata', name: 'India (IST)' },
    { id: 'Australia/Sydney', name: 'Sydney (AEST/AEDT)' },
    { id: 'Pacific/Auckland', name: 'Auckland (NZST/NZDT)' }
];

// Initialize the Time Zone Converter
function initTimeZone() {
    console.log('Initializing timezone converter...');
    
    const fromSelect = document.getElementById('from-timezone');
    const toSelect = document.getElementById('to-timezone');
    const timeInput = document.getElementById('time-input');
    
    if (!fromSelect || !toSelect) {
        console.error('Timezone selects not found:', {fromSelect, toSelect});
        return;
    }
    
    // Clear existing options first
    fromSelect.innerHTML = '';
    toSelect.innerHTML = '';
    
    // Make sure elements are visible and properly styled
    fromSelect.style.display = 'block';
    toSelect.style.display = 'block';
    fromSelect.style.width = '100%';
    toSelect.style.width = '100%';
    
    // Apply additional styles to help with dark mode display
    fromSelect.style.backgroundColor = 'var(--input-bg)';
    toSelect.style.backgroundColor = 'var(--input-bg)';
    fromSelect.style.color = 'var(--text-color)';
    toSelect.style.color = 'var(--text-color)';
    timeInput.style.backgroundColor = 'var(--input-bg)';
    timeInput.style.color = 'var(--text-color)';
    
    // Populate timezone dropdowns
    console.log('Adding timezone options...');
    timeZones.forEach(tz => {
        const fromOption = document.createElement('option');
        fromOption.value = tz.id;
        fromOption.textContent = tz.name;
        fromSelect.appendChild(fromOption);
        
        const toOption = document.createElement('option');
        toOption.value = tz.id;
        toOption.textContent = tz.name;
        toSelect.appendChild(toOption);
    });
      // Set default values
    const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    try {
        fromSelect.value = userTimeZone || 'UTC';
    } catch (e) {
        // If the user's timezone is not in our list, default to UTC
        fromSelect.value = 'UTC';
    }
    // Set to timezone to something different than the from timezone
    if (fromSelect.value === 'UTC') {
        toSelect.value = 'America/New_York';
    } else {
        toSelect.value = 'UTC';
    }
    
    // Set default time to current time
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    
    document.getElementById('time-input').value = `${year}-${month}-${day}T${hours}:${minutes}`;
    
    // Add event listener to convert button
    document.getElementById('convert-time-btn').addEventListener('click', convertTime);
    
    // Add event listener for swap icon
    const swapIcon = document.querySelector('.timezone-equals');
    swapIcon.innerHTML = '<i class="fas fa-exchange-alt"></i>'; // Change icon to exchange
    swapIcon.style.cursor = 'pointer';
    swapIcon.title = "Swap timezones";
    swapIcon.addEventListener('click', swapTimeZones);
    
    // Add keyboard support for Enter key
    document.getElementById('time-input').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            convertTime();
        }
    });    // Add event listeners for timezone selects to prevent duplicate selection and auto-convert
    fromSelect.addEventListener('change', (e) => {
        // If both dropdowns are set to the same value, change the other one
        if (fromSelect.value === toSelect.value) {
            // Find an alternative timezone option (first one that's different)
            const alternativeOption = timeZones.find(tz => tz.id !== fromSelect.value);
            if (alternativeOption) {
                toSelect.value = alternativeOption.id;
                showNotification('Selected different destination timezone to compare', 'info');
            }
        }
        convertTime();
    });
    
    toSelect.addEventListener('change', (e) => {
        // If both dropdowns are set to the same value, change the other one
        if (toSelect.value === fromSelect.value) {
            // Find an alternative timezone option (first one that's different)
            const alternativeOption = timeZones.find(tz => tz.id !== toSelect.value);
            if (alternativeOption) {
                fromSelect.value = alternativeOption.id;
                showNotification('Selected different source timezone to compare', 'info');
            }
        }
        convertTime();
    });
    
    // Initial conversion
    setTimeout(convertTime, 500);
}

// Convert time between timezones
function convertTime() {
    const timeInput = document.getElementById('time-input').value;
    const fromTimezone = document.getElementById('from-timezone').value;
    const toTimezone = document.getElementById('to-timezone').value;
    const output = document.getElementById('time-output');
    
    // Basic validation
    if (!timeInput) {
        showNotification('Please enter a time', 'error');
        return;
    }
    
    try {
        // Parse input date
        const inputDate = new Date(timeInput);
        if (isNaN(inputDate.getTime())) {
            throw new Error('Invalid date input');
        }
        
        // Format in source timezone
        const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone: fromTimezone,
            year: 'numeric',
            month: 'numeric',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
            second: 'numeric',
            hour12: false
        });
        
        // Get parts of the date in source timezone
        const parts = formatter.formatToParts(inputDate);
        const dateObj = {};
        parts.forEach(part => {
            if (part.type !== 'literal') {
                dateObj[part.type] = part.value;
            }
        });
        
        // Create a UTC date representing the time in the source timezone
        const sourceDate = new Date(Date.UTC(
            parseInt(dateObj.year),
            parseInt(dateObj.month) - 1,
            parseInt(dateObj.day),
            parseInt(dateObj.hour),
            parseInt(dateObj.minute),
            parseInt(dateObj.second || 0)
        ));
          // Format the result in the target timezone
        const result = new Intl.DateTimeFormat('en-US', {
            timeZone: toTimezone,
            weekday: 'short',
            year: 'numeric', 
            month: 'short',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
            timeZoneName: 'short'
        }).format(sourceDate);
          // Calculate time difference between the two timezones
        const timeDiff = calculateTimeDifference(fromTimezone, toTimezone);
        const formattedResult = `${result} (${timeDiff})`;
          // Create a separate time difference display element if it doesn't exist
        let timeDiffDisplay = document.getElementById('time-diff-display');
        if (!timeDiffDisplay) {
            timeDiffDisplay = document.createElement('div');
            timeDiffDisplay.id = 'time-diff-display';
            
            const outputParent = output.parentElement;
            outputParent.appendChild(timeDiffDisplay);
        }
        
        // Display time difference
        timeDiffDisplay.textContent = `Time Difference: ${timeDiff}`;
        
        // Display the result with a nice animation
        const equalsIcon = document.querySelector('.timezone-equals');
        equalsIcon.style.transform = 'rotate(180deg)';
        equalsIcon.style.backgroundColor = 'var(--primary-color)';
        
        // Update the output with animation
        output.classList.add('highlight');
        output.value = result;
        
        // Reset the animations after a delay
        setTimeout(() => {
            equalsIcon.style.transform = '';
            equalsIcon.style.backgroundColor = '';
            output.classList.remove('highlight');
        }, 500);
        
    } catch (error) {
        console.error('Error converting time:', error);
        output.value = '';
        showNotification('Error converting time: ' + error.message, 'error');
    }
}

// Swap from and to timezones
function swapTimeZones() {
    const fromSelect = document.getElementById('from-timezone');
    const toSelect = document.getElementById('to-timezone');
    
    // Don't swap if both are the same (shouldn't happen with our new logic, but just in case)
    if (fromSelect.value === toSelect.value) {
        const alternativeOption = timeZones.find(tz => tz.id !== fromSelect.value);
        if (alternativeOption) {
            toSelect.value = alternativeOption.id;
            showNotification('Cannot swap identical timezones. Changed to alternative timezone.', 'info');
            convertTime();
            return;
        }
    }
    
    // Swap the values
    const tempValue = fromSelect.value;
    fromSelect.value = toSelect.value;
    toSelect.value = tempValue;
    
    // Animate the swap
    const fromLabel = fromSelect.previousElementSibling;
    const toLabel = toSelect.previousElementSibling;
    
    if (fromLabel && toLabel) {
        fromLabel.classList.add('swap-animation');
        toLabel.classList.add('swap-animation');
        
        setTimeout(() => {
            fromLabel.classList.remove('swap-animation');
            toLabel.classList.remove('swap-animation');
        }, 500);
    }
    
    // If there's a result, trigger conversion again
    convertTime();
    
    // Show notification
    showNotification('Timezones swapped', 'info');
}

// Calculate the time difference between two timezones
function calculateTimeDifference(fromTimezone, toTimezone) {
    // Create a reference date (now)
    const now = new Date();
    
    // Create formatters for both timezones that include hours and minutes
    const fromFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: fromTimezone,
        hour: 'numeric',
        minute: 'numeric',
        hour12: false
    });
    
    const toFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: toTimezone,
        hour: 'numeric',
        minute: 'numeric',
        hour12: false
    });
    
    // Get the time parts
    const fromParts = fromFormatter.formatToParts(now);
    const toParts = toFormatter.formatToParts(now);
    
    // Extract hours and minutes
    let fromHour, fromMinute, toHour, toMinute;
    
    fromParts.forEach(part => {
        if (part.type === 'hour') fromHour = parseInt(part.value);
        if (part.type === 'minute') fromMinute = parseInt(part.value);
    });
    
    toParts.forEach(part => {
        if (part.type === 'hour') toHour = parseInt(part.value);
        if (part.type === 'minute') toMinute = parseInt(part.value);
    });
    
    // Convert to minutes for easier calculation
    const fromTotalMinutes = fromHour * 60 + fromMinute;
    const toTotalMinutes = toHour * 60 + toMinute;
    
    // Calculate the difference (considering day boundaries)
    let diffMinutes = toTotalMinutes - fromTotalMinutes;
    
    // Adjust for day boundary crossings
    if (diffMinutes < -720) { // More than -12 hours, cross to next day
        diffMinutes += 1440;  // Add 24 hours
    } else if (diffMinutes > 720) { // More than +12 hours, cross to previous day
        diffMinutes -= 1440;  // Subtract 24 hours
    }
    
    // Convert to hours and remaining minutes
    const diffHours = Math.floor(Math.abs(diffMinutes) / 60);
    const remainingMinutes = Math.abs(diffMinutes) % 60;    // Format the result
    const sign = diffMinutes < 0 ? '-' : '+';
    
    // Create a more descriptive time difference message
    if (diffHours === 0 && remainingMinutes === 0) {
        return 'Same time zone';
    } else if (diffHours === 0) {
        return `${sign}${remainingMinutes} minutes`;
    } else if (remainingMinutes === 0) {
        if (diffHours === 1) {
            return `${sign}${diffHours} hour`;
        } else {
            return `${sign}${diffHours} hours`;
        }
    } else {
        if (diffHours === 1) {
            return `${sign}${diffHours} hour and ${remainingMinutes} minutes`;
        } else {
            return `${sign}${diffHours} hours and ${remainingMinutes} minutes`;
        }
    }
}

// Show notification
function showNotification(message, type = 'info') {
    // Check if notification container exists
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