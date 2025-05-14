// Meal planning functionality with localStorage integration and custom confirmation
const MealPlanManager = (() => {
    // Constants
    const DAYS = {
        MONDAY: 'monday',
        TUESDAY: 'tuesday',
        WEDNESDAY: 'wednesday',
        THURSDAY: 'thursday',
        FRIDAY: 'friday',
        SATURDAY: 'saturday',
        SUNDAY: 'sunday'
    };
    
    const CLASSES = {
        ACTIVE: 'active',
        FILLED: 'filled',
        EMPTY: 'empty',
        COLLAPSED: 'collapsed'
    };
    
    // State
    const state = {
        mealPlan: {
            [DAYS.MONDAY]: null,
            [DAYS.TUESDAY]: null,
            [DAYS.WEDNESDAY]: null,
            [DAYS.THURSDAY]: null,
            [DAYS.FRIDAY]: null,
            [DAYS.SATURDAY]: null,
            [DAYS.SUNDAY]: null
        },
        currentRecipe: null,
        pendingAction: null  // To store action that's awaiting confirmation
    };
    
    // DOM elements
    const elements = {
        dayCards: null,
        daySelectionModal: null,
        daySelectionOptions: null,
        cancelDaySelection: null,
        togglePlanBtn: null,
        weeklyPlan: null,
        dayCardsContainer: null,
        clearMealPlanBtn: null,
        confirmationModal: null,
        confirmMessage: null,
        confirmYesBtn: null,
        confirmCancelBtn: null
    };
    
    // Initialize
    const init = () => {
        // Get DOM elements
        elements.dayCards = document.querySelectorAll('.day-card');
        elements.daySelectionModal = document.getElementById('day-selection-modal');
        elements.daySelectionOptions = document.querySelector('.day-selection-options');
        elements.cancelDaySelection = document.getElementById('cancel-day-selection');
        elements.togglePlanBtn = document.getElementById('toggle-plan');
        elements.weeklyPlan = document.querySelector('.weekly-plan');
        elements.dayCardsContainer = document.querySelector('.day-cards');
        elements.clearMealPlanBtn = document.getElementById('clear-meal-plan');
        
        // Get confirmation modal elements
        elements.confirmationModal = document.getElementById('confirmation-modal');
        elements.confirmMessage = document.getElementById('confirmation-message');
        elements.confirmYesBtn = document.getElementById('confirm-yes');
        elements.confirmCancelBtn = document.getElementById('confirm-cancel');
        
        // Check if required elements exist
        if (!elements.daySelectionModal || !elements.weeklyPlan || !elements.dayCardsContainer) {
            console.error('Required meal plan elements not found');
            return;
        }
        
        // Load saved meal plan
        loadMealPlan();
        
        setupEventListeners();
    };
    
    // Setup event listeners
    const setupEventListeners = () => {
        // Listen for "Add to Plan" button clicks using document body instead of document
        if (document.body) {
            domHelpers.addEventDelegate(document.body, 'click', '.add-to-plan', (event) => {
                const target = event.target.closest('.add-to-plan');
                const recipeId = target?.dataset.recipeId;
                if (recipeId) {
                    state.currentRecipe = parseInt(recipeId);
                    openDaySelectionModal();
                }
            });
        }
        
        // Day selection options
        if (elements.daySelectionOptions) {
            domHelpers.addEventDelegate(elements.daySelectionOptions, 'click', 'button', (_, target) => {
                const day = target.dataset.day;
                if (day && Object.values(DAYS).includes(day)) {
                    addToMealPlan(day, state.currentRecipe);
                    closeDaySelectionModal();
                }
            });
        }
        
        // Cancel day selection
        if (elements.cancelDaySelection) {
            elements.cancelDaySelection.addEventListener('click', closeDaySelectionModal);
        }
        
        // Toggle weekly plan collapse/expand
        if (elements.togglePlanBtn) {
            elements.togglePlanBtn.addEventListener('click', () => {
                elements.weeklyPlan.classList.toggle(CLASSES.COLLAPSED);
            });
        }
        
        // Clear meal plan button
        if (elements.clearMealPlanBtn) {
            elements.clearMealPlanBtn.addEventListener('click', () => {
                showConfirmation('Are you sure you want to clear your meal plan?', 'clearMealPlan');
            });
        }
        
        // Confirmation modal event listeners
        if (elements.confirmationModal) {
            // Confirm button
            if (elements.confirmYesBtn) {
                elements.confirmYesBtn.addEventListener('click', () => {
                    executeConfirmedAction();
                    closeConfirmationModal();
                });
            }
            
            // Cancel button
            if (elements.confirmCancelBtn) {
                elements.confirmCancelBtn.addEventListener('click', closeConfirmationModal);
            }
            
            // Click outside to close
            elements.confirmationModal.addEventListener('click', (e) => {
                if (e.target === elements.confirmationModal) {
                    closeConfirmationModal();
                }
            });
        }
        
        // Day card click for empty slots - using direct event listeners on the elements
        if (elements.dayCards) {
            elements.dayCards.forEach(card => {
                card.addEventListener('click', (e) => {
                    // Don't trigger if clicking the remove button
                    if (e.target.closest('.day-card-remove')) return;
                    
                    const day = card.dataset.day;
                    if (day && !state.mealPlan[day]) {
                        // Get current recipe from carousel
                        const currentRecipeObj = CarouselManager.getCurrentRecipe();
                        if (currentRecipeObj && currentRecipeObj.id) {
                            addToMealPlan(day, currentRecipeObj.id);
                        }
                    }
                });
            });
        }
        
        // Close modals when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target === elements.daySelectionModal) {
                closeDaySelectionModal();
            }
        });
    };
    
    // Show confirmation modal
    const showConfirmation = (message, action, data) => {
        if (!elements.confirmationModal || !elements.confirmMessage) {
            console.error('Confirmation modal elements not found');
            return;
        }
        
        // Set the message
        elements.confirmMessage.textContent = message;
        
        // Store the pending action
        state.pendingAction = {
            action: action,
            data: data
        };
        
        // Show the modal
        elements.confirmationModal.classList.add('active');
    };
    
    // Close confirmation modal
    const closeConfirmationModal = () => {
        if (!elements.confirmationModal) return;
        
        elements.confirmationModal.classList.remove('active');
        state.pendingAction = null;
    };
    
    // Execute the confirmed action
    const executeConfirmedAction = () => {
        if (!state.pendingAction) return;
        
        const { action, data } = state.pendingAction;
        
        switch (action) {
            case 'clearMealPlan':
                clearMealPlan();
                break;
            case 'removeFromDay':
                if (data && data.day) {
                    // This version doesn't trigger another confirmation
                    removeFromMealPlanWithoutConfirm(data.day);
                }
                break;
            default:
                console.error(`Unknown action: ${action}`);
        }
    };
    
    // Open day selection modal
    const openDaySelectionModal = () => {
        if (elements.daySelectionModal) {
            elements.daySelectionModal.classList.add(CLASSES.ACTIVE);
        }
    };
    
    // Close day selection modal
    const closeDaySelectionModal = () => {
        if (elements.daySelectionModal) {
            elements.daySelectionModal.classList.remove(CLASSES.ACTIVE);
            state.currentRecipe = null;
        }
    };
    
    // Add recipe to meal plan
    const addToMealPlan = (day, recipeId) => {
        if (!day || !Object.values(DAYS).includes(day)) {
            console.error(`Invalid day: ${day}`);
            return;
        }
        
        if (!recipeId) {
            console.error('No recipe ID provided');
            return;
        }
        
        const recipe = findRecipeById(recipeId);
        if (!recipe) {
            console.error(`Recipe with ID ${recipeId} not found`);
            return;
        }
        
        state.mealPlan[day] = recipe;
        updateDayCard(day);
        
        // Save changes to localStorage
        saveMealPlan();
    };
    
    // Remove recipe from meal plan (with confirmation)
    const removeFromMealPlan = (day) => {
        if (!day || !Object.values(DAYS).includes(day)) {
            console.error(`Invalid day: ${day}`);
            return;
        }
        
        const recipe = state.mealPlan[day];
        if (recipe) {
            showConfirmation(`Remove ${recipe.title} from ${day}?`, 'removeFromDay', { day });
        }
    };
    
    // Remove recipe from meal plan (without confirmation - internal use)
    const removeFromMealPlanWithoutConfirm = (day) => {
        if (!day || !Object.values(DAYS).includes(day)) {
            console.error(`Invalid day: ${day}`);
            return;
        }
        
        console.log(`Removing recipe from ${day}`);
        state.mealPlan[day] = null;
        updateDayCard(day);
        
        // Save changes to localStorage
        saveMealPlan();
    };
    
    // Find recipe by ID
    const findRecipeById = (id) => {
        if (!window.sampleRecipes || !Array.isArray(window.sampleRecipes)) {
            console.error('No recipe data available');
            return null;
        }
        
        return window.sampleRecipes.find(recipe => recipe.id === id) || null;
    };
    
    // Update day card display
    const updateDayCard = (day) => {
        const card = document.querySelector(`.day-card[data-day="${day}"]`);
        if (!card) {
            console.error(`Day card for ${day} not found`);
            return;
        }
        
        const contentElement = card.querySelector('.day-card-content');
        if (!contentElement) {
            console.error(`Content element for day ${day} not found`);
            return;
        }
        
        // Remove existing remove button if any
        const existingRemoveBtn = card.querySelector('.day-card-remove');
        if (existingRemoveBtn) {
            existingRemoveBtn.remove();
        }
        
        // Clear the content
        domHelpers.clearElement(contentElement);
        
        if (state.mealPlan[day]) {
            const recipe = state.mealPlan[day];
            
            // Set filled class
            contentElement.className = 'day-card-content ' + CLASSES.FILLED;
            
            // Create recipe title
            const recipeTitle = domHelpers.createElement('div', {
                className: 'recipe-title',
                textContent: recipe.title
            });
            
            // Add elements to the card
            contentElement.appendChild(recipeTitle);
            
            // Create remove button (moved to the card level, outside content)
            const removeBtn = domHelpers.createElement('button', {
                className: 'day-card-remove',
                innerHTML: '×',
                title: 'Remove recipe',
                'data-day': day  // Store day directly on button for easy access
            });
            
            // Add button to the card itself, not inside content
            card.appendChild(removeBtn);

            // Add a direct event listener to ensure it works
            removeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                removeFromMealPlan(day);
            });
        } else {
            contentElement.className = 'day-card-content ' + CLASSES.EMPTY;
            contentElement.innerHTML = '<span>Tap to add</span>';
        }
    };
    
    // Get meal plan data (for grocery list generation)
    const getMealPlan = () => {
        return {...state.mealPlan};
    };
    
    // Save the current meal plan to localStorage
    const saveMealPlan = () => {
        // Check if StorageManager exists
        if (typeof StorageManager === 'undefined' || !StorageManager.saveMealPlan) {
            console.warn('StorageManager not available yet, skipping meal plan saving');
            return false;
        }
        
        // Convert recipe objects to IDs for storage
        const storagePlan = {};
        
        Object.entries(state.mealPlan).forEach(([day, recipe]) => {
            storagePlan[day] = recipe ? recipe.id : null;
        });
        
        // Save using the StorageManager
        return StorageManager.saveMealPlan(storagePlan);
    };
    
    // Load meal plan from localStorage
    const loadMealPlan = () => {
        // Check if StorageManager exists
        if (typeof StorageManager === 'undefined' || !StorageManager.loadMealPlan) {
            console.warn('StorageManager not available yet, skipping meal plan loading');
            return false;
        }
        
        const storagePlan = StorageManager.loadMealPlan();
        if (!storagePlan) return false;
        
        // Convert IDs back to recipe objects
        Object.entries(storagePlan).forEach(([day, recipeId]) => {
            if (recipeId !== null) {
                const recipe = findRecipeById(recipeId);
                if (recipe) {
                    state.mealPlan[day] = recipe;
                    updateDayCard(day);
                }
            }
        });
        
        return true;
    };
    
    // Clear the meal plan
    const clearMealPlan = () => {
        // Reset state
        Object.keys(state.mealPlan).forEach(day => {
            state.mealPlan[day] = null;
            updateDayCard(day);
        });
        
        // Clear from storage
        saveMealPlan();
    };
    
    // Public API
    return {
        init,
        getMealPlan,
        removeFromMealPlan,
        clearMealPlan,
        saveMealPlan,
        loadMealPlan
    };
})();