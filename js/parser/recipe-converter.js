// js/parser/recipe-converter.js
const fs = require('fs');
const path = require('path');
const { categorizeIngredient } = require('./category-mapping');

// Config
const inputPath = path.join(__dirname, '../../rawRecipes.ndjson');
const outputPath = path.join(__dirname, '../../data/recipes.js');

// Convert ISO duration to minutes
function parseTime(timeString) {
    if (!timeString) return 0;
    const matches = timeString.match(/PT(\d+)M/);
    return matches ? parseInt(matches[1]) : 0;
}

// Parse ingredients with more accurate categorization
function parseIngredients(ingredients) {
    if (!ingredients || !Array.isArray(ingredients)) return [];
    
    return ingredients.map(ingredient => {
        // Parse ingredient string
        const match = ingredient.match(/^([\d\s./+]+(?:\s*(?:cup|tablespoon|teaspoon|pound|ounce|oz|tbsp|tsp|lb|g|ml|cups|tablespoons|teaspoons|pounds|ounces))?)\s+(.+)$/i);
        
        let amount = '';
        let name = ingredient;
        
        if (match) {
            amount = match[1].trim();
            name = match[2].trim();
        }
        
        // Use the refined categorization function
        const category = categorizeIngredient(name);
        
        return {
            name,
            amount,
            category
        };
    });
}

// The rest of the conversion functions remain similar...
// (normalizeCuisine, determineProtein, extractTags, convertRecipe)

// Main function to process the NDJSON file
async function processRecipes() {
    // Implementation similar to before
}

// Run the script
processRecipes();