// Recipe handling functionality
const RecipeManager = (() => {
    // State
    let recipes = [];
    let filteredRecipes = [];
    let filters = {
        maxPrepTime: 30,
        maxCookTime: 45,
        cuisine: '',
        protein: '',
        source: ''
    };
    
    // DOM Elements
    const recipesGrid = document.getElementById('recipes-grid');
    const maxPrepTimeInput = document.getElementById('max-prep-time');
    const maxCookTimeInput = document.getElementById('max-cook-time');
    const cuisineSelect = document.getElementById('cuisine-type');
    const proteinSelect = document.getElementById('protein-type');
    const sourceSelect = document.getElementById('recipe-source');
    const resetFiltersBtn = document.getElementById('reset-filters');
    const prepTimeValue = document.getElementById('prep-time-value');
    const cookTimeValue = document.getElementById('cook-time-value');
    
    // Initialize
    const init = (recipeData) => {
        recipes = recipeData;
        filteredRecipes = [...recipes];
        setupEventListeners();
        renderRecipes();
        updateFilterLabels();
    };
    
    // Setup event listeners
    const setupEventListeners = () => {
        // Filter change events
        maxPrepTimeInput.addEventListener('input', () => {
            filters.maxPrepTime = parseInt(maxPrepTimeInput.value);
            updateFilterLabels();
            applyFilters();
        });
        
        maxCookTimeInput.addEventListener('input', () => {
            filters.maxCookTime = parseInt(maxCookTimeInput.value);
            updateFilterLabels();
            applyFilters();
        });
        
        cuisineSelect.addEventListener('change', () => {
            filters.cuisine = cuisineSelect.value;
            applyFilters();
        });
        
        proteinSelect.addEventListener('change', () => {
            filters.protein = proteinSelect.value;
            applyFilters();
        });
        
        sourceSelect.addEventListener('change', () => {
            filters.source = sourceSelect.value;
            applyFilters();
        });
        
        // Reset filters
        resetFiltersBtn.addEventListener('click', resetFilters);
    };
    
    // Update filter label display
    const updateFilterLabels = () => {
        prepTimeValue.textContent = filters.maxPrepTime;
        cookTimeValue.textContent = filters.maxCookTime;
    };
    
    // Apply filters to recipes
    const applyFilters = () => {
        filteredRecipes = recipes.filter(recipe => {
            const prepTimeMatch = recipe.prepTime <= filters.maxPrepTime;
            const cookTimeMatch = recipe.cookTime <= filters.maxCookTime;
            const cuisineMatch = !filters.cuisine || recipe.cuisine === filters.cuisine;
            const proteinMatch = !filters.protein || recipe.protein === filters.protein;
            const sourceMatch = !filters.source || recipe.source === filters.source;
            
            return prepTimeMatch && cookTimeMatch && cuisineMatch && proteinMatch && sourceMatch;
        });
        
        renderRecipes();
    };
    
    // Reset all filters to default values
    const resetFilters = () => {
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
        applyFilters();
    };
    
    // Render recipe cards to the grid
    const renderRecipes = () => {
        domHelpers.clearElement(recipesGrid);
        
        if (filteredRecipes.length === 0) {
            const noResults = domHelpers.createElement('div', {
                className: 'no-results',
                textContent: 'No recipes match your current filters. Try adjusting your criteria.'
            });
            recipesGrid.appendChild(noResults);
            return;
        }
        
        filteredRecipes.forEach(recipe => {
            const recipeCard = createRecipeCard(recipe);
            recipesGrid.appendChild(recipeCard);
        });
    };
    
    // Create a recipe card element
    const createRecipeCard = (recipe) => {
        // Format source display name
        const sourceDisplay = recipe.source === 'halfbakedharvest' ? 'Half Baked Harvest' : 'The Modern Proper';
        
        // Create recipe card elements
        const card = domHelpers.createElement('div', { className: 'recipe-card' });
        
        // Recipe image
        const img = domHelpers.createElement('img', {
            src: recipe.imageUrl,
            alt: recipe.title,
            loading: 'lazy'
        });
        
        // Recipe content
        const content = domHelpers.createElement('div', { className: 'recipe-card-content' });
        
        // Recipe title
        const title = domHelpers.createElement('h3', { textContent: recipe.title });
        
        // Recipe meta information
        const meta = domHelpers.createElement('div', { className: 'recipe-meta' });
        
        const prepTime = domHelpers.createElement('span', {
            innerHTML: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg> ${recipe.prepTime} min prep`
        });
        
        const cookTime = domHelpers.createElement('span', {
            innerHTML: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3v3a2 2 0 0 1-2 2H3"></path><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7"></path><path d="M14 3v4a1 1 0 0 0 1 1h4"></path><path d="M9 13h6"></path><path d="M9 17h6"></path></svg> ${recipe.cookTime} min cook`
        });
        
        const servings = domHelpers.createElement('span', {
            innerHTML: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg> Serves ${recipe.servings}`
        });
        
        meta.appendChild(prepTime);
        meta.appendChild(cookTime);
        meta.appendChild(servings);
        
        // Recipe tags
        const tags = domHelpers.createElement('div', { className: 'recipe-tags' });
        
        recipe.tags.forEach(tag => {
            const tagElement = domHelpers.createElement('span', {
                className: 'recipe-tag',
                textContent: tag
            });
            tags.appendChild(tagElement);
        });
        
        // Recipe source
        const source = domHelpers.createElement('div', {
            className: 'recipe-source',
            textContent: `From ${sourceDisplay}`
        });
        
        // Recipe actions
        const actions = domHelpers.createElement('div', { className: 'recipe-actions' });
        
        const addToMealPlanBtn = domHelpers.createElement('button', {
            textContent: 'Add to Plan',
            'data-recipe-id': recipe.id
        });
        
        const viewRecipeLink = domHelpers.createElement('a', {
            href: recipe.sourceUrl,
            target: '_blank',
            rel: 'noopener noreferrer',
            textContent: 'View Original'
        });
        
        actions.appendChild(addToMealPlanBtn);
        actions.appendChild(viewRecipeLink);
        
        // Assemble the card
        content.appendChild(title);
        content.appendChild(meta);
        content.appendChild(tags);
        content.appendChild(source);
        content.appendChild(actions);
        
        card.appendChild(img);
        card.appendChild(content);
        
        return card;
    };
    
    // Public API
    return {
        init
    };
})();