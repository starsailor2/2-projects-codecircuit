// Mind Map Builder Functionality - Complete Rewrite
// This implementation ensures all functionality works properly

// State management
let nodes = [];
let connections = [];
let selectedNode = null;
let nodeIdCounter = 1;
let mindMapHistory = new HistoryManager(20);
let isDragging = false;
let dragOffset = { x: 0, y: 0 };
let isEditingText = false;

/**
 * Initialize the mind map component
 */
function initMindMap() {
    // Setup event listeners for all the button controls
    document.getElementById('add-root-node').addEventListener('click', addRootNode);
    document.getElementById('add-child-node').addEventListener('click', addChildNode);
    document.getElementById('remove-node').addEventListener('click', removeSelectedNode);
    document.getElementById('clear-mindmap').addEventListener('click', clearMindmap);
    
    // Add undo/redo button handlers
    document.getElementById('undo-mindmap').addEventListener('click', undoMindMapAction);
    document.getElementById('redo-mindmap').addEventListener('click', redoMindMapAction);
    
    // Add export functionality
    document.getElementById('export-mindmap').addEventListener('click', exportMindMap);
    
    // Add print functionality
    document.getElementById('print-mindmap').addEventListener('click', printMindMap);
    
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
            selectedNode = null;
            updateNodeSelection();
            resetConnectionHighlights();
        }
    });
    
    // Load mind map from localStorage
    loadMindMap();
    
    // Add window resize handler to re-render connections
    window.addEventListener('resize', () => {
        requestAnimationFrame(() => {
            renderConnections();
        });
    });
    
    // Show welcome message if no nodes exist
    if (nodes.length === 0) {
        showNotification('Add a root node to start your mind map', 'info');
    }
    
    // Render the initial state
    renderMindMap();
}

/**
 * Handle undo operation
 */
function undoMindMapAction() {
    const previousState = mindMapHistory.undo();
    if (previousState) {
        // Restore previous state
        nodes = previousState.nodes;
        connections = previousState.connections;
        nodeIdCounter = previousState.nodeIdCounter;
        selectedNode = null; // Reset selection on undo
        
        renderMindMap();
        updateNodeSelection();
        saveMindMap();
        
        // Show notification
        showNotification('Undo: ' + mindMapHistory.getUndoDescription());
    } else {
        showNotification('Nothing to undo', 'info');
    }
}

/**
 * Handle redo operation
 */
function redoMindMapAction() {
    const futureState = mindMapHistory.redo();
    if (futureState) {
        // Restore future state
        nodes = futureState.nodes;
        connections = futureState.connections;
        nodeIdCounter = futureState.nodeIdCounter;
        selectedNode = null; // Reset selection on redo
        
        renderMindMap();
        updateNodeSelection();
        saveMindMap();
        
        // Show notification
        showNotification('Redo: ' + mindMapHistory.getRedoDescription());
    } else {
        showNotification('Nothing to redo', 'info');
    }
}

/**
 * Save current state to history
 */
function saveToHistory(actionDescription) {
    mindMapHistory.addState({
        nodes: JSON.parse(JSON.stringify(nodes)), 
        connections: JSON.parse(JSON.stringify(connections)),
        nodeIdCounter: nodeIdCounter
    }, actionDescription);
}

/**
 * Add a root node to the mind map
 */
function addRootNode() {
    // Save current state before adding
    saveToHistory('Add root node');
    
    const container = document.getElementById('mindmap-container');
    
    // Create a new node at the center
    const nodeId = nodeIdCounter++;
    const node = {
        id: nodeId,
        text: `What's your main idea or topic?`,
        x: container.clientWidth / 2 - 100,
        y: container.clientHeight / 2 - 30,
        parentId: null,
        type: 'root'
    };
    
    nodes.push(node);
    renderNode(node);
    selectNode(nodeId);
    saveMindMap();
    
    // Auto start editing the new node
    setTimeout(() => {
        startNodeEdit(nodeId);
    }, 100);
}

/**
 * Add a child node to the currently selected node
 */
function addChildNode() {
    if (!selectedNode) {
        showNotification('Select a node first to add a child', 'error');
        return;
    }
    
    // Save current state before adding
    saveToHistory('Add child node');
    
    const parentNode = selectedNode;
    const nodeId = nodeIdCounter++;
    
    // Determine node type based on parent type
    let nodeType = 'sub-idea';
    let nodeText = 'Add a related idea';
    
    if (parentNode.type === 'root') {
        nodeType = 'main-idea';
        nodeText = 'Add an awesome idea here';
    }
    
    // Calculate position for the new node
    const siblings = nodes.filter(n => n.parentId === parentNode.id);
    const angle = siblings.length * (Math.PI / 4) - Math.PI / 2;
    
    let distanceMultiplier = 1.0;
    if (parentNode.type === 'root') {
        distanceMultiplier = 1.5; // Greater distance from root
    }
    
    const distance = 150 * distanceMultiplier;
    const x = parentNode.x + Math.cos(angle) * distance;
    const y = parentNode.y + Math.sin(angle) * distance;
    
    // Create the node
    const node = {
        id: nodeId,
        text: nodeText,
        x: x,
        y: y,
        parentId: parentNode.id,
        type: nodeType
    };
    
    nodes.push(node);
    
    // Create a connection between parent and new node
    const connection = {
        id: `conn-${parentNode.id}-${nodeId}`,
        fromId: parentNode.id,
        toId: nodeId
    };
    connections.push(connection);
    
    renderMindMap();
    selectNode(nodeId);
    saveMindMap();
    
    // Auto start editing the new node
    setTimeout(() => {
        startNodeEdit(nodeId);
    }, 100);
}

/**
 * Remove the currently selected node and all its children
 */
function removeSelectedNode() {
    if (!selectedNode) {
        showNotification('Select a node first to remove it', 'error');
        return;
    }
    
    // Save current state before deletion
    saveToHistory('Remove node');
    
    // Get all child nodes to remove
    const nodeIdsToRemove = getNodeAndAllChildren(selectedNode.id);
    
    // Remove all connections involving these nodes
    connections = connections.filter(conn => 
        !nodeIdsToRemove.includes(conn.fromId) && !nodeIdsToRemove.includes(conn.toId)
    );
    
    // Remove the nodes
    nodes = nodes.filter(node => !nodeIdsToRemove.includes(node.id));
    
    // Reset selection
    selectedNode = null;
    
    renderMindMap();
    updateNodeSelection();
    saveMindMap();
    
    showNotification('Node and its children removed', 'info');
}

/**
 * Get a node and all its descendant node IDs
 */
function getNodeAndAllChildren(nodeId) {
    const result = [nodeId];
    
    // Find all direct children
    const childNodes = nodes.filter(n => n.parentId === nodeId);
    
    // Recursively get their children too
    for (const child of childNodes) {
        result.push(...getNodeAndAllChildren(child.id));
    }
    
    return result;
}

/**
 * Clear the entire mind map
 */
function clearMindmap() {
    if (nodes.length === 0) {
        showNotification('Mind map is already empty', 'info');
        return;
    }
    
    if (confirm('Are you sure you want to clear the entire mind map?')) {
        // Save current state before clearing
        saveToHistory('Clear mind map');
        
        nodes = [];
        connections = [];
        selectedNode = null;
        
        renderMindMap();
        updateNodeSelection();
        saveMindMap();
        
        showNotification('Mind map cleared', 'info');
    }
}

/**
 * Start editing a node's text
 */
function startNodeEdit(nodeId) {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;
    
    const nodeElement = document.querySelector(`.mindmap-node[data-id="${nodeId}"]`);
    if (!nodeElement) return;
    
    isEditingText = true;
    
    // Find the label element
    const labelElement = nodeElement.querySelector('.mindmap-node-text');
    if (!labelElement) return;
    
    // Replace the label with an input
    const originalText = node.text;
    labelElement.innerHTML = '';
    
    const input = document.createElement('input');
    input.type = 'text';
    input.value = originalText;
    input.className = 'mindmap-node-edit';
    input.style.width = '100%';
    input.style.border = 'none';
    input.style.background = 'transparent';
    input.style.textAlign = 'center';
    input.style.outline = 'none';
    input.style.fontFamily = 'inherit';
    input.style.fontSize = 'inherit';
    
    labelElement.appendChild(input);
    input.focus();
    input.select();
    
    // Save text on blur or enter key
    input.addEventListener('blur', () => {
        stopNodeEdit(false, input.value, nodeId, originalText);
    });
    
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            stopNodeEdit(false, input.value, nodeId, originalText);
        } else if (e.key === 'Escape') {
            e.preventDefault();
            stopNodeEdit(true, originalText, nodeId, originalText);
        }
    });
}

/**
 * Stop editing a node's text
 */
function stopNodeEdit(cancelled, newText, nodeId, originalText) {
    isEditingText = false;
    
    if (cancelled) {
        renderMindMap();
        return;
    }
    
    // Update the node text if it changed
    newText = newText.trim();
    if (newText !== originalText && newText !== '') {
        // Save state before update
        saveToHistory('Edit node text');
        
        // Find and update the node
        const nodeIndex = nodes.findIndex(n => n.id === nodeId);
        if (nodeIndex !== -1) {
            nodes[nodeIndex].text = newText;
            saveMindMap();
        }
    }
    
    renderMindMap();
    selectNode(nodeId);
}

/**
 * Select a node
 */
function selectNode(nodeId) {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;
    
    selectedNode = node;
    updateNodeSelection();
    highlightConnections(nodeId);
    
    // Enable/disable buttons based on selection
    document.getElementById('add-child-node').disabled = false;
    document.getElementById('remove-node').disabled = false;
}

/**
 * Update UI to reflect the selected node
 */
function updateNodeSelection() {
    // Remove previous selection styling
    document.querySelectorAll('.mindmap-node').forEach(el => {
        el.classList.remove('selected');
    });
    
    // Add new selection styling
    if (selectedNode) {
        const nodeElement = document.querySelector(`.mindmap-node[data-id="${selectedNode.id}"]`);
        if (nodeElement) {
            nodeElement.classList.add('selected');
        }
        
        // Enable buttons
        document.getElementById('add-child-node').disabled = false;
        document.getElementById('remove-node').disabled = false;
    } else {
        // Disable buttons
        document.getElementById('add-child-node').disabled = true;
        document.getElementById('remove-node').disabled = true;
    }
}

/**
 * Highlight connections related to a node
 */
function highlightConnections(nodeId) {
    // Reset all connections first
    resetConnectionHighlights();
    
    // Highlight direct connections
    document.querySelectorAll(`.mindmap-connection[data-from="${nodeId}"], .mindmap-connection[data-to="${nodeId}"]`)
        .forEach(conn => {
            conn.classList.add('highlighted');
        });
}

/**
 * Reset connection highlights
 */
function resetConnectionHighlights() {
    document.querySelectorAll('.mindmap-connection').forEach(conn => {
        conn.classList.remove('highlighted');
    });
}

/**
 * Search the mind map for nodes containing the search text
 */
function searchMindMap() {
    const searchInput = document.getElementById('mindmap-search-input');
    const searchText = searchInput.value.trim().toLowerCase();
    
    if (!searchText) {
        showNotification('Enter search text first', 'error');
        searchInput.focus();
        return;
    }
    
    // Clear previous highlights
    document.querySelectorAll('.mindmap-search-highlight').forEach(el => {
        el.classList.remove('mindmap-search-highlight');
    });
    
    // Find matching nodes
    const matchingNodes = nodes.filter(node => 
        node.text.toLowerCase().includes(searchText)
    );
    
    if (matchingNodes.length === 0) {
        showNotification(`No matches found for "${searchText}"`, 'info');
        return;
    }
    
    // Highlight matching nodes
    matchingNodes.forEach(node => {
        const nodeElement = document.querySelector(`.mindmap-node[data-id="${node.id}"]`);
        if (nodeElement) {
            nodeElement.classList.add('mindmap-search-highlight');
        }
    });
    
    // Select the first matching node
    selectNode(matchingNodes[0].id);
    
    showNotification(`Found ${matchingNodes.length} matches`, 'success');
}

/**
 * Render the complete mind map
 */
function renderMindMap() {
    const container = document.getElementById('mindmap-container');
    container.innerHTML = '';
    
    // Create SVG element for connections
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'mindmap-connections');
    svg.style.position = 'absolute';
    svg.style.top = '0';
    svg.style.left = '0';
    svg.style.width = '100%';
    svg.style.height = '100%';
    svg.style.pointerEvents = 'none';
    svg.style.zIndex = '1';
    container.appendChild(svg);
    
    // Render all nodes
    nodes.forEach(node => renderNode(node));
    
    // Render all connections
    renderConnections();
}

/**
 * Render a single node
 */
function renderNode(node) {
    const container = document.getElementById('mindmap-container');
    
    // Create node element if it doesn't already exist
    let nodeElement = document.querySelector(`.mindmap-node[data-id="${node.id}"]`);
    
    if (!nodeElement) {
        nodeElement = document.createElement('div');
        nodeElement.className = 'mindmap-node';
        nodeElement.setAttribute('data-id', node.id);
        
        // Add node type class
        nodeElement.classList.add(`mindmap-node-${node.type || 'default'}`);
        
        // Create text content
        const textElement = document.createElement('div');
        textElement.className = 'mindmap-node-text';
        textElement.textContent = node.text;
        nodeElement.appendChild(textElement);
        
        // Add event listeners
        nodeElement.addEventListener('click', (e) => {
            e.stopPropagation();
            selectNode(node.id);
        });
        
        nodeElement.addEventListener('dblclick', (e) => {
            e.stopPropagation();
            startNodeEdit(node.id);
        });
        
        // Make node draggable
        nodeElement.addEventListener('mousedown', (e) => {
            if (isEditingText) return;
            
            e.preventDefault();
            selectNode(node.id);
            
            isDragging = true;
            dragOffset = {
                x: e.clientX - node.x,
                y: e.clientY - node.y
            };
            
            nodeElement.classList.add('dragging');
            
            document.addEventListener('mousemove', handleNodeDrag);
            document.addEventListener('mouseup', stopNodeDrag);
        });
        
        container.appendChild(nodeElement);
    }
    
    // Update node position and appearance
    nodeElement.style.left = `${node.x}px`;
    nodeElement.style.top = `${node.y}px`;
    
    // Style based on node type
    if (node.type === 'root') {
        nodeElement.style.backgroundColor = 'var(--primary-color)';
        nodeElement.style.color = '#fff';
        nodeElement.style.fontWeight = 'bold';
    } else if (node.type === 'main-idea') {
        nodeElement.style.backgroundColor = 'var(--accent-color)';
        nodeElement.style.color = '#fff';
    }
    
    // Apply selection if this is the selected node
    if (selectedNode && node.id === selectedNode.id) {
        nodeElement.classList.add('selected');
    } else {
        nodeElement.classList.remove('selected');
    }
}

/**
 * Handle node dragging
 */
function handleNodeDrag(e) {
    if (!isDragging || !selectedNode) return;
    
    // Save state before the first move (only once)
    if (!document.querySelector('.dragging')) {
        saveToHistory('Move node');
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
}

/**
 * Stop node dragging
 */
function stopNodeDrag() {
    if (!isDragging) return;
    
    isDragging = false;
    
    document.querySelectorAll('.mindmap-node').forEach(el => {
        el.classList.remove('dragging');
    });
    
    document.removeEventListener('mousemove', handleNodeDrag);
    document.removeEventListener('mouseup', stopNodeDrag);
    
    saveMindMap();
}

/**
 * Render all connections between nodes
 */
function renderConnections() {
    const svg = document.querySelector('.mindmap-connections');
    if (!svg) return;
    
    svg.innerHTML = '';
    
    connections.forEach(conn => {
        const fromNode = nodes.find(n => n.id === conn.fromId);
        const toNode = nodes.find(n => n.id === conn.toId);
        
        if (!fromNode || !toNode) return;
        
        // Calculate connector points
        const fromX = fromNode.x + 100; // Node width/2
        const fromY = fromNode.y + 30;  // Node height/2
        const toX = toNode.x + 100;     // Node width/2
        const toY = toNode.y + 30;      // Node height/2
        
        // Create line
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        
        // Calculate control points for a curved line
        const dx = toX - fromX;
        const dy = toY - fromY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // More curve for longer distances
        const curveIntensity = Math.min(distance * 0.5, 200);
        
        const midX = (fromX + toX) / 2;
        const midY = (fromY + toY) / 2;
        
        // For horizontal connections, curve vertically
        let cpX, cpY;
        if (Math.abs(dx) > Math.abs(dy)) {
            cpX = midX;
            cpY = midY - curveIntensity * 0.5;
        } else {
            cpX = midX + curveIntensity * 0.5;
            cpY = midY;
        }
        
        // Draw a quadratic curve
        const path = `M ${fromX} ${fromY} Q ${cpX} ${cpY} ${toX} ${toY}`;
        
        line.setAttribute('d', path);
        line.setAttribute('stroke', 'var(--text-color)');
        line.setAttribute('stroke-width', '2');
        line.setAttribute('fill', 'none');
        line.setAttribute('data-from', conn.fromId);
        line.setAttribute('data-to', conn.toId);
        line.setAttribute('class', 'mindmap-connection');
        
        // Add arrowhead
        const arrow = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        
        // Calculate the direction of the line at the end point
        // For quadratic curves, the tangent at endpoint t=1 is P2-P1
        const endTangentX = toX - cpX;
        const endTangentY = toY - cpY;
        
        // Normalize the tangent
        const len = Math.sqrt(endTangentX * endTangentX + endTangentY * endTangentY);
        const normX = endTangentX / len;
        const normY = endTangentY / len;
        
        // Create arrowhead points
        const arrowSize = 8;
        const arrowPoints = [
            [toX, toY],
            [toX - arrowSize * normX + arrowSize * normY * 0.5, toY - arrowSize * normY - arrowSize * normX * 0.5],
            [toX - arrowSize * normX - arrowSize * normY * 0.5, toY - arrowSize * normY + arrowSize * normX * 0.5]
        ].map(point => point.join(',')).join(' ');
        
        arrow.setAttribute('points', arrowPoints);
        arrow.setAttribute('fill', 'var(--text-color)');
        arrow.setAttribute('class', 'mindmap-arrow');
        arrow.setAttribute('data-from', conn.fromId);
        arrow.setAttribute('data-to', conn.toId);
        
        svg.appendChild(line);
        svg.appendChild(arrow);
    });
    
    // Highlight connections for selected node
    if (selectedNode) {
        highlightConnections(selectedNode.id);
    }
}

/**
 * Export the mind map as a PNG image
 */
function exportMindMap() {
    // Check if html2canvas is available, if not, load it
    if (typeof html2canvas === 'undefined') {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
        script.onload = generateMindMapImage;
        document.head.appendChild(script);
    } else {
        generateMindMapImage();
    }
    
    function generateMindMapImage() {
        const container = document.getElementById('mindmap-container');
        if (!container) return;
        
        // Show loading notification
        showNotification('Generating mind map image...', 'info');
        
        // Create a clean copy for export
        const exportContainer = container.cloneNode(true);
        exportContainer.style.width = container.offsetWidth + 'px';
        exportContainer.style.height = container.offsetHeight + 'px';
        exportContainer.style.position = 'absolute';
        exportContainer.style.top = '-9999px';
        exportContainer.style.backgroundColor = getComputedStyle(document.body).backgroundColor;
        
        // Add title
        const titleDiv = document.createElement('div');
        titleDiv.textContent = 'Mind Map';
        titleDiv.style.position = 'absolute';
        titleDiv.style.top = '10px';
        titleDiv.style.left = '10px';
        titleDiv.style.fontSize = '24px';
        titleDiv.style.fontWeight = 'bold';
        titleDiv.style.color = 'var(--text-color)';
        exportContainer.appendChild(titleDiv);
        
        document.body.appendChild(exportContainer);
        
        html2canvas(exportContainer, {
            backgroundColor: getComputedStyle(document.body).backgroundColor,
            scale: 2
        }).then(canvas => {
            // Remove the temporary container
            document.body.removeChild(exportContainer);
            
            // Create download link
            const link = document.createElement('a');
            link.download = 'mindmap-' + new Date().toISOString().slice(0, 10) + '.png';
            link.href = canvas.toDataURL('image/png');
            link.click();
            
            showNotification('Mind map exported as PNG', 'success');
        }).catch(err => {
            console.error('Error exporting mind map:', err);
            showNotification('Error exporting mind map', 'error');
        });
    }
}

/**
 * Print the mind map
 */
function printMindMap() {
    // Check if html2canvas is available, if not, load it
    if (typeof html2canvas === 'undefined') {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
        script.onload = preparePrint;
        document.head.appendChild(script);
    } else {
        preparePrint();
    }
    
    function preparePrint() {
        const container = document.getElementById('mindmap-container');
        if (!container) return;
        
        // Show loading notification
        showNotification('Preparing mind map for printing...', 'info');
        
        // Create a clean copy for printing
        const printContainer = container.cloneNode(true);
        printContainer.style.width = '100%';
        printContainer.style.height = '100%';
        printContainer.style.position = 'static';
        printContainer.style.backgroundColor = '#fff';
        
        // Create print window
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
                <head>
                    <title>Mind Map</title>
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            margin: 0;
                            padding: 20px;
                        }
                        .mindmap-container {
                            position: relative;
                            width: 100%;
                            height: 650px;
                            overflow: visible;
                        }
                        .mindmap-node {
                            position: absolute;
                            padding: 10px 15px;
                            border-radius: 8px;
                            background-color: #f0f0f0;
                            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
                            min-width: 100px;
                            text-align: center;
                            cursor: default;
                            transition: transform 0.2s;
                            user-select: none;
                        }
                        .mindmap-node-root {
                            background-color: #4361ee;
                            color: white;
                            font-weight: bold;
                        }
                        .mindmap-node-main-idea {
                            background-color: #3a86ff;
                            color: white;
                        }
                        h1 {
                            margin-bottom: 20px;
                        }
                    </style>
                </head>
                <body>
                    <h1>Mind Map</h1>
                    <div id="print-container"></div>
                </body>
            </html>
        `);
        
        // Render HTML version to print window
        html2canvas(container, {
            backgroundColor: '#ffffff',
            scale: 1
        }).then(canvas => {
            const dataUrl = canvas.toDataURL('image/png');
            const img = new Image();
            img.src = dataUrl;
            img.style.maxWidth = '100%';
            
            printWindow.document.getElementById('print-container').appendChild(img);
            
            setTimeout(() => {
                printWindow.print();
                showNotification('Printing mind map', 'success');
            }, 500);
        }).catch(err => {
            console.error('Error rendering mind map for print:', err);
            printWindow.close();
            showNotification('Error preparing mind map for print', 'error');
        });
    }
}

/**
 * Save mind map to local storage
 */
function saveMindMap() {
    localStorage.setItem('mindMap', JSON.stringify({
        nodes,
        connections,
        nodeIdCounter
    }));
}

/**
 * Load mind map from local storage
 */
function loadMindMap() {
    try {
        const savedMap = JSON.parse(localStorage.getItem('mindMap'));
        if (savedMap) {
            nodes = savedMap.nodes || [];
            connections = savedMap.connections || [];
            nodeIdCounter = savedMap.nodeIdCounter || 1;
        }
    } catch (e) {
        console.error('Error loading mind map from localStorage:', e);
        nodes = [];
        connections = [];
        nodeIdCounter = 1;
    }
}

/**
 * Add touch support for mobile devices
 */
function enableTouchSupport() {
    const container = document.getElementById('mindmap-container');
    if (!container) return;
    
    // Touch handling for nodes
    container.addEventListener('touchstart', (e) => {
        if (isEditingText) return;
        
        const nodeElement = e.target.closest('.mindmap-node');
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
