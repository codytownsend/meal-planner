// Meal planning functionality
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
        currentRecipe: null
    };
    
    // DOM elements
    const elements = {
        dayCards: null,
        daySelectionModal: null,
        daySelectionOptions: null,
        cancelDaySelection: null,
        togglePlanBtn: null,
        weeklyPlan: null
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
        
        // Check if required elements exist
        if (!elements.daySelectionModal || !elements.weeklyPlan) {
            console.error('Required meal plan elements not found');
            return;
        }
        
        setupEventListeners();
    };
    
    // Setup event listeners
    const setupEventListeners = () => {
        // Listen for "Add to Plan" button clicks
        domHelpers.addEventDelegate(document, 'click', '.add-to-plan', (event) => {
            const target = event.target.closest('.add-to-plan');
            const recipeId = target.dataset.recipeId;
            if (recipeId) {
                state.currentRecipe = parseInt(recipeId);
                openDaySelectionModal();
            }
        });
        
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
        
        // Day card click for empty slots
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
        
        // Listen for remove button clicks
        domHelpers.addEventDelegate(document, 'click', '.day-card-remove', (event, target) => {
            const dayCard = target.closest('.day-card');
            if (dayCard) {
                const day = dayCard.dataset.day;
                if (day) {
                    removeFromMealPlan(day);
                    event.stopPropagation(); // Prevent the day card click from firing
                }
            }
        });
        
        // Close modals when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target === elements.daySelectionModal) {
                closeDaySelectionModal();
            }
        });
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
    };
    
    // Remove recipe from meal plan
    const removeFromMealPlan = (day) => {
        if (!day || !Object.values(DAYS).includes(day)) {
            console.error(`Invalid day: ${day}`);
            return;
        }
        
        state.mealPlan[day] = null;
        updateDayCard(day);
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
        
        if (state.mealPlan[day]) {
            const recipe = state.mealPlan[day];
            
            // Clear the content
            domHelpers.clearElement(contentElement);
            
            // Set filled class
            contentElement.className = 'day-card-content ' + CLASSES.FILLED;
            
            // Create recipe title
            const recipeTitle = domHelpers.createElement('div', {
                className: 'recipe-title',
                textContent: recipe.title
            });
            
            // Create remove button
            const removeBtn = domHelpers.createElement('button', {
                className: 'day-card-remove',
                innerHTML: '×',
                title: 'Remove recipe'
            });
            
            // Add elements to the card
            contentElement.appendChild(recipeTitle);
            contentElement.appendChild(removeBtn);
        } else {
            contentElement.className = 'day-card-content ' + CLASSES.EMPTY;
            contentElement.innerHTML = '<span>Tap to add</span>';
        }
    };
    
    // Get meal plan data (for grocery list generation)
    const getMealPlan = () => {
        return {...state.mealPlan};
    };
    
    // Public API
    return {
        init,
        getMealPlan,
        removeFromMealPlan
    };
})();