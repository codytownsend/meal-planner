// js/parser/category-analyzer.js
const fs = require('fs');
const path = require('path');

// Config
const inputPath = path.join(__dirname, '../../rawRecipes.ndjson');
const outputPath = path.join(__dirname, '../../data/category-analysis.json');

async function analyzeCategories() {
    try {
        // Read the NDJSON file
        const content = await fs.promises.readFile(inputPath, 'utf8');
        const lines = content.split('\n').filter(line => line.trim());
        
        // Track all categories and their frequency
        const categoryMap = new Map();
        const mealTypeMap = new Map(); // For breakfast, lunch, dinner, dessert, etc.
        let totalRecipes = 0;
        let uncategorizedCount = 0;
        
        // Common meal types to look for in categories and keywords
        const mealTypes = {
            breakfast: ['breakfast', 'brunch', 'morning'],
            lunch: ['lunch', 'sandwiches', 'wraps'],
            dinner: ['dinner', 'main course', 'entree', 'main dish'],
            appetizer: ['appetizer', 'starter', 'snack', 'hors d\'oeuvre'],
            side: ['side dish', 'side', 'accompaniment'],
            dessert: ['dessert', 'sweet', 'cake', 'cookie', 'pie'],
            drink: ['drink', 'beverage', 'cocktail', 'smoothie']
        };
        
        // Process each recipe
        for (const line of lines) {
            try {
                const { url, data } = JSON.parse(line);
                if (!data) continue;
                
                totalRecipes++;
                
                // Get categories from recipeCategory field
                const categories = data.recipeCategory || [];
                
                if (categories.length === 0) {
                    uncategorizedCount++;
                    const entry = categoryMap.get('Uncategorized') || { count: 0, recipes: [] };
                    entry.count++;
                    if (entry.recipes.length < 10) {
                        entry.recipes.push({
                            name: data.name || 'Unknown Recipe',
                            url
                        });
                    }
                    categoryMap.set('Uncategorized', entry);
                } else {
                    // Update category counts
                    categories.forEach(category => {
                        const entry = categoryMap.get(category) || { count: 0, recipes: [] };
                        entry.count++;
                        if (entry.recipes.length < 10) {
                            entry.recipes.push({
                                name: data.name || 'Unknown Recipe',
                                url
                            });
                        }
                        categoryMap.set(category, entry);
                    });
                }
                
                // Analyze for meal type
                let mealTypeFound = false;
                
                // Check categories for meal types
                if (categories.length > 0) {
                    for (const [mealType, keywords] of Object.entries(mealTypes)) {
                        if (categories.some(category => 
                            keywords.some(keyword => 
                                category.toLowerCase().includes(keyword)
                            )
                        )) {
                            const entry = mealTypeMap.get(mealType) || { count: 0, recipes: [] };
                            entry.count++;
                            if (entry.recipes.length < 10) {
                                entry.recipes.push({
                                    name: data.name || 'Unknown Recipe',
                                    url
                                });
                            }
                            mealTypeMap.set(mealType, entry);
                            mealTypeFound = true;
                        }
                    }
                }
                
                // If no meal type found in categories, try keywords
                if (!mealTypeFound && data.keywords) {
                    const keywords = typeof data.keywords === 'string' 
                        ? data.keywords.split(',').map(k => k.trim().toLowerCase())
                        : [];
                    
                    for (const [mealType, mealKeywords] of Object.entries(mealTypes)) {
                        if (keywords.some(keyword => 
                            mealKeywords.some(mk => keyword.includes(mk))
                        )) {
                            const entry = mealTypeMap.get(mealType) || { count: 0, recipes: [] };
                            entry.count++;
                            if (entry.recipes.length < 10) {
                                entry.recipes.push({
                                    name: data.name || 'Unknown Recipe',
                                    url
                                });
                            }
                            mealTypeMap.set(mealType, entry);
                            mealTypeFound = true;
                            break;
                        }
                    }
                }
                
                // If still no meal type found, categorize as 'other'
                if (!mealTypeFound) {
                    const entry = mealTypeMap.get('other') || { count: 0, recipes: [] };
                    entry.count++;
                    if (entry.recipes.length < 10) {
                        entry.recipes.push({
                            name: data.name || 'Unknown Recipe',
                            url
                        });
                    }
                    mealTypeMap.set('other', entry);
                }
                
            } catch (err) {
                console.error(`Error processing recipe line:`, err);
            }
        }
        
        // Convert the maps to arrays sorted by frequency
        const categoryStats = Array.from(categoryMap.entries())
            .map(([name, { count, recipes }]) => ({
                name,
                count,
                percentage: ((count / totalRecipes) * 100).toFixed(1) + '%',
                recipes
            }))
            .sort((a, b) => b.count - a.count);
        
        const mealTypeStats = Array.from(mealTypeMap.entries())
            .map(([name, { count, recipes }]) => ({
                name,
                count,
                percentage: ((count / totalRecipes) * 100).toFixed(1) + '%',
                recipes
            }))
            .sort((a, b) => b.count - a.count);
        
        // Write the analysis results
        await fs.promises.writeFile(
            outputPath, 
            JSON.stringify({
                totalRecipes,
                categorizedRecipes: totalRecipes - uncategorizedCount,
                uncategorizedRecipes: uncategorizedCount,
                uniqueCategories: categoryStats.length - (uncategorizedCount > 0 ? 1 : 0),
                categories: categoryStats,
                mealTypes: mealTypeStats
            }, null, 2)
        );
        
        console.log(`Analyzed ${totalRecipes} recipes with ${categoryStats.length - (uncategorizedCount > 0 ? 1 : 0)} unique categories.`);
        console.log(`${uncategorizedCount} recipes (${((uncategorizedCount / totalRecipes) * 100).toFixed(1)}%) have no category.`);
        console.log(`\nCategory distribution (top 10):`);
        categoryStats.slice(0, 10).forEach(category => {
            console.log(`- ${category.name}: ${category.count} recipes (${category.percentage})`);
        });
        
        console.log(`\nMeal type distribution:`);
        mealTypeStats.forEach(mealType => {
            console.log(`- ${mealType.name}: ${mealType.count} recipes (${mealType.percentage})`);
        });
    } catch (err) {
        console.error('Error analyzing categories:', err);
    }
}

analyzeCategories();