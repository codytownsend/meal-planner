// DOMContentLoaded event handler
document.addEventListener('DOMContentLoaded', async () => {
    // Create loading indicator
    const loadingIndicator = document.createElement('div');
    loadingIndicator.className = 'loading-indicator';
    loadingIndicator.innerHTML = '<div class="loading-spinner"></div><p>Loading recipes...</p>';
    document.querySelector('main').appendChild(loadingIndicator);
    
    // Default filter values - setting mealType to 'dinner' by default
    const defaultFilters = {
        maxPrepTime: 30,
        maxCookTime: 45,
        cuisine: '',
        protein: '',
        source: '',
        mealType: 'dinner', // Show dinner recipes by default
        searchQuery: '' // New property for search
    };
    
    // Initialize recipe loader and load first batch
    await RecipeLoader.init();
    
    // Apply dinner filter immediately after loading recipes
    const storedFilters = StorageManager.loadFilters();
    const filtersToApply = storedFilters || defaultFilters;
    const filteredRecipes = RecipeLoader.applyFilters(filtersToApply);
    
    if (!filteredRecipes || !filteredRecipes.length) {
        loadingIndicator.innerHTML = '<p>No recipes found matching the filters. Please try different filters.</p>';
        console.error('No filtered recipes found!');
        return;
    }
    
    // Remove loading indicator
    loadingIndicator.remove();
    
    // Initialize managers with FILTERED recipes
    CarouselManager.init(filteredRecipes);
    MealPlanManager.init();
    GroceryListManager.init();
    FavoritesManager.init();
    
    // Setup infinite scroll functionality
    const setupInfiniteScroll = () => {
        // Variable to track if we're currently loading
        let isLoadingMore = false;
        
        // Function to check scroll position and load more if needed
        const checkScrollPosition = () => {
            // Don't do anything if already loading or no more recipes
            if (isLoadingMore || !RecipeLoader.hasMore()) return;
            
            // Calculate how far down the page we've scrolled
            const scrollPosition = window.innerHeight + window.scrollY;
            // Threshold - load more when within 500px of bottom
            const threshold = document.body.offsetHeight - 500;
            
            // If scrolled past threshold, load more recipes
            if (scrollPosition > threshold) {
                loadMoreRecipes();
            }
        };
        
        // Function to load more recipes
        const loadMoreRecipes = async () => {
            isLoadingMore = true;
            
            // Create loading indicator at bottom of carousel
            const loadingIndicator = document.createElement('div');
            loadingIndicator.className = 'loading-indicator';
            loadingIndicator.innerHTML = '<div class="loading-spinner"></div><p>Loading more recipes...</p>';
            document.querySelector('.carousel-container').appendChild(loadingIndicator);
            
            // Load next batch of recipes
            const newRecipes = await RecipeLoader.loadMoreRecipes();
            
            // Remove loading indicator
            loadingIndicator.remove();
            
            if (newRecipes.length > 0) {
                // Update carousel with all filtered recipes
                CarouselManager.updateRecipes(RecipeLoader.getFilteredRecipes());
            }
            
            isLoadingMore = false;
        };
        
        // Add scroll event listener with throttling
        let scrollTimeout;
        window.addEventListener('scroll', () => {
            if (scrollTimeout) clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(checkScrollPosition, 200); // Throttle to once per 200ms
        });
        
        // Initial check in case the page doesn't have a scrollbar yet
        setTimeout(checkScrollPosition, 500); // Check after a short delay
    };
    
    // Initialize infinite scroll
    setupInfiniteScroll();
    
    // Constants for UI elements
    const TABS = {
        RECIPES: 'recipes',
        FAVORITES: 'favorites',
        GROCERY: 'grocery'
    };
    
    // Tab navigation elements
    const tabElements = {
        [TABS.RECIPES]: document.getElementById('tab-recipes'),
        [TABS.FAVORITES]: document.getElementById('tab-favorites'),
        [TABS.GROCERY]: document.getElementById('tab-grocery')
    };
    
    const viewElements = {
        [TABS.RECIPES]: document.getElementById('recipes-view'),
        [TABS.FAVORITES]: document.getElementById('favorites-view'),
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
        
        // If switching to favorites tab, update the displayed favorites
        if (tabName === TABS.FAVORITES) {
            FavoritesManager.refreshFavorites();
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
    
    // Setup search functionality
    const setupSearch = () => {
        const searchInput = document.getElementById('recipe-search');
        const searchButton = document.getElementById('search-button');
        
        if (!searchInput || !searchButton) {
            console.error('Search elements not found');
            return;
        }
        
        const performSearch = () => {
            const searchQuery = searchInput.value.trim().toLowerCase();
            
            // Update current filters with search query
            const currentFilters = StorageManager.loadFilters() || defaultFilters;
            currentFilters.searchQuery = searchQuery;
            
            // Apply search filter
            const filteredRecipes = RecipeLoader.applyFilters(currentFilters);
            
            // Update carousel with filtered recipes
            CarouselManager.updateRecipes(filteredRecipes);
            
            // Save filters
            StorageManager.saveFilters(currentFilters);
        };
        
        // Search button click event
        searchButton.addEventListener('click', performSearch);
        
        // Search on enter key
        searchInput.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') {
                performSearch();
            }
        });
        
        // Update search input with stored value
        const storedFilters = StorageManager.loadFilters();
        if (storedFilters && storedFilters.searchQuery) {
            searchInput.value = storedFilters.searchQuery;
        }
    };
    
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
            mealType: document.getElementById('meal-type') // Your meal type filter
        };
        
        const filterLabels = {
            prepTime: document.getElementById('prep-time-value'),
            cookTime: document.getElementById('cook-time-value')
        };
        
        // Current filters - using the same default we used earlier
        let currentFilters = storedFilters || defaultFilters;
        
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
        };
        
        // Reset filters to default values
        const resetFiltersToDefault = () => {
            // Preserve the search query when resetting other filters
            const searchQuery = currentFilters.searchQuery || '';
            currentFilters = {...defaultFilters, searchQuery};
            
            // Update UI to match defaults
            Object.entries(filterElements).forEach(([key, element]) => {
                if (element) element.value = currentFilters[key];
            });
            
            updateFilterLabels();
            
            // Apply the reset filters
            applyFilterToRecipes();
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
    };
    
    // Run setup functions
    setupFilters();
    setupSearch();
    
    // Load the last active view from storage, or default to recipes
    const lastView = StorageManager.loadLastView() || TABS.RECIPES;
    switchTab(lastView);
    
    // Show recipe count
    console.log(`Loaded ${RecipeLoader.getTotalLoaded()} of ${RecipeLoader.getTotalAvailable()} total recipes (showing ${filteredRecipes.length} dinner recipes)`);
});