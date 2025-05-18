// Fixed context menu function
function showContextMenu(x, y, event) {
    // Remove any existing context menus
    const existingMenu = document.querySelector('.calendar-context-menu');
    if (existingMenu) {
        document.body.removeChild(existingMenu);
    }
    
    // Create context menu
    const contextMenu = document.createElement('div');
    contextMenu.className = 'calendar-context-menu';
    contextMenu.style.position = 'fixed';
    contextMenu.style.left = `${x}px`;
    contextMenu.style.top = `${y}px`;
    
    // Event title display
    const titleItem = document.createElement('div');
    titleItem.className = 'context-menu-title';
    titleItem.textContent = event.title;
    contextMenu.appendChild(titleItem);
    
    // Edit option
    const editItem = document.createElement('div');
    editItem.className = 'context-menu-item';
    editItem.innerHTML = '<i class="fas fa-edit"></i> Edit';
    
    editItem.addEventListener('click', () => {
        document.body.removeChild(contextMenu);
        editEvent(event.id);
    });
    
    contextMenu.appendChild(editItem);
    
    // Delete option
    const deleteItem = document.createElement('div');
    deleteItem.className = 'context-menu-item danger';
    deleteItem.innerHTML = '<i class="fas fa-trash"></i> Delete';
    
    deleteItem.addEventListener('click', () => {
        document.body.removeChild(contextMenu);
        if (confirm(`Delete event "${event.title}"?`)) {
            deleteEvent(event.id);
        }
    });
    
    contextMenu.appendChild(deleteItem);
    
    // Add to document
    document.body.appendChild(contextMenu);
    
    // Close menu when clicking outside
    function handleClickOutside(e) {
        if (!contextMenu.contains(e.target)) {
            document.body.removeChild(contextMenu);
            document.removeEventListener('click', handleClickOutside);
        }
    }
    
    // Use setTimeout to prevent immediate closing
    setTimeout(() => {
        document.addEventListener('click', handleClickOutside);
    }, 0);
    
    // Ensure the menu fits on the screen
    const menuRect = contextMenu.getBoundingClientRect();
    if (menuRect.right > window.innerWidth) {
        contextMenu.style.left = `${x - menuRect.width}px`;
    }
    
    if (menuRect.bottom > window.innerHeight) {
        contextMenu.style.top = `${y - menuRect.height}px`;
    }
}
