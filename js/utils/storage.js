// Storage Manager for persistence
const StorageManager = (() => {
    // Constants
    const STORAGE_KEYS = {
        MEAL_PLAN: 'mealPlannerMealPlan',
        FILTERS: 'mealPlannerFilters',
        LAST_VIEW: 'mealPlannerLastView'
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
        return saveData(STORAGE_KEYS.MEAL_PLAN, mealPlan);
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
        saveMealPlan,
        loadMealPlan,
        saveFilters,
        loadFilters,
        saveLastView,
        loadLastView,
        clearAllData
    };
})();