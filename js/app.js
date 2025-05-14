// Update for app.js - Add Storage initialization and clear button event listeners

// DOMContentLoaded event handler
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
    GroceryListManager.init();
    
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
    
    // Get the clear meal plan button
    const clearMealPlanBtn = document.getElementById('clear-meal-plan');
    
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
        
        // Toggle grocery tab class on body to hide weekly plan
        if (tabName === TABS.GROCERY) {
            document.body.classList.add('grocery-tab-active');
        } else {
            document.body.classList.remove('grocery-tab-active');
        }
        
        // If switching to grocery tab, auto-generate list if it's empty
        if (tabName === TABS.GROCERY) {
            const groceryList = document.getElementById('grocery-list');
            const hasContent = groceryList && groceryList.querySelector('.grocery-list-content');
            if (!hasContent) {
                // Only auto-generate if we have recipes in the meal plan
                const mealPlan = MealPlanManager.getMealPlan();
                const hasRecipes = Object.values(mealPlan).some(recipe => recipe !== null);
                if (hasRecipes) {
                    GroceryListManager.generateGroceryList();
                }
            }
        }
        
        // Save the current view in localStorage
        StorageManager.saveLastView(tabName);
    };
    
    // Add click event listeners to tabs
    Object.entries(tabElements).forEach(([tabName, tabElement]) => {
        tabElement.addEventListener('click', () => switchTab(tabName));
    });
    
    // Add click event listener to clear meal plan button
    if (clearMealPlanBtn) {
        clearMealPlanBtn.addEventListener('click', () => {
            // Add confirmation dialog
            if (confirm('Are you sure you want to clear your meal plan?')) {
                MealPlanManager.clearMealPlan();
            }
        });
    }
    
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
        
        // Current filters - try to load from storage
        let currentFilters = StorageManager.loadFilters() || {...defaultFilters};
        
        // Update UI to match loaded filters
        if (currentFilters) {
            Object.entries(currentFilters).forEach(([key, value]) => {
                if (filterElements[key]) {
                    filterElements[key].value = value;
                }
            });
        }
        
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
            
            // Save filters to localStorage
            StorageManager.saveFilters(currentFilters);
        };
        
        // Reset filters to default values
        const resetFiltersToDefault = () => {
            currentFilters = {...defaultFilters};
            
            // Update UI to match defaults
            Object.entries(filterElements).forEach(([key, element]) => {
                element.value = currentFilters[key];
            });
            
            updateFilterLabels();
            
            // Clear saved filters
            StorageManager.saveFilters(currentFilters);
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
        
        // Apply stored filters on load
        applyFilterToRecipes();
    };
    
    // Run setup functions
    setupFilters();
    
    // Load the last active view from storage, or default to recipes
    const lastView = StorageManager.loadLastView() || TABS.RECIPES;
    switchTab(lastView);
});