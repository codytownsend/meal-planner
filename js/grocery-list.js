// Grocery List Manager with updated categories
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
            const name = ingredient.name.toLowerCase();
            const amount = ingredient.amount;

            // Initialize category if it doesn't exist
            if (!state.groceryItems[category]) {
                state.groceryItems[category] = {};
            }

            // Add or update the ingredient
            if (state.groceryItems[category][name]) {
                state.groceryItems[category][name].recipes.push(recipe.title);
                // We don't combine amounts here as they may be in different units
                // Just note we need it for multiple recipes
            } else {
                state.groceryItems[category][name] = {
                    name: ingredient.name,
                    amount: amount,
                    recipes: [recipe.title]
                };
            }
        });
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
            const itemNames = Object.keys(items).sort();
            
            // Add each item to the list
            itemNames.forEach(itemName => {
                const item = items[itemName];
                const recipeCount = item.recipes.length;
                
                // Create list item
                const listItem = domHelpers.createElement('li', {
                    className: 'grocery-item'
                });
                
                // Create checkbox and label
                const checkbox = domHelpers.createElement('input', {
                    type: 'checkbox',
                    className: 'item-checkbox',
                    id: `item-${category}-${itemName.replace(/\s+/g, '-')}`
                });
                
                // Create item content
                const itemContent = domHelpers.createElement('label', {
                    className: 'item-content',
                    htmlFor: checkbox.id,
                    innerHTML: `<span class="item-amount">${item.amount}</span> <span class="item-name">${item.name}</span>`
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
            const itemNames = Object.keys(items).sort();
            
            itemNames.forEach(itemName => {
                const item = items[itemName];
                printContent += `
                    <li>
                        <input type="checkbox" class="checkbox">
                        <span class="item-amount">${item.amount}</span>
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