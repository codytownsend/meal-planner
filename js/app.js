// js/app.js
// DOMContentLoaded event handler
document.addEventListener('DOMContentLoaded', async () => {
    // Function to show loading state with error handling
    const showLoading = (container, message = "Loading...") => {
        const loadingIndicator = domHelpers.createElement('div', {
            className: 'loading-indicator',
            innerHTML: `
                <div class="loading-spinner"></div>
                <p>${message}</p>
            `
        });
        
        // If container is a string, try to get the element
        const targetContainer = typeof container === 'string' 
            ? document.querySelector(container) 
            : container;
            
        if (!targetContainer) {
            console.warn('Loading container not found, attaching to body as fallback');
            document.body.appendChild(loadingIndicator);
            return loadingIndicator;
        }
        
        try {
            domHelpers.clearElement(targetContainer);
            targetContainer.appendChild(loadingIndicator);
        } catch (err) {
            console.warn('Error showing loading state:', err);
            document.body.appendChild(loadingIndicator);
        }
        
        return loadingIndicator;
    };

    
    // Create loading indicator in body (safer initial loading)
    const bodyLoadingIndicator = domHelpers.createElement('div', {
        className: 'loading-indicator',
        style: 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: white; z-index: 9999; display: flex; flex-direction: column; justify-content: center; align-items: center;',
        innerHTML: `
            <div class="loading-spinner"></div>
            <p>Loading recipes...</p>
        `
    });
    document.body.appendChild(bodyLoadingIndicator);

    // Error-resilient element getters
    const getElement = (selector, defaultValue = null) => {
        const element = document.querySelector(selector);
        if (!element) {
            console.warn(`Element not found: ${selector}`);
        }
        return element || defaultValue;
    };
    
    // Function to update current filter chips display
    const updateFilterChips = (filters) => {
        const currentMealType = document.getElementById('current-meal-type');
        if (currentMealType) {
            if (filters.mealType) {
                const mealTypeText = filters.mealType.charAt(0).toUpperCase() + filters.mealType.slice(1);
                currentMealType.textContent = mealTypeText;
                currentMealType.style.display = 'inline-flex';
            } else {
                currentMealType.style.display = 'none';
            }
        }
    };
    
    // Get main content reference without clearing it
    const mainContent = document.querySelector('main');
    
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
    
    // Update filter chips to reflect current filters
    updateFilterChips(filtersToApply);
    
    if (!filteredRecipes || !filteredRecipes.length) {
        // Remove body loading indicator first
        if (bodyLoadingIndicator && bodyLoadingIndicator.parentNode) {
            bodyLoadingIndicator.parentNode.removeChild(bodyLoadingIndicator);
        }
        
        const noRecipesMessage = domHelpers.createElement('div', {
            className: 'empty-list-message',
            innerHTML: `
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="9" y1="9" x2="15" y2="15"></line>
                    <line x1="15" y1="9" x2="9" y2="15"></line>
                </svg>
                <p>No recipes found matching the filters</p>
                <p class="subtitle">Try different filter settings</p>
            `
        });
        domHelpers.clearElement(mainContent);
        mainContent.appendChild(noRecipesMessage);
        console.error('No filtered recipes found!');
        return;
    }
    
    // IMPORTANT: Initialize managers BEFORE clearing mainContent
    // This allows the managers to find the DOM elements they need
    CarouselManager.init(filteredRecipes);
    MealPlanManager.init();
    GroceryListManager.init();
    FavoritesManager.init();
    
    // Now remove the loading indicator
    if (bodyLoadingIndicator && bodyLoadingIndicator.parentNode) {
        bodyLoadingIndicator.parentNode.removeChild(bodyLoadingIndicator);
    }
    
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
        
        // Function to load more recipes with error handling
        const loadMoreRecipes = async () => {
            isLoadingMore = true;
            
            // Create loading indicator at bottom of carousel
            const carouselContainer = document.querySelector('.carousel-container');
            if (!carouselContainer) {
                console.warn('Carousel container not found for loading indicator');
                isLoadingMore = false;
                return;
            }
            
            const loadingIndicator = domHelpers.createElement('div', {
                className: 'loading-indicator',
                style: 'position: absolute; bottom: 0; left: 0; right: 0; background: rgba(255,255,255,0.9);',
                innerHTML: `
                    <div class="loading-spinner"></div>
                    <p>Loading more recipes...</p>
                `
            });
            
            try {
                carouselContainer.appendChild(loadingIndicator);
                
                // Load next batch of recipes
                const newRecipes = await RecipeLoader.loadMoreRecipes();
                
                // Remove loading indicator
                if (loadingIndicator && loadingIndicator.parentNode) {
                    loadingIndicator.parentNode.removeChild(loadingIndicator);
                }
                
                if (newRecipes && newRecipes.length > 0) {
                    // Update carousel with all filtered recipes
                    CarouselManager.updateRecipes(RecipeLoader.getFilteredRecipes());
                }
            } catch (err) {
                console.error('Error loading more recipes:', err);
                
                // Remove loading indicator
                if (loadingIndicator && loadingIndicator.parentNode) {
                    loadingIndicator.parentNode.removeChild(loadingIndicator);
                }
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
            // Show confirmation modal instead of alert
            const confirmationModal = document.getElementById('confirmation-modal');
            const confirmationMessage = document.getElementById('confirmation-message');
            
            if (confirmationModal && confirmationMessage) {
                confirmationMessage.textContent = 'Are you sure you want to clear your meal plan?';
                confirmationModal.classList.add('active');
                
                // Handle confirmation
                const confirmYesBtn = document.getElementById('confirm-yes');
                const confirmCancelBtn = document.getElementById('confirm-cancel');
                
                const confirmHandler = () => {
                    MealPlanManager.clearMealPlan();
                    confirmationModal.classList.remove('active');
                    
                    // Remove event listeners to prevent memory leaks
                    confirmYesBtn.removeEventListener('click', confirmHandler);
                    confirmCancelBtn.removeEventListener('click', cancelHandler);
                };
                
                const cancelHandler = () => {
                    confirmationModal.classList.remove('active');
                    
                    // Remove event listeners to prevent memory leaks
                    confirmYesBtn.removeEventListener('click', confirmHandler);
                    confirmCancelBtn.removeEventListener('click', cancelHandler);
                };
                
                confirmYesBtn.addEventListener('click', confirmHandler);
                confirmCancelBtn.addEventListener('click', cancelHandler);
            } else {
                // Fallback to old confirmation if modal not found
                if (confirm('Are you sure you want to clear your meal plan?')) {
                    MealPlanManager.clearMealPlan();
                }
            }
        });
    }
    
    // Setup search functionality
    const setupSearch = () => {
        const searchInput = document.getElementById('recipe-search');
        const searchButton = document.getElementById('search-button');
        const searchToggle = document.getElementById('search-toggle');
        const searchContainer = document.querySelector('.search-container');
        
        if (!searchInput || !searchButton) {
            console.error('Search elements not found');
            return;
        }
        
        // Toggle search visibility
        if (searchToggle && searchContainer) {
            searchToggle.addEventListener('click', () => {
                searchContainer.classList.add('expanded');
                searchInput.focus();
            });
            
            // Close search when clicking outside
            document.addEventListener('click', (e) => {
                if (!searchContainer.contains(e.target) && e.target !== searchToggle) {
                    searchContainer.classList.remove('expanded');
                }
            });
        }
        
        const performSearch = async () => {
            const searchQuery = searchInput.value.trim().toLowerCase();
            
            // Show loading in carousel container
            const carouselContainer = document.querySelector('.carousel-container');
            if (carouselContainer) {
                showLoading(carouselContainer, "Searching recipes...");
            }
            
            // Load all recipes if they aren't already loaded
            // This ensures we search through all recipes, not just loaded ones
            while (RecipeLoader.hasMore()) {
                await RecipeLoader.loadMoreRecipes();
            }
            
            // Update current filters with search query
            const currentFilters = StorageManager.loadFilters() || defaultFilters;
            currentFilters.searchQuery = searchQuery;
            
            // Apply search filter
            const filteredRecipes = RecipeLoader.applyFilters(currentFilters);
            
            // Update carousel with filtered recipes
            CarouselManager.updateRecipes(filteredRecipes);
            
            // Save filters
            StorageManager.saveFilters(currentFilters);
            
            // Add feedback for empty results
            if (filteredRecipes.length === 0) {
                const emptyMessage = domHelpers.createElement('div', {
                    className: 'empty-list-message',
                    innerHTML: `
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                            <circle cx="11" cy="11" r="8"></circle>
                            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                        </svg>
                        <p>No recipes found matching "${searchQuery}"</p>
                        <p class="subtitle">Try a different search term</p>
                    `
                });
                domHelpers.clearElement(carouselContainer);
                carouselContainer.appendChild(emptyMessage);
            }
            
            // Hide search after searching
            if (searchContainer) {
                searchContainer.classList.remove('expanded');
            }
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
            const carouselContainer = document.querySelector('.carousel-container');
            if (carouselContainer) {
                showLoading(carouselContainer, "Filtering recipes...");
            }
            
            // Apply filters to loaded recipes
            const filteredRecipes = RecipeLoader.applyFilters(currentFilters);
            
            // Update carousel with filtered recipes
            CarouselManager.updateRecipes(filteredRecipes);
            
            // Close filter modal
            filtersModal.classList.remove('active');
            
            // Update filter chips
            updateFilterChips(currentFilters);
            
            // Save filters to localStorage
            StorageManager.saveFilters(currentFilters);
            
            // Add feedback for empty results
            if (filteredRecipes.length === 0) {
                const emptyMessage = domHelpers.createElement('div', {
                    className: 'empty-list-message',
                    innerHTML: `
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                            <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"></path>
                        </svg>
                        <p>No recipes match these filters</p>
                        <p class="subtitle">Try different filter settings</p>
                    `
                });
                domHelpers.clearElement(carouselContainer);
                carouselContainer.appendChild(emptyMessage);
            }
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
            
            // Also close when clicking outside
            filtersModal.addEventListener('click', (e) => {
                if (e.target === filtersModal) {
                    filtersModal.classList.remove('active');
                }
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
        
        // Update filter chips on initial load
        updateFilterChips(currentFilters);
    };
    
    // Setup bottom sheet behavior
    const setupBottomSheets = () => {
        const bottomSheets = document.querySelectorAll('.bottom-sheet');
        
        bottomSheets.forEach(sheet => {
            // Close sheet when clicking outside the content
            sheet.addEventListener('click', (e) => {
                if (e.target === sheet) {
                    sheet.classList.remove('active');
                }
            });
            
            // Add swipe down to close
            const content = sheet.querySelector('.bottom-sheet-content');
            if (content) {
                let startY = 0;
                let currentY = 0;
                
                content.addEventListener('touchstart', (e) => {
                    startY = e.touches[0].clientY;
                });
                
                content.addEventListener('touchmove', (e) => {
                    currentY = e.touches[0].clientY;
                    const diff = currentY - startY;
                    
                    // Only allow swiping down, not up
                    if (diff > 0) {
                        content.style.transform = `translateY(${diff}px)`;
                        e.preventDefault();
                    }
                });
                
                content.addEventListener('touchend', () => {
                    const diff = currentY - startY;
                    content.style.transform = '';
                    
                    if (diff > 100) {
                        // If swiped down enough, close the sheet
                        sheet.classList.remove('active');
                    }
                });
            }
        });
    };
    
    // Run setup functions
    setupFilters();
    setupSearch();
    setupBottomSheets();
    
    // Setup weekly plan toggle
    const weeklyPlan = document.querySelector('.weekly-plan');
    const togglePlanBtn = document.getElementById('toggle-plan');
    
    if (weeklyPlan && togglePlanBtn) {
        togglePlanBtn.addEventListener('click', () => {
            weeklyPlan.classList.toggle('collapsed');
        });
    }
    
    // Load the last active view from storage, or default to recipes
    const lastView = StorageManager.loadLastView() || TABS.RECIPES;
    switchTab(lastView);
    
    // Show recipe count
    console.log(`Loaded ${RecipeLoader.getTotalLoaded()} of ${RecipeLoader.getTotalAvailable()} total recipes (showing ${filteredRecipes.length} dinner recipes)`);
});