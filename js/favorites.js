// js/favorites.js
const FavoritesManager = (() => {
    // Constants
    const STORAGE_KEY = 'mealPlannerFavorites';
    const MAX_FAVORITES = 100; // Limit number of favorites to prevent storage issues
    
    // State
    const state = {
        favorites: []
    };
    
    // DOM Elements
    const elements = {
        favoritesGrid: null,
        emptyMessage: null
    };
    
    // Initialize
    const init = () => {
        // Get DOM elements
        elements.favoritesGrid = document.getElementById('favorites-grid');
        elements.emptyMessage = elements.favoritesGrid ? elements.favoritesGrid.querySelector('.empty-favorites') : null;
        
        // Load favorites from storage
        loadFavorites();
        
        // Add event listener for meal plan changes
        document.addEventListener('mealPlanUpdated', handleMealPlanUpdate);
        
        // Render favorites
        renderFavorites();
    };
    
    // Load favorites from storage
    const loadFavorites = () => {
        const storedFavorites = StorageManager.loadData(STORAGE_KEY);
        if (storedFavorites && Array.isArray(storedFavorites)) {
            state.favorites = storedFavorites;
        }
    };
    
    // Save favorites to storage
    const saveFavorites = () => {
        return StorageManager.saveData(STORAGE_KEY, state.favorites);
    };
    
    // Handle meal plan update event
    const handleMealPlanUpdate = () => {
        const mealPlan = MealPlanManager.getMealPlan();
        if (!mealPlan) return;
        
        // Add any new recipes from the meal plan to favorites
        Object.values(mealPlan).forEach(recipe => {
            if (recipe) {
                addToFavorites(recipe);
            }
        });
    };
    
    // Add a recipe to favorites
    const addToFavorites = (recipe) => {
        if (!recipe || !recipe.id) return;
        
        // Skip if already in favorites
        if (state.favorites.some(fav => fav.id === recipe.id)) {
            return;
        }
        
        // Add to favorites
        state.favorites.unshift(recipe); // Add to beginning
        
        // Limit number of favorites
        if (state.favorites.length > MAX_FAVORITES) {
            state.favorites = state.favorites.slice(0, MAX_FAVORITES);
        }
        
        // Save to storage
        saveFavorites();
        
        // Update UI
        renderFavorites();
    };
    
    // Remove a recipe from favorites
    const removeFromFavorites = (recipeId) => {
        if (!recipeId) return;
        
        // Remove from state
        state.favorites = state.favorites.filter(recipe => recipe.id !== recipeId);
        
        // Save to storage
        saveFavorites();
        
        // Update UI
        renderFavorites();
    };
    
    // Render favorites grid
    const renderFavorites = () => {
        if (!elements.favoritesGrid) return;
        
        // Clear current favorites
        domHelpers.clearElement(elements.favoritesGrid);
        
        // Show empty message if no favorites
        if (state.favorites.length === 0) {
            const emptyMessage = domHelpers.createElement('div', {
                className: 'empty-favorites',
                innerHTML: '<p>You haven\'t added any favorites yet. Recipes you add to your meal plan will appear here.</p>'
            });
            elements.favoritesGrid.appendChild(emptyMessage);
            return;
        }
        
        // Create favorite cards
        state.favorites.forEach(recipe => {
            const card = createFavoriteCard(recipe);
            elements.favoritesGrid.appendChild(card);
        });
    };
    
    // Create a favorite recipe card
    const createFavoriteCard = (recipe) => {
        const sourceDisplay = recipe.source === 'halfbakedharvest' ? 'Half Baked Harvest' : 'The Modern Proper';
        
        // Create card container
        const card = domHelpers.createElement('div', { className: 'favorite-card' });
        
        // Create image
        const imageContainer = domHelpers.createElement('div', { className: 'favorite-image' });
        const image = domHelpers.createElement('img', {
            src: recipe.imageUrl,
            alt: recipe.title
        });
        imageContainer.appendChild(image);
        
        // Create content
        const content = domHelpers.createElement('div', { className: 'favorite-content' });
        
        // Title
        const title = domHelpers.createElement('h3', {
            className: 'favorite-title',
            textContent: recipe.title
        });
        
        // Source
        const source = domHelpers.createElement('div', {
            className: 'favorite-source',
            textContent: sourceDisplay
        });
        
        // Meta info
        const meta = domHelpers.createElement('div', { className: 'favorite-meta' });
        
        const prepTime = domHelpers.createElement('span', {
            className: 'meta-item',
            textContent: `${recipe.prepTime} min prep`
        });
        
        const cookTime = domHelpers.createElement('span', {
            className: 'meta-item',
            textContent: `${recipe.cookTime} min cook`
        });
        
        meta.appendChild(prepTime);
        meta.appendChild(cookTime);
        
        // Actions
        const actions = domHelpers.createElement('div', { className: 'favorite-actions' });
        
        // View recipe button
        const viewButton = domHelpers.createElement('a', {
            className: 'favorite-view',
            href: recipe.sourceUrl,
            target: '_blank',
            textContent: 'View Recipe'
        });
        
        // Add to plan button
        const addToPlanBtn = domHelpers.createElement('button', {
            className: 'favorite-add-to-plan',
            'data-recipe-id': recipe.id,
            textContent: 'Add to Plan'
        });
        
        // Remove button
        const removeButton = domHelpers.createElement('button', {
            className: 'favorite-remove',
            'data-recipe-id': recipe.id,
            textContent: 'Remove'
        });
        
        // Add event listeners
        addToPlanBtn.addEventListener('click', () => {
            state.currentRecipe = recipe.id;
            const daySelectionModal = document.getElementById('day-selection-modal');
            if (daySelectionModal) {
                daySelectionModal.classList.add('active');
            }
        });
        
        removeButton.addEventListener('click', () => {
            removeFromFavorites(recipe.id);
        });
        
        // Assemble the card
        actions.appendChild(addToPlanBtn);
        actions.appendChild(viewButton);
        actions.appendChild(removeButton);
        
        content.appendChild(title);
        content.appendChild(source);
        content.appendChild(meta);
        content.appendChild(actions);
        
        card.appendChild(imageContainer);
        card.appendChild(content);
        
        return card;
    };
    
    // Refresh favorites display
    const refreshFavorites = () => {
        loadFavorites();
        renderFavorites();
    };
    
    // Public API
    return {
        init,
        addToFavorites,
        removeFromFavorites,
        refreshFavorites,
        getFavorites: () => [...state.favorites]
    };
})();