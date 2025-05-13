// Main application logic
document.addEventListener('DOMContentLoaded', () => {
    // Initialize managers
    CarouselManager.init(sampleRecipes);
    MealPlanManager.init();
    
    // Tabs navigation
    const tabs = {
        recipes: document.getElementById('tab-recipes'),
        grocery: document.getElementById('tab-grocery')
    };
    
    const views = {
        recipes: document.getElementById('recipes-view'),
        grocery: document.getElementById('grocery-view')
    };
    
    // Switch between tabs
    const switchTab = (tabName) => {
        // Update tab states
        Object.values(tabs).forEach(tab => {
            tab.classList.remove('active');
        });
        tabs[tabName].classList.add('active');
        
        // Update view visibility
        Object.values(views).forEach(view => {
            view.classList.remove('active');
        });
        views[tabName].classList.add('active');
    };
    
    // Add click event listeners to tabs
    tabs.recipes.addEventListener('click', () => switchTab('recipes'));
    tabs.grocery.addEventListener('click', () => switchTab('grocery'));
    
    // Filter functionality
    const filtersToggle = document.getElementById('filters-toggle');
    const filtersModal = document.getElementById('filters-modal');
    const closeFilters = document.getElementById('close-filters');
    const applyFilters = document.getElementById('apply-filters');
    const resetFilters = document.getElementById('reset-filters');
    
    const maxPrepTimeInput = document.getElementById('max-prep-time');
    const maxCookTimeInput = document.getElementById('max-cook-time');
    const cuisineSelect = document.getElementById('cuisine-type');
    const proteinSelect = document.getElementById('protein-type');
    const sourceSelect = document.getElementById('recipe-source');
    
    const prepTimeValue = document.getElementById('prep-time-value');
    const cookTimeValue = document.getElementById('cook-time-value');
    
    // Filter state
    let filters = {
        maxPrepTime: 30,
        maxCookTime: 45,
        cuisine: '',
        protein: '',
        source: ''
    };
    
    // Open filters modal
    filtersToggle.addEventListener('click', () => {
        filtersModal.classList.add('active');
    });
    
    // Close filters modal
    closeFilters.addEventListener('click', () => {
        filtersModal.classList.remove('active');
    });
    
    // Update filter label displays
    const updateFilterLabels = () => {
        prepTimeValue.textContent = filters.maxPrepTime;
        cookTimeValue.textContent = filters.maxCookTime;
    };
    
    // Filter change handlers
    maxPrepTimeInput.addEventListener('input', () => {
        filters.maxPrepTime = parseInt(maxPrepTimeInput.value);
        updateFilterLabels();
    });
    
    maxCookTimeInput.addEventListener('input', () => {
        filters.maxCookTime = parseInt(maxCookTimeInput.value);
        updateFilterLabels();
    });
    
    // Apply filters
    applyFilters.addEventListener('click', () => {
        filters.cuisine = cuisineSelect.value;
        filters.protein = proteinSelect.value;
        filters.source = sourceSelect.value;
        
        const filteredRecipes = sampleRecipes.filter(recipe => {
            const prepTimeMatch = recipe.prepTime <= filters.maxPrepTime;
            const cookTimeMatch = recipe.cookTime <= filters.maxCookTime;
            const cuisineMatch = !filters.cuisine || recipe.cuisine === filters.cuisine;
            const proteinMatch = !filters.protein || recipe.protein === filters.protein;
            const sourceMatch = !filters.source || recipe.source === filters.source;
            
            return prepTimeMatch && cookTimeMatch && cuisineMatch && proteinMatch && sourceMatch;
        });
        
        CarouselManager.filterRecipes(filteredRecipes);
        filtersModal.classList.remove('active');
    });
    
    // Reset filters
    resetFilters.addEventListener('click', () => {
        filters = {
            maxPrepTime: 30,
            maxCookTime: 45,
            cuisine: '',
            protein: '',
            source: ''
        };
        
        maxPrepTimeInput.value = filters.maxPrepTime;
        maxCookTimeInput.value = filters.maxCookTime;
        cuisineSelect.value = filters.cuisine;
        proteinSelect.value = filters.protein;
        sourceSelect.value = filters.source;
        
        updateFilterLabels();
    });
    
    // Initialize the tabs
    switchTab('recipes');
});