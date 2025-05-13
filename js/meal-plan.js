// Meal planning functionality
const MealPlanManager = (() => {
    // State
    let mealPlan = {
        monday: null,
        tuesday: null,
        wednesday: null,
        thursday: null,
        friday: null,
        saturday: null,
        sunday: null
    };
    let currentRecipe = null;
    
    // DOM Elements
    const dayCards = document.querySelectorAll('.day-card');
    const daySelectionModal = document.getElementById('day-selection-modal');
    const daySelectionOptions = document.querySelector('.day-selection-options');
    const cancelDaySelection = document.getElementById('cancel-day-selection');
    const togglePlanBtn = document.getElementById('toggle-plan');
    const weeklyPlan = document.querySelector('.weekly-plan');
    
    // Initialize
    const init = () => {
        setupEventListeners();
    };
    
    // Setup event listeners
    const setupEventListeners = () => {
        // Listen for "Add to Plan" button clicks
        document.addEventListener('click', (e) => {
            if (e.target.closest('.add-to-plan')) {
                const recipeId = e.target.closest('.add-to-plan').dataset.recipeId;
                currentRecipe = parseInt(recipeId);
                openDaySelectionModal();
            }
        });
        
        // Day selection options
        daySelectionOptions.addEventListener('click', (e) => {
            if (e.target.tagName === 'BUTTON') {
                const day = e.target.dataset.day;
                addToMealPlan(day, currentRecipe);
                closeDaySelectionModal();
            }
        });
        
        // Cancel day selection
        cancelDaySelection.addEventListener('click', closeDaySelectionModal);
        
        // Toggle weekly plan collapse/expand
        togglePlanBtn.addEventListener('click', () => {
            weeklyPlan.classList.toggle('collapsed');
        });
        
        // Day card click for empty slots
        dayCards.forEach(card => {
            card.addEventListener('click', (e) => {
                // Don't trigger if clicking the remove button
                if (e.target.closest('.day-card-remove')) return;
                
                const day = card.dataset.day;
                if (!mealPlan[day]) {
                    currentRecipe = CarouselManager.getCurrentRecipe().id;
                    addToMealPlan(day, currentRecipe);
                }
            });
        });
        
        // Listen for remove button clicks
        document.addEventListener('click', (e) => {
            if (e.target.closest('.day-card-remove')) {
                const day = e.target.closest('.day-card').dataset.day;
                removeFromMealPlan(day);
                e.stopPropagation(); // Prevent the day card click from firing
            }
        });
        
        // Close modals when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target === daySelectionModal) {
                closeDaySelectionModal();
            }
        });
    };
    
    // Open day selection modal
    const openDaySelectionModal = () => {
        daySelectionModal.classList.add('active');
    };
    
    // Close day selection modal
    const closeDaySelectionModal = () => {
        daySelectionModal.classList.remove('active');
        currentRecipe = null;
    };
    
    // Add recipe to meal plan
    const addToMealPlan = (day, recipeId) => {
        const recipe = findRecipeById(recipeId);
        mealPlan[day] = recipe;
        updateDayCard(day);
    };
    
    // Remove recipe from meal plan
    const removeFromMealPlan = (day) => {
        mealPlan[day] = null;
        updateDayCard(day);
    };
    
    // Find recipe by ID
    const findRecipeById = (id) => {
        return sampleRecipes.find(recipe => recipe.id === id);
    };
    
    // Update day card display
    const updateDayCard = (day) => {
        const card = document.querySelector(`.day-card[data-day="${day}"]`);
        const contentElement = card.querySelector('.day-card-content');
        
        if (mealPlan[day]) {
            const recipe = mealPlan[day];
            const sourceDisplay = recipe.source === 'halfbakedharvest' ? 'Half Baked Harvest' : 'The Modern Proper';
            
            // Clear the content
            contentElement.innerHTML = '';
            // Set filled class
            contentElement.className = 'day-card-content filled';
            
            // Create recipe title
            const recipeTitle = document.createElement('div');
            recipeTitle.className = 'recipe-title';
            recipeTitle.textContent = recipe.title;
            
            // Create remove button
            const removeBtn = document.createElement('button');
            removeBtn.className = 'day-card-remove';
            removeBtn.innerHTML = '×';
            removeBtn.title = 'Remove recipe';
            
            // Add elements to the card
            contentElement.appendChild(recipeTitle);
            contentElement.appendChild(removeBtn);
        } else {
            contentElement.className = 'day-card-content empty';
            contentElement.innerHTML = '<span>Tap to add</span>';
        }
    };
    
    // Get meal plan data (for grocery list generation)
    const getMealPlan = () => {
        return mealPlan;
    };
    
    // Public API
    return {
        init,
        getMealPlan,
        removeFromMealPlan
    };
})();