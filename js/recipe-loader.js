// js/recipe-loader.js
const RecipeLoader = (() => {
    // State
    const state = {
        allRecipes: [],
        filteredRecipes: [],
        currentPage: 0,
        recipesPerPage: 50,
        isLoading: false,
        hasMoreRecipes: true,
        filters: {}
    };
    
    // Initialize - load first batch of recipes
    const init = async () => {
        try {
            state.isLoading = true;
            
            // Use the already loaded window.sampleRecipes variable
            if (!window.sampleRecipes || !Array.isArray(window.sampleRecipes)) {
                console.error('Recipe data not found or invalid');
                return [];
            }
            
            // Get the first batch of recipes
            const firstBatch = window.sampleRecipes.slice(0, state.recipesPerPage);
            state.allRecipes = firstBatch;
            state.filteredRecipes = [...firstBatch];
            state.hasMoreRecipes = window.sampleRecipes.length > state.recipesPerPage;
            
            console.log(`Loaded initial ${firstBatch.length} recipes out of ${window.sampleRecipes.length}`);
            
            state.isLoading = false;
            return firstBatch;
        } catch (error) {
            console.error('Failed to initialize recipes:', error);
            state.isLoading = false;
            return [];
        }
    };
    
    // Load more recipes
    const loadMoreRecipes = async () => {
        // Don't load if already loading or no more recipes
        if (state.isLoading || !state.hasMoreRecipes) {
            return [];
        }
        
        try {
            state.isLoading = true;
            state.currentPage++;
            
            const start = state.currentPage * state.recipesPerPage;
            const end = start + state.recipesPerPage;
            
            // Load next batch from the main window.sampleRecipes array
            const nextBatch = window.sampleRecipes.slice(start, end);
            
            if (nextBatch.length === 0) {
                state.hasMoreRecipes = false;
                state.isLoading = false;
                return [];
            }
            
            // Add to already loaded recipes
            state.allRecipes = [...state.allRecipes, ...nextBatch];
            
            // Apply current filters to all recipes
            applyFilters(state.filters);
            
            console.log(`Loaded ${nextBatch.length} more recipes (${state.allRecipes.length} total)`);
            state.isLoading = false;
            
            // Check if there are more recipes to load
            state.hasMoreRecipes = end < window.sampleRecipes.length;
            
            return nextBatch;
        } catch (error) {
            console.error('Failed to load more recipes:', error);
            state.isLoading = false;
            return [];
        }
    };
    
    // Apply filters to the loaded recipes
    const applyFilters = (filters = {}) => {
        state.filters = filters;
        
        state.filteredRecipes = state.allRecipes.filter(recipe => {
            // Apply search filter if provided
            if (filters.searchQuery && filters.searchQuery.length > 0) {
                const query = filters.searchQuery.toLowerCase();
                const titleMatch = recipe.title.toLowerCase().includes(query);
                const tagsMatch = recipe.tags && Array.isArray(recipe.tags) && 
                               recipe.tags.some(tag => tag.toLowerCase().includes(query));
                const ingredientMatch = recipe.ingredients && Array.isArray(recipe.ingredients) &&
                                   recipe.ingredients.some(ingredient => 
                                       ingredient.name.toLowerCase().includes(query));
                
                if (!titleMatch && !tagsMatch && !ingredientMatch) {
                    return false;
                }
            }
            
            // Apply other filters
            return (!filters.cuisine || recipe.cuisine === filters.cuisine) &&
                   (!filters.mealType || recipe.mealType === filters.mealType) &&
                   (!filters.protein || recipe.protein === filters.protein) &&
                   (!filters.maxPrepTime || recipe.prepTime <= filters.maxPrepTime) &&
                   (!filters.maxCookTime || recipe.cookTime <= filters.maxCookTime) &&
                   (!filters.source || recipe.source === filters.source);
        });
        
        return state.filteredRecipes;
    };
    
    // Find recipe by ID
    const findRecipeById = (id) => {
        // First check loaded recipes
        let recipe = state.allRecipes.find(r => r.id === id);
        
        // If not found, check all available recipes
        if (!recipe && window.sampleRecipes) {
            recipe = window.sampleRecipes.find(r => r.id === id);
            
            // If found in all recipes but not in loaded recipes, add it to loaded
            if (recipe && !state.allRecipes.some(r => r.id === id)) {
                state.allRecipes.push(recipe);
            }
        }
        
        return recipe || null;
    };
    
    // Public API
    return {
        init,
        loadMoreRecipes,
        applyFilters,
        findRecipeById,
        getFilteredRecipes: () => state.filteredRecipes,
        getAllRecipes: () => state.allRecipes,
        getCurrentPage: () => state.currentPage,
        getTotalLoaded: () => state.allRecipes.length,
        getTotalAvailable: () => window.sampleRecipes ? window.sampleRecipes.length : 0,
        hasMore: () => state.hasMoreRecipes,
        isLoading: () => state.isLoading
    };
})();