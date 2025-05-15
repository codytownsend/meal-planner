// js/parser/recipe-converter.js
const fs = require('fs');
const path = require('path');

// Config
const inputPath = path.join(__dirname, '../../rawRecipes.ndjson');
const outputPath = path.join(__dirname, '../../data/recipes.js');

// Convert ISO duration to minutes
function parseTime(timeString) {
    if (!timeString) return 0;
    const matches = timeString.match(/PT(\d+)M/);
    return matches ? parseInt(matches[1]) : 0;
}

// Determine meal type based on categories, keywords and title
function determineMealType(recipeData) {
    const categories = recipeData.recipeCategory || [];
    const title = recipeData.name || '';
    const keywords = typeof recipeData.keywords === 'string' 
        ? recipeData.keywords.toLowerCase().split(',').map(k => k.trim())
        : [];
        
    // Check for appetizer/starter
    if (categories.includes('Appetizer') || 
        keywords.some(k => k.includes('appetizer') || k.includes('starter')) ||
        title.toLowerCase().includes('dip') || 
        title.toLowerCase().includes('bites')) {
        return 'appetizer';
    }
    
    // Check for lunch
    if (categories.includes('Lunch') || 
        keywords.some(k => k.includes('lunch')) ||
        title.toLowerCase().includes('sandwich') || 
        title.toLowerCase().includes('wrap') ||
        title.toLowerCase().includes('bowl')) {
        return 'lunch';
    }
    
    // Check for side dish
    if (categories.includes('Side Dish') || 
        keywords.some(k => k.includes('side')) ||
        title.toLowerCase().includes('salad') || 
        title.toLowerCase().includes('slaw') ||
        title.toLowerCase().includes('vegetables')) {
        return 'side';
    }
    
    // Default to dinner (main course) for most recipes
    return 'dinner';
}

// Normalize cuisine type to match our filters
function normalizeCuisine(rawCuisine) {
    if (!rawCuisine || !Array.isArray(rawCuisine) || rawCuisine.length === 0) return '';
    
    const cuisine = rawCuisine[0].toLowerCase();
    
    // Map to our supported cuisines
    const supportedCuisines = [
        'american', 'italian', 'mexican', 'asian', 'mediterranean', 
        'greek', 'thai', 'french', 'indian'
    ];
    
    // Handle special cases
    if (cuisine.includes('chinese') || cuisine.includes('japanese') || 
        cuisine.includes('korean') || cuisine.includes('vietnamese')) {
        return 'asian';
    }
    
    // Return the cuisine if it's in our supported list
    if (supportedCuisines.includes(cuisine)) {
        return cuisine;
    }
    
    // Default to empty string if not supported
    return '';
}

// Convert a recipe from JSON-LD to our app format
function convertRecipe(recipeData, id) {
    // Extract basic info
    const title = recipeData.name || 'Untitled Recipe';
    const prepTime = parseTime(recipeData.prepTime);
    const cookTime = parseTime(recipeData.cookTime);
    const servings = recipeData.recipeYield ? 
        (Array.isArray(recipeData.recipeYield) ? recipeData.recipeYield[0] : recipeData.recipeYield) : 
        '4';
    
    // Normalize cuisine
    const cuisine = normalizeCuisine(recipeData.recipeCuisine);
    
    // Determine meal type
    const mealType = determineMealType(recipeData);
    
    // Get source info
    const sourceUrl = recipeData.url || '';
    const source = sourceUrl.includes('halfbakedharvest') ? 'halfbakedharvest' : 'modernproper';
    
    // Get image URL
    const imageUrl = recipeData.image && Array.isArray(recipeData.image) ? 
        recipeData.image[0] : 
        (recipeData.image || 'https://placehold.co/400x600');
    
    // Parse ingredients
    const ingredients = recipeData.recipeIngredient || [];
    
    // Create processed ingredients array
    const processedIngredients = ingredients.map(ingredientStr => {
        // Extract amount and name
        const match = ingredientStr.match(/^([\d\s./+]+(?:\s*(?:cup|tablespoon|teaspoon|pound|ounce|oz|tbsp|tsp|lb|g|ml|cups|tablespoons|teaspoons|pounds|ounces))?)\s+(.+)$/i);
        
        let amount = '';
        let name = ingredientStr;
        
        if (match) {
            amount = match[1].trim();
            name = match[2].trim();
        }
        
        // Determine category
        let category = 'Pantry'; // Default
        
        // Simple categorization logic
        if (/\b(onion|garlic|tomato|vegetable|zucchini|potato|pepper|carrot|lettuce|spinach|kale)\b/i.test(name)) {
            category = 'Produce';
        } else if (/\b(chicken|beef|pork|turkey|lamb|meat|steak)\b/i.test(name)) {
            category = 'Meat';
        } else if (/\b(salmon|fish|shrimp|seafood)\b/i.test(name)) {
            category = 'Seafood';
        } else if (/\b(milk|cream|cheese|yogurt|butter|egg)\b/i.test(name)) {
            category = 'Dairy';
        } else if (/\b(bread|roll|bun|tortilla|pita)\b/i.test(name)) {
            category = 'Bakery';
        } else if (/\b(sugar|flour|baking|vanilla|extract)\b/i.test(name)) {
            category = 'Baking';
        } else if (/\b(oil|vinegar)\b/i.test(name)) {
            category = 'Oils & Vinegars';
        } else if (/\b(salt|pepper|spice|herb|oregano|basil|thyme|cumin)\b/i.test(name)) {
            category = 'Spices';
        }
        
        return {
            name,
            amount,
            category
        };
    });
    
    // Extract tags
    const keywords = recipeData.keywords || '';
    const tags = typeof keywords === 'string' ? 
        keywords.split(',').map(tag => tag.trim().toLowerCase()) : 
        [];
    
    // Create final recipe object
    return {
        id,
        title,
        prepTime,
        cookTime,
        servings,
        cuisine,
        mealType,
        source,
        sourceUrl,
        imageUrl,
        ingredients: processedIngredients,
        tags
    };
}

// Main function
async function convertRecipes() {
    try {
        const content = await fs.promises.readFile(inputPath, 'utf8');
        const lines = content.split('\n').filter(line => line.trim());
        
        const recipes = [];
        let id = 1;
        
        for (const line of lines) {
            try {
                const { data } = JSON.parse(line);
                if (!data) continue;
                
                const recipe = convertRecipe(data, id++);
                recipes.push(recipe);
                
                // Status update every 100 recipes
                if (recipes.length % 100 === 0) {
                    console.log(`Processed ${recipes.length} recipes...`);
                }
            } catch (err) {
                console.error('Error processing recipe:', err);
            }
        }
        
        // Write output
        const output = `// Generated recipes data\nwindow.sampleRecipes = ${JSON.stringify(recipes, null, 2)};`;
        await fs.promises.writeFile(outputPath, output);
        
        console.log(`Successfully converted ${recipes.length} recipes to ${outputPath}`);
        
        // Output some stats
        const mealTypes = recipes.reduce((acc, recipe) => {
            acc[recipe.mealType] = (acc[recipe.mealType] || 0) + 1;
            return acc;
        }, {});
        
        console.log('Meal type distribution:');
        Object.entries(mealTypes).forEach(([type, count]) => {
            console.log(`- ${type}: ${count} recipes (${((count / recipes.length) * 100).toFixed(1)}%)`);
        });
    } catch (err) {
        console.error('Error converting recipes:', err);
    }
}

// Run the script
convertRecipes();