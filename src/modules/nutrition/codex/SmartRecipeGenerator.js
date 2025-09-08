/**
 * SMART RECIPE GENERATOR v2.0
 * Connects real nutrients.js database + pantry inventory + nutritional analysis
 * Generates recipes based on deficiencies with Instant Pot stratification
 */

import { ROMANIAN_FOODS_DATABASE } from './database/nutrients.js';
import { InstantPotLayers } from './CookingMethods.js';
import { get } from 'svelte/store';

export class SmartRecipeGenerator {
    constructor() {
        this.foodDatabase = ROMANIAN_FOODS_DATABASE;
        this.instantPotLayers = new InstantPotLayers();
        
        // Nutritional targets for OMAD (daily values)
        this.dailyTargets = {
            protein: 100,     // g
            fiber: 30,        // g
            vitamin_c: 90,    // mg
            vitamin_k: 120,   // mcg
            folate: 400,      // mcg
            iron: 18,         // mg
            calcium: 1000,    // mg
            magnesium: 420,   // mg
            potassium: 3500,  // mg
            omega3: 1.6,      // g
            antioxidants: 100 // ORAC units (estimated)
        };
    }

    /**
     * Generate recipe based on nutritional deficiencies and available pantry items
     * @param {Array} pantryItems - Available ingredients from pantry
     * @param {Object} nutritionalDeficiencies - Current nutrient gaps
     * @param {Object} preferences - Cooking preferences and restrictions
     * @returns {Object} Complete recipe with Instant Pot instructions
     */
    generateTargetedRecipe(pantryItems = [], nutritionalDeficiencies = {}, preferences = {}) {
        // Step 1: Analyze available ingredients from pantry
        const availableFoods = this.matchPantryToDatabase(pantryItems);
        
        // Step 2: Identify top deficiencies to target
        const priorityNutrients = this.prioritizeDeficiencies(nutritionalDeficiencies);
        
        // Step 3: Select optimal ingredients for deficiencies
        const selectedIngredients = this.selectOptimalIngredients(
            availableFoods, 
            priorityNutrients, 
            preferences
        );
        
        // Step 4: Create balanced recipe
        const recipe = this.createBalancedRecipe(selectedIngredients);
        
        // Step 5: Generate Instant Pot stratification
        const instantPotInstructions = this.generateInstantPotInstructions(recipe.ingredients);
        
        // Step 6: Calculate nutritional impact
        const nutritionalProfile = this.calculateRecipeNutrition(recipe.ingredients);
        
        return {
            id: `smart_recipe_${Date.now()}`,
            name: this.generateRecipeName(recipe.ingredients, priorityNutrients),
            description: this.generateRecipeDescription(priorityNutrients),
            servings: 1, // OMAD single serving
            
            // Core recipe data
            ingredients: recipe.ingredients,
            instructions: recipe.instructions,
            
            // Instant Pot specific
            instantPot: {
                layers: instantPotInstructions.layers,
                instructions: instantPotInstructions.instructions,
                cookingTime: instantPotInstructions.totalCookingTime,
                pressure: 'HIGH',
                liquidRequirements: instantPotInstructions.liquidRequirements
            },
            
            // Nutritional analysis
            nutrition: {
                profile: nutritionalProfile,
                deficienciesAddressed: this.analyzeDeficienciesAddressed(
                    nutritionalProfile, 
                    priorityNutrients
                ),
                dailyTargetsCovered: this.calculateTargetsCovered(nutritionalProfile),
                antiInflammatoryScore: this.calculateAntiInflammatoryScore(recipe.ingredients),
                longevityScore: this.calculateLongevityScore(recipe.ingredients)
            },
            
            // Meta information
            targetedDeficiencies: priorityNutrients,
            usedPantryItems: availableFoods.map(f => f.pantryItem),
            cookingMethod: 'instant_pot',
            difficulty: 'easy',
            totalTime: instantPotInstructions.totalCookingTime + 15, // prep + cook
            created: new Date().toISOString()
        };
    }

    /**
     * Match pantry items with nutrient database
     */
    matchPantryToDatabase(pantryItems) {
        const matched = [];
        
        for (const pantryItem of pantryItems) {
            // Try exact name match first
            let dbMatch = this.foodDatabase.find(food => 
                food.name.toLowerCase() === pantryItem.name.toLowerCase() ||
                food.nameRo?.toLowerCase() === pantryItem.name.toLowerCase() ||
                food.nameEn?.toLowerCase() === pantryItem.name.toLowerCase()
            );
            
            // Try partial match if no exact match
            if (!dbMatch) {
                dbMatch = this.foodDatabase.find(food => 
                    food.name.toLowerCase().includes(pantryItem.name.toLowerCase()) ||
                    pantryItem.name.toLowerCase().includes(food.name.toLowerCase())
                );
            }
            
            if (dbMatch) {
                matched.push({
                    pantryItem: pantryItem,
                    nutritionData: dbMatch,
                    availableAmount: pantryItem.quantity || 100, // grams
                    category: dbMatch.category
                });
            }
        }
        
        return matched;
    }

    /**
     * Prioritize nutritional deficiencies for targeting
     */
    prioritizeDeficiencies(deficiencies) {
        const priority = [];
        
        // Critical deficiencies (>50% below target)
        Object.entries(deficiencies).forEach(([nutrient, deficitPercent]) => {
            if (deficitPercent > 0.5) {
                priority.push({
                    nutrient,
                    severity: 'critical',
                    deficitPercent,
                    targetAmount: this.dailyTargets[nutrient] || 0
                });
            }
        });
        
        // Moderate deficiencies (25-50% below target)
        Object.entries(deficiencies).forEach(([nutrient, deficitPercent]) => {
            if (deficitPercent > 0.25 && deficitPercent <= 0.5) {
                priority.push({
                    nutrient,
                    severity: 'moderate',
                    deficitPercent,
                    targetAmount: this.dailyTargets[nutrient] || 0
                });
            }
        });
        
        // Sort by severity and deficit percentage
        return priority.sort((a, b) => {
            if (a.severity === 'critical' && b.severity !== 'critical') return -1;
            if (b.severity === 'critical' && a.severity !== 'critical') return 1;
            return b.deficitPercent - a.deficitPercent;
        }).slice(0, 5); // Focus on top 5 deficiencies
    }

    /**
     * Select optimal ingredients to address deficiencies
     */
    selectOptimalIngredients(availableFoods, priorityNutrients, preferences = {}) {
        const selected = [];
        const nutrientScores = {};
        
        // Calculate nutrient density scores for available foods
        availableFoods.forEach(food => {
            let score = 0;
            const nutrition = food.nutritionData.nutrition;
            
            priorityNutrients.forEach(deficiency => {
                const nutrientValue = nutrition[deficiency.nutrient] || 0;
                const contribution = (nutrientValue / deficiency.targetAmount) * 100;
                score += contribution * (deficiency.severity === 'critical' ? 2 : 1);
            });
            
            food.nutrientScore = score;
        });
        
        // Sort by nutrient score and select top contributors
        const sortedFoods = availableFoods.sort((a, b) => b.nutrientScore - a.nutrientScore);
        
        // Select ingredients with variety and balance
        let totalScore = 0;
        const usedCategories = new Set();
        
        for (const food of sortedFoods) {
            if (selected.length >= 8) break; // Limit to 8 main ingredients
            
            const category = food.nutritionData.category;
            
            // Ensure variety across food categories
            if (!usedCategories.has(category) || usedCategories.size < 4) {
                selected.push({
                    ...food,
                    amount: this.calculateOptimalAmount(food, priorityNutrients)
                });
                usedCategories.add(category);
                totalScore += food.nutrientScore;
            }
        }
        
        // Ensure we have protein source
        const hasProtein = selected.some(s => s.nutritionData.category === 'meat' || 
                                              s.nutritionData.category === 'legumes' ||
                                              s.nutritionData.nutrition.protein > 15);
        
        if (!hasProtein && availableFoods.some(f => f.nutritionData.nutrition.protein > 15)) {
            const proteinSource = availableFoods
                .filter(f => f.nutritionData.nutrition.protein > 15)
                .sort((a, b) => b.nutritionData.nutrition.protein - a.nutritionData.nutrition.protein)[0];
            
            if (proteinSource) {
                selected.push({
                    ...proteinSource,
                    amount: 150 // 150g protein source
                });
            }
        }
        
        return selected;
    }

    /**
     * Calculate optimal amount for each ingredient
     */
    calculateOptimalAmount(food, priorityNutrients) {
        const nutrition = food.nutritionData.nutrition;
        let optimalAmount = 100; // Base 100g
        
        // Adjust based on nutrient density and deficiency severity
        priorityNutrients.forEach(deficiency => {
            const nutrientValue = nutrition[deficiency.nutrient] || 0;
            if (nutrientValue > 0) {
                const neededAmount = (deficiency.targetAmount * deficiency.deficitPercent) / 4; // Divide by 4 ingredients average
                const amountForThisNutrient = (neededAmount / nutrientValue) * 100;
                optimalAmount = Math.max(optimalAmount, Math.min(amountForThisNutrient, 300)); // Cap at 300g
            }
        });
        
        // Adjust based on food category
        const category = food.nutritionData.category;
        if (category === 'vegetables') optimalAmount = Math.min(optimalAmount * 1.2, 250);
        if (category === 'meat') optimalAmount = Math.min(optimalAmount * 0.8, 200);
        if (category === 'spices') optimalAmount = Math.min(optimalAmount * 0.1, 20);
        
        return Math.round(optimalAmount);
    }

    /**
     * Create balanced recipe from selected ingredients
     */
    createBalancedRecipe(ingredients) {
        const recipe = {
            ingredients: ingredients.map(ing => ({
                name: ing.nutritionData.name,
                amount: ing.amount,
                unit: 'g',
                category: ing.nutritionData.category,
                nutritionData: ing.nutritionData.nutrition,
                pantryId: ing.pantryItem.id
            })),
            instructions: this.generateCookingInstructions(ingredients)
        };
        
        return recipe;
    }

    /**
     * Generate cooking instructions
     */
    generateCookingInstructions(ingredients) {
        const instructions = [
            "🔪 PREGĂTIRE (5 minute):",
            "• Spală și taie toate legumele în bucăți de 3-4 cm",
            "• Condimentează carnea cu sare și piper",
            "• Pregătește aromele (ceapă, usturoi, ghimbir)",
            "",
            "⚡ INSTANT POT - Stratificare OBLIGATORIE:",
            "• NU amesteca în timpul gătitului!",
            "• Fiecare strat se gătește perfect în vapori",
            "• Urmează ordinea exactă pentru rezultate optime"
        ];
        
        return instructions;
    }

    /**
     * Generate Instant Pot stratification instructions
     */
    generateInstantPotInstructions(ingredients) {
        return this.instantPotLayers.getOptimalLayers(ingredients);
    }

    /**
     * Calculate total nutritional profile of recipe
     */
    calculateRecipeNutrition(ingredients) {
        const totals = {
            calories: 0,
            protein: 0,
            carbs: 0,
            fat: 0,
            fiber: 0,
            vitamin_c: 0,
            vitamin_k: 0,
            folate: 0,
            iron: 0,
            calcium: 0,
            magnesium: 0,
            potassium: 0
        };
        
        ingredients.forEach(ingredient => {
            const nutrition = ingredient.nutritionData;
            const multiplier = ingredient.amount / 100; // Per 100g to actual amount
            
            Object.keys(totals).forEach(nutrient => {
                if (nutrition[nutrient]) {
                    totals[nutrient] += nutrition[nutrient] * multiplier;
                }
            });
        });
        
        return totals;
    }

    /**
     * Analyze which deficiencies are addressed by recipe
     */
    analyzeDeficienciesAddressed(nutritionalProfile, priorityNutrients) {
        const addressed = [];
        
        priorityNutrients.forEach(deficiency => {
            const providedAmount = nutritionalProfile[deficiency.nutrient] || 0;
            const percentageOfTarget = (providedAmount / deficiency.targetAmount) * 100;
            
            addressed.push({
                nutrient: deficiency.nutrient,
                provided: Math.round(providedAmount),
                target: deficiency.targetAmount,
                percentageCovered: Math.round(percentageOfTarget),
                improvementLevel: percentageOfTarget > 70 ? 'excellent' : 
                                 percentageOfTarget > 50 ? 'good' : 
                                 percentageOfTarget > 25 ? 'moderate' : 'minimal'
            });
        });
        
        return addressed;
    }

    /**
     * Generate recipe name based on ingredients and targets
     */
    generateRecipeName(ingredients, priorityNutrients) {
        const mainIngredients = ingredients
            .filter(i => i.category !== 'spices')
            .slice(0, 3)
            .map(i => i.name);
        
        const mainNutrient = priorityNutrients[0]?.nutrient || 'nutrients';
        const nutritionFocus = this.getNutritionFocusName(mainNutrient);
        
        return `OMAD ${nutritionFocus} - ${mainIngredients.join(', ')}`;
    }

    /**
     * Get nutrition focus name in Romanian
     */
    getNutritionFocusName(nutrient) {
        const focusNames = {
            protein: 'Proteină',
            fiber: 'Fibră',
            vitamin_c: 'Vitamina C',
            vitamin_k: 'Vitamina K',
            iron: 'Fier',
            calcium: 'Calciu',
            folate: 'Folat'
        };
        return focusNames[nutrient] || 'Nutrienți';
    }

    /**
     * Generate recipe description
     */
    generateRecipeDescription(priorityNutrients) {
        const mainDeficiencies = priorityNutrients.slice(0, 3);
        const focusAreas = mainDeficiencies.map(d => this.getNutritionFocusName(d.nutrient));
        
        return `🎯 Rețetă OMAD optimizată pentru: ${focusAreas.join(', ')}. ` +
               `Stratificare Instant Pot pentru reținere maximă nutrienți. ` +
               `Ingrediente selectate din inventarul disponibil.`;
    }

    /**
     * Calculate anti-inflammatory score
     */
    calculateAntiInflammatoryScore(ingredients) {
        let score = 0;
        
        ingredients.forEach(ingredient => {
            const category = ingredient.nutritionData?.category;
            const nutrition = ingredient.nutritionData;
            
            // Anti-inflammatory scoring
            if (category === 'vegetables' && nutrition.vitamin_c > 20) score += 10;
            if (category === 'spices') score += 15;
            if (nutrition.omega3 > 0.5) score += 10;
            if (nutrition.fiber > 5) score += 8;
            if (ingredient.name.toLowerCase().includes('turmeric') || 
                ingredient.name.toLowerCase().includes('ghimbir')) score += 20;
        });
        
        return Math.min(score, 100); // Cap at 100
    }

    /**
     * Calculate longevity score
     */
    calculateLongevityScore(ingredients) {
        let score = 0;
        
        ingredients.forEach(ingredient => {
            const nutrition = ingredient.nutritionData;
            
            // Longevity factors
            if (nutrition.antioxidants > 50) score += 10;
            if (nutrition.folate > 50) score += 8;
            if (nutrition.vitamin_k > 50) score += 8;
            if (nutrition.magnesium > 50) score += 6;
            if (nutrition.potassium > 300) score += 5;
        });
        
        return Math.min(score, 100); // Cap at 100
    }

    /**
     * Calculate daily targets coverage
     */
    calculateTargetsCovered(nutritionalProfile) {
        const coverage = {};
        
        Object.entries(this.dailyTargets).forEach(([nutrient, target]) => {
            const provided = nutritionalProfile[nutrient] || 0;
            coverage[nutrient] = {
                provided: Math.round(provided),
                target: target,
                percentage: Math.round((provided / target) * 100),
                status: provided >= target ? 'complete' : 
                        provided >= target * 0.7 ? 'good' : 
                        provided >= target * 0.4 ? 'moderate' : 'low'
            };
        });
        
        return coverage;
    }
}

export default SmartRecipeGenerator;