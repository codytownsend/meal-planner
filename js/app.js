// Main application logic
document.addEventListener('DOMContentLoaded', () => {
    // Initialize recipe data
    const recipeData = window.sampleRecipes || [];
    if (!recipeData.length) {
        console.error('No recipe data found!');
        return;
    }

    // Initialize managers with proper sequence
    CarouselManager.init(recipeData);
    MealPlanManager.init();
    
    // Constants for UI elements
    const TABS = {
        RECIPES: 'recipes',
        GROCERY: 'grocery'
    };
    
    // Tab navigation elements
    const tabElements = {
        [TABS.RECIPES]: document.getElementById('tab-recipes'),
        [TABS.GROCERY]: document.getElementById('tab-grocery')
    };
    
    const viewElements = {
        [TABS.RECIPES]: document.getElementById('recipes-view'),
        [TABS.GROCERY]: document.getElementById('grocery-view')
    };
    
    // Switch between tabs
    const switchTab = (tabName) => {
        if (!tabElements[tabName] || !viewElements[tabName]) {
            console.error(`Tab "${tabName}" not found`);
            return;
        }
        
        // Update tab states
        Object.values(tabElements).forEach(tab => tab.classList.remove('active'));
        tabElements[tabName].classList.add('active');
        
        // Update view visibility
        Object.values(viewElements).forEach(view => view.classList.remove('active'));
        viewElements[tabName].classList.add('active');
    };
    
    // Add click event listeners to tabs
    Object.entries(tabElements).forEach(([tabName, tabElement]) => {
        tabElement.addEventListener('click', () => switchTab(tabName));
    });
    
    // Filter functionality setup
    const setupFilters = () => {
        const filtersToggle = document.getElementById('filters-toggle');
        const filtersModal = document.getElementById('filters-modal');
        const closeFilters = document.getElementById('close-filters');
        const applyFilters = document.getElementById('apply-filters');
        const resetFilters = document.getElementById('reset-filters');
        
        const filterElements = {
            maxPrepTime: document.getElementById('max-prep-time'),
            maxCookTime: document.getElementById('max-cook-time'),
            cuisine: document.getElementById('cuisine-type'),
            protein: document.getElementById('protein-type'),
            source: document.getElementById('recipe-source')
        };
        
        const filterLabels = {
            prepTime: document.getElementById('prep-time-value'),
            cookTime: document.getElementById('cook-time-value')
        };
        
        // Default filter values
        const defaultFilters = {
            maxPrepTime: 30,
            maxCookTime: 45,
            cuisine: '',
            protein: '',
            source: ''
        };
        
        // Current filters
        let currentFilters = {...defaultFilters};
        
        // Update filter labels based on slider values
        const updateFilterLabels = () => {
            filterLabels.prepTime.textContent = currentFilters.maxPrepTime;
            filterLabels.cookTime.textContent = currentFilters.maxCookTime;
        };
        
        // Apply filters to recipe data
        const applyFilterToRecipes = () => {
            const filteredRecipes = recipeData.filter(recipe => {
                return (
                    recipe.prepTime <= currentFilters.maxPrepTime &&
                    recipe.cookTime <= currentFilters.maxCookTime &&
                    (!currentFilters.cuisine || recipe.cuisine === currentFilters.cuisine) &&
                    (!currentFilters.protein || recipe.protein === currentFilters.protein) &&
                    (!currentFilters.source || recipe.source === currentFilters.source)
                );
            });
            
            CarouselManager.filterRecipes(filteredRecipes);
            filtersModal.classList.remove('active');
        };
        
        // Reset filters to default values
        const resetFiltersToDefault = () => {
            currentFilters = {...defaultFilters};
            
            // Update UI to match defaults
            Object.entries(filterElements).forEach(([key, element]) => {
                element.value = currentFilters[key];
            });
            
            updateFilterLabels();
        };
        
        // Event handlers for filter UI
        if (filtersToggle) {
            filtersToggle.addEventListener('click', () => {
                filtersModal.classList.add('active');
            });
        }
        
        if (closeFilters) {
            closeFilters.addEventListener('click', () => {
                filtersModal.classList.remove('active');
            });
        }
        
        // Slider input handlers
        filterElements.maxPrepTime.addEventListener('input', () => {
            currentFilters.maxPrepTime = parseInt(filterElements.maxPrepTime.value);
            updateFilterLabels();
        });
        
        filterElements.maxCookTime.addEventListener('input', () => {
            currentFilters.maxCookTime = parseInt(filterElements.maxCookTime.value);
            updateFilterLabels();
        });
        
        // Apply button handler
        applyFilters.addEventListener('click', () => {
            // Update currentFilters with select values
            currentFilters.cuisine = filterElements.cuisine.value;
            currentFilters.protein = filterElements.protein.value;
            currentFilters.source = filterElements.source.value;
            
            applyFilterToRecipes();
        });
        
        // Reset button handler
        resetFilters.addEventListener('click', resetFiltersToDefault);
        
        // Initialize filter labels
        updateFilterLabels();
    };
    
    // Run setup functions
    setupFilters();
    
    // Start with recipes tab active
    switchTab(TABS.RECIPES);
    
    // Prepare empty grocery list view
    const setupGroceryList = () => {
        const groceryListElement = document.getElementById('grocery-list');
        if (groceryListElement) {
            // Add placeholder message
            groceryListElement.innerHTML = '<p>Grocery list generation coming soon!</p>';
        }
    };
    
    setupGroceryList();
});