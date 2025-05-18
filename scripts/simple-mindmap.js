// Simple Mind Map Implementation

let mindmapNodes = [];
let mindmapConnections = [];
let selectedMindmapNode = null;
let mindmapNodeCounter = 1;
let mindmapHistory = [];
let mindmapHistoryIndex = -1;
const MAX_HISTORY = 20;

/**
 * Initialize a simple mind map
 */
function initSimpleMindMap() {
    console.log("Initializing simple mind map...");
    
    // Clear any existing nodes
    mindmapNodes = [];
    mindmapConnections = [];
    selectedMindmapNode = null;
    mindmapNodeCounter = 1;
    
    // Reset history
    mindmapHistory = [];
    mindmapHistoryIndex = -1;
    
    // Get the container
    const container = document.getElementById('mindmap-container');
    if (!container) {
        console.error("Mind map container not found!");
        return;
    }
    
    // Clear the container
    container.innerHTML = '';
    
    // Add connection SVG
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.classList.add('mindmap-connections');
    svg.style.position = 'absolute';
    svg.style.top = '0';
    svg.style.left = '0';
    svg.style.width = '100%';
    svg.style.height = '100%';
    svg.style.pointerEvents = 'none';
    svg.style.zIndex = '5';
    container.appendChild(svg);
    
    // Add root node
    addSimpleRootNode();
    
    // Add click handler for container
    container.addEventListener('click', function(e) {
        if (e.target === container) {
            // Deselect when clicking on empty space
            deselectAllNodes();
        }
    });
      // Add button event listeners
    document.getElementById('add-root-node').addEventListener('click', addSimpleRootNode);
    document.getElementById('add-child-node').addEventListener('click', addSimpleChildNode);
    document.getElementById('remove-node').addEventListener('click', removeSimpleNode);
    document.getElementById('clear-mindmap').addEventListener('click', initSimpleMindMap);
    document.getElementById('undo-mindmap').addEventListener('click', undoAction);
    document.getElementById('redo-mindmap').addEventListener('click', redoAction);
    
    // Update button states initially
    updateUndoRedoButtons();
    
    console.log("Simple mind map initialized successfully");
}

/**
 * Add a root node to the mind map
 */
function addSimpleRootNode() {
    console.log("Adding root node...");
    
    const container = document.getElementById('mindmap-container');
    if (!container) return;
    
    // Calculate center position
    const containerWidth = container.offsetWidth || 600;
    const containerHeight = container.offsetHeight || 400;
    
    // Create node data
    const node = {
        id: mindmapNodeCounter++,
        text: "Main Topic",
        x: (containerWidth / 2) - 75,
        y: (containerHeight / 2) - 75,
        isRoot: true,
        parentId: null
    };
    
    // Add to our nodes array
    mindmapNodes.push(node);
    
    // Render the node
    renderSimpleNode(node);
    
    // Select the new node
    selectSimpleNode(node.id);
    
    // Reset history if this is the first node
    if (mindmapHistory.length === 0) {
        console.log("Initializing history with root node");
    }
    
    // Save to history
    saveToHistory('Add root node');
    
    console.log("Root node added:", node);
}

/**
 * Add a child node to the currently selected node
 */
function addSimpleChildNode() {
    if (!selectedMindmapNode) {
        console.log("No node selected. Select a node first.");
        return;
    }
    
    console.log("Adding child node to:", selectedMindmapNode);
    
    // Create node data with random offset from parent
    const offsetX = Math.random() * 100 + 100; // 100-200px to the right
    const offsetY = Math.random() * 200 - 100; // +/- 100px vertically
    
    const node = {
        id: mindmapNodeCounter++,
        text: "New Idea",
        x: selectedMindmapNode.x + offsetX,
        y: selectedMindmapNode.y + offsetY,
        isRoot: false,
        parentId: selectedMindmapNode.id
    };
    
    // Add to our nodes array
    mindmapNodes.push(node);
    
    // Add connection
    const connection = {
        from: selectedMindmapNode.id,
        to: node.id
    };
    mindmapConnections.push(connection);
    
    // Render the node
    renderSimpleNode(node);
    
    // Render connection
    renderSimpleConnections();
    
    // Select the new node
    selectSimpleNode(node.id);
    
    // Save to history
    saveToHistory('Add child node');
    
    console.log("Child node added:", node);
}

/**
 * Remove the currently selected node
 */
function removeSimpleNode() {
    if (!selectedMindmapNode) return;
    
    console.log("Removing node:", selectedMindmapNode);
    
    // Get all nodes to remove (selected + all descendants)
    const nodesToRemove = findNodeAndDescendants(selectedMindmapNode.id);
    
    // Remove connections involving these nodes
    mindmapConnections = mindmapConnections.filter(conn => 
        !nodesToRemove.includes(conn.from) && !nodesToRemove.includes(conn.to)
    );
    
    // Remove nodes from array
    mindmapNodes = mindmapNodes.filter(node => !nodesToRemove.includes(node.id));
    
    // Remove from DOM
    nodesToRemove.forEach(nodeId => {
        const element = document.querySelector(`.mindmap-node[data-id="${nodeId}"]`);
        if (element) element.remove();
    });
    
    // Clear selection
    selectedMindmapNode = null;
    document.getElementById('add-child-node').disabled = true;
    document.getElementById('remove-node').disabled = true;
    
    // Re-render connections
    renderSimpleConnections();
    
    // Save to history
    saveToHistory('Remove node');
    
    console.log("Node removed");
}

/**
 * Helper to find a node and all its descendants
 */
function findNodeAndDescendants(nodeId) {
    const result = [nodeId];
    
    // Find direct children
    const childNodes = mindmapNodes.filter(n => n.parentId === nodeId);
    
    // Recursively add all descendants
    childNodes.forEach(child => {
        result.push(...findNodeAndDescendants(child.id));
    });
    
    return result;
}

/**
 * Render a node in the mind map
 */
function renderSimpleNode(node) {
    const container = document.getElementById('mindmap-container');
    if (!container) return;
    
    // Create the node element
    const nodeElement = document.createElement('div');
    nodeElement.className = 'mindmap-node';
    if (node.isRoot) nodeElement.classList.add('root-node');
    nodeElement.setAttribute('data-id', node.id);
    
    // Apply direct styles for visibility
    nodeElement.style.position = 'absolute';
    nodeElement.style.left = `${node.x}px`;
    nodeElement.style.top = `${node.y}px`;
    nodeElement.style.backgroundColor = node.isRoot ? '#7e74f1' : '#3a36e0';
    nodeElement.style.color = 'white';
    nodeElement.style.padding = '10px 15px';
    nodeElement.style.borderRadius = node.isRoot ? '50%' : '8px';
    nodeElement.style.minWidth = node.isRoot ? '150px' : '120px';
    nodeElement.style.minHeight = node.isRoot ? '150px' : 'auto';
    nodeElement.style.display = 'flex';
    nodeElement.style.alignItems = 'center';
    nodeElement.style.justifyContent = 'center';
    nodeElement.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
    nodeElement.style.cursor = 'pointer';
    nodeElement.style.zIndex = '10';
    
    // Add text content
    const content = document.createElement('div');
    content.className = 'mindmap-node-content';
    content.textContent = node.text;
    content.style.width = '100%';
    content.style.textAlign = 'center';
    content.style.wordWrap = 'break-word';
    nodeElement.appendChild(content);
    
    // Add event listeners
    nodeElement.addEventListener('click', (e) => {
        e.stopPropagation();
        selectSimpleNode(node.id);
    });
    
    nodeElement.addEventListener('dblclick', (e) => {
        e.stopPropagation();
        editNodeText(nodeElement, node);
    });
    
    // Add drag functionality
    addDragFunctionality(nodeElement, node);
    
    // Add to DOM
    container.appendChild(nodeElement);
}

/**
 * Add drag functionality to a node
 */
function addDragFunctionality(element, node) {
    let isDragging = false;
    let startX, startY;
    let originalX, originalY;
    
    element.addEventListener('mousedown', startDrag);
    element.addEventListener('touchstart', startDrag, { passive: false });
    
    function startDrag(e) {
        e.stopPropagation();
        if (e.type === 'touchstart') e.preventDefault();
        
        isDragging = true;
        
        // Store start position
        if (e.type === 'touchstart') {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
        } else {
            startX = e.clientX;
            startY = e.clientY;
        }
        
        // Store original node position
        originalX = node.x;
        originalY = node.y;
        
        // Add move and end listeners
        document.addEventListener('mousemove', onDrag);
        document.addEventListener('touchmove', onDrag, { passive: false });
        document.addEventListener('mouseup', stopDrag);
        document.addEventListener('touchend', stopDrag);
        
        // Add dragging class
        element.classList.add('dragging');
    }
    
    function onDrag(e) {
        if (!isDragging) return;
        
        e.preventDefault();
        
        // Get current position
        let currentX, currentY;
        if (e.type === 'touchmove') {
            currentX = e.touches[0].clientX;
            currentY = e.touches[0].clientY;
        } else {
            currentX = e.clientX;
            currentY = e.clientY;
        }
        
        // Calculate new position
        const deltaX = currentX - startX;
        const deltaY = currentY - startY;
        
        // Update node position data
        node.x = originalX + deltaX;
        node.y = originalY + deltaY;
        
        // Update element position
        element.style.left = `${node.x}px`;
        element.style.top = `${node.y}px`;
        
        // Update connections
        renderSimpleConnections();
    }
    
    function stopDrag() {
        if (!isDragging) return;
        
        isDragging = false;
        element.classList.remove('dragging');
        
        // Remove event listeners
        document.removeEventListener('mousemove', onDrag);
        document.removeEventListener('touchmove', onDrag);
        document.removeEventListener('mouseup', stopDrag);
        document.removeEventListener('touchend', stopDrag);
        
        // Save to history
        saveToHistory('Move node');
    }
}

/**
 * Allow editing the text of a node
 */
function editNodeText(nodeElement, node) {
    // Find content element
    const contentDiv = nodeElement.querySelector('.mindmap-node-content');
    if (!contentDiv) return;
    
    // Hide content div
    contentDiv.style.display = 'none';
    
    // Create input element
    const input = document.createElement('input');
    input.type = 'text';
    input.value = node.text;
    input.className = 'mindmap-node-edit';
    input.style.width = '90%';
    input.style.padding = '5px';
    input.style.border = 'none';
    input.style.textAlign = 'center';
    input.style.backgroundColor = 'white';
    input.style.color = '#333';
    input.style.borderRadius = '4px';
    
    // Add input to node
    nodeElement.appendChild(input);
    input.focus();
    input.select();
    
    // Handle input events
    function saveText() {
        const newText = input.value.trim() || node.text;
        node.text = newText;
        contentDiv.textContent = newText;
        contentDiv.style.display = '';
        input.remove();
        
        // Save to history
        saveToHistory('Edit node text');
    }
    
    input.addEventListener('blur', saveText);
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            saveText();
        } else if (e.key === 'Escape') {
            e.preventDefault();
            contentDiv.style.display = '';
            input.remove();
        }
    });
}

/**
 * Select a node in the mind map
 */
function selectSimpleNode(nodeId) {
    // Find the node
    const node = mindmapNodes.find(n => n.id === nodeId);
    if (!node) return;
    
    // Update selected node
    selectedMindmapNode = node;
    
    // Update UI
    deselectAllNodes();
    
    const nodeElement = document.querySelector(`.mindmap-node[data-id="${nodeId}"]`);
    if (nodeElement) {
        nodeElement.classList.add('selected');
        nodeElement.style.boxShadow = '0 0 0 3px white, 0 0 0 5px #3a36e0';
    }
    
    // Highlight connections
    highlightConnections(nodeId);
    
    // Update buttons
    document.getElementById('add-child-node').disabled = false;
    document.getElementById('remove-node').disabled = false;
    
    console.log("Selected node:", node);
}

/**
 * Deselect all nodes
 */
function deselectAllNodes() {
    document.querySelectorAll('.mindmap-node').forEach(n => {
        n.classList.remove('selected');
        n.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
    });
    
    document.querySelectorAll('.mindmap-connection').forEach(c => {
        c.classList.remove('highlighted');
        c.setAttribute('stroke-width', '2');
    });
    
    // Disable buttons
    if (!selectedMindmapNode) {
        document.getElementById('add-child-node').disabled = true;
        document.getElementById('remove-node').disabled = true;
    }
}

/**
 * Highlight connections related to a node
 */
function highlightConnections(nodeId) {
    // Reset all connections first
    document.querySelectorAll('.mindmap-connection').forEach(conn => {
        conn.classList.remove('highlighted');
        conn.setAttribute('stroke-width', '2');
        conn.setAttribute('stroke', '#7e74f1');
    });
    
    // Highlight connections for this node
    document.querySelectorAll(`.mindmap-connection[data-from="${nodeId}"], .mindmap-connection[data-to="${nodeId}"]`).forEach(conn => {
        conn.classList.add('highlighted');
        conn.setAttribute('stroke-width', '3');
        conn.setAttribute('stroke', '#3a36e0');
    });
}

/**
 * Render all connections in the mind map
 */
function renderSimpleConnections() {
    // Get or create SVG container
    let svg = document.querySelector('.mindmap-connections');
    if (!svg) {
        const container = document.getElementById('mindmap-container');
        if (!container) return;
        
        svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.classList.add('mindmap-connections');
        svg.style.position = 'absolute';
        svg.style.top = '0';
        svg.style.left = '0';
        svg.style.width = '100%';
        svg.style.height = '100%';
        svg.style.pointerEvents = 'none';
        svg.style.zIndex = '5';
        container.appendChild(svg);
    }
    
    // Clear existing connections
    svg.innerHTML = '';
    
    // Draw each connection
    mindmapConnections.forEach(conn => {
        const fromNode = mindmapNodes.find(n => n.id === conn.from);
        const toNode = mindmapNodes.find(n => n.id === conn.to);
        
        if (!fromNode || !toNode) return;
        
        // Calculate center points
        let fromX, fromY, toX, toY;
        
        if (fromNode.isRoot) {
            fromX = fromNode.x + 75; // Half of root node width (150px)
            fromY = fromNode.y + 75; // Half of root node height (150px)
        } else {
            fromX = fromNode.x + 60; // Half of normal node width (120px)
            fromY = fromNode.y + 20; // Approximate half height
        }
        
        if (toNode.isRoot) {
            toX = toNode.x + 75; 
            toY = toNode.y + 75;
        } else {
            toX = toNode.x + 60;
            toY = toNode.y + 20;
        }
        
        // Create line element
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', fromX);
        line.setAttribute('y1', fromY);
        line.setAttribute('x2', toX);
        line.setAttribute('y2', toY);
        line.setAttribute('stroke', '#7e74f1');
        line.setAttribute('stroke-width', '2');
        line.setAttribute('data-from', conn.from);
        line.setAttribute('data-to', conn.to);
        line.classList.add('mindmap-connection');
        
        // Highlight if selected
        if (selectedMindmapNode && (conn.from === selectedMindmapNode.id || conn.to === selectedMindmapNode.id)) {
            line.classList.add('highlighted');
            line.setAttribute('stroke-width', '3');
            line.setAttribute('stroke', '#3a36e0');
        }
        
        svg.appendChild(line);
    });
}

/**
 * Save current state to history
 */
function saveToHistory(action) {
    console.log(`Saving to history: ${action}`);
    
    // Create a deep copy of the current state
    const stateCopy = {
        nodes: JSON.parse(JSON.stringify(mindmapNodes)),
        connections: JSON.parse(JSON.stringify(mindmapConnections)),
        counter: mindmapNodeCounter,
        action: action || 'State change'
    };
    
    // If we're not at the end of the history, remove future states
    if (mindmapHistoryIndex < mindmapHistory.length - 1) {
        mindmapHistory = mindmapHistory.slice(0, mindmapHistoryIndex + 1);
    }
    
    // Add the new state to history
    mindmapHistory.push(stateCopy);
    
    // Limit history size
    if (mindmapHistory.length > MAX_HISTORY) {
        mindmapHistory.shift();
        // Adjust the index if we removed items
        mindmapHistoryIndex = Math.max(0, mindmapHistoryIndex - 1);
    }
    
    // Update index to point to the latest state
    mindmapHistoryIndex = mindmapHistory.length - 1;
    
    // Update undo/redo button states
    updateUndoRedoButtons();
    
    console.log(`History updated: ${mindmapHistoryIndex + 1}/${mindmapHistory.length} states`);
}

/**
 * Undo the last action
 */
function undoAction() {
    console.log('Undoing action...');
    
    // Debugging
    console.log(`Current history state: ${mindmapHistoryIndex + 1}/${mindmapHistory.length}`);
    
    // Check if we have history to go back to
    if (mindmapHistoryIndex <= 0 || mindmapHistory.length === 0) {
        console.log('Nothing to undo');
        return;
    }
    
    // Go back one step in history
    mindmapHistoryIndex--;
    
    // Restore the state
    const state = mindmapHistory[mindmapHistoryIndex];
    if (state) {
        restoreState(state);
        console.log(`Undid: ${state.action} (Now at state ${mindmapHistoryIndex + 1}/${mindmapHistory.length})`);
    } else {
        console.error('Invalid history state at index:', mindmapHistoryIndex);
        // Reset history if it's corrupted
        mindmapHistoryIndex = -1;
        mindmapHistory = [];
        saveToHistory('Reset after invalid state');
    }
    
    // Update undo/redo button states
    updateUndoRedoButtons();
}

/**
 * Redo the last undone action
 */
function redoAction() {
    console.log('Redoing action...');
    
    // Check if we have future states to go to
    if (mindmapHistoryIndex >= mindmapHistory.length - 1 || mindmapHistory.length === 0) {
        console.log('Nothing to redo');
        return;
    }
    
    // Go forward one step in history
    mindmapHistoryIndex++;
    
    // Restore the state
    const state = mindmapHistory[mindmapHistoryIndex];
    if (state) {
        restoreState(state);
        console.log(`Redid: ${state.action} (Now at state ${mindmapHistoryIndex + 1}/${mindmapHistory.length})`);
    } else {
        console.error('Invalid history state at index:', mindmapHistoryIndex);
        // Reset if corrupted
        saveToHistory('Reset after invalid state');
    }
    
    // Update undo/redo button states
    updateUndoRedoButtons();
}

/**
 * Update undo/redo button states
 */
function updateUndoRedoButtons() {
    const undoBtn = document.getElementById('undo-mindmap');
    const redoBtn = document.getElementById('redo-mindmap');
    
    if (undoBtn) {
        undoBtn.disabled = mindmapHistoryIndex <= 0 || mindmapHistory.length <= 1;
        // Add visual indication
        if (undoBtn.disabled) {
            undoBtn.classList.add('disabled');
        } else {
            undoBtn.classList.remove('disabled');
        }
    }
    
    if (redoBtn) {
        redoBtn.disabled = mindmapHistoryIndex >= mindmapHistory.length - 1 || mindmapHistory.length <= 1;
        // Add visual indication
        if (redoBtn.disabled) {
            redoBtn.classList.add('disabled');
        } else {
            redoBtn.classList.remove('disabled');
        }
    }
    
    console.log(`Button states updated: Undo ${undoBtn ? (undoBtn.disabled ? 'disabled' : 'enabled') : 'not found'}, Redo ${redoBtn ? (redoBtn.disabled ? 'disabled' : 'enabled') : 'not found'}`);
}

/**
 * Restore a previous state
 */
function restoreState(state) {
    if (!state) {
        console.error("Invalid state provided to restoreState");
        return;
    }
    
    try {
        // Restore saved state
        mindmapNodes = state.nodes;
        mindmapConnections = state.connections;
        mindmapNodeCounter = state.counter;
        selectedMindmapNode = null;
        
        // Clear the container and redraw everything
        const container = document.getElementById('mindmap-container');
        if (!container) {
            console.error("Mindmap container not found");
            return;
        }
        
        console.log(`Restoring state: ${state.action} with ${state.nodes.length} nodes and ${state.connections.length} connections`);
        
        // Clear container
        container.innerHTML = '';
        
        // Add connection SVG
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.classList.add('mindmap-connections');
        svg.style.position = 'absolute';
        svg.style.top = '0';
        svg.style.left = '0';
        svg.style.width = '100%';
        svg.style.height = '100%';
        svg.style.pointerEvents = 'none';
        svg.style.zIndex = '5';
        container.appendChild(svg);
        
        // Render all nodes
        mindmapNodes.forEach(node => {
            renderSimpleNode(node);
        });
        
        // Render all connections
        renderSimpleConnections();
        
        // Update UI state
        document.getElementById('add-child-node').disabled = true;
        document.getElementById('remove-node').disabled = true;
        
    } catch (error) {
        console.error("Error restoring state:", error);
    }
}

// Initialize the mind map when the document loads
window.addEventListener('load', initSimpleMindMap);
