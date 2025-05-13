// Simplified Carousel with Details Dropdown
const CarouselManager = (() => {
    // State management
    const state = {
        recipes: [],
        currentIndex: 0
    };
    
    // DOM Element references
    const elements = {
        carousel: null,
        prevBtn: null,
        nextBtn: null,
        dotsContainer: null
    };
    
    // Constants
    const CLASSES = {
        DOT: 'dot',
        ACTIVE: 'active',
        OPEN: 'open'
    };
    
    // Initialize
    const init = (recipeData) => {
        if (!recipeData || !Array.isArray(recipeData) || !recipeData.length) {
            console.error('Invalid recipe data provided to CarouselManager');
            return;
        }
        
        state.recipes = recipeData;
        
        // Get DOM elements
        elements.carousel = document.getElementById('recipe-carousel');
        elements.prevBtn = document.getElementById('prev-recipe');
        elements.nextBtn = document.getElementById('next-recipe');
        elements.dotsContainer = document.getElementById('carousel-dots');
        
        // Verify elements exist
        if (!elements.carousel || !elements.prevBtn || 
            !elements.nextBtn || !elements.dotsContainer) {
            console.error('Required carousel elements not found');
            return;
        }
        
        renderCarousel();
        renderDots();
        setupEventListeners();
        updateNavigation();
    };
    
    // Create carousel items with simple design
    const renderCarousel = () => {
        domHelpers.clearElement(elements.carousel);
        
        state.recipes.forEach(recipe => {
            const card = createRecipeCard(recipe);
            elements.carousel.appendChild(card);
        });
        
        updateCarouselPosition();
    };
    
    // Create navigation dots
    const renderDots = () => {
        domHelpers.clearElement(elements.dotsContainer);
        
        state.recipes.forEach((_, index) => {
            const dot = domHelpers.createElement('div', {
                className: `${CLASSES.DOT} ${index === state.currentIndex ? CLASSES.ACTIVE : ''}`,
                'data-index': index
            });
            elements.dotsContainer.appendChild(dot);
        });
    };
    
    // Create simplified recipe card using domHelpers
    const createRecipeCard = (recipe) => {
        const sourceDisplay = recipe.source === 'halfbakedharvest' ? 'Half Baked Harvest' : 'The Modern Proper';
        
        // Create card container
        const card = domHelpers.createElement('div', { className: 'recipe-card' });
        
        // Create image section
        const imageSection = domHelpers.createElement('div', { className: 'recipe-image' });
        
        const image = domHelpers.createElement('img', {
            src: recipe.imageUrl,
            alt: recipe.title
        });
        
        const source = domHelpers.createElement('div', {
            className: 'recipe-source',
            textContent: sourceDisplay
        });
        
        imageSection.appendChild(image);
        imageSection.appendChild(source);
        
        // Create content section
        const content = domHelpers.createElement('div', { className: 'recipe-content' });
        
        const title = domHelpers.createElement('h2', {
            className: 'recipe-title',
            textContent: recipe.title
        });
        
        content.appendChild(title);
        
        // Create details toggle button
        const detailsToggle = domHelpers.createElement('button', {
            className: 'details-toggle',
            innerHTML: `
                <span>More Details</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
            `
        });
        
        // Create details panel (hidden by default)
        const detailsPanel = domHelpers.createElement('div', { className: 'recipe-details' });
        
        const detailsContent = domHelpers.createElement('div', { className: 'details-content' });
        
        // Recipe meta info
        const meta = domHelpers.createElement('div', { className: 'recipe-meta' });
        
        const prepTime = domHelpers.createElement('div', {
            className: 'meta-tag',
            innerHTML: `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                <span>${recipe.prepTime} min prep</span>
            `
        });
        
        const cookTime = domHelpers.createElement('div', {
            className: 'meta-tag',
            innerHTML: `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="4" y="5" width="16" height="16" rx="2"></rect>
                    <path d="M16 2v4"></path>
                    <path d="M8 2v4"></path>
                    <path d="M4 10h16"></path>
                </svg>
                <span>${recipe.cookTime} min cook</span>
            `
        });
        
        const servings = domHelpers.createElement('div', {
            className: 'meta-tag',
            innerHTML: `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
                <span>Serves ${recipe.servings}</span>
            `
        });
        
        meta.appendChild(prepTime);
        meta.appendChild(cookTime);
        meta.appendChild(servings);
        
        // Ingredients preview
        const ingredientsPreview = domHelpers.createElement('div', { className: 'ingredients-preview' });
        const ingredientsList = domHelpers.createElement('ul', { className: 'ingredients-preview' });
        
        // Show first 3 ingredients
        const displayedIngredients = recipe.ingredients.slice(0, 3);
        displayedIngredients.forEach(ingredient => {
            const item = domHelpers.createElement('li', {
                textContent: `${ingredient.amount} ${ingredient.name}`
            });
            ingredientsList.appendChild(item);
        });
        
        // If there are more ingredients, add a "more" indicator
        if (recipe.ingredients.length > 3) {
            const moreItem = domHelpers.createElement('li', {
                className: 'more-ingredients',
                textContent: `+ ${recipe.ingredients.length - 3} more ingredients`
            });
            ingredientsList.appendChild(moreItem);
        }
        
        ingredientsPreview.appendChild(ingredientsList);
        
        // Recipe actions
        const actions = domHelpers.createElement('div', { className: 'recipe-actions' });
        
        const addToPlanBtn = domHelpers.createElement('button', {
            className: 'add-to-plan',
            'data-recipe-id': recipe.id,
            innerHTML: `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 5v14"></path>
                    <path d="M5 12h14"></path>
                </svg>
                Add to Plan
            `
        });
        
        const viewRecipeLink = domHelpers.createElement('a', {
            className: 'view-recipe',
            href: recipe.sourceUrl,
            target: '_blank',
            textContent: 'View Recipe'
        });
        
        actions.appendChild(addToPlanBtn);
        actions.appendChild(viewRecipeLink);
        
        // Assemble the details panel
        detailsContent.appendChild(meta);
        detailsContent.appendChild(ingredientsPreview);
        detailsContent.appendChild(actions);
        detailsPanel.appendChild(detailsContent);
        
        // Assemble the card
        card.appendChild(imageSection);
        card.appendChild(content);
        card.appendChild(detailsToggle);
        card.appendChild(detailsPanel);
        
        // Add event listener for toggle
        detailsToggle.addEventListener('click', () => {
            detailsToggle.classList.toggle(CLASSES.OPEN);
            detailsPanel.classList.toggle(CLASSES.OPEN);
        });
        
        return card;
    };
    
    // Setup event listeners
    const setupEventListeners = () => {
        // Navigation buttons
        elements.prevBtn.addEventListener('click', showPreviousRecipe);
        elements.nextBtn.addEventListener('click', showNextRecipe);
        
        // Dot navigation
        domHelpers.addEventDelegate(elements.dotsContainer, 'click', `.${CLASSES.DOT}`, (_, target) => {
            const index = parseInt(target.dataset.index);
            if (!isNaN(index)) {
                goToRecipe(index);
            }
        });
        
        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') {
                showPreviousRecipe();
            } else if (e.key === 'ArrowRight') {
                showNextRecipe();
            }
        });
        
        // Touch swiping
        let startX, moveX;
        elements.carousel.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
        });
        
        elements.carousel.addEventListener('touchmove', (e) => {
            moveX = e.touches[0].clientX;
        });
        
        elements.carousel.addEventListener('touchend', () => {
            if (startX && moveX) {
                const diff = startX - moveX;
                if (Math.abs(diff) > 50) {
                    if (diff > 0) {
                        showNextRecipe();
                    } else {
                        showPreviousRecipe();
                    }
                }
            }
            startX = null;
            moveX = null;
        });
    };
    
    // Navigation functions
    const goToRecipe = (index) => {
        if (index >= 0 && index < state.recipes.length) {
            state.currentIndex = index;
            updateCarouselPosition();
            updateNavigation();
        }
    };
    
    const showPreviousRecipe = () => {
        if (state.currentIndex > 0) {
            state.currentIndex--;
            updateCarouselPosition();
            updateNavigation();
        }
    };
    
    const showNextRecipe = () => {
        if (state.currentIndex < state.recipes.length - 1) {
            state.currentIndex++;
            updateCarouselPosition();
            updateNavigation();
        }
    };
    
    // Update functions
    const updateCarouselPosition = () => {
        if (!elements.carousel) return;
        
        const position = -state.currentIndex * 100;
        elements.carousel.style.transform = `translateX(${position}%)`;
    };
    
    const updateNavigation = () => {
        // Update buttons
        if (elements.prevBtn && elements.nextBtn) {
            elements.prevBtn.style.opacity = state.currentIndex === 0 ? '0.5' : '1';
            elements.prevBtn.style.pointerEvents = state.currentIndex === 0 ? 'none' : 'auto';
            
            elements.nextBtn.style.opacity = state.currentIndex === state.recipes.length - 1 ? '0.5' : '1';
            elements.nextBtn.style.pointerEvents = state.currentIndex === state.recipes.length - 1 ? 'none' : 'auto';
        }
        
        // Update dots
        if (elements.dotsContainer) {
            const dots = elements.dotsContainer.querySelectorAll(`.${CLASSES.DOT}`);
            dots.forEach((dot, index) => {
                dot.classList.toggle(CLASSES.ACTIVE, index === state.currentIndex);
            });
        }
    };
    
    // Filter recipes
    const filterRecipes = (filteredRecipeData) => {
        if (!filteredRecipeData || !Array.isArray(filteredRecipeData)) {
            console.error('Invalid filtered recipe data');
            return;
        }
        
        state.recipes = filteredRecipeData;
        state.currentIndex = 0;
        renderCarousel();
        renderDots();
        updateNavigation();
    };
    
    // Get current recipe
    const getCurrentRecipe = () => {
        return state.recipes[state.currentIndex] || null;
    };
    
    // Public API
    return {
        init,
        filterRecipes,
        getCurrentRecipe
    };
})();