/**
 * CODEX N-OMAD v3.0 Recipe Orchestration Engine
 * Integrates ProfileEngine, NutrientDatabase, CookingMethods, and RecipeGenerator
 * for complete OMAD meal planning with pantry integration
 */

// import { CodexCore } from './CodexCore.js'; // CodexCore class not available
// import { CookingMethods } from './CookingMethods.js'; // CookingMethods class not exported
// import { nutrients } from './database/nutrients.js'; // nutrients not exported

export class RecipeEngine {
    constructor() {
        // this.codexCore = new CodexCore(); // CodexCore class not available
        // this.cookingMethods = new CookingMethods(); // CookingMethods class not available
        this.pantryItems = new Map();
        this.shoppingList = [];
        this.currentProfile = 'ioan'; // Default profile
        this.currentPhase = 'growth'; // mTOR phase
    }

    /**
     * Initialize pantry with available ingredients
     * @param {Array} items - Array of {ingredient, quantity, unit, expiryDate}
     */
    initializePantry(items = []) {
        this.pantryItems.clear();
        items.forEach(item => {
            this.pantryItems.set(item.ingredient.toLowerCase(), {
                quantity: item.quantity,
                unit: item.unit,
                expiryDate: new Date(item.expiryDate),
                freshness: this.calculateFreshness(item.expiryDate)
            });
        });
    }

    /**
     * Generate complete OMAD recipe based on profile and available ingredients
     * @param {Object} preferences - Recipe preferences and constraints
     * @returns {Object} Complete recipe with nutrition, cooking instructions, shopping list
     */
    async generateOMADRecipe(preferences = {}) {
        const profile = this.codexCore.profiles[this.currentProfile];
        const mTORSettings = this.codexCore.calculateMTORPhase(this.currentPhase);

        // 1. Analyze nutritional needs
        const nutritionalNeeds = this.calculateNutritionalNeeds(profile, mTORSettings);
        
        // 2. Select ingredients based on availability and nutrition
        const selectedIngredients = await this.selectOptimalIngredients(nutritionalNeeds, preferences);
        
        // 3. Optimize cooking method for maximum retention
        const cookingStrategy = this.cookingMethods.optimizeForRetention(selectedIngredients);
        
        // 4. Generate complete recipe
        const recipe = await this.codexCore.generateRecipe(selectedIngredients, this.currentProfile);
        
        // 5. Apply Instant Pot stratification
        const stratifiedRecipe = this.applyInstantPotStratification(recipe, cookingStrategy);
        
        // 6. Calculate final nutrition and DRI%
        const nutritionAnalysis = this.calculateCompleteNutrition(stratifiedRecipe);
        
        // 7. Generate shopping list for missing ingredients
        this.generateShoppingList(selectedIngredients);
        
        // 8. Ayurvedic compatibility assessment
        const ayurvedicScore = this.assessAyurvedicCompatibility(selectedIngredients);

        return {
            metadata: {
                profile: this.currentProfile,
                mTORPhase: this.currentPhase,
                generatedAt: new Date().toISOString(),
                oMadWindow: "08:00-09:00",
                plantDiversityCount: this.countPlantDiversity(selectedIngredients)
            },
            ingredients: stratifiedRecipe.ingredients,
            cookingInstructions: stratifiedRecipe.instructions,
            instantPotLayers: stratifiedRecipe.layers,
            nutrition: nutritionAnalysis,
            driPercentages: this.calculateDRIPercentages(nutritionAnalysis, profile),
            ayurvedicCompatibility: ayurvedicScore,
            shoppingList: this.shoppingList,
            pantryUsage: this.calculatePantryUsage(),
            deficiencies: this.identifyDeficiencies(nutritionAnalysis, nutritionalNeeds),
            mTOROptimization: this.optimizeForMTOR(nutritionAnalysis, mTORSettings)
        };
    }

    /**
     * Calculate nutritional needs based on profile and mTOR phase
     */
    calculateNutritionalNeeds(profile, mTORSettings) {
        const baseDRI = this.codexCore.calculateDRI(profile);
        
        return {
            calories: baseDRI.calories * mTORSettings.calorieMultiplier,
            protein: Math.max(profile.weight * 1.2, baseDRI.protein * mTORSettings.proteinMultiplier),
            carbs: baseDRI.carbs * mTORSettings.carbMultiplier,
            fat: baseDRI.fat * mTORSettings.fatMultiplier,
            fiber: Math.max(35, baseDRI.fiber),
            micronutrients: this.adjustMicronutrientsForPhase(baseDRI, mTORSettings),
            plantDiversityTarget: 15, // Minimum for single meal
            maxSodium: 1500, // OMAD sodium limit
            minMagnesium: 400, // Enhanced for mTOR
            minOmega3: 2.5 // Enhanced for longevity phase
        };
    }

    /**
     * Select optimal ingredients based on availability and nutritional density
     */
    async selectOptimalIngredients(needs, preferences = {}) {
        const availableIngredients = this.getAvailableIngredients();
        const selectedIngredients = [];
        const nutritionTracker = this.initializeNutritionTracker();

        // Priority selection algorithm
        const priorityCategories = [
            'proteins', 'leafyGreens', 'cruciferous', 'colorfulVegetables',
            'healthyFats', 'complexCarbs', 'herbs', 'fermentedFoods'
        ];

        for (const category of priorityCategories) {
            const categoryIngredients = this.getCategoryIngredients(category, availableIngredients);
            const selected = this.selectBestFromCategory(categoryIngredients, needs, nutritionTracker, preferences);
            selectedIngredients.push(...selected);
        }

        // Ensure plant diversity target is met
        this.ensurePlantDiversity(selectedIngredients, availableIngredients, needs.plantDiversityTarget);

        return selectedIngredients;
    }

    /**
     * Apply Instant Pot 4-layer stratification system
     */
    applyInstantPotStratification(recipe, cookingStrategy) {
        const layers = this.cookingMethods.createStratificationLayers(recipe.ingredients);
        const optimizedTiming = this.cookingMethods.calculateOptimalTiming(layers);

        return {
            ...recipe,
            layers: {
                layer1_aromatics: {
                    ingredients: layers.aromatics,
                    timing: "0-2 minutes",
                    temperature: "High saute",
                    purpose: "Base flavor development"
                },
                layer2_proteins: {
                    ingredients: layers.proteins,
                    timing: "2-8 minutes",
                    temperature: "High pressure",
                    purpose: "Protein structure optimization"
                },
                layer3_vegetables: {
                    ingredients: layers.vegetables,
                    timing: "8-15 minutes",
                    temperature: "High pressure",
                    purpose: "Nutrient preservation"
                },
                layer4_finishing: {
                    ingredients: layers.finishing,
                    timing: "Natural release + 5 min",
                    temperature: "Keep warm",
                    purpose: "Flavor integration"
                }
            },
            totalCookTime: optimizedTiming.total,
            nutrientRetention: optimizedTiming.retention,
            instructions: this.generateStratifiedInstructions(layers, optimizedTiming)
        };
    }

    /**
     * Calculate complete nutrition with cooking method adjustments
     */
    calculateCompleteNutrition(recipe) {
        const nutrition = {
            calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0,
            vitamins: {}, minerals: {}, omega3: 0, antioxidants: 0
        };

        recipe.ingredients.forEach(ingredient => {
            const nutrientData = nutrients[ingredient.name.toLowerCase()];
            if (!nutrientData) return;

            const retentionFactor = this.cookingMethods.getRetentionFactor(ingredient.cookingMethod);
            const quantity = ingredient.grams / 100; // Convert to per 100g

            // Macronutrients
            nutrition.calories += nutrientData.calories * quantity * retentionFactor.calories;
            nutrition.protein += nutrientData.protein * quantity * retentionFactor.protein;
            nutrition.carbs += nutrientData.carbs * quantity * retentionFactor.carbs;
            nutrition.fat += nutrientData.fat * quantity * retentionFactor.fat;
            nutrition.fiber += nutrientData.fiber * quantity * retentionFactor.fiber;

            // Micronutrients with cooking adjustments
            Object.keys(nutrientData.vitamins || {}).forEach(vitamin => {
                nutrition.vitamins[vitamin] = (nutrition.vitamins[vitamin] || 0) + 
                    (nutrientData.vitamins[vitamin] * quantity * retentionFactor.vitamins);
            });

            Object.keys(nutrientData.minerals || {}).forEach(mineral => {
                nutrition.minerals[mineral] = (nutrition.minerals[mineral] || 0) + 
                    (nutrientData.minerals[mineral] * quantity * retentionFactor.minerals);
            });

            // Special compounds
            nutrition.omega3 += (nutrientData.omega3 || 0) * quantity * retentionFactor.omega3;
            nutrition.antioxidants += (nutrientData.antioxidantScore || 0) * quantity * retentionFactor.antioxidants;
        });

        return nutrition;
    }

    /**
     * Generate shopping list for missing ingredients
     */
    generateShoppingList(selectedIngredients) {
        this.shoppingList = [];
        
        selectedIngredients.forEach(ingredient => {
            const available = this.pantryItems.get(ingredient.name.toLowerCase());
            
            if (!available || available.quantity < ingredient.grams) {
                const needed = ingredient.grams - (available?.quantity || 0);
                this.shoppingList.push({
                    ingredient: ingredient.name,
                    needed: needed,
                    unit: ingredient.unit || 'g',
                    priority: this.calculateShoppingPriority(ingredient),
                    category: this.getIngredientCategory(ingredient.name),
                    estimatedCost: this.estimateCost(ingredient.name, needed),
                    alternatives: this.findAlternatives(ingredient.name)
                });
            }
        });

        // Sort by priority and category
        this.shoppingList.sort((a, b) => {
            if (a.priority !== b.priority) return b.priority - a.priority;
            return a.category.localeCompare(b.category);
        });
    }

    /**
     * Identify nutritional deficiencies and provide concrete suggestions
     */
    identifyDeficiencies(nutrition, needs) {
        const deficiencies = [];

        // Check macronutrients
        if (nutrition.protein < needs.protein * 0.8) {
            deficiencies.push({
                nutrient: 'Protein',
                deficit: needs.protein - nutrition.protein,
                suggestions: ['Adaugă 100g tofu fermentat', 'Include 50g semințe de dovleac', 'Adaugă 150g linte roșie']
            });
        }

        if (nutrition.fiber < needs.fiber * 0.8) {
            deficiencies.push({
                nutrient: 'Fiber',
                deficit: needs.fiber - nutrition.fiber,
                suggestions: ['Adaugă 200g broccoli', 'Include 100g quinoa', 'Adaugă 150g fasole neagră']
            });
        }

        // Check key micronutrients
        const criticalMinerals = ['iron', 'magnesium', 'zinc', 'calcium'];
        criticalMinerals.forEach(mineral => {
            const current = nutrition.minerals[mineral] || 0;
            const needed = needs.micronutrients[mineral] || 0;
            
            if (current < needed * 0.7) {
                deficiencies.push({
                    nutrient: mineral.charAt(0).toUpperCase() + mineral.slice(1),
                    deficit: needed - current,
                    suggestions: this.getMineralSuggestions(mineral)
                });
            }
        });

        return deficiencies;
    }

    /**
     * Optimize recipe for current mTOR phase
     */
    optimizeForMTOR(nutrition, mTORSettings) {
        const optimizations = {
            phase: mTORSettings.phase,
            recommendations: [],
            leucineContent: this.calculateLeucine(nutrition),
            autophagoScore: this.calculateAutophagoScore(nutrition),
            longevityMarkers: this.calculateLongevityMarkers(nutrition)
        };

        if (mTORSettings.phase === 'growth') {
            if (optimizations.leucineContent < 2.5) {
                optimizations.recommendations.push('Adaugă semințe de susan pentru leucină');
            }
            optimizations.recommendations.push('Optimizat pentru sinteza proteică și recuperare');
        } else {
            if (optimizations.autophagoScore < 70) {
                optimizations.recommendations.push('Adaugă curcuma și ghimbir pentru autoegie');
            }
            optimizations.recommendations.push('Optimizat pentru longevitate și regenerare celulară');
        }

        return optimizations;
    }

    /**
     * Assess Ayurvedic food compatibility
     */
    assessAyurvedicCompatibility(ingredients) {
        let compatibilityScore = 100;
        const incompatibilities = [];

        // Check for problematic combinations
        const hasLemon = ingredients.some(ing => ing.name.toLowerCase().includes('lămâie'));
        const hasMilk = ingredients.some(ing => ing.name.toLowerCase().includes('lapte'));
        
        if (hasLemon && hasMilk) {
            compatibilityScore -= 20;
            incompatibilities.push('Lămâie + Lapte: poate cauza probleme digestive');
        }

        // Check for optimal combinations
        const hasTurmeric = ingredients.some(ing => ing.name.toLowerCase().includes('curcuma'));
        const hasBlackPepper = ingredients.some(ing => ing.name.toLowerCase().includes('piper negru'));
        
        if (hasTurmeric && hasBlackPepper) {
            compatibilityScore += 10;
        }

        return {
            score: Math.max(0, Math.min(100, compatibilityScore)),
            incompatibilities: incompatibilities,
            recommendations: this.getAyurvedicRecommendations(ingredients)
        };
    }

    // Helper methods
    calculateFreshness(expiryDate) {
        const now = new Date();
        const expiry = new Date(expiryDate);
        const daysUntilExpiry = (expiry - now) / (1000 * 60 * 60 * 24);
        
        if (daysUntilExpiry < 0) return 0; // Expired
        if (daysUntilExpiry < 2) return 0.5; // Almost expired
        if (daysUntilExpiry < 5) return 0.8; // Use soon
        return 1.0; // Fresh
    }

    countPlantDiversity(ingredients) {
        const plantFoods = new Set();
        ingredients.forEach(ingredient => {
            const nutrientData = nutrients[ingredient.name.toLowerCase()];
            if (nutrientData && nutrientData.category !== 'animal_products') {
                plantFoods.add(ingredient.name.toLowerCase());
            }
        });
        return plantFoods.size;
    }

    getAvailableIngredients() {
        return Array.from(this.pantryItems.keys())
            .map(name => ({
                name: name,
                available: this.pantryItems.get(name).quantity,
                freshness: this.pantryItems.get(name).freshness
            }))
            .filter(item => item.freshness > 0.3); // Only include reasonably fresh items
    }

    getMineralSuggestions(mineral) {
        const suggestions = {
            iron: ['Adaugă spanac proaspăt', 'Include linte roșie', 'Adaugă semințe de dovleac'],
            magnesium: ['Include migdale', 'Adaugă quinoa', 'Folosește cacao raw'],
            zinc: ['Adaugă semințe de susan', 'Include năut', 'Folosește semințe de dovleac'],
            calcium: ['Include susan tahini', 'Adaugă kale', 'Folosește migdale']
        };
        return suggestions[mineral] || ['Consultă specialistul în nutriție'];
    }

    /**
     * Switch active profile
     */
    switchProfile(profileName) {
        if (this.codexCore.profiles[profileName]) {
            this.currentProfile = profileName;
            return true;
        }
        return false;
    }

    /**
     * Switch mTOR phase
     */
    switchMTORPhase(phase) {
        if (['growth', 'longevity'].includes(phase)) {
            this.currentPhase = phase;
            return true;
        }
        return false;
    }

    /**
     * Get current engine status
     */
    getStatus() {
        return {
            currentProfile: this.currentProfile,
            currentPhase: this.currentPhase,
            pantryItems: this.pantryItems.size,
            shoppingListItems: this.shoppingList.length,
            lastGenerated: this.lastRecipeGenerated || null
        };
    }
}

export default RecipeEngine;