// Markdown Notes Functionality
let markdownNotes = [];
let currentNoteId = null;

function initMarkdown() {
    // Load markdown parser
    const markdownInput = document.getElementById('markdown-input');
    const markdownOutput = document.getElementById('markdown-output');
    
    // Add event listeners
    markdownInput.addEventListener('input', updateMarkdownPreview);
    document.getElementById('save-markdown-btn').addEventListener('click', saveMarkdownNote);
    document.getElementById('clear-markdown-btn').addEventListener('click', clearMarkdownEditor);
    
    // Load saved notes
    markdownNotes = JSON.parse(localStorage.getItem('markdownNotes')) || [];
    
    // Initialize with a blank note
    clearMarkdownEditor();
}

function updateMarkdownPreview() {
    const input = document.getElementById('markdown-input');
    const output = document.getElementById('markdown-output');
    
    // Convert markdown to HTML
    output.innerHTML = marked.parse(input.value);
    
    // Apply syntax highlighting
    document.querySelectorAll('#markdown-output pre code').forEach((block) => {
        hljs.highlightElement(block);
    });
    
    // Update word count
    const wordCount = input.value.trim() === '' ? 0 : input.value.trim().split(/\s+/).length;
    document.getElementById('word-count').textContent = wordCount;
}

function saveMarkdownNote() {
    const input = document.getElementById('markdown-input');
    
    if (input.value.trim() === '') {
        alert('Cannot save an empty note!');
        return;
    }
    
    const noteTitle = input.value.split('\n')[0].replace(/^#+\s*/, '').substr(0, 30);
    
    if (currentNoteId === null) {
        // Create a new note
        const newNote = {
            id: Date.now(),
            title: noteTitle,
            content: input.value,
            lastModified: new Date().toISOString()
        };
        
        markdownNotes.push(newNote);
        currentNoteId = newNote.id;
    } else {
        // Update existing note
        const noteIndex = markdownNotes.findIndex(note => note.id === currentNoteId);
        if (noteIndex !== -1) {
            markdownNotes[noteIndex].title = noteTitle;
            markdownNotes[noteIndex].content = input.value;
            markdownNotes[noteIndex].lastModified = new Date().toISOString();
        }
    }
    
    localStorage.setItem('markdownNotes', JSON.stringify(markdownNotes));
    alert('Note saved successfully!');
}

function clearMarkdownEditor() {
    document.getElementById('markdown-input').value = '# New Note\n\nStart writing your markdown here...\n\n## Features\n\n- **Bold text** with double asterisks\n- *Italic text* with single asterisks\n- Lists like this one\n- [Links](https://example.com)\n- Code blocks with triple backticks\n\n```javascript\nfunction helloWorld() {\n  console.log("Hello, world!");\n}\n```';
    
    currentNoteId = null;
    updateMarkdownPreview();
}
