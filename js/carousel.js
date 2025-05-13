// Simplified Carousel with Details Dropdown
const CarouselManager = (() => {
    // State
    let recipes = [];
    let currentIndex = 0;
    
    // DOM Elements
    const carousel = document.getElementById('recipe-carousel');
    const prevBtn = document.getElementById('prev-recipe');
    const nextBtn = document.getElementById('next-recipe');
    const dotsContainer = document.getElementById('carousel-dots');
    
    // Initialize
    const init = (recipeData) => {
        recipes = recipeData;
        renderCarousel();
        renderDots();
        setupEventListeners();
        updateNavigation();
    };
    
    // Create carousel items with simple design
    const renderCarousel = () => {
        carousel.innerHTML = '';
        
        recipes.forEach(recipe => {
            const card = createRecipeCard(recipe);
            carousel.appendChild(card);
        });
        
        updateCarouselPosition();
    };
    
    // Create navigation dots
    const renderDots = () => {
        dotsContainer.innerHTML = '';
        
        recipes.forEach((_, index) => {
            const dot = document.createElement('div');
            dot.className = `dot ${index === currentIndex ? 'active' : ''}`;
            dot.dataset.index = index;
            dotsContainer.appendChild(dot);
        });
    };
    
    // Create simplified recipe card
    const createRecipeCard = (recipe) => {
        const sourceDisplay = recipe.source === 'halfbakedharvest' ? 'Half Baked Harvest' : 'The Modern Proper';
        
        // Create card container
        const card = document.createElement('div');
        card.className = 'recipe-card';
        
        // Create image section
        const imageSection = document.createElement('div');
        imageSection.className = 'recipe-image';
        
        const image = document.createElement('img');
        image.src = recipe.imageUrl;
        image.alt = recipe.title;
        
        const source = document.createElement('div');
        source.className = 'recipe-source';
        source.textContent = sourceDisplay;
        
        imageSection.appendChild(image);
        imageSection.appendChild(source);
        
        // Create content section
        const content = document.createElement('div');
        content.className = 'recipe-content';
        
        const title = document.createElement('h2');
        title.className = 'recipe-title';
        title.textContent = recipe.title;
        
        content.appendChild(title);
        
        // Create details toggle button
        const detailsToggle = document.createElement('button');
        detailsToggle.className = 'details-toggle';
        detailsToggle.innerHTML = `
            <span>More Details</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
        `;
        
        // Create details panel (hidden by default)
        const detailsPanel = document.createElement('div');
        detailsPanel.className = 'recipe-details';
        
        const detailsContent = document.createElement('div');
        detailsContent.className = 'details-content';
        
        // Recipe meta info
        const meta = document.createElement('div');
        meta.className = 'recipe-meta';
        
        meta.innerHTML = `
            <div class="meta-tag">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                <span>${recipe.prepTime} min prep</span>
            </div>
            <div class="meta-tag">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="4" y="5" width="16" height="16" rx="2"></rect>
                    <path d="M16 2v4"></path>
                    <path d="M8 2v4"></path>
                    <path d="M4 10h16"></path>
                </svg>
                <span>${recipe.cookTime} min cook</span>
            </div>
            <div class="meta-tag">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
                <span>Serves ${recipe.servings}</span>
            </div>
        `;
        
        // Recipe actions
        const actions = document.createElement('div');
        actions.className = 'recipe-actions';
        
        const viewRecipeLink = document.createElement('a');
        viewRecipeLink.className = 'view-recipe';
        viewRecipeLink.href = recipe.sourceUrl;
        viewRecipeLink.target = '_blank';
        viewRecipeLink.textContent = 'View Recipe';
        
        actions.appendChild(viewRecipeLink);
        
        // Assemble the details panel
        detailsContent.appendChild(meta);
        detailsContent.appendChild(actions);
        detailsPanel.appendChild(detailsContent);
        
        // Assemble the card
        card.appendChild(imageSection);
        card.appendChild(content);
        card.appendChild(detailsToggle);
        card.appendChild(detailsPanel);
        
        // Add event listener for toggle
        detailsToggle.addEventListener('click', () => {
            detailsToggle.classList.toggle('open');
            detailsPanel.classList.toggle('open');
        });
        
        return card;
    };
    
    // Setup event listeners
    const setupEventListeners = () => {
        // Navigation buttons
        prevBtn.addEventListener('click', showPreviousRecipe);
        nextBtn.addEventListener('click', showNextRecipe);
        
        // Dot navigation
        dotsContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('dot')) {
                const index = parseInt(e.target.dataset.index);
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
        carousel.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
        });
        
        carousel.addEventListener('touchmove', (e) => {
            moveX = e.touches[0].clientX;
        });
        
        carousel.addEventListener('touchend', () => {
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
        if (index >= 0 && index < recipes.length) {
            currentIndex = index;
            updateCarouselPosition();
            updateNavigation();
        }
    };
    
    const showPreviousRecipe = () => {
        if (currentIndex > 0) {
            currentIndex--;
            updateCarouselPosition();
            updateNavigation();
        }
    };
    
    const showNextRecipe = () => {
        if (currentIndex < recipes.length - 1) {
            currentIndex++;
            updateCarouselPosition();
            updateNavigation();
        }
    };
    
    // Update functions
    const updateCarouselPosition = () => {
        const position = -currentIndex * 100;
        carousel.style.transform = `translateX(${position}%)`;
    };
    
    const updateNavigation = () => {
        // Update buttons
        prevBtn.style.opacity = currentIndex === 0 ? '0.5' : '1';
        prevBtn.style.pointerEvents = currentIndex === 0 ? 'none' : 'auto';
        
        nextBtn.style.opacity = currentIndex === recipes.length - 1 ? '0.5' : '1';
        nextBtn.style.pointerEvents = currentIndex === recipes.length - 1 ? 'none' : 'auto';
        
        // Update dots
        const dots = dotsContainer.querySelectorAll('.dot');
        dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === currentIndex);
        });
    };
    
    // Filter recipes
    const filterRecipes = (filteredRecipeData) => {
        recipes = filteredRecipeData;
        currentIndex = 0;
        renderCarousel();
        renderDots();
        updateNavigation();
    };
    
    // Get current recipe
    const getCurrentRecipe = () => {
        return recipes[currentIndex];
    };
    
    // Public API
    return {
        init,
        filterRecipes,
        getCurrentRecipe
    };
})();