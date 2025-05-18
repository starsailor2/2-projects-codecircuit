// JSON Viewer/Editor Functionality
let jsonData = null;
let isAllCollapsed = false;

function initJsonViewer() {
    document.getElementById('parse-json-btn').addEventListener('click', parseJson);
    document.getElementById('format-json-btn').addEventListener('click', formatJson);
    document.getElementById('collapse-json-btn').addEventListener('click', collapseAllNodes);
    document.getElementById('expand-json-btn').addEventListener('click', expandAllNodes);
}

function parseJson() {
    const jsonInput = document.getElementById('json-input').value.trim();
    const jsonOutput = document.getElementById('json-output');
    
    if (!jsonInput) {
        jsonOutput.innerHTML = '<div class="error">Please enter JSON data</div>';
        return;
    }
    
    try {
        jsonData = JSON.parse(jsonInput);
        renderJsonView(jsonData, jsonOutput);
    } catch (error) {
        jsonOutput.innerHTML = `<div class="error">Invalid JSON: ${error.message}</div>`;
    }
}

function formatJson() {
    const jsonInput = document.getElementById('json-input');
    const value = jsonInput.value.trim();
    
    if (!value) return;
    
    try {
        const parsed = JSON.parse(value);
        jsonInput.value = JSON.stringify(parsed, null, 2);
    } catch (error) {
        alert('Invalid JSON: ' + error.message);
    }
}

function renderJsonView(data, container) {
    container.innerHTML = '';
    
    if (data === null) {
        container.innerHTML = '<span class="json-null">null</span>';
        return;
    }
    
    if (Array.isArray(data)) {
        renderArray(data, container);
    } else if (typeof data === 'object') {
        renderObject(data, container);
    } else {
        container.innerHTML = formatPrimitive(data);
    }
}

function renderObject(obj, container) {
    const objContainer = document.createElement('div');
    
    const header = document.createElement('div');
    header.className = 'collapsible';
    header.innerHTML = '<span>{</span>';
    header.addEventListener('click', toggleCollapse);
    
    const content = document.createElement('div');
    content.className = 'collapsible-content';
    
    // Add each property
    Object.keys(obj).forEach((key, index) => {
        const property = document.createElement('div');
        property.style.marginLeft = '20px';
        
        const keySpan = document.createElement('span');
        keySpan.className = 'json-key';
        keySpan.textContent = `"${key}"`;
        
        property.appendChild(keySpan);
        property.innerHTML += ': ';
        
        const valueContainer = document.createElement('span');
        property.appendChild(valueContainer);
        
        if (typeof obj[key] === 'object' && obj[key] !== null) {
            if (Array.isArray(obj[key])) {
                renderArray(obj[key], valueContainer);
            } else {
                renderObject(obj[key], valueContainer);
            }
        } else {
            valueContainer.innerHTML = formatPrimitive(obj[key]);
        }
        
        if (index < Object.keys(obj).length - 1) {
            property.innerHTML += ',';
        }
        
        content.appendChild(property);
    });
    
    const footer = document.createElement('div');
    footer.textContent = '}';
    footer.style.marginLeft = '0px';
    
    objContainer.appendChild(header);
    objContainer.appendChild(content);
    objContainer.appendChild(footer);
    container.appendChild(objContainer);
}

function renderArray(arr, container) {
    const arrContainer = document.createElement('div');
    
    const header = document.createElement('div');
    header.className = 'collapsible';
    header.innerHTML = '<span>[</span>';
    header.addEventListener('click', toggleCollapse);
    
    const content = document.createElement('div');
    content.className = 'collapsible-content';
    
    // Add each item
    arr.forEach((item, index) => {
        const itemElement = document.createElement('div');
        itemElement.style.marginLeft = '20px';
        
        const valueContainer = document.createElement('span');
        itemElement.appendChild(valueContainer);
        
        if (typeof item === 'object' && item !== null) {
            if (Array.isArray(item)) {
                renderArray(item, valueContainer);
            } else {
                renderObject(item, valueContainer);
            }
        } else {
            valueContainer.innerHTML = formatPrimitive(item);
        }
        
        if (index < arr.length - 1) {
            itemElement.innerHTML += ',';
        }
        
        content.appendChild(itemElement);
    });
    
    const footer = document.createElement('div');
    footer.textContent = ']';
    footer.style.marginLeft = '0px';
    
    arrContainer.appendChild(header);
    arrContainer.appendChild(content);
    arrContainer.appendChild(footer);
    container.appendChild(arrContainer);
}

function formatPrimitive(value) {
    if (typeof value === 'string') {
        return `<span class="json-string">"${escapeHtml(value)}"</span>`;
    }
    if (typeof value === 'number') {
        return `<span class="json-number">${value}</span>`;
    }
    if (typeof value === 'boolean') {
        return `<span class="json-boolean">${value}</span>`;
    }
    if (value === null) {
        return `<span class="json-null">null</span>`;
    }
    return escapeHtml(String(value));
}

function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function toggleCollapse(event) {
    const content = event.currentTarget.nextElementSibling;
    content.style.display = content.style.display === 'none' ? 'block' : 'none';
}

function collapseAllNodes() {
    const contents = document.querySelectorAll('.collapsible-content');
    contents.forEach(content => {
        content.style.display = 'none';
    });
    isAllCollapsed = true;
}

function expandAllNodes() {
    const contents = document.querySelectorAll('.collapsible-content');
    contents.forEach(content => {
        content.style.display = 'block';
    });
    isAllCollapsed = false;
}
