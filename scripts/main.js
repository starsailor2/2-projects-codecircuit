// Main JavaScript File
document.addEventListener('DOMContentLoaded', function() {    // Navigation functionality with smooth animations
    const navLinks = document.querySelectorAll('nav ul li a');
    const toolSections = document.querySelectorAll('.tool-section');
    
    // Function to update URL hash without scrolling
    function updateURLHash(hash) {
        const scrollPos = window.scrollY;
        window.location.hash = hash;
        window.scrollTo(0, scrollPos);
    }
    
    // Check for deep linking on page load
    function handleDeepLinking() {
        const hash = window.location.hash.substring(1);
        if (hash) {
            const targetLink = document.querySelector(`nav ul li a[data-tool="${hash}"]`);
            if (targetLink) {
                switchToSection(targetLink, hash, false);
            }
        }
    }
    
    // Function to handle section switching with animations
    function switchToSection(linkElement, toolId, updateHash = true) {
        // Update active nav link with animation
        navLinks.forEach(link => {
            link.classList.remove('active');
            link.style.transform = '';
        });
        linkElement.classList.add('active');
        linkElement.style.transform = 'scale(1.1)';
        setTimeout(() => { linkElement.style.transform = ''; }, 300);
        
        // Update URL hash if needed
        if (updateHash) {
            updateURLHash(toolId);
        }
        
        // Animate section transition with a subtle loading indicator
        const currentSection = document.querySelector('.tool-section.active');
        const targetSection = document.getElementById(toolId);
        
        // Show a brief loading indicator
        document.body.classList.add('loading');
        
        // Exit animation for current section
        if (currentSection) {
            currentSection.style.opacity = '0';
            currentSection.style.transform = 'translateY(-20px)';
        }
        
        // After a short delay, switch sections
        setTimeout(() => {
            // Hide all sections
            toolSections.forEach(section => {
                section.classList.remove('active');
                section.style.opacity = '0';
                section.style.transform = 'translateY(20px)';
            });
            
            // Show and animate the selected section
            targetSection.classList.add('active');
            
            // Entrance animation
            setTimeout(() => {
                targetSection.style.opacity = '1';
                targetSection.style.transform = 'translateY(0)';
                document.body.classList.remove('loading');
            }, 50);
        }, 200);
    }
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const toolId = this.getAttribute('data-tool');
            switchToSection(this, toolId);
        });
    });
    
    // Handle deep linking on page load
    document.addEventListener('DOMContentLoaded', handleDeepLinking);
    
    // Initialize local storage if needed
    function initLocalStorage() {
        // Tasks
        if (!localStorage.getItem('tasks')) {
            localStorage.setItem('tasks', JSON.stringify([]));
        }
        
        // Notes
        if (!localStorage.getItem('notes')) {
            localStorage.setItem('notes', JSON.stringify([]));
        }
        
        // Markdown notes
        if (!localStorage.getItem('markdownNotes')) {
            localStorage.setItem('markdownNotes', JSON.stringify([]));
        }
        
        // Calendar events
        if (!localStorage.getItem('calendarEvents')) {
            localStorage.setItem('calendarEvents', JSON.stringify([]));
        }
        
        // Snippets
        if (!localStorage.getItem('snippets')) {
            localStorage.setItem('snippets', JSON.stringify([]));
        }
    }      // Initialize the application
    function initApp() {
        initLocalStorage();
        
        // Initialize theme switcher
        if (typeof initThemeSwitcher === 'function') initThemeSwitcher();
        
        // Load initial data for each tool
        if (typeof loadTasks === 'function') loadTasks();
        if (typeof loadNotes === 'function') loadNotes();
        if (typeof initPomodoro === 'function') initPomodoro();
        if (typeof initMarkdown === 'function') initMarkdown();
        
        // Initialize components with debug logging
        console.log('Initializing calendar...');
        if (typeof initCalendar === 'function') {
            try {
                initCalendar();
                console.log('Calendar initialized successfully');
            } catch (e) {
                console.error('Calendar initialization failed:', e);
            }
        }
        
        console.log('Initializing timezone converter...');
        if (typeof initTimeZone === 'function') {
            try {
                initTimeZone();
                console.log('Timezone converter initialized successfully');
            } catch (e) {
                console.error('Timezone initialization failed:', e);
            }
        }
        
        if (typeof initJsonViewer === 'function') initJsonViewer();
          console.log('Initializing mindmap...');
        if (typeof initSimpleMindMap === 'function') {
            try {
                initSimpleMindMap();
                console.log('Simple mindmap initialized successfully');
            } catch (e) {
                console.error('Mindmap initialization failed:', e);
            }
        }
        
        if (typeof loadSnippets === 'function') loadSnippets();
        if (typeof initRegexTester === 'function') initRegexTester();
    }
    
    // Start the app
    initApp();
});
