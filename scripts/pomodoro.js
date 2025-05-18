// Pomodoro Timer Functionality
let timer;
let minutes = 25;
let seconds = 0;
let isRunning = false;
let currentMode = 'pomodoro';
let originalMinutes = 25; // To keep track of the starting minutes for the dial
let totalSeconds;
let remainingSeconds;

const modes = {
    pomodoro: { minutes: 25, seconds: 0 },
    shortBreak: { minutes: 5, seconds: 0 },
    longBreak: { minutes: 15, seconds: 0 }
};

function initPomodoro() {
    document.getElementById('start-timer-btn').addEventListener('click', startTimer);
    document.getElementById('pause-timer-btn').addEventListener('click', pauseTimer);
    document.getElementById('reset-timer-btn').addEventListener('click', resetTimer);
    document.getElementById('pomodoro-btn').addEventListener('click', () => changeMode('pomodoro'));
    document.getElementById('short-break-btn').addEventListener('click', () => changeMode('shortBreak'));
    document.getElementById('long-break-btn').addEventListener('click', () => changeMode('longBreak'));
    document.getElementById('set-custom-time').addEventListener('click', setCustomTime);
    
    // Add preset button event listeners
    const presetButtons = document.querySelectorAll('.preset-btn');
    presetButtons.forEach(button => {
        button.addEventListener('click', () => {
            const presetMinutes = parseInt(button.getAttribute('data-minutes'));
            setCustomTimeValue(presetMinutes);
            
            // Update active preset button
            document.querySelectorAll('.preset-btn').forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
        });
    });
    
    // Set initial values
    totalSeconds = minutes * 60 + seconds;
    remainingSeconds = totalSeconds;
    
    // Initialize the timer display and circle
    updateTimerDisplay();
    updateTimerCircle();
}

function startTimer() {
    if (isRunning) return;
    
    isRunning = true;
    document.getElementById('start-timer-btn').disabled = true;
    document.getElementById('pause-timer-btn').disabled = false;
    
    timer = setInterval(() => {
        if (seconds === 0) {
            if (minutes === 0) {
                clearInterval(timer);
                isRunning = false;
                document.getElementById('start-timer-btn').disabled = false;
                document.getElementById('pause-timer-btn').disabled = true;
                
                // Play sound
                const audio = new Audio('https://soundbible.com/mp3/service-bell_daniel_simion.mp3');
                audio.play().catch(() => console.log('Audio play was prevented'));
                
                // Reset the timer circle
                remainingSeconds = totalSeconds;
                updateTimerCircle();
                
                return;
            }
            minutes--;
            seconds = 59;
        } else {
            seconds--;
        }
        
        remainingSeconds = minutes * 60 + seconds;
        updateTimerDisplay();
        updateTimerCircle();
    }, 1000);
}

function pauseTimer() {
    clearInterval(timer);
    isRunning = false;
    document.getElementById('start-timer-btn').disabled = false;
    document.getElementById('pause-timer-btn').disabled = true;
}

function resetTimer() {
    clearInterval(timer);
    isRunning = false;
    document.getElementById('start-timer-btn').disabled = false;
    document.getElementById('pause-timer-btn').disabled = true;
    
    // Instead of resetting to mode default, reset to the original minutes set by the user
    minutes = originalMinutes;
    seconds = 0;
    
    // Don't call setTimerByMode as it would override with default values
    // Just update the totalSeconds and remainingSeconds
    totalSeconds = minutes * 60 + seconds;
    remainingSeconds = totalSeconds;
    
    updateTimerDisplay();
    updateTimerCircle();
}

function changeMode(mode) {
    if (isRunning) {
        pauseTimer();
    }
    
    // Update UI
    document.getElementById('pomodoro-btn').classList.remove('active-mode');
    document.getElementById('short-break-btn').classList.remove('active-mode');
    document.getElementById('long-break-btn').classList.remove('active-mode');
    
    if (mode === 'pomodoro') {
        document.getElementById('pomodoro-btn').classList.add('active-mode');
    } else if (mode === 'shortBreak') {
        document.getElementById('short-break-btn').classList.add('active-mode');
    } else if (mode === 'longBreak') {
        document.getElementById('long-break-btn').classList.add('active-mode');
    }
    
    currentMode = mode;
    setTimerByMode(mode); // This will reset to the default time for the selected mode
    
    // Reset preset button active states
    document.querySelectorAll('.preset-btn').forEach(btn => btn.classList.remove('active'));
    
    // Update timer circle
    updateTimerDisplay();
    updateTimerCircle();
}

function setTimerByMode(mode) {
    minutes = modes[mode].minutes;
    seconds = modes[mode].seconds;
    originalMinutes = minutes; // Update originalMinutes to the mode's default minutes
    totalSeconds = minutes * 60 + seconds;
    remainingSeconds = totalSeconds;
}

function setCustomTime() {
    const customMinutesInput = document.getElementById('custom-minutes');
    const customMinutes = parseInt(customMinutesInput.value);
    
    if (isNaN(customMinutes) || customMinutes < 1 || customMinutes > 120) {
        alert('Please enter a valid time between 1 and 120 minutes.');
        return;
    }
    
    setCustomTimeValue(customMinutes);
    customMinutesInput.value = '';
    
    // Reset preset button active states
    document.querySelectorAll('.preset-btn').forEach(btn => btn.classList.remove('active'));
}

function setCustomTimeValue(customMinutes) {
    if (isRunning) {
        pauseTimer();
    }
    
    minutes = customMinutes;
    seconds = 0;
    originalMinutes = customMinutes; // Store the custom minutes for reset functionality
    totalSeconds = minutes * 60;
    remainingSeconds = totalSeconds;
    
    // Now when reset is clicked, it will go back to this custom time
    updateTimerDisplay();
    updateTimerCircle();
}

function updateTimerDisplay() {
    document.getElementById('minutes').textContent = minutes.toString().padStart(2, '0');
    document.getElementById('seconds').textContent = seconds.toString().padStart(2, '0');
}

function updateTimerCircle() {
    const pathRemaining = document.querySelector('.timer-path-remaining');
    const circumference = 2 * Math.PI * 140; // 2πr (updated to new radius of 140)
    
    const fraction = remainingSeconds / totalSeconds;
    const dashoffset = circumference * (1 - fraction);
    
    // Update the stroke dasharray and dashoffset
    pathRemaining.style.strokeDasharray = `${circumference} ${circumference}`;
    pathRemaining.style.strokeDashoffset = dashoffset;
    
    // Change color based on the remaining time
    if (fraction > 0.66) {
        pathRemaining.style.stroke = 'var(--primary-color)';
    } else if (fraction > 0.33) {
        pathRemaining.style.stroke = 'var(--warning-color)';
    } else {
        pathRemaining.style.stroke = 'var(--danger-color)';
    }
}
