// DOM Helper Functions
const domHelpers = {
    // Create an element with optional attributes and child elements
    createElement(tag, attributes = {}, children = []) {
        const element = document.createElement(tag);
        
        // Set attributes
        Object.entries(attributes).forEach(([key, value]) => {
            if (key === 'textContent') {
                element.textContent = value;
            } else if (key === 'innerHTML') {
                element.innerHTML = value;
            } else {
                element.setAttribute(key, value);
            }
        });
        
        // Append children
        children.forEach(child => {
            if (typeof child === 'string') {
                element.appendChild(document.createTextNode(child));
            } else if (child instanceof Node) {
                element.appendChild(child);
            }
        });
        
        return element;
    },
    
    // Remove all children from an element
    clearElement(element) {
        while (element.firstChild) {
            element.removeChild(element.firstChild);
        }
        return element;
    },
    
    // Add event listener with delegation
    addEventDelegate(parent, eventType, selector, callback) {
        parent.addEventListener(eventType, event => {
            const target = event.target.closest(selector);
            if (target && parent.contains(target)) {
                callback(event, target);
            }
        });
    }
};