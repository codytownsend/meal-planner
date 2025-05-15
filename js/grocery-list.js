// Grocery List Manager with updated categories and ingredient combining
const GroceryListManager = (() => {
    // Updated categories
    const CATEGORIES = {
        MEAT_SEAFOOD: 'Meat & Seafood',
        FRESH_PRODUCE: 'Fresh Produce',
        DELI: 'Deli',
        DAIRY_EGGS: 'Dairy & Eggs',
        BAKERY_BREAD: 'Bakery & Bread',
        FROZEN: 'Frozen',
        PANTRY: 'Pantry',
        BREAKFAST_CEREAL: 'Breakfast & Cereal',
        BAKING: 'Baking',
        SNACKS: 'Snacks',
        CANDY: 'Candy',
        BEVERAGES: 'Beverages',
        ALCOHOL: 'Alcohol'
    };

    // Category mapping from existing recipe data to new categories
    const CATEGORY_MAPPING = {
        'Meat': CATEGORIES.MEAT_SEAFOOD,
        'Seafood': CATEGORIES.MEAT_SEAFOOD,
        'Produce': CATEGORIES.FRESH_PRODUCE,
        'Deli': CATEGORIES.DELI,
        'Dairy': CATEGORIES.DAIRY_EGGS,
        'Bakery': CATEGORIES.BAKERY_BREAD,
        'Frozen': CATEGORIES.FROZEN,
        'Canned Goods': CATEGORIES.PANTRY,
        'Pasta & Rice': CATEGORIES.PANTRY,
        'Oils & Vinegars': CATEGORIES.PANTRY,
        'Condiments': CATEGORIES.PANTRY,
        'Spices': CATEGORIES.PANTRY,
        'Baking': CATEGORIES.BAKING
    };

    // Common units for parsing amounts
    const UNITS = {
        WEIGHT: ['lb', 'lbs', 'pound', 'pounds', 'oz', 'ounce', 'ounces', 'g', 'gram', 'grams', 'kg', 'kilogram', 'kilograms'],
        VOLUME: ['cup', 'cups', 'tbsp', 'tablespoon', 'tablespoons', 'tsp', 'teaspoon', 'teaspoons', 'ml', 'milliliter', 'milliliters', 'l', 'liter', 'liters', 'pint', 'pints', 'quart', 'quarts', 'gallon', 'gallons', 'fluid ounce', 'fluid ounces', 'fl oz'],
        COUNT: ['', 'piece', 'pieces', 'slice', 'slices', 'whole', 'pkg', 'package', 'packages', 'can', 'cans', 'bottle', 'bottles', 'jar', 'jars']
    };

    // DOM Elements
    const elements = {
        groceryList: null,
        generateButton: null,
        printButton: null,
        groceryView: null
    };

    // State 
    const state = {
        groceryItems: {}
    };

    // Initialize
    const init = () => {
        // Get DOM elements
        elements.groceryList = document.getElementById('grocery-list');
        elements.generateButton = document.getElementById('generate-grocery-list');
        elements.printButton = document.getElementById('print-grocery-list');
        elements.groceryView = document.getElementById('grocery-view');

        // Check if required elements exist
        if (!elements.groceryList) {
            console.error('Required grocery list elements not found');
            return;
        }

        setupEventListeners();
    };

    // Setup event listeners
    const setupEventListeners = () => {
        // Generate button
        if (elements.generateButton) {
            elements.generateButton.addEventListener('click', generateGroceryList);
        }

        // Print button
        if (elements.printButton) {
            elements.printButton.addEventListener('click', printGroceryList);
        }
    };

    // Map ingredient category to standardized category
    const mapCategory = (originalCategory) => {
        if (!originalCategory) return CATEGORIES.PANTRY; // Default
        
        // Check if there's a direct mapping
        const mappedCategory = CATEGORY_MAPPING[originalCategory];
        if (mappedCategory) return mappedCategory;
        
        // Try to find a partial match
        for (const [key, value] of Object.entries(CATEGORY_MAPPING)) {
            if (originalCategory.includes(key)) {
                return value;
            }
        }
        
        // Default to pantry if no match found
        return CATEGORIES.PANTRY;
    };

    // Parse ingredient amount into {quantity, unit}
    const parseAmount = (amountStr) => {
        if (!amountStr || typeof amountStr !== 'string') {
            return { quantity: 1, unit: '' };
        }
        
        // Clean up the amount string
        const cleanAmount = amountStr.trim().toLowerCase();
        
        // Handle empty case
        if (!cleanAmount) {
            return { quantity: 1, unit: '' };
        }
        
        // Regular expressions for different formats
        const fractionRegex = /^(\d+)\s*\/\s*(\d+)/;  // e.g., "1/2"
        const mixedFractionRegex = /^(\d+)\s+(\d+)\s*\/\s*(\d+)/;  // e.g., "1 1/2"
        const wholeNumberRegex = /^(\d+(\.\d+)?)/;  // e.g., "2" or "2.5"
        const rangeRegex = /^(\d+(\.\d+)?)\s*-\s*(\d+(\.\d+)?)/;  // e.g., "2-3"
        
        let quantity = 1;
        let unit = '';
        
        // Process the quantity part
        if (mixedFractionRegex.test(cleanAmount)) {
            // Mixed fraction (e.g., "1 1/2")
            const matches = cleanAmount.match(mixedFractionRegex);
            const whole = parseInt(matches[1]);
            const numerator = parseInt(matches[2]);
            const denominator = parseInt(matches[3]);
            quantity = whole + (numerator / denominator);
        } else if (fractionRegex.test(cleanAmount)) {
            // Simple fraction (e.g., "1/2")
            const matches = cleanAmount.match(fractionRegex);
            const numerator = parseInt(matches[1]);
            const denominator = parseInt(matches[2]);
            quantity = numerator / denominator;
        } else if (rangeRegex.test(cleanAmount)) {
            // Range (e.g., "2-3") - use the average
            const matches = cleanAmount.match(rangeRegex);
            const min = parseFloat(matches[1]);
            const max = parseFloat(matches[3]);
            quantity = (min + max) / 2;
        } else if (wholeNumberRegex.test(cleanAmount)) {
            // Whole number (e.g., "2")
            const matches = cleanAmount.match(wholeNumberRegex);
            quantity = parseFloat(matches[1]);
        }
        
        // Extract the unit
        // Remove the quantity part and trim
        let unitPart = cleanAmount.replace(/^\d+(\.\d+)?\s*\/\s*\d+/, '')  // Remove fraction
            .replace(/^\d+\s+\d+\s*\/\s*\d+/, '')  // Remove mixed fraction
            .replace(/^\d+(\.\d+)?/, '')  // Remove whole number
            .replace(/^\s*-\s*\d+(\.\d+)?/, '')  // Remove range end
            .trim();
        
        // Find the unit
        for (const [type, unitList] of Object.entries(UNITS)) {
            for (const u of unitList) {
                if (unitPart.startsWith(u) || 
                    unitPart.startsWith(u + ' of') || 
                    unitPart === u) {
                    unit = u;
                    break;
                }
            }
            if (unit) break;
        }
        
        return { quantity, unit };
    };

    // Get a standardized key for an ingredient
    const getIngredientKey = (name) => {
        return name.toLowerCase()
            .replace(/\s+/g, ' ')
            .trim();
    };

    // Format quantity for display
    const formatQuantity = (quantity) => {
        if (quantity === Math.floor(quantity)) {
            return quantity.toString();
        }
        
        // Handle common fractions
        if (quantity === 0.25) return '1/4';
        if (quantity === 0.33 || quantity === 0.333) return '1/3';
        if (quantity === 0.5) return '1/2';
        if (quantity === 0.67 || quantity === 0.666) return '2/3';
        if (quantity === 0.75) return '3/4';
        
        // Handle mixed numbers
        const whole = Math.floor(quantity);
        const fraction = quantity - whole;
        
        if (whole > 0 && fraction > 0) {
            if (fraction === 0.25) return `${whole} 1/4`;
            if (fraction === 0.33 || fraction === 0.333) return `${whole} 1/3`;
            if (fraction === 0.5) return `${whole} 1/2`;
            if (fraction === 0.67 || fraction === 0.666) return `${whole} 2/3`;
            if (fraction === 0.75) return `${whole} 3/4`;
        }
        
        // Fall back to decimal with 1 decimal place
        return quantity.toFixed(1);
    };

    // Generate the grocery list from the meal plan
    const generateGroceryList = () => {
        // Clear the current grocery list
        state.groceryItems = {};

        // Get the current meal plan
        const mealPlan = MealPlanManager.getMealPlan();
        if (!mealPlan) {
            console.error('No meal plan found');
            return;
        }

        // Process each day's recipe
        Object.values(mealPlan).forEach(recipe => {
            if (recipe) {
                processRecipeIngredients(recipe);
            }
        });

        // Render the grocery list
        renderGroceryList();
    };

    // Process ingredients from a recipe
    const processRecipeIngredients = (recipe) => {
        if (!recipe.ingredients || !Array.isArray(recipe.ingredients)) {
            console.error('No ingredients found in recipe:', recipe.title);
            return;
        }

        recipe.ingredients.forEach(ingredient => {
            // Map the original category to our standardized categories
            const category = mapCategory(ingredient.category);
            const name = ingredient.name.trim();
            const nameKey = getIngredientKey(name);
            const amount = ingredient.amount;

            // Parse the amount
            const { quantity, unit } = parseAmount(amount);

            // Initialize category if it doesn't exist
            if (!state.groceryItems[category]) {
                state.groceryItems[category] = {};
            }

            // Create a key that combines name and unit for combining like ingredients
            const itemKey = unit ? `${nameKey}::${unit}` : nameKey;

            // Add or update the ingredient
            if (state.groceryItems[category][itemKey]) {
                // Add recipe to the list
                if (!state.groceryItems[category][itemKey].recipes.includes(recipe.title)) {
                    state.groceryItems[category][itemKey].recipes.push(recipe.title);
                }
                
                // Add quantity if the unit matches
                if (state.groceryItems[category][itemKey].unit === unit) {
                    state.groceryItems[category][itemKey].quantity += quantity;
                }
            } else {
                state.groceryItems[category][itemKey] = {
                    name: name,
                    quantity: quantity,
                    unit: unit,
                    recipes: [recipe.title]
                };
            }
        });
    };

    // Format the amount for display
    const formatAmount = (item) => {
        if (!item.unit) {
            return formatQuantity(item.quantity);
        }
        
        return `${formatQuantity(item.quantity)} ${item.unit}`;
    };

    // Render the grocery list
    const renderGroceryList = () => {
        if (!elements.groceryList) return;

        // Clear the current list
        domHelpers.clearElement(elements.groceryList);
        
        // Check if we have any items
        const hasItems = Object.keys(state.groceryItems).length > 0;
        
        if (!hasItems) {
            const emptyMessage = domHelpers.createElement('div', {
                className: 'empty-list-message',
                textContent: 'Your grocery list is empty. Add recipes to your meal plan first.'
            });
            elements.groceryList.appendChild(emptyMessage);
            return;
        }

        // Create the grocery list
        const listContainer = domHelpers.createElement('div', {
            className: 'grocery-list-content'
        });

        // Define category order (using the values from CATEGORIES)
        const categoryOrder = Object.values(CATEGORIES);
        
        // Create sections for each category (in specified order)
        categoryOrder.forEach(category => {
            // Skip categories with no items
            if (!state.groceryItems[category] || Object.keys(state.groceryItems[category]).length === 0) {
                return;
            }
            
            // Create category heading
            const categoryHeading = domHelpers.createElement('h3', {
                className: 'grocery-category',
                textContent: category
            });
            
            // Create item list
            const itemsList = domHelpers.createElement('ul', {
                className: 'grocery-items'
            });
            
            // Get all items in this category
            const items = state.groceryItems[category];
            const itemKeys = Object.keys(items).sort((a, b) => {
                // Sort by name only (remove the unit part if present)
                const nameA = a.split('::')[0];
                const nameB = b.split('::')[0];
                return nameA.localeCompare(nameB);
            });
            
            // Add each item to the list
            itemKeys.forEach(itemKey => {
                const item = items[itemKey];
                const recipeCount = item.recipes.length;
                
                // Create list item
                const listItem = domHelpers.createElement('li', {
                    className: 'grocery-item'
                });
                
                // Create checkbox and label
                const checkbox = domHelpers.createElement('input', {
                    type: 'checkbox',
                    className: 'item-checkbox',
                    id: `item-${category}-${itemKey.replace(/\s+/g, '-').replace(/::.*$/, '')}`
                });
                
                // Format the displayed amount
                const displayAmount = formatAmount(item);
                
                // Create item content
                const itemContent = domHelpers.createElement('label', {
                    className: 'item-content',
                    htmlFor: checkbox.id,
                    innerHTML: `<span class="item-amount">${displayAmount}</span> <span class="item-name">${item.name}</span>`
                });
                
                // Show recipe names if item is used in multiple recipes
                if (recipeCount > 1) {
                    const recipesText = item.recipes.join(', ');
                    const recipesInfo = domHelpers.createElement('div', {
                        className: 'item-recipes',
                        textContent: `Used in: ${recipesText}`
                    });
                    itemContent.appendChild(recipesInfo);
                }
                
                listItem.appendChild(checkbox);
                listItem.appendChild(itemContent);
                itemsList.appendChild(listItem);
            });
            
            // Add category to list
            listContainer.appendChild(categoryHeading);
            listContainer.appendChild(itemsList);
        });
        
        // Add list to the DOM
        elements.groceryList.appendChild(listContainer);
        
        // Show print button
        if (elements.printButton) {
            elements.printButton.style.display = 'inline-block';
        }
    };

    // Print the grocery list
    const printGroceryList = () => {
        // Create a print-friendly version of the grocery list
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            alert('Please allow pop-ups to print the grocery list');
            return;
        }

        // Create HTML content for print
        let printContent = `
            <html>
            <head>
                <title>Grocery List</title>
                <style>
                    body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
                    h1 { text-align: center; margin-bottom: 20px; }
                    h3 { margin-top: 20px; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
                    ul { list-style-type: none; padding: 0; }
                    li { padding: 5px 0; display: flex; }
                    .item-amount { font-weight: bold; width: 100px; }
                    .checkbox { margin-right: 10px; }
                    @media print {
                        h1 { margin-top: 0; }
                        .no-print { display: none; }
                    }
                </style>
            </head>
            <body>
                <h1>Grocery List</h1>
                <div class="no-print">
                    <button onclick="window.print()">Print</button>
                    <button onclick="window.close()">Close</button>
                </div>
        `;

        // Define category order
        const categoryOrder = Object.values(CATEGORIES);
        
        // Add each category and items (in specified order)
        categoryOrder.forEach(category => {
            // Skip categories with no items
            if (!state.groceryItems[category] || Object.keys(state.groceryItems[category]).length === 0) {
                return;
            }
            
            printContent += `<h3>${category}</h3><ul>`;
            
            const items = state.groceryItems[category];
            const itemKeys = Object.keys(items).sort((a, b) => {
                // Sort by name only (remove the unit part if present)
                const nameA = a.split('::')[0];
                const nameB = b.split('::')[0];
                return nameA.localeCompare(nameB);
            });
            
            itemKeys.forEach(itemKey => {
                const item = items[itemKey];
                const displayAmount = formatAmount(item);
                
                printContent += `
                    <li>
                        <input type="checkbox" class="checkbox">
                        <span class="item-amount">${displayAmount}</span>
                        <span class="item-name">${item.name}</span>
                    </li>
                `;
            });
            
            printContent += `</ul>`;
        });

        printContent += `
                </body>
            </html>
        `;

        // Write to the window and print
        printWindow.document.open();
        printWindow.document.write(printContent);
        printWindow.document.close();
    };

    // Public API
    return {
        init,
        generateGroceryList
    };
})();