// js/carousel.js
// Simplified Carousel with Details Dropdown and Mobile Swipe Support
const CarouselManager = (() => {
    // State management
    const state = {
        recipes: [],
        currentIndex: 0,
        isSwiping: false,
        swipeStartX: null,
        swipeCurrentX: null,
        swipeThreshold: 50,
        animationInProgress: false
    };
    
    // DOM Element references
    const elements = {
        carousel: null,
        prevBtn: null,
        nextBtn: null,
        container: null
    };
    
    // Constants
    const CLASSES = {
        ACTIVE: 'active',
        OPEN: 'open',
        SWIPING: 'swiping'
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
        elements.container = document.querySelector('.carousel-container');
        
        // Verify elements exist
        if (!elements.carousel || !elements.prevBtn || !elements.nextBtn) {
            console.error('Required carousel elements not found');
            return;
        }
        
        renderCarousel();
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
    
    // Create recipe card - updated for mobile design
    const createRecipeCard = (recipe) => {
        const sourceDisplay = recipe.source === 'halfbakedharvest' ? 'Half Baked Harvest' : 'The Modern Proper';
        
        // Create card container
        const card = domHelpers.createElement('div', { className: 'recipe-card' });
        
        // Create image section
        const imageSection = domHelpers.createElement('div', { className: 'recipe-image' });
        
        const image = domHelpers.createElement('img', {
            src: recipe.imageUrl,
            alt: recipe.title,
            loading: 'lazy' // Add lazy loading
        });
        
        const source = domHelpers.createElement('div', {
            className: 'recipe-source',
            textContent: sourceDisplay
        });
        
        imageSection.appendChild(image);
        imageSection.appendChild(source);
        
        // Create main content
        const mainContent = domHelpers.createElement('div', { className: 'recipe-main-content' });
        
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
                <span>Recipe Details</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
            `
        });
        
        mainContent.appendChild(content);
        mainContent.appendChild(detailsToggle);
        
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
        
        // Recipe actions
        const actions = domHelpers.createElement('div', { className: 'recipe-actions' });
        
        // Add to Plan button
        const addToPlanBtn = domHelpers.createElement('button', {
            className: 'add-to-plan',
            'data-recipe-id': recipe.id,
            innerHTML: `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                <span>Add to Plan</span>
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
        detailsContent.appendChild(actions);
        detailsPanel.appendChild(detailsContent);
        
        // Assemble the card
        card.appendChild(imageSection);
        card.appendChild(mainContent);
        card.appendChild(detailsPanel);
        
        // Add event listener for toggle
        detailsToggle.addEventListener('click', () => {
            detailsToggle.classList.toggle(CLASSES.OPEN);
            
            if (detailsPanel.classList.contains(CLASSES.OPEN)) {
                // Closing the panel
                const currentHeight = detailsPanel.scrollHeight;
                detailsPanel.style.height = `${currentHeight}px`;
                
                // Force a reflow
                detailsPanel.offsetHeight;
                
                // Set height to 0
                detailsPanel.style.height = '0';
                
                // Remove the open class after transition
                setTimeout(() => {
                    detailsPanel.classList.remove(CLASSES.OPEN);
                    detailsPanel.style.height = '';
                }, 300); // Match this to your CSS transition time
            } else {
                // Opening the panel
                detailsPanel.classList.add(CLASSES.OPEN);
                
                // Get the height of the content
                const height = detailsPanel.scrollHeight;
                
                // Set the height to create animation
                detailsPanel.style.height = `${height}px`;
                
                // Remove inline height after transition
                setTimeout(() => {
                    detailsPanel.style.height = '';
                }, 300);
            }
        });
        
        return card;
    };
    
    // Setup event listeners
    const setupEventListeners = () => {
        // Navigation buttons
        elements.prevBtn.addEventListener('click', showPreviousRecipe);
        elements.nextBtn.addEventListener('click', showNextRecipe);
        
        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') {
                showPreviousRecipe();
            } else if (e.key === 'ArrowRight') {
                showNextRecipe();
            }
        });
        
        // Touch swiping with enhanced support
        setupSwipeSupport();
    };
    
    // Setup enhanced swipe support for mobile
    const setupSwipeSupport = () => {
        if (!elements.carousel || !elements.container) return;
        
        // Touch events for swipe
        elements.container.addEventListener('touchstart', handleSwipeStart, { passive: false });
        elements.container.addEventListener('touchmove', handleSwipeMove, { passive: false });
        elements.container.addEventListener('touchend', handleSwipeEnd, { passive: false });
        
        // Mouse events for drag (optional, for desktop testing)
        elements.container.addEventListener('mousedown', handleSwipeStart);
        document.addEventListener('mousemove', handleSwipeMove);
        document.addEventListener('mouseup', handleSwipeEnd);
    };
    
    // Handle the start of a swipe
    const handleSwipeStart = (e) => {
        // Skip if animation is in progress
        if (state.animationInProgress) return;
        
        // Don't swipe if we're clicking a button or link
        if (e.target.tagName === 'BUTTON' || e.target.tagName === 'A' || 
            e.target.closest('button') || e.target.closest('a')) {
            return;
        }
        
        // Get initial position
        const pageX = e.type.includes('mouse') ? e.pageX : e.touches[0].pageX;
        
        state.isSwiping = true;
        state.swipeStartX = pageX;
        state.swipeCurrentX = pageX;
        
        // Add swiping class for visual feedback
        elements.carousel.classList.add(CLASSES.SWIPING);
        
        // Prevent default only for touch events to avoid text selection during swipe
        if (e.type === 'touchstart') {
            // We don't want to prevent all touch events as that would break scrolling
            // Instead we'll check the direction in the move handler
        }
    };
    
    // Handle swipe movement
    const handleSwipeMove = (e) => {
        if (!state.isSwiping) return;
        
        // Get current position
        const pageX = e.type.includes('mouse') ? e.pageX : e.touches[0].pageX;
        state.swipeCurrentX = pageX;
        
        // Calculate swipe distance
        const distance = state.swipeCurrentX - state.swipeStartX;
        
        // If we're swiping horizontally enough, prevent vertical scrolling
        if (e.type === 'touchmove' && Math.abs(distance) > 10) {
            e.preventDefault();
        }
        
        // Only allow swiping if we're not at the edge or if we're swiping in the valid direction
        const canSwipeLeft = state.currentIndex < state.recipes.length - 1;
        const canSwipeRight = state.currentIndex > 0;
        
        if ((distance < 0 && canSwipeLeft) || (distance > 0 && canSwipeRight)) {
            // Calculate a resistance factor that increases as we approach the edges
            let resistance = 1;
            
            // Apply transformation based on swipe
            const translateValue = -state.currentIndex * 100 + (distance / elements.container.offsetWidth) * 100 * resistance;
            elements.carousel.style.transform = `translateX(${translateValue}%)`;
        }
    };
    
    // Handle end of swipe
    const handleSwipeEnd = (e) => {
        if (!state.isSwiping) return;
        
        state.isSwiping = false;
        elements.carousel.classList.remove(CLASSES.SWIPING);
        
        // Calculate the distance swiped
        const distance = state.swipeCurrentX - state.swipeStartX;
        const absDist = Math.abs(distance);
        
        // If swiped far enough, change recipe
        if (absDist > state.swipeThreshold) {
            if (distance > 0 && state.currentIndex > 0) {
                showPreviousRecipe();
            } else if (distance < 0 && state.currentIndex < state.recipes.length - 1) {
                showNextRecipe();
            } else {
                // Reset to current position if at the edge
                updateCarouselPosition();
            }
        } else {
            // Reset to current position if swipe not far enough
            updateCarouselPosition();
        }
        
        // Reset swipe state
        state.swipeStartX = null;
        state.swipeCurrentX = null;
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
        if (state.currentIndex > 0 && !state.animationInProgress) {
            state.animationInProgress = true;
            state.currentIndex--;
            updateCarouselPosition();
            updateNavigation();
            
            // Reset animation flag after transition completes
            setTimeout(() => {
                state.animationInProgress = false;
            }, 300); // Match this to your CSS transition time
        }
    };
    
    const showNextRecipe = () => {
        if (state.currentIndex < state.recipes.length - 1 && !state.animationInProgress) {
            state.animationInProgress = true;
            state.currentIndex++;
            updateCarouselPosition();
            updateNavigation();
            
            // Reset animation flag after transition completes
            setTimeout(() => {
                state.animationInProgress = false;
            }, 300); // Match this to your CSS transition time
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
            // Previous button
            if (state.currentIndex === 0) {
                elements.prevBtn.style.opacity = '0.5';
                elements.prevBtn.style.pointerEvents = 'none';
            } else {
                elements.prevBtn.style.opacity = '1';
                elements.prevBtn.style.pointerEvents = 'auto';
            }
            
            // Next button
            if (state.currentIndex === state.recipes.length - 1) {
                elements.nextBtn.style.opacity = '0.5';
                elements.nextBtn.style.pointerEvents = 'none';
            } else {
                elements.nextBtn.style.opacity = '1';
                elements.nextBtn.style.pointerEvents = 'auto';
            }
        }
        
        // Update progress indicator if present
        const progressIndicator = document.querySelector('.carousel-progress');
        if (progressIndicator) {
            // Clear existing indicators
            domHelpers.clearElement(progressIndicator);
            
            // Create new indicators
            state.recipes.forEach((_, index) => {
                const dot = domHelpers.createElement('div', {
                    className: `carousel-dot ${index === state.currentIndex ? 'active' : ''}`
                });
                progressIndicator.appendChild(dot);
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
        updateNavigation();
    };
    
    // Get current recipe
    const getCurrentRecipe = () => {
        return state.recipes[state.currentIndex] || null;
    };
    
    // Update recipes - new method for pagination
    const updateRecipes = (newRecipes) => {
        if (!newRecipes || !Array.isArray(newRecipes)) {
            console.error('Invalid recipes data provided to CarouselManager.updateRecipes');
            return;
        }
        
        // Save current index for restoring position if possible
        const currentRecipeId = state.recipes.length > 0 && state.currentIndex < state.recipes.length 
            ? state.recipes[state.currentIndex]?.id 
            : null;
        
        // Update recipes
        state.recipes = newRecipes;
        
        // Try to maintain position by finding the same recipe ID
        if (currentRecipeId) {
            const newIndex = state.recipes.findIndex(recipe => recipe.id === currentRecipeId);
            if (newIndex !== -1) {
                state.currentIndex = newIndex;
            } else {
                // Reset to first recipe if previous recipe not found
                state.currentIndex = 0;
            }
        } else {
            // Reset to first recipe
            state.currentIndex = 0;
        }
        
        // Redraw carousel
        renderCarousel();
        updateNavigation();
        
        // Log update
        console.log(`Carousel updated with ${newRecipes.length} recipes`);
        
        // If no recipes, show empty message
        if (newRecipes.length === 0 && elements.container) {
            const emptyMessage = domHelpers.createElement('div', {
                className: 'empty-list-message',
                innerHTML: `
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                        <line x1="12" y1="9" x2="12" y2="13"></line>
                        <line x1="12" y1="17" x2="12.01" y2="17"></line>
                    </svg>
                    <p>No recipes found</p>
                    <p class="subtitle">Try different search or filter settings</p>
                `
            });
            domHelpers.clearElement(elements.container);
            elements.container.appendChild(emptyMessage);
        }
    };
    
    // Public API
    return {
        init,
        filterRecipes,
        getCurrentRecipe,
        updateRecipes,
        goToRecipe
    };
})();