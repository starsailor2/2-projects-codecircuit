// Helper functions for working with CSS variables and styling

/**
 * Converts a hex color to RGB format
 * @param {string} hex - Hex color code (e.g., #ff0000)
 * @returns {string} - RGB values as "r, g, b" string
 */
function hexToRgb(hex) {
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);
    
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? 
        `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : 
        "0, 0, 0";
}

/**
 * Adds RGB variables to root CSS for transparency support
 */
function addRGBVariables() {
    const root = document.documentElement;
    const style = getComputedStyle(root);
    
    // Add RGB versions of main colors for transparency support
    const colors = ['primary-color', 'secondary-color', 'accent-color', 'border-color'];
    
    colors.forEach(colorName => {
        const color = style.getPropertyValue(`--${colorName}`).trim();
        if (color) {
            root.style.setProperty(`--${colorName}-rgb`, hexToRgb(color));
        }
    });
}

/**
 * Fix display issues by enforcing critical CSS properties
 */
function fixComponentDisplay() {
    // Fix timezone selects
    const tzSelects = document.querySelectorAll('#from-timezone, #to-timezone');
    tzSelects.forEach(select => {
        if (select) {
            select.style.display = 'block';
            select.style.width = '100%';
            select.style.minHeight = '40px';
            select.style.padding = '8px';
            select.style.margin = '5px 0';
            select.style.border = '1px solid var(--border-color)';
            select.style.borderRadius = '4px';
        }
    });
    
    // Fix calendar day headers
    const dayHeaders = document.querySelectorAll('.day-header');
    dayHeaders.forEach(header => {
        if (header) {
            header.style.display = 'block';
            header.style.height = 'auto';
            header.style.padding = '10px';
            header.style.textAlign = 'center';
            header.style.borderBottom = '2px solid var(--border-color)';
            header.style.fontWeight = 'bold';
        }
    });
    
    // Fix mindmap container
    const mindmapContainer = document.getElementById('mindmap-container');
    if (mindmapContainer) {
        mindmapContainer.style.display = 'block';
        mindmapContainer.style.position = 'relative';
        mindmapContainer.style.minHeight = '500px';
        mindmapContainer.style.border = '1px solid var(--border-color)';
        mindmapContainer.style.margin = '20px 0';
        mindmapContainer.style.padding = '20px';
    }
}

// Add this to window load event
window.addEventListener('load', () => {
    addRGBVariables();
    
    // Wait a moment for components to render
    setTimeout(fixComponentDisplay, 500);
});
