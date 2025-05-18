// Theme Switcher Functionality
function initThemeSwitcher() {
    const themeToggle = document.getElementById('theme-toggle');
    
    // Check for saved theme preference or set based on user's system preference
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // Set initial theme based on saved preference or system preference
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
        document.documentElement.classList.add('dark-theme');
        themeToggle.checked = true;
        updateThemeText('Dark');
    } else {
        updateThemeText('Light');
    }
    
    // Add event listener for theme toggle
    themeToggle.addEventListener('change', function() {
        if (this.checked) {
            // Dark theme
            document.documentElement.classList.add('dark-theme');
            localStorage.setItem('theme', 'dark');
            updateThemeText('Dark');
        } else {
            // Light theme
            document.documentElement.classList.remove('dark-theme');
            localStorage.setItem('theme', 'light');
            updateThemeText('Light');
        }
    });
}

function updateThemeText(themeName) {
    const themeTexts = document.querySelectorAll('.theme-text');
    
    themeTexts.forEach((text, index) => {
        if (index === 0) {
            text.style.fontWeight = themeName === 'Light' ? 'bold' : 'normal';
        } else {
            text.style.fontWeight = themeName === 'Dark' ? 'bold' : 'normal';
        }
    });
}
