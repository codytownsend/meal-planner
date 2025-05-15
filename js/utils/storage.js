// Storage Manager for persistence
const StorageManager = (() => {
    // Constants
    const STORAGE_KEYS = {
        MEAL_PLAN: 'mealPlannerMealPlan',
        FILTERS: 'mealPlannerFilters',
        LAST_VIEW: 'mealPlannerLastView',
        FAVORITES: 'mealPlannerFavorites',
        RECIPE_HISTORY: 'mealPlannerRecipeHistory'
    };

    // Check if localStorage is available
    const isLocalStorageAvailable = () => {
        try {
            const testKey = 'test';
            localStorage.setItem(testKey, testKey);
            localStorage.removeItem(testKey);
            return true;
        } catch (e) {
            console.error('LocalStorage is not available:', e);
            return false;
        }
    };

    // Save data to localStorage
    const saveData = (key, data) => {
        if (!isLocalStorageAvailable()) return false;
        
        try {
            const jsonData = JSON.stringify(data);
            localStorage.setItem(key, jsonData);
            return true;
        } catch (e) {
            console.error(`Error saving data for key "${key}":`, e);
            return false;
        }
    };

    // Load data from localStorage
    const loadData = (key) => {
        if (!isLocalStorageAvailable()) return null;
        
        try {
            const jsonData = localStorage.getItem(key);
            if (!jsonData) return null;
            
            return JSON.parse(jsonData);
        } catch (e) {
            console.error(`Error loading data for key "${key}":`, e);
            return null;
        }
    };

    // Clear data from localStorage
    const clearData = (key) => {
        if (!isLocalStorageAvailable()) return false;
        
        try {
            localStorage.removeItem(key);
            return true;
        } catch (e) {
            console.error(`Error clearing data for key "${key}":`, e);
            return false;
        }
    };

    // Save meal plan
    const saveMealPlan = (mealPlan) => {
        // Save recipes to history for favorites feature
        saveMealPlanHistory(mealPlan);
        
        // Save the meal plan itself
        return saveData(STORAGE_KEYS.MEAL_PLAN, mealPlan);
    };
    
    // Save meal plan history (for favorites)
    const saveMealPlanHistory = (mealPlan) => {
        if (!mealPlan) return false;
        
        try {
            // Load current history
            const history = loadData(STORAGE_KEYS.RECIPE_HISTORY) || {};
            
            // Add recipe IDs to history with timestamp
            Object.values(mealPlan).forEach(recipeId => {
                if (recipeId !== null) {
                    history[recipeId] = Date.now();
                }
            });
            
            // Save updated history
            return saveData(STORAGE_KEYS.RECIPE_HISTORY, history);
        } catch (e) {
            console.error('Error saving meal plan history:', e);
            return false;
        }
    };

    // Load meal plan
    const loadMealPlan = () => {
        return loadData(STORAGE_KEYS.MEAL_PLAN);
    };

    // Save filter settings
    const saveFilters = (filters) => {
        return saveData(STORAGE_KEYS.FILTERS, filters);
    };

    // Load filter settings
    const loadFilters = () => {
        return loadData(STORAGE_KEYS.FILTERS);
    };

    // Save last active view
    const saveLastView = (view) => {
        return saveData(STORAGE_KEYS.LAST_VIEW, view);
    };

    // Load last active view
    const loadLastView = () => {
        return loadData(STORAGE_KEYS.LAST_VIEW);
    };
    
    // Save favorites
    const saveFavorites = (favorites) => {
        return saveData(STORAGE_KEYS.FAVORITES, favorites);
    };
    
    // Load favorites
    const loadFavorites = () => {
        return loadData(STORAGE_KEYS.FAVORITES);
    };

    // Clear all data
    const clearAllData = () => {
        if (!isLocalStorageAvailable()) return false;
        
        try {
            Object.values(STORAGE_KEYS).forEach(key => {
                localStorage.removeItem(key);
            });
            return true;
        } catch (e) {
            console.error('Error clearing all data:', e);
            return false;
        }
    };

    // Public API
    return {
        saveData,
        loadData,
        clearData,
        saveMealPlan,
        loadMealPlan,
        saveFilters,
        loadFilters,
        saveLastView,
        loadLastView,
        saveFavorites,
        loadFavorites,
        clearAllData
    };
})();