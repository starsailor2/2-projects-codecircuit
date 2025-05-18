// Sticky Notes Functionality
let notes = [];
let draggedNote = null;
let dragOffsetX = 0;
let dragOffsetY = 0;
let noteZIndexCounter = 10;

function loadNotes() {
    notes = JSON.parse(localStorage.getItem('notes')) || [];
    renderNotes();
    
    // Add event listeners
    document.getElementById('add-note-btn').addEventListener('click', addNote);
    
    // Initialize keyboard shortcuts
    initNoteKeyboardShortcuts();
    
    // Initialize shortcuts tooltip
    initShortcutsTooltip();
    
    // Handle drag events on container
    const notesContainer = document.getElementById('notes-container');
    notesContainer.addEventListener('mouseup', () => {
        draggedNote = null;
    });
    
    notesContainer.addEventListener('mousemove', (e) => {
        if (draggedNote) {
            e.preventDefault();
            
            const noteElement = document.getElementById(`note-${draggedNote}`);
            
            // Add dragging class for visual feedback
            if (!noteElement.classList.contains('dragging')) {
                noteElement.classList.add('dragging');
                // Play a subtle sound effect for dragging feedback
                playNoteSound('drag');
            }
            
            const rect = notesContainer.getBoundingClientRect();
            
            const x = Math.max(0, Math.min(e.clientX - rect.left - dragOffsetX, rect.width - noteElement.offsetWidth));
            const y = Math.max(0, Math.min(e.clientY - rect.top - dragOffsetY, rect.height - noteElement.offsetHeight));
            
            noteElement.style.left = `${x}px`;
            noteElement.style.top = `${y}px`;
            
            // Add shadow based on movement speed for more realistic effect
            const speed = Math.sqrt(Math.pow(e.movementX, 2) + Math.pow(e.movementY, 2));
            const shadowBlur = Math.min(24, 12 + speed);
            noteElement.style.boxShadow = `0 ${shadowBlur}px ${shadowBlur * 1.5}px rgba(0, 0, 0, 0.2)`;
            
            // Update note position in array
            const noteIndex = notes.findIndex(note => note.id === draggedNote);
            if (noteIndex !== -1) {
                notes[noteIndex].x = x;
                notes[noteIndex].y = y;
                
                // Throttle localStorage updates to improve performance
                if (!notesContainer.saveTimeout) {
                    notesContainer.saveTimeout = setTimeout(() => {
                        localStorage.setItem('notes', JSON.stringify(notes));
                        notesContainer.saveTimeout = null;
                    }, 500);
                }
            }
        }
    });
    
    notesContainer.addEventListener('mouseup', () => {
        // Remove dragging class when drag ends
        if (draggedNote) {
            const noteElement = document.getElementById(`note-${draggedNote}`);
            if (noteElement) {
                noteElement.classList.remove('dragging');
                // Reset shadow to default
                noteElement.style.boxShadow = '';
                // Save position in localStorage
                localStorage.setItem('notes', JSON.stringify(notes));
                // Play a sound effect for drop
                playNoteSound('drop');
            }
        }
        draggedNote = null;
    });
    
    // Also handle case when mouse leaves the container
    notesContainer.addEventListener('mouseleave', () => {
        if (draggedNote) {
            const noteElement = document.getElementById(`note-${draggedNote}`);
            if (noteElement) {
                noteElement.classList.remove('dragging');
                noteElement.style.boxShadow = '';
                // Save position
                localStorage.setItem('notes', JSON.stringify(notes));
            }
            draggedNote = null;
        }
    });
}

// Play sound effects for better feedback
function playNoteSound(action) {
    // Create audio context only when needed to respect browser autoplay policies
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return; // Browser doesn't support Web Audio API
    
    const audioCtx = new AudioContext();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    switch(action) {
        case 'create':
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
            gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
            oscillator.start();
            oscillator.stop(audioCtx.currentTime + 0.3);
            break;
        case 'delete':
            oscillator.type = 'triangle';
            oscillator.frequency.setValueAtTime(392.00, audioCtx.currentTime); // G4
            oscillator.frequency.exponentialRampToValueAtTime(196.00, audioCtx.currentTime + 0.3); // G3
            gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
            oscillator.start();
            oscillator.stop(audioCtx.currentTime + 0.3);
            break;
        case 'drag':
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(261.63, audioCtx.currentTime); // C4
            gainNode.gain.setValueAtTime(0.01, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
            oscillator.start();
            oscillator.stop(audioCtx.currentTime + 0.1);
            break;
        case 'drop':
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(329.63, audioCtx.currentTime); // E4
            gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);
            oscillator.start();
            oscillator.stop(audioCtx.currentTime + 0.2);
            break;
    }
}

function addNote() {
    const colorSelect = document.getElementById('note-color');
    const notesContainer = document.getElementById('notes-container');
    
    // Create a visual effect on the add button
    const addButton = document.getElementById('add-note-btn');
    addButton.classList.add('active');
    setTimeout(() => addButton.classList.remove('active'), 300);
    
    // Calculate a good position for the new note
    // Offset each new note slightly to create a staggered effect
    const noteCount = notes.length;
    const offsetX = (noteCount % 5) * 30 + 30; // Increased spacing
    const offsetY = (noteCount % 5) * 30 + 30;
    
    // Add a slight random rotation for a more natural look
    const rotation = Math.random() * 6 - 3; // -3 to +3 degrees
    
    // Increment z-index counter for new notes
    noteZIndexCounter++;
    
    const newNote = {
        id: Date.now(),
        content: '',
        color: colorSelect.value,
        x: offsetX,
        y: offsetY,
        rotation: rotation,
        zIndex: noteZIndexCounter
    };
    
    notes.push(newNote);
    localStorage.setItem('notes', JSON.stringify(notes));
    
    renderNote(newNote);
    
    // Play creation sound
    playNoteSound('create');
    
    // Focus on the new note
    setTimeout(() => {
        const noteElement = document.getElementById(`note-${newNote.id}`);
        const textArea = noteElement.querySelector('.note-content');
        textArea.focus();
        
        // Make sure all other notes have lower z-index
        document.querySelectorAll('.sticky-note').forEach(note => {
            if (note.id !== `note-${newNote.id}`) {
                note.style.zIndex = note.dataset.zIndex || '10';
            }
        });
        
        // New note should be on top
        noteElement.style.zIndex = newNote.zIndex;
        noteElement.dataset.zIndex = newNote.zIndex;
    }, 50);
}

function updateNoteContent(id, content) {
    const noteIndex = notes.findIndex(note => note.id === id);
    if (noteIndex !== -1) {
        notes[noteIndex].content = content;
        localStorage.setItem('notes', JSON.stringify(notes));
    }
}

function deleteNote(id) {
    // Find the note to delete
    const noteElement = document.getElementById(`note-${id}`);
    
    if (noteElement) {
        // Add a removal animation
        noteElement.style.transform = 'scale(0.8) rotate(10deg)';
        noteElement.style.opacity = '0';
        
        // Play delete sound
        playNoteSound('delete');
        
        // Remove the element after the animation completes
        setTimeout(() => {
            noteElement.remove();
            
            // Update the notes array and localStorage
            notes = notes.filter(note => note.id !== id);
            localStorage.setItem('notes', JSON.stringify(notes));
        }, 300);
    } else {
        // If element not found, just update the array
        notes = notes.filter(note => note.id !== id);
        localStorage.setItem('notes', JSON.stringify(notes));
    }
}

function renderNotes() {
    const notesContainer = document.getElementById('notes-container');
    notesContainer.innerHTML = '';
    
    // Find the highest z-index
    noteZIndexCounter = notes.reduce((highest, note) => 
        note.zIndex > highest ? note.zIndex : highest, 10);
    
    // Render notes with staggered animations
    notes.forEach((note, index) => {
        setTimeout(() => renderNote(note), index * 100);
    });
}

function renderNote(note) {
    const notesContainer = document.getElementById('notes-container');
    
    const noteElement = document.createElement('div');
    noteElement.className = 'sticky-note';
    noteElement.id = `note-${note.id}`;
    noteElement.style.backgroundColor = note.color;
    noteElement.style.left = `${note.x}px`;
    noteElement.style.top = `${note.y}px`;
    
    // Set z-index if defined, otherwise use default
    noteElement.style.zIndex = note.zIndex || '10';
    noteElement.dataset.zIndex = note.zIndex || '10';
    
    // Apply rotation if defined
    if (note.rotation !== undefined) {
        noteElement.style.transform = `rotate(${note.rotation}deg)`;
        // Also store the rotation as a CSS variable for animations
        noteElement.style.setProperty('--random-rotation', `${note.rotation}deg`);
    }
    
    // Create note content
    const textarea = document.createElement('textarea');
    textarea.className = 'note-content';
    textarea.value = note.content;
    textarea.placeholder = "Write your note here...";
    textarea.spellcheck = false;
    
    textarea.addEventListener('input', (e) => {
        updateNoteContent(note.id, e.target.value);
    });
    
    textarea.addEventListener('focus', () => {
        // Bring the note to front when editing
        noteZIndexCounter++;
        noteElement.style.zIndex = noteZIndexCounter;
        note.zIndex = noteZIndexCounter;
        noteElement.dataset.zIndex = noteZIndexCounter;
    });
    
    // Create note controls
    const controls = document.createElement('div');
    controls.className = 'note-controls';
    
    const deleteBtn = document.createElement('button');
    deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
    deleteBtn.title = "Delete note";
    deleteBtn.addEventListener('click', () => deleteNote(note.id));
    
    const colorBtn = document.createElement('button');
    colorBtn.innerHTML = '<i class="fas fa-palette"></i>';
    colorBtn.title = "Change color";
    colorBtn.addEventListener('click', () => {
        // Create a simple color palette for quick color changes
        const colors = ['#FFEB3B', '#81C784', '#64B5F6', '#E57373', '#BA68C8', '#FFD54F', '#4FC3F7', '#FF8A65'];
        const currentIndex = colors.indexOf(note.color);
        const nextIndex = (currentIndex + 1) % colors.length;
        
        // Change the color
        note.color = colors[nextIndex];
        noteElement.style.backgroundColor = note.color;
        localStorage.setItem('notes', JSON.stringify(notes));
        
        // Add a visual feedback
        noteElement.style.transform = `${noteElement.style.transform.replace('scale(1.1)', '')} scale(1.1)`;
        setTimeout(() => {
            noteElement.style.transform = noteElement.style.transform.replace('scale(1.1)', '');
        }, 200);
    });
    
    controls.appendChild(colorBtn);
    controls.appendChild(deleteBtn);
    
    // Add elements to note
    noteElement.appendChild(textarea);
    noteElement.appendChild(controls);
    
    // Make note draggable
    noteElement.addEventListener('mousedown', (e) => {
        // Only start drag if not clicking on textarea or buttons
        if (e.target !== textarea && !controls.contains(e.target)) {
            e.preventDefault();
            
            // Bring the dragged note to front
            noteZIndexCounter++;
            document.querySelectorAll('.sticky-note').forEach(note => {
                note.style.zIndex = note.dataset.zIndex || '10';
            });
            
            noteElement.style.zIndex = noteZIndexCounter;
            note.zIndex = noteZIndexCounter;
            noteElement.dataset.zIndex = noteZIndexCounter;
            
            draggedNote = note.id;
            
            const rect = noteElement.getBoundingClientRect();
            dragOffsetX = e.clientX - rect.left;
            dragOffsetY = e.clientY - rect.top;
        }
    });
    
    notesContainer.appendChild(noteElement);
}

// Add keyboard shortcuts for sticky notes operations
function initNoteKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Only process shortcuts when the sticky notes section is active
        const stickySection = document.getElementById('sticky-notes');
        if (!stickySection.classList.contains('active')) return;
        
        // Ctrl+N: Create new note
        if (e.ctrlKey && e.key === 'n' && !e.shiftKey) {
            e.preventDefault();
            addNote();
        }
        
        // Ctrl+Shift+D: Delete focused note (if any)
        if (e.ctrlKey && e.shiftKey && e.key === 'D') {
            e.preventDefault();
            const activeElement = document.activeElement;
            if (activeElement.classList.contains('note-content')) {
                const noteId = parseInt(activeElement.closest('.sticky-note').id.replace('note-', ''));
                if (noteId) {
                    deleteNote(noteId);
                }
            }
        }
        
        // Ctrl+Space: Cycle through note colors for focused note
        if (e.ctrlKey && e.key === ' ' && !e.shiftKey) {
            e.preventDefault();
            const activeElement = document.activeElement;
            if (activeElement.classList.contains('note-content')) {
                const noteElement = activeElement.closest('.sticky-note');
                const noteId = parseInt(noteElement.id.replace('note-', ''));
                const noteIndex = notes.findIndex(note => note.id === noteId);
                
                if (noteIndex !== -1) {
                    // Cycle through colors
                    const colors = ['#FFEB3B', '#81C784', '#64B5F6', '#E57373', '#BA68C8', '#FFD54F', '#4FC3F7', '#FF8A65'];
                    const currentIndex = colors.indexOf(notes[noteIndex].color);
                    const nextIndex = (currentIndex + 1) % colors.length;
                    
                    // Update color
                    notes[noteIndex].color = colors[nextIndex];
                    noteElement.style.backgroundColor = colors[nextIndex];
                    localStorage.setItem('notes', JSON.stringify(notes));
                    
                    // Visual feedback
                    noteElement.style.transform = `${noteElement.style.transform.replace('scale(1.1)', '')} scale(1.1)`;
                    setTimeout(() => {
                        noteElement.style.transform = noteElement.style.transform.replace('scale(1.1)', '');
                    }, 200);
                }
            }
        }
    });
}

// Initialize keyboard shortcuts tooltip
function initShortcutsTooltip() {
    const showShortcutsBtn = document.getElementById('show-note-shortcuts');
    const tooltip = document.getElementById('note-shortcuts-tooltip');
    
    if (!showShortcutsBtn || !tooltip) return;
    
    showShortcutsBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        tooltip.classList.toggle('visible');
    });
    
    // Close the tooltip when clicking outside
    document.addEventListener('click', (e) => {
        if (tooltip.classList.contains('visible') && 
            !tooltip.contains(e.target) && 
            e.target !== showShortcutsBtn) {
            tooltip.classList.remove('visible');
        }
    });
    
    // Close the tooltip when pressing Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && tooltip.classList.contains('visible')) {
            tooltip.classList.remove('visible');
        }
    });
}
