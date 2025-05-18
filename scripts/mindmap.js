// Mind Map Builder Functionality - Complete Rewrite
// This implementation ensures all functionality works properly

// State management
let nodes = [];
let connections = [];
let selectedNode = null;
let nodeIdCounter = 1;
let mindMapHistory = null;
let isDragging = false;
let dragOffset = { x: 0, y: 0 };
let isEditingText = false;

/**
 * Initialize the mind map component
 */
function initMindMap() {
    // Initialize history manager
    mindMapHistory = new HistoryManager(20);
    
    // Setup event listeners for all the button controls
    document.getElementById('add-root-node').addEventListener('click', addRootNode);
    document.getElementById('add-child-node').addEventListener('click', addChildNode);
    document.getElementById('remove-node').addEventListener('click', removeSelectedNode);
    document.getElementById('clear-mindmap').addEventListener('click', clearMindmap);
      // Add undo/redo button handlers
    document.getElementById('undo-mindmap').addEventListener('click', undoMindMapAction);
    document.getElementById('redo-mindmap').addEventListener('click', redoMindMapAction);
    
    // Add search functionality
    document.getElementById('mindmap-search-btn').addEventListener('click', searchMindMap);
    document.getElementById('mindmap-search-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchMindMap();
        }
    });
    
    // Add keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Only process if mind map section is active
        const mindmapSection = document.getElementById('mindmap');
        if (!mindmapSection.classList.contains('active')) return;
        
        // Don't process shortcuts when editing text
        if (isEditingText) return;
        
        // Ctrl+Z for undo
        if (e.ctrlKey && e.key === 'z') {
            e.preventDefault();
            undoMindMapAction();
        }
        
        // Ctrl+Y for redo
        if (e.ctrlKey && e.key === 'y') {
            e.preventDefault();
            redoMindMapAction();
        }
        
        // Ctrl+F for search focus
        if (e.ctrlKey && e.key === 'f') {
            e.preventDefault();
            document.getElementById('mindmap-search-input').focus();
        }
        
        // Delete/Backspace to remove selected node
        if ((e.key === 'Delete' || e.key === 'Backspace') && selectedNode) {
            e.preventDefault();
            removeSelectedNode();
        }
        
        // Enter to edit selected node
        if (e.key === 'Enter' && selectedNode) {
            e.preventDefault();
            startNodeEdit(selectedNode.id);
        }
        
        // Escape to clear selection
        if (e.key === 'Escape') {
            if (isEditingText) {
                stopNodeEdit(true);  // Cancel edit mode
            } else if (selectedNode) {
                selectedNode = null;
                updateNodeSelection();
                resetConnectionHighlights();
                
                // Also clear any search highlights
                document.querySelectorAll('.mindmap-search-highlight').forEach(el => {
                    el.classList.remove('mindmap-search-highlight');
                });
            }
        }
    });
    
    // Setup click handler for the mindmap container to clear selection
    const container = document.getElementById('mindmap-container');
    container.addEventListener('click', (e) => {
        if (e.target === container) {
            // Clicked on empty space
            selectedNode = null;
            updateNodeSelection();
            resetConnectionHighlights();
        }
    });
    
    // Setup mouse and touch event handlers for dragging
    setupDragHandlers();
    
    // Try to load any saved mindmap
    loadMindMap();
    
    // If no mindmap was loaded, start with a default root node
    if (nodes.length === 0) {
        addRootNode();
    }
}

/**
 * Setup drag handlers for nodes
 */
function setupDragHandlers() {
    const container = document.getElementById('mindmap-container');
    
    // Mouse events for drag and drop
    container.addEventListener('mousedown', (e) => {
        const nodeElement = findParentNode(e.target);
        if (!nodeElement) return;
        
        e.preventDefault();
        
        const nodeId = parseInt(nodeElement.getAttribute('data-id'));
        const node = nodes.find(n => n.id === nodeId);
        if (!node) return;
        
        selectNode(nodeId);
        
        // Check for double click
        const now = new Date().getTime();
        const lastClick = nodeElement.getAttribute('data-last-click') || 0;
        
        if (now - lastClick < 300) {
            // Double click detected
            e.preventDefault();
            startNodeEdit(nodeId);
        }
        
        nodeElement.setAttribute('data-last-click', now);
        
        // Setup dragging
        isDragging = true;
        dragOffset = {
            x: e.clientX - node.x,
            y: e.clientY - node.y
        };
        
        nodeElement.classList.add('dragging');
    });
    
    container.addEventListener('mousemove', (e) => {
        if (!isDragging || !selectedNode) return;
        
        e.preventDefault();
        
        // Save state before the first move (only once)
        if (!document.querySelector('.dragging.moved')) {
            saveToHistory('Move node');
            document.querySelector('.dragging').classList.add('moved');
        }
        
        // Calculate new position
        const newX = e.clientX - dragOffset.x;
        const newY = e.clientY - dragOffset.y;
        
        // Update the node data
        const nodeIndex = nodes.findIndex(n => n.id === selectedNode.id);
        if (nodeIndex !== -1) {
            nodes[nodeIndex].x = newX;
            nodes[nodeIndex].y = newY;
            
            // Update node position in DOM
            const nodeElement = document.querySelector(`.mindmap-node[data-id="${selectedNode.id}"]`);
            if (nodeElement) {
                nodeElement.style.left = `${newX}px`;
                nodeElement.style.top = `${newY}px`;
            }
            
            // Update connections
            renderConnections();
        }
    });
    
    container.addEventListener('mouseup', (e) => {
        if (!isDragging) return;
        
        isDragging = false;
        
        document.querySelectorAll('.mindmap-node.dragging').forEach(el => {
            el.classList.remove('dragging');
            el.classList.remove('moved');
        });
        
        saveMindMap();
    });
    
    // Touch events for mobile support
    container.addEventListener('touchstart', (e) => {
        const nodeElement = findParentNode(e.target);
        if (!nodeElement) return;
        
        const nodeId = parseInt(nodeElement.getAttribute('data-id'));
        const node = nodes.find(n => n.id === nodeId);
        if (!node) return;
        
        selectNode(nodeId);
        
        // Check for double tap
        const now = new Date().getTime();
        const lastTap = nodeElement.getAttribute('data-last-tap') || 0;
        
        if (now - lastTap < 300) {
            // Double tap detected
            e.preventDefault();
            startNodeEdit(nodeId);
        }
        
        nodeElement.setAttribute('data-last-tap', now);
        
        // Setup dragging
        const touch = e.touches[0];
        isDragging = true;
        dragOffset = {
            x: touch.clientX - node.x,
            y: touch.clientY - node.y
        };
        
        nodeElement.classList.add('dragging');
    }, { passive: false });
    
    container.addEventListener('touchmove', (e) => {
        if (!isDragging || !selectedNode) return;
        
        e.preventDefault();
        
        const touch = e.touches[0];
        
        // Save state before the first move (only once)
        if (!document.querySelector('.dragging.moved')) {
            saveToHistory('Move node');
            document.querySelector('.dragging').classList.add('moved');
        }
        
        // Calculate new position
        const newX = touch.clientX - dragOffset.x;
        const newY = touch.clientY - dragOffset.y;
        
        // Update the node data
        const nodeIndex = nodes.findIndex(n => n.id === selectedNode.id);
        if (nodeIndex !== -1) {
            nodes[nodeIndex].x = newX;
            nodes[nodeIndex].y = newY;
            
            // Update node position in DOM
            const nodeElement = document.querySelector(`.mindmap-node[data-id="${selectedNode.id}"]`);
            if (nodeElement) {
                nodeElement.style.left = `${newX}px`;
                nodeElement.style.top = `${newY}px`;
            }
            
            // Update connections
            renderConnections();
        }
    }, { passive: false });
    
    container.addEventListener('touchend', (e) => {
        if (!isDragging) return;
        
        isDragging = false;
        
        document.querySelectorAll('.mindmap-node.dragging').forEach(el => {
            el.classList.remove('dragging');
            el.classList.remove('moved');
        });
        
        saveMindMap();
    });
}

/**
 * Find the closest parent node element from a target element
 */
function findParentNode(element) {
    let current = element;
    while (current && !current.classList.contains('mindmap-node')) {
        current = current.parentElement;
    }
    return current;
}

/**
 * Add a new root node
 */
function addRootNode() {
    console.log('Adding root node to mindmap...');
    saveToHistory('Add root node');
    
    // Create a new root node
    const container = document.getElementById('mindmap-container');
    
    if (!container) {
        console.error('Mindmap container not found!');
        return;
    }
    
    // Make sure container is visible
    container.style.display = 'block';
    
    const containerRect = container.getBoundingClientRect();
    console.log('Container dimensions:', containerRect);
    
    // Default position if container has no size
    let x = 200;
    let y = 200;
    
    // If container has size, center the node
    if (containerRect.width > 0 && containerRect.height > 0) {
        x = containerRect.width / 2 - 75;
        y = containerRect.height / 2 - 25;
    }
    
    const node = {
        id: nodeIdCounter++,
        text: 'New Root Node',
        x: x,
        y: y,
        parentId: null
    };
    
    console.log('Creating node:', node);
    nodes.push(node);
    renderNode(node);
    selectNode(node.id);
    saveMindMap();
    
    // Start editing the new node
    startNodeEdit(node.id);
}

/**
 * Add a child node to the currently selected node
 */
function addChildNode() {
    if (!selectedNode) {
        showNotification('Please select a parent node first', 'error');
        return;
    }
    
    saveToHistory('Add child node');
    
    // Create a new child node
    const parent = nodes.find(n => n.id === selectedNode.id);
    if (!parent) return;
    
    // Calculate position - position the child below and to the right of parent
    const childX = parent.x + 150;
    const childY = parent.y + 80;
    
    const node = {
        id: nodeIdCounter++,
        text: 'New Child Node',
        x: childX,
        y: childY,
        parentId: parent.id
    };
    
    nodes.push(node);
    renderNode(node);
    
    // Create connection
    connections.push({
        from: parent.id,
        to: node.id
    });
    
    renderConnections();
    selectNode(node.id);
    saveMindMap();
    
    // Start editing the new node
    startNodeEdit(node.id);
}

/**
 * Remove the currently selected node and its children
 */
function removeSelectedNode() {
    if (!selectedNode) {
        showNotification('Please select a node to remove', 'error');
        return;
    }
    
    saveToHistory('Remove node');
    
    // Find all child nodes recursively
    const nodesToRemove = findNodeAndDescendants(selectedNode.id);
    
    // Confirm if trying to remove multiple nodes
    if (nodesToRemove.length > 1 && !confirm(`This will remove ${nodesToRemove.length} nodes, including all child nodes. Continue?`)) {
        return;
    }
    
    // Remove connections first
    connections = connections.filter(conn => 
        !nodesToRemove.includes(conn.from) && !nodesToRemove.includes(conn.to)
    );
    
    // Remove nodes
    nodes = nodes.filter(node => !nodesToRemove.includes(node.id));
    
    // Update DOM
    nodesToRemove.forEach(nodeId => {
        const element = document.querySelector(`.mindmap-node[data-id="${nodeId}"]`);
        if (element) element.remove();
    });
    
    // Reset selection and connections
    selectedNode = null;
    updateNodeSelection();
    renderConnections();
    saveMindMap();
    
    // Update UI state
    document.getElementById('add-child-node').disabled = true;
    document.getElementById('remove-node').disabled = true;
}

/**
 * Find a node and all its descendants (for deletion)
 */
function findNodeAndDescendants(nodeId) {
    const result = [nodeId];
    
    // Find direct children
    const childNodes = nodes.filter(n => n.parentId === nodeId);
    
    // Recursively add all descendants
    childNodes.forEach(child => {
        result.push(...findNodeAndDescendants(child.id));
    });
    
    return result;
}

/**
 * Render a node in the mind map
 */
function renderNode(node) {
    console.log('Rendering node:', node);
    const container = document.getElementById('mindmap-container');
    
    if (!container) {
        console.error('Mindmap container not found!');
        return;
    }
    
    // Check if node already exists (for updates)
    let nodeElement = document.querySelector(`.mindmap-node[data-id="${node.id}"]`);
    
    if (!nodeElement) {
        console.log('Creating new node element');
        // Create new node element
        nodeElement = document.createElement('div');
        nodeElement.className = 'mindmap-node';
        nodeElement.setAttribute('data-id', node.id);
        
        // Add visual styles directly to ensure visibility
        nodeElement.style.position = 'absolute';
        nodeElement.style.padding = '0.8rem 1.5rem';
        nodeElement.style.borderRadius = '8px';
        nodeElement.style.cursor = 'pointer';
        nodeElement.style.userSelect = 'none';
        nodeElement.style.boxShadow = 'var(--shadow)';
        nodeElement.style.zIndex = '10';
        nodeElement.style.minWidth = '120px';
        
        // Set colors directly
        if (node.parentId === null) {
            // Root node styling
            nodeElement.style.backgroundColor = '#7e74f1'; // accent color
            nodeElement.style.color = 'white';
            nodeElement.style.width = '150px';
            nodeElement.style.height = '150px';
            nodeElement.style.borderRadius = '50%';
            nodeElement.style.display = 'flex';
            nodeElement.style.alignItems = 'center';
            nodeElement.style.justifyContent = 'center';
            nodeElement.classList.add('root-node');
        } else {
            // Normal node styling
            nodeElement.style.backgroundColor = '#3a36e0'; // primary color
            nodeElement.style.color = 'white';
        }
        
        // Create content within the node
        const contentDiv = document.createElement('div');
        contentDiv.className = 'mindmap-node-content';
        contentDiv.textContent = node.text;
        contentDiv.style.width = '100%';
        contentDiv.style.textAlign = 'center';
        contentDiv.style.wordWrap = 'break-word';
        
        nodeElement.appendChild(contentDiv);
        container.appendChild(nodeElement);
        
        // Add click handler to select node
        nodeElement.addEventListener('click', (e) => {
            e.stopPropagation();
            selectNode(node.id);
        });
        
        // Add double click handler to edit node
        nodeElement.addEventListener('dblclick', (e) => {
            e.stopPropagation();
            startNodeEdit(node.id);
        });
    } else {
        console.log('Updating existing node element');
        // Update existing node content
        const contentDiv = nodeElement.querySelector('.mindmap-node-content');
        if (contentDiv) {
            contentDiv.textContent = node.text;
        }
    }
    
    // Position the node
    nodeElement.style.left = `${node.x}px`;
    nodeElement.style.top = `${node.y}px`;
    
    console.log('Node positioned at:', node.x, node.y);
}

/**
 * Start editing a node's text
 */
function startNodeEdit(nodeId) {
    const nodeElement = document.querySelector(`.mindmap-node[data-id="${nodeId}"]`);
    if (!nodeElement) return;
    
    // Get the node data
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;
    
    const contentDiv = nodeElement.querySelector('.mindmap-node-content');
    if (!contentDiv) return;
    
    isEditingText = true;
    
    // Hide the content and add an input
    contentDiv.style.display = 'none';
    
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'mindmap-node-edit';
    input.value = node.text;
    nodeElement.appendChild(input);
    
    // Focus the input and select all text
    input.focus();
    input.select();
    
    // Save on enter or blur
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            finishNodeEdit(nodeId);
        } else if (e.key === 'Escape') {
            e.preventDefault();
            stopNodeEdit(true);
        }
    });
    
    input.addEventListener('blur', () => {
        finishNodeEdit(nodeId);
    });
}

/**
 * Finish editing a node and save changes
 */
function finishNodeEdit(nodeId) {
    stopNodeEdit(false);
    
    const nodeElement = document.querySelector(`.mindmap-node[data-id="${nodeId}"]`);
    if (!nodeElement) return;
    
    const input = nodeElement.querySelector('.mindmap-node-edit');
    const contentDiv = nodeElement.querySelector('.mindmap-node-content');
    
    if (!input || !contentDiv) return;
    
    // Only save if the text has changed
    const node = nodes.find(n => n.id === nodeId);
    const newText = input.value.trim() || 'Unnamed Node';
    
    if (node && node.text !== newText) {
        saveToHistory('Edit node text');
        node.text = newText;
        contentDiv.textContent = newText;
        saveMindMap();
    }
    
    // Show content again
    contentDiv.style.display = '';
    
    // Remove the input
    input.remove();
    
    // Reset editing state
    isEditingText = false;
}

/**
 * Stop editing without saving (or save based on parameter)
 */
function stopNodeEdit(cancel = false) {
    const input = document.querySelector('.mindmap-node-edit');
    if (!input) return;
    
    const nodeElement = input.parentElement;
    if (!nodeElement) return;
    
    const nodeId = parseInt(nodeElement.getAttribute('data-id'));
    const contentDiv = nodeElement.querySelector('.mindmap-node-content');
    
    if (contentDiv) {
        contentDiv.style.display = '';
    }
    
    // If cancel is true, discard changes, otherwise save
    if (!cancel) {
        const node = nodes.find(n => n.id === nodeId);
        const newText = input.value.trim() || 'Unnamed Node';
        
        if (node && node.text !== newText) {
            saveToHistory('Edit node text');
            node.text = newText;
            
            if (contentDiv) {
                contentDiv.textContent = newText;
            }
            saveMindMap();
        }
    }
    
    // Remove the input
    input.remove();
    
    // Reset editing state
    isEditingText = false;
}

/**
 * Select a node
 */
function selectNode(nodeId) {
    // Find the node
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;
    
    // Update selectedNode
    selectedNode = node;
    
    // Update UI
    updateNodeSelection();
    highlightConnections(nodeId);
    
    // Enable/disable buttons
    document.getElementById('add-child-node').disabled = false;
    document.getElementById('remove-node').disabled = false;
}

/**
 * Update visual selection state of nodes
 */
function updateNodeSelection() {
    // Remove selection from all nodes
    document.querySelectorAll('.mindmap-node').forEach(n => {
        n.classList.remove('selected');
    });
    
    // Add selection to current node
    if (selectedNode) {
        const nodeElement = document.querySelector(`.mindmap-node[data-id="${selectedNode.id}"]`);
        if (nodeElement) {
            nodeElement.classList.add('selected');
        }
    }
    
    // Update button states
    const addChildButton = document.getElementById('add-child-node');
    const removeNodeButton = document.getElementById('remove-node');
    
    if (selectedNode) {
        addChildButton.disabled = false;
        removeNodeButton.disabled = false;
    } else {
        addChildButton.disabled = true;
        removeNodeButton.disabled = true;
    }
}

/**
 * Render all connections between nodes
 */
function renderConnections() {
    // Get the SVG container or create it
    let svg = document.querySelector('.mindmap-connections');
    
    if (!svg) {
        svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.classList.add('mindmap-connections');
        document.getElementById('mindmap-container').appendChild(svg);
    }
    
    // Clear all existing connections
    svg.innerHTML = '';
    
    // Create each connection line
    connections.forEach(conn => {
        const fromNode = nodes.find(n => n.id === conn.from);
        const toNode = nodes.find(n => n.id === conn.to);
        
        if (!fromNode || !toNode) return;
        
        const fromX = fromNode.x + 75;  // assuming 150px node width
        const fromY = fromNode.y + 25;  // assuming 50px node height
        const toX = toNode.x + 75;
        const toY = toNode.y + 25;
        
        // Create line
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', fromX);
        line.setAttribute('y1', fromY);
        line.setAttribute('x2', toX);
        line.setAttribute('y2', toY);
        line.setAttribute('data-from', conn.from);
        line.setAttribute('data-to', conn.to);
        line.classList.add('mindmap-connection');
        
        svg.appendChild(line);
    });
}

/**
 * Highlight connections related to a specific node
 */
function highlightConnections(nodeId) {
    resetConnectionHighlights();
    
    document.querySelectorAll('.mindmap-connection').forEach(line => {
        const fromId = parseInt(line.getAttribute('data-from'));
        const toId = parseInt(line.getAttribute('data-to'));
        
        if (fromId === nodeId || toId === nodeId) {
            line.classList.add('highlighted');
        }
    });
}

/**
 * Reset all connection highlights
 */
function resetConnectionHighlights() {
    document.querySelectorAll('.mindmap-connection').forEach(line => {
        line.classList.remove('highlighted');
    });
}

/**
 * Clear the entire mind map
 */
function clearMindmap() {
    if (nodes.length === 0) return;
    
    if (!confirm('Are you sure you want to clear the entire mind map? This cannot be undone.')) {
        return;
    }
    
    saveToHistory('Clear mind map');
    
    // Clear data
    nodes = [];
    connections = [];
    selectedNode = null;
    nodeIdCounter = 1;
    
    // Clear DOM
    const container = document.getElementById('mindmap-container');
    container.querySelectorAll('.mindmap-node').forEach(node => node.remove());
    
    const svg = container.querySelector('.mindmap-connections');
    if (svg) svg.innerHTML = '';
    
    // Update UI state
    document.getElementById('add-child-node').disabled = true;
    document.getElementById('remove-node').disabled = true;
    
    // Add a default root node
    addRootNode();
    
    saveMindMap();
}

/**
 * Export the mind map as PNG
 */
function exportMindMap() {
    const container = document.getElementById('mindmap-container');
    
    // Create a notification about the export process
    showNotification('Preparing to export mind map...', 'info');
    
    html2canvas(container).then(canvas => {
        // Convert the canvas to a data URL and trigger a download
        const image = canvas.toDataURL('image/png');
        
        const downloadLink = document.createElement('a');
        downloadLink.href = image;
        downloadLink.download = 'mindmap_export_' + new Date().toISOString().slice(0, 10) + '.png';
        downloadLink.click();
        
        showNotification('Mind map exported successfully!', 'success');
    }).catch(error => {
        console.error('Export failed:', error);
        showNotification('Export failed: ' + error.message, 'error');
        
        // Fallback to just offering the JSON
        const jsonData = JSON.stringify({
            nodes: nodes,
            connections: connections,
            nextId: nodeIdCounter
        });
        
        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const downloadLink = document.createElement('a');
        downloadLink.href = url;
        downloadLink.download = 'mindmap_export_' + new Date().toISOString().slice(0, 10) + '.json';
        downloadLink.click();
        
        showNotification('Mind map exported as JSON instead', 'info');
    });
}

/**
 * Print the mind map
 */
function printMindMap() {
    const container = document.getElementById('mindmap-container');
    
    html2canvas(container).then(canvas => {
        const printWindow = window.open('', '_blank');
        
        if (!printWindow) {
            showNotification('Pop-up blocked. Please allow pop-ups for printing.', 'error');
            return;
        }
        
        const image = canvas.toDataURL('image/png');
        
        printWindow.document.open();
        printWindow.document.write(`
            <html>
            <head>
                <title>Mind Map Print</title>
                <style>
                    body {
                        margin: 0;
                        padding: 20px;
                        text-align: center;
                    }
                    img {
                        max-width: 100%;
                        height: auto;
                    }
                    @media print {
                        button {
                            display: none;
                        }
                        body {
                            padding: 0;
                        }
                    }
                </style>
            </head>
            <body>
                <h1>Mind Map</h1>
                <img src="${image}" alt="Mind Map">
                <div>
                    <button onclick="window.print()">Print</button>
                    <button onclick="window.close()">Close</button>
                </div>
            </body>
            </html>
        `);
        printWindow.document.close();
    }).catch(error => {
        console.error('Print preparation failed:', error);
        showNotification('Print preparation failed: ' + error.message, 'error');
    });
}

/**
 * Search the mind map for nodes matching the query
 */
function searchMindMap() {
    const searchInput = document.getElementById('mindmap-search-input');
    const query = searchInput.value.trim().toLowerCase();
    
    if (!query) {
        // Clear any existing highlights
        document.querySelectorAll('.mindmap-search-highlight').forEach(el => {
            el.classList.remove('mindmap-search-highlight');
        });
        return;
    }
    
    let found = false;
    
    // Clear previous highlights
    document.querySelectorAll('.mindmap-search-highlight').forEach(el => {
        el.classList.remove('mindmap-search-highlight');
    });
    
    // Search nodes
    nodes.forEach(node => {
        if (node.text.toLowerCase().includes(query)) {
            found = true;
            const nodeElement = document.querySelector(`.mindmap-node[data-id="${node.id}"]`);
            if (nodeElement) {
                nodeElement.classList.add('mindmap-search-highlight');
                
                // Scroll to the first match
                if (!document.querySelector('.mindmap-search-highlight.viewed')) {
                    nodeElement.classList.add('viewed');
                    nodeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }
        }
    });
    
    if (found) {
        showNotification(`Found matches for "${query}"`, 'success');
    } else {
        showNotification(`No matches found for "${query}"`, 'error');
    }
}

/**
 * Save mind map state for undo/redo
 */
function saveToHistory(actionName) {
    if (!mindMapHistory) return;
    
    const state = {
        nodes: JSON.parse(JSON.stringify(nodes)),
        connections: JSON.parse(JSON.stringify(connections)),
        nextId: nodeIdCounter
    };
    
    mindMapHistory.saveState(state, actionName);
}

/**
 * Undo the last action
 */
function undoMindMapAction() {
    if (!mindMapHistory) return;
    
    const result = mindMapHistory.undo();
    
    if (result) {
        restoreMindMapState(result.state);
        showNotification(`Undo: ${result.actionName}`, 'info');
    } else {
        showNotification('Nothing to undo', 'info');
    }
}

/**
 * Redo the last undone action
 */
function redoMindMapAction() {
    if (!mindMapHistory) return;
    
    const result = mindMapHistory.redo();
    
    if (result) {
        restoreMindMapState(result.state);
        showNotification(`Redo: ${result.actionName}`, 'info');
    } else {
        showNotification('Nothing to redo', 'info');
    }
}

/**
 * Restore a mind map state from history
 */
function restoreMindMapState(state) {
    if (!state) return;
    
    nodes = JSON.parse(JSON.stringify(state.nodes));
    connections = JSON.parse(JSON.stringify(state.connections));
    nodeIdCounter = state.nextId;
    
    // Reset selection
    selectedNode = null;
    
    // Redraw the entire mind map
    redrawMindMap();
}

/**
 * Redraw the entire mind map from the current state
 */
function redrawMindMap() {
    const container = document.getElementById('mindmap-container');
    
    // Clear existing nodes
    container.querySelectorAll('.mindmap-node').forEach(node => node.remove());
    
    // Redraw all nodes
    nodes.forEach(node => {
        renderNode(node);
    });
    
    // Redraw all connections
    renderConnections();
    
    // Update UI state
    document.getElementById('add-child-node').disabled = true;
    document.getElementById('remove-node').disabled = true;
    
    saveMindMap();
}

/**
 * Save the mindmap to local storage
 */
function saveMindMap() {
    const state = {
        nodes: nodes,
        connections: connections,
        nextId: nodeIdCounter
    };
    
    localStorage.setItem('mindmap_state', JSON.stringify(state));
}

/**
 * Load the mindmap from local storage
 */
function loadMindMap() {
    try {
        const savedState = localStorage.getItem('mindmap_state');
        if (savedState) {
            const state = JSON.parse(savedState);
            
            nodes = state.nodes || [];
            connections = state.connections || [];
            nodeIdCounter = state.nextId || 1;
            
            redrawMindMap();
            
            return true;
        }
    } catch (error) {
        console.error('Error loading mind map:', error);
        showNotification('Failed to load saved mind map', 'error');
    }
    
    return false;
}

// Notification function - reused from main app
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