// DOM Helper Functions
const domHelpers = {
    // Create an element with optional attributes and child elements
    createElement(tag, attributes = {}, children = []) {
        if (!tag) {
            console.error('Tag name is required for createElement');
            return document.createDocumentFragment();
        }
        
        const element = document.createElement(tag);
        
        // Set attributes
        Object.entries(attributes).forEach(([key, value]) => {
            if (key === 'textContent') {
                element.textContent = value;
            } else if (key === 'innerHTML') {
                element.innerHTML = value;
            } else if (key === 'className' || key === 'class') {
                element.className = value;
            } else {
                element.setAttribute(key, value);
            }
        });
        
        // Append children
        if (Array.isArray(children)) {
            children.forEach(child => {
                if (typeof child === 'string') {
                    element.appendChild(document.createTextNode(child));
                } else if (child instanceof Node) {
                    element.appendChild(child);
                }
            });
        }
        
        return element;
    },
    
    // Remove all children from an element
    clearElement(element) {
        if (!element || !(element instanceof Element)) {
            console.error('Valid element is required for clearElement');
            return null;
        }
        
        while (element.firstChild) {
            element.removeChild(element.firstChild);
        }
        return element;
    },
    
    // Add event listener with delegation - FIXED to allow document as parent
    addEventDelegate(parent, eventType, selector, callback) {
        if (!parent || (!(parent instanceof Element) && !(parent instanceof Document))) {
            console.error('Valid parent element is required for addEventDelegate');
            return;
        }
        
        if (!eventType || typeof eventType !== 'string') {
            console.error('Valid event type is required for addEventDelegate');
            return;
        }
        
        if (!selector || typeof selector !== 'string') {
            console.error('Valid selector is required for addEventDelegate');
            return;
        }
        
        if (!callback || typeof callback !== 'function') {
            console.error('Valid callback function is required for addEventDelegate');
            return;
        }
        
        parent.addEventListener(eventType, event => {
            const target = event.target.closest(selector);
            if (target && parent.contains(target)) {
                callback(event, target);
            }
        });
    },
    
    // Create a document fragment with multiple elements
    createFragment(elements = []) {
        const fragment = document.createDocumentFragment();
        
        elements.forEach(element => {
            if (element instanceof Node) {
                fragment.appendChild(element);
            }
        });
        
        return fragment;
    }
};