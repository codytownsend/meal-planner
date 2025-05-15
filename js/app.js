// DOMContentLoaded event handler
document.addEventListener('DOMContentLoaded', async () => {
    // Create loading indicator
    const loadingIndicator = document.createElement('div');
    loadingIndicator.className = 'loading-indicator';
    loadingIndicator.innerHTML = '<div class="loading-spinner"></div><p>Loading recipes...</p>';
    document.querySelector('main').appendChild(loadingIndicator);
    
    // Initialize recipe loader and load first batch
    const initialRecipes = await RecipeLoader.init();
    
    if (!initialRecipes || !initialRecipes.length) {
        loadingIndicator.innerHTML = '<p>Error loading recipes. Please try again later.</p>';
        console.error('No recipe data found!');
        return;
    }
    
    // Remove loading indicator
    loadingIndicator.remove();
    
    // Initialize managers with loaded recipes
    CarouselManager.init(initialRecipes);
    MealPlanManager.init();
    GroceryListManager.init();
    
    // Add "Load More" button if there are more recipes
    if (RecipeLoader.hasMore()) {
        const loadMoreContainer = document.createElement('div');
        loadMoreContainer.className = 'load-more-container';
        
        const loadMoreButton = document.createElement('button');
        loadMoreButton.className = 'load-more-button';
        loadMoreButton.textContent = 'Load More Recipes';
        loadMoreButton.addEventListener('click', async () => {
            loadMoreButton.disabled = true;
            loadMoreButton.textContent = 'Loading...';
            
            const newRecipes = await RecipeLoader.loadMoreRecipes();
            
            if (newRecipes.length > 0) {
                // Update the carousel with all filtered recipes
                CarouselManager.updateRecipes(RecipeLoader.getFilteredRecipes());
                loadMoreButton.textContent = 'Load More Recipes';
                loadMoreButton.disabled = false;
            }
            
            // Hide button if no more recipes
            if (!RecipeLoader.hasMore()) {
                loadMoreContainer.style.display = 'none';
            }
        });
        
        loadMoreContainer.appendChild(loadMoreButton);
        document.querySelector('.carousel-container').after(loadMoreContainer);
    }
    
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
    
    // Filter functionality setup with recipe loader
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
            source: document.getElementById('recipe-source'),
            mealType: document.getElementById('meal-type') // Your new meal type filter
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
            source: '',
            mealType: ''
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
            if (filterLabels.prepTime) filterLabels.prepTime.textContent = currentFilters.maxPrepTime;
            if (filterLabels.cookTime) filterLabels.cookTime.textContent = currentFilters.maxCookTime;
        };
        
        // Apply filters to recipe data using RecipeLoader
        const applyFilterToRecipes = () => {
            // Create loading indicator
            const loadingIndicator = document.createElement('div');
            loadingIndicator.className = 'loading-indicator';
            loadingIndicator.innerHTML = '<div class="loading-spinner"></div><p>Filtering recipes...</p>';
            document.querySelector('.carousel-container').appendChild(loadingIndicator);
            
            // Apply filters to loaded recipes
            const filteredRecipes = RecipeLoader.applyFilters(currentFilters);
            
            // Update carousel with filtered recipes
            CarouselManager.updateRecipes(filteredRecipes);
            
            // Close filter modal
            filtersModal.classList.remove('active');
            
            // Remove loading indicator
            loadingIndicator.remove();
            
            // Save filters to localStorage
            StorageManager.saveFilters(currentFilters);
            
            // Update the "Load More" button visibility based on filter results
            const loadMoreContainer = document.querySelector('.load-more-container');
            if (loadMoreContainer) {
                if (RecipeLoader.hasMore() && filteredRecipes.length > 0) {
                    loadMoreContainer.style.display = 'flex';
                } else {
                    loadMoreContainer.style.display = 'none';
                }
            }
        };
        
        // Reset filters to default values
        const resetFiltersToDefault = () => {
            currentFilters = {...defaultFilters};
            
            // Update UI to match defaults
            Object.entries(filterElements).forEach(([key, element]) => {
                if (element) element.value = currentFilters[key];
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
        if (filterElements.maxPrepTime) {
            filterElements.maxPrepTime.addEventListener('input', () => {
                currentFilters.maxPrepTime = parseInt(filterElements.maxPrepTime.value);
                updateFilterLabels();
            });
        }
        
        if (filterElements.maxCookTime) {
            filterElements.maxCookTime.addEventListener('input', () => {
                currentFilters.maxCookTime = parseInt(filterElements.maxCookTime.value);
                updateFilterLabels();
            });
        }
        
        // Apply button handler
        if (applyFilters) {
            applyFilters.addEventListener('click', () => {
                // Update currentFilters with select values
                if (filterElements.cuisine) currentFilters.cuisine = filterElements.cuisine.value;
                if (filterElements.protein) currentFilters.protein = filterElements.protein.value;
                if (filterElements.source) currentFilters.source = filterElements.source.value;
                if (filterElements.mealType) currentFilters.mealType = filterElements.mealType.value;
                
                applyFilterToRecipes();
            });
        }
        
        // Reset button handler
        if (resetFilters) {
            resetFilters.addEventListener('click', resetFiltersToDefault);
        }
        
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
    
    // Show recipe count
    console.log(`Loaded ${RecipeLoader.getTotalLoaded()} of ${RecipeLoader.getTotalAvailable()} total recipes`);
});