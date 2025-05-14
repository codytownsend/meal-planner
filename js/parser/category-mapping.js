// js/parser/category-mapping.js
// This should be created manually after reviewing the ingredient analysis

module.exports = {
    // These are example mappings - adjust based on your ingredient analysis results
    CATEGORY_MAPPING: {
        // Produce
        'onion': 'Fresh Produce',
        'garlic': 'Fresh Produce',
        'tomato': 'Fresh Produce',
        'pepper': 'Fresh Produce',
        'zucchini': 'Fresh Produce',
        'parsley': 'Fresh Produce',
        'basil': 'Fresh Produce',
        'lemon': 'Fresh Produce',
        'lime': 'Fresh Produce',
        
        // Proteins
        'chicken': 'Meat & Seafood',
        'beef': 'Meat & Seafood',
        'pork': 'Meat & Seafood',
        'salmon': 'Meat & Seafood',
        'shrimp': 'Meat & Seafood',
        
        // Dairy
        'cheese': 'Dairy & Eggs',
        'feta': 'Dairy & Eggs',
        'butter': 'Dairy & Eggs',
        'egg': 'Dairy & Eggs',
        'milk': 'Dairy & Eggs',
        'yogurt': 'Dairy & Eggs',
        
        // Pantry
        'oil': 'Oils & Vinegars',
        'vinegar': 'Oils & Vinegars',
        'salt': 'Spices',
        'pepper': 'Spices',
        'oregano': 'Spices',
        'paprika': 'Spices',
        'cinnamon': 'Spices',
        
        // And so on...
    },
    
    // Fallback function for uncategorized ingredients
    categorizeIngredient: function(ingredient) {
        const lowerName = ingredient.toLowerCase();
        
        // Try to match specific ingredients first
        for (const [key, category] of Object.entries(this.CATEGORY_MAPPING)) {
            if (lowerName.includes(key)) {
                return category;
            }
        }
        
        // If no match, try to categorize by more general patterns
        if (lowerName.includes('flour') || lowerName.includes('sugar') || 
            lowerName.includes('baking')) {
            return 'Baking';
        }
        
        // Default fallback
        return 'Other';
    }
};