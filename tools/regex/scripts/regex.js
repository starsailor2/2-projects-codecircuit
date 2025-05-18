// Regex Tester Functionality
function initRegexTester() {
    const regexPattern = document.getElementById('regex-pattern');
    const regexFlags = document.getElementById('regex-flags');
    const testInput = document.getElementById('regex-test-input');
    
    // Add event listeners
    [regexPattern, regexFlags, testInput].forEach(el => {
        el.addEventListener('input', testRegex);
    });
    
    // Add sample data
    testInput.value = `Hello world! This is a sample text.
    
You can test regular expressions here.
For example:
- Email: john.doe@example.com
- Phone: (123) 456-7890
- URL: https://www.example.com
- Date: 2025-05-17

The regex pattern will highlight all matches in real-time.`;

    // Initial test
    setTimeout(testRegex, 500);
}

function testRegex() {
    const pattern = document.getElementById('regex-pattern').value;
    const flags = document.getElementById('regex-flags').value;
    const testInput = document.getElementById('regex-test-input').value;
    
    const highlightedEl = document.getElementById('regex-highlighted');
    const matchCountEl = document.getElementById('regex-match-count');
    const matchesListEl = document.getElementById('regex-matches-list');
    
    // Clear previous results with fade effect
    highlightedEl.style.opacity = '0';
    matchesListEl.style.opacity = '0';
    
    setTimeout(() => {
        highlightedEl.innerHTML = '';
        matchesListEl.innerHTML = '';
        
        if (!pattern) {
            highlightedEl.textContent = testInput;
            matchCountEl.textContent = 'No pattern defined';
            highlightedEl.style.opacity = '1';
            return;
        }
        
        try {
            const regex = new RegExp(pattern, flags);
            const matches = [...testInput.matchAll(regex)];
            
            if (matches.length === 0) {
                highlightedEl.textContent = testInput;
                matchCountEl.textContent = 'No matches found';
                highlightedEl.style.opacity = '1';
                return;
            }
            
            // Apply visual effect to match count
            matchCountEl.style.transform = 'scale(1.1)';
            matchCountEl.style.color = 'var(--primary-color)';
            
            // Show match count with animation
            matchCountEl.textContent = `${matches.length} match${matches.length > 1 ? 'es' : ''} found`;
            
            // Create highlighted content
            let lastIndex = 0;
            let highlightedContent = '';
            
            matches.forEach((match, i) => {
                const matchIndex = match.index;
                const matchText = match[0];
                const beforeMatch = testInput.substring(lastIndex, matchIndex);
                
                highlightedContent += escapeHtml(beforeMatch);
                highlightedContent += `<span class="regex-match">${escapeHtml(matchText)}</span>`;
                
                lastIndex = matchIndex + matchText.length;
                
                // Add to matches list with staggered animations
                const matchItem = document.createElement('div');
                matchItem.className = 'regex-match-item';
                matchItem.style.animationDelay = `${i * 50}ms`;
                
                let matchInfo = `Match ${i+1}: "${escapeHtml(matchText)}"`;
                
                if (match.length > 1) {
                    matchInfo += `<br>Groups: ${match.slice(1).map(g => `"${escapeHtml(g)}"`).join(', ')}`;
                }
                
                matchItem.innerHTML = matchInfo;
                matchesListEl.appendChild(matchItem);
            });
            
            // Add any remaining text
            highlightedContent += escapeHtml(testInput.substring(lastIndex));
            highlightedEl.innerHTML = highlightedContent;
            
            // Fade elements back in
            highlightedEl.style.opacity = '1';
            matchesListEl.style.opacity = '1';
            
            // Reset match count styling after animation
            setTimeout(() => {
                matchCountEl.style.transform = '';
                matchCountEl.style.color = '';
            }, 800);
            
        } catch (error) {
            highlightedEl.textContent = testInput;
            matchCountEl.textContent = `Error: ${error.message}`;
            matchCountEl.style.color = 'var(--danger-color)';
            highlightedEl.style.opacity = '1';
            
            // Reset error styling after a delay
            setTimeout(() => {
                matchCountEl.style.color = '';
            }, 3000);
        }
    }, 200);
}

function escapeHtml(text) {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;")
        .replace(/\n/g, "<br>");
}
