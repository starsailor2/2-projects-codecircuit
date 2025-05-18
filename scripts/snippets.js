// Snippet Manager Functionality
let snippets = [];
let selectedSnippet = null;

function loadSnippets() {
    // Load snippets from localStorage
    snippets = JSON.parse(localStorage.getItem('snippets')) || [];
    
    // Setup event listeners
    document.getElementById('save-snippet').addEventListener('click', saveSnippet);
    document.getElementById('clear-snippet').addEventListener('click', clearSnippetForm);
    document.getElementById('snippet-search').addEventListener('input', filterSnippets);
    document.getElementById('snippet-language-filter').addEventListener('change', filterSnippets);
    
    // Initial render
    renderSnippetsList();
}

function renderSnippetsList() {
    const snippetsList = document.getElementById('snippets-list');
    snippetsList.innerHTML = '';
    
    if (snippets.length === 0) {
        snippetsList.innerHTML = '<div class="no-snippets">No snippets found</div>';
        return;
    }
    
    snippets.forEach(snippet => {
        const snippetItem = document.createElement('div');
        snippetItem.className = 'snippet-item';
        snippetItem.setAttribute('data-id', snippet.id);
        
        const title = document.createElement('div');
        title.className = 'snippet-title';
        title.textContent = snippet.title;
        
        const language = document.createElement('div');
        language.className = 'snippet-language';
        language.textContent = snippet.language;
        
        snippetItem.appendChild(title);
        snippetItem.appendChild(language);
        
        snippetItem.addEventListener('click', () => {
            selectSnippet(snippet);
        });
        
        snippetsList.appendChild(snippetItem);
    });
}

function filterSnippets() {
    const searchQuery = document.getElementById('snippet-search').value.toLowerCase();
    const languageFilter = document.getElementById('snippet-language-filter').value;
    
    const filteredSnippets = snippets.filter(snippet => {
        const matchesSearch = snippet.title.toLowerCase().includes(searchQuery) || 
                              snippet.code.toLowerCase().includes(searchQuery);
        
        const matchesLanguage = languageFilter === 'all' || snippet.language === languageFilter;
        
        return matchesSearch && matchesLanguage;
    });
    
    const snippetsList = document.getElementById('snippets-list');
    snippetsList.innerHTML = '';
    
    if (filteredSnippets.length === 0) {
        snippetsList.innerHTML = '<div class="no-snippets">No snippets found</div>';
        return;
    }
    
    filteredSnippets.forEach(snippet => {
        const snippetItem = document.createElement('div');
        snippetItem.className = 'snippet-item';
        snippetItem.setAttribute('data-id', snippet.id);
        
        if (selectedSnippet && selectedSnippet.id === snippet.id) {
            snippetItem.classList.add('active');
        }
        
        const title = document.createElement('div');
        title.className = 'snippet-title';
        title.textContent = snippet.title;
        
        const language = document.createElement('div');
        language.className = 'snippet-language';
        language.textContent = snippet.language;
        
        snippetItem.appendChild(title);
        snippetItem.appendChild(language);
        
        snippetItem.addEventListener('click', () => {
            selectSnippet(snippet);
        });
        
        snippetsList.appendChild(snippetItem);
    });
}

function selectSnippet(snippet) {
    selectedSnippet = snippet;
    
    // Update active class
    document.querySelectorAll('.snippet-item').forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('data-id') === String(snippet.id)) {
            item.classList.add('active');
            // Ensure it's visible in the scroll view
            item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    });
    
    // Animate transition
    const editor = document.querySelector('.snippet-editor');
    editor.style.opacity = '0';
    editor.style.transform = 'translateY(20px)';
    
    setTimeout(() => {
        // Update form
        document.getElementById('snippet-title').value = snippet.title;
        document.getElementById('snippet-language').value = snippet.language;
        document.getElementById('snippet-code').value = snippet.code;
        
        // Animate back in
        editor.style.opacity = '1';
        editor.style.transform = 'translateY(0)';
    }, 200);
}

function saveSnippet() {
    const title = document.getElementById('snippet-title').value.trim();
    const language = document.getElementById('snippet-language').value;
    const code = document.getElementById('snippet-code').value.trim();
    
    if (!title || !code) {
        alert('Please enter a title and code for the snippet');
        return;
    }
    
    if (selectedSnippet) {
        // Update existing snippet
        const index = snippets.findIndex(s => s.id === selectedSnippet.id);
        
        if (index !== -1) {
            snippets[index].title = title;
            snippets[index].language = language;
            snippets[index].code = code;
            snippets[index].updatedAt = new Date().toISOString();
        }
    } else {
        // Create new snippet
        const newSnippet = {
            id: Date.now(),
            title,
            language,
            code,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        snippets.push(newSnippet);
        selectedSnippet = newSnippet;
    }
    
    // Save and update UI
    localStorage.setItem('snippets', JSON.stringify(snippets));
    renderSnippetsList();
    filterSnippets(); // Re-apply any current filters
}

function clearSnippetForm() {
    document.getElementById('snippet-title').value = '';
    document.getElementById('snippet-code').value = '';
    selectedSnippet = null;
    
    // Remove active selection
    document.querySelectorAll('.snippet-item').forEach(item => {
        item.classList.remove('active');
    });
}
