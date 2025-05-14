// js/parser/ingredient-analyzer.js
const fs = require('fs');
const path = require('path');

// Config
const inputPath = path.join(__dirname, '../../rawRecipes.ndjson');
const outputPath = path.join(__dirname, '../../data/ingredient-analysis.json');

async function analyzeIngredients() {
    try {
        // Read the NDJSON file
        const content = await fs.promises.readFile(inputPath, 'utf8');
        const lines = content.split('\n').filter(line => line.trim());
        
        // Track all ingredients and their frequency
        const ingredientMap = new Map();
        let totalRecipes = 0;
        
        // Process each recipe
        for (const line of lines) {
            try {
                const { data } = JSON.parse(line);
                if (!data || !data.recipeIngredient || !Array.isArray(data.recipeIngredient)) {
                    continue;
                }
                
                totalRecipes++;
                
                // Extract key words from each ingredient
                data.recipeIngredient.forEach(ingredient => {
                    // Clean up the ingredient text
                    const cleanIngredient = ingredient.toLowerCase()
                        .replace(/[\d\s./+]+(?:\s*(?:cup|tablespoon|teaspoon|pound|ounce|oz|tbsp|tsp|lb|g|ml|cups|tablespoons|teaspoons|pounds|ounces))?/g, '')
                        .trim();
                    
                    // Extract potential ingredient name (last word often contains the main ingredient)
                    const words = cleanIngredient.split(/\s+/);
                    let mainIngredient = words[words.length - 1];
                    
                    // Some ingredients have descriptors after the main ingredient
                    if (words.length > 1 && (mainIngredient === 'powder' || mainIngredient === 'flakes' || 
                        mainIngredient === 'fresh' || mainIngredient === 'dried')) {
                        mainIngredient = words[words.length - 2] + ' ' + mainIngredient;
                    }
                    
                    // Update ingredient count
                    if (!ingredientMap.has(mainIngredient)) {
                        ingredientMap.set(mainIngredient, {
                            count: 1,
                            examples: [ingredient]
                        });
                    } else {
                        const entry = ingredientMap.get(mainIngredient);
                        entry.count++;
                        if (entry.examples.length < 5 && !entry.examples.includes(ingredient)) {
                            entry.examples.push(ingredient);
                        }
                    }
                });
            } catch (err) {
                console.error(`Error processing recipe line:`, err);
            }
        }
        
        // Convert the map to an array of ingredients sorted by frequency
        const ingredientStats = Array.from(ingredientMap.entries())
            .map(([name, { count, examples }]) => ({
                name,
                count,
                frequency: (count / totalRecipes).toFixed(4),
                examples
            }))
            .sort((a, b) => b.count - a.count);
        
        // Write the analysis results
        await fs.promises.writeFile(
            outputPath, 
            JSON.stringify({
                totalRecipes,
                totalUniqueIngredients: ingredientStats.length,
                ingredients: ingredientStats
            }, null, 2)
        );
        
        console.log(`Analyzed ${totalRecipes} recipes with ${ingredientStats.length} unique ingredients.`);
        console.log(`Top 20 most common ingredients:`);
        ingredientStats.slice(0, 20).forEach(ing => {
            console.log(`- ${ing.name}: ${ing.count} occurrences (${(ing.frequency * 100).toFixed(1)}%)`);
        });
    } catch (err) {
        console.error('Error analyzing ingredients:', err);
    }
}

// Run the script
analyzeIngredients();