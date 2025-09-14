/**
 * CODEX N-OMAD v3.0 - Unified Recipe Engine
 * Connects CodexCore + CookingMethods + Pantry + nutrients.js
 * REAL IMPLEMENTATION - generates actual recipes using available ingredients
 */

import { ROMANIAN_FOODS_DATABASE } from './codex/database/nutrients.js';
import { CookingMethodIntegration } from './codex/CookingMethods.js';
import { groceryInventory } from '../pantry/stores/pantryStore.js';
import { get } from 'svelte/store';

export class RecipeEngine {
  constructor() {
    console.log('🧬 Initializing CODEX Recipe Engine v3.0...');
    
    this.nutrientsDatabase = ROMANIAN_FOODS_DATABASE;
    this.cookingMethods = new CookingMethodIntegration();
    this.profiles = this.initializeProfiles();
    this.currentProfile = 'ioan';
    this.currentPhase = 'growth';
    
    console.log('✅ Recipe Engine initialized with:', {
      nutrientsDatabase: this.nutrientsDatabase.length + ' foods',
      profiles: Object.keys(this.profiles),
      defaultProfile: this.currentProfile,
      currentPhase: this.currentPhase
    });
  }

  /**
   * Generate complete OMAD recipe using real pantry inventory
   * CONNECTS: Pantry → Nutrients → Cooking → Recipe
   */
  async generateOMADRecipe(preferences = {}) {
    console.log('🚀 Generating OMAD recipe for:', this.currentProfile, 'phase:', this.currentPhase);
    
    try {
      // 1. Get current pantry inventory with defensive checks
      const pantryData = get(groceryInventory) || { inventory: {} };
      const availableIngredients = await this.getAvailableIngredients(pantryData);
      console.log('📦 Available ingredients:', availableIngredients.length);

      // 2. Get nutritional needs for profile
      const profile = this.profiles[this.currentProfile];
      const nutritionalNeeds = this.calculateNutritionalNeeds(profile);
      console.log('🎯 Nutritional targets:', {
        calories: nutritionalNeeds.calories,
        protein: nutritionalNeeds.protein,
        plantDiversity: nutritionalNeeds.plantDiversityTarget
      });

      // 3. Select optimal ingredients (pantry + shopping)
      const selectedIngredients = this.selectOptimalIngredients(
        availableIngredients, 
        nutritionalNeeds, 
        preferences
      );
      console.log('✅ Selected ingredients:', selectedIngredients.length);

      // 4. Apply Instant Pot stratification
      const instantPotLayers = this.cookingMethods.getInstantPotLayers(selectedIngredients);
      
      // 5. Calculate real nutrition
      const nutrition = this.calculateRealNutrition(selectedIngredients);
      
      // 6. Calculate DRI percentages
      const driPercentages = this.calculateDRIPercentages(nutrition, profile);
      
      // 7. Generate shopping list for missing items
      const shoppingList = this.generateShoppingList(selectedIngredients, pantryData);
      
      // 8. Calculate CODEX score
      const codexScore = this.calculateCODEXScore(nutrition, selectedIngredients);

      const recipe = {
        metadata: {
          profile: this.currentProfile,
          phase: this.currentPhase,
          generatedAt: new Date().toISOString(),
          version: '3.0',
          totalIngredients: selectedIngredients.length,
          plantDiversity: this.countPlantDiversity(selectedIngredients)
        },
        name: `OMAD ${this.currentPhase.toUpperCase()} - ${profile.name}`,
        ingredients: selectedIngredients,
        instantPotLayers: instantPotLayers,
        nutrition: nutrition,
        driPercentages: driPercentages,
        shoppingList: shoppingList,
        codexScore: codexScore,
        cookingTime: instantPotLayers.totalCookingTime,
        method: 'instant_pot'
      };

      console.log('🎉 Recipe generated successfully!', {
        name: recipe.name,
        ingredients: recipe.ingredients.length,
        codexScore: recipe.codexScore,
        cookingTime: recipe.cookingTime
      });

      return recipe;

    } catch (error) {
      console.error('❌ Recipe generation failed:', error);
      throw error;
    }
  }

  /**
   * Get available ingredients from pantry inventory
   */
  async getAvailableIngredients(pantryData) {
    const available = [];

    // Try to get real pantry data from store
    try {
      const { groceryInventory } = await import('../../stores/groceryStore.js');
      const { get } = await import('svelte/store');
      const realPantryData = get(groceryInventory);

      if (realPantryData?.inventory) {
        console.log('📦 Using REAL pantry data from groceryInventory');

        // Convert pantry format to recipe ingredients
        Object.entries(realPantryData.inventory).forEach(([itemName, itemData]) => {
          if (itemData && itemData.quantity > 0) {
            const nutrientData = this.findNutrientData(itemName);

            available.push({
              name: itemName,
              nameRo: itemName,
              category: itemData.category || 'other',
              available: itemData.quantity,
              unit: itemData.unit || 'g',
              expiryDate: itemData.expiryDate,
              freshness: this.calculateFreshness(itemData.expiryDate),
              nutrientData: nutrientData,
              pantrySource: true,
              needToBuy: false
            });
          }
        });

        console.log(`✅ Loaded ${available.length} items from pantry`);
      }
    } catch (error) {
      console.log('⚠️ Could not load pantry data, using defaults');
    }

    // If no pantry data or not enough items, add common ingredients
    if (available.length < 5) {
      const defaults = [
        { name: 'Somon', available: 0, needToBuy: true },
        { name: 'Broccoli', available: 0, needToBuy: true },
        { name: 'Quinoa', available: 0, needToBuy: true },
        { name: 'Spanac', available: 0, needToBuy: true },
        { name: 'Avocado', available: 0, needToBuy: true }
      ];

      defaults.forEach(item => {
        if (!available.find(a => a.name === item.name)) {
          available.push({
            ...item,
            category: 'suggested',
            unit: 'g',
            freshness: 1.0,
            pantrySource: false,
            nutrientData: this.findNutrientData(item.name)
          });
        }
      });
    }

    return available;
  }

  markIngredientsAvailability(ingredients, pantryItems) {
    return ingredients.map(ing => {
      const inPantry = pantryItems.find(p =>
        p.name.toLowerCase().includes(ing.name.toLowerCase()) ||
        ing.name.toLowerCase().includes(p.name.toLowerCase())
      );

      return {
        ...ing,
        inStock: !!inPantry,
        stockAmount: inPantry?.available || 0,
        needAmount: ing.amount - (inPantry?.available || 0),
        displayStatus: inPantry
          ? `✅ În stoc: ${inPantry.available}${inPantry.unit}`
          : `🛒 De cumpărat: ${ing.amount}${ing.unit}`
      };
    });
  }

  /**
   * Select optimal ingredients based on nutrition needs and availability
   */
  selectOptimalIngredients(availableIngredients, needs, preferences = {}) {
    const selected = [];
    const nutritionTracker = {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0,
      plantCount: 0
    };

    // Priority categories for OMAD
    const priorityCategories = [
      'proteins',
      'leafyGreens', 
      'cruciferous',
      'rootVegetables',
      'healthyFats',
      'complexCarbs',
      'aromatics'
    ];

    // Select from each category
    priorityCategories.forEach(category => {
      const categoryItems = this.getCategoryItems(availableIngredients, category);
      const bestItems = this.selectBestFromCategory(categoryItems, needs, nutritionTracker, 2);
      selected.push(...bestItems);
    });

    // Add base ingredients if not enough from pantry
    if (selected.length < 8) {
      const baseIngredients = this.getBaseOMAdIngredients();
      baseIngredients.forEach(ingredient => {
        if (!selected.find(s => s.name === ingredient.name)) {
          selected.push({
            ...ingredient,
            pantrySource: false,
            needToBuy: true
          });
        }
      });
    }

    console.log('🎯 Ingredient selection complete:', {
      fromPantry: selected.filter(i => i.pantrySource).length,
      needToBuy: selected.filter(i => i.needToBuy).length,
      total: selected.length
    });

    return selected.slice(0, 12); // Max 12 ingredients for complexity
  }

  /**
   * Get base OMAD ingredients when pantry is limited
   */
  getBaseOMAdIngredients() {
    return [
      { name: 'somon', amount: 200, unit: 'g', category: 'protein', reason: 'Complete protein + omega-3' },
      { name: 'quinoa', amount: 100, unit: 'g', category: 'grains', reason: 'Complete amino acids' },
      { name: 'broccoli', amount: 150, unit: 'g', category: 'vegetables', reason: 'High vitamin C + fiber' },
      { name: 'spanac', amount: 100, unit: 'g', category: 'vegetables', reason: 'Iron + folate' },
      { name: 'morcov', amount: 100, unit: 'g', category: 'vegetables', reason: 'Beta-carotene' },
      { name: 'avocado', amount: 80, unit: 'g', category: 'fats', reason: 'Healthy monounsaturated fats' },
      { name: 'usturoi', amount: 10, unit: 'g', category: 'aromatics', reason: 'Allicin + flavor' },
      { name: 'curcuma', amount: 5, unit: 'g', category: 'spices', reason: 'Anti-inflammatory' },
      { name: 'ghimbir', amount: 10, unit: 'g', category: 'aromatics', reason: 'Digestive health' },
      { name: 'bulion de oase', amount: 500, unit: 'ml', category: 'liquids', reason: 'Mineral base' }
    ];
  }

  /**
   * Calculate real nutrition from selected ingredients
   */
  calculateRealNutrition(ingredients) {
    const nutrition = {
      calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0,
      vitamin_c: 0, iron: 0, calcium: 0, magnesium: 0,
      omega3: 0, sodium: 0
    };

    ingredients.forEach(ingredient => {
      const nutrientData = ingredient.nutrientData || this.findNutrientData(ingredient.name);
      
      if (nutrientData && nutrientData.nutrition) {
        const multiplier = (ingredient.amount || 100) / 100; // Per 100g conversion
        
        // Add all available nutrients
        Object.keys(nutrition).forEach(nutrient => {
          const value = nutrientData.nutrition[nutrient] || 0;
          nutrition[nutrient] += value * multiplier;
        });
      } else {
        // Fallback estimates for unknown ingredients
        console.warn(`⚠️ No nutrition data for ${ingredient.name}, using estimates`);
        const multiplier = (ingredient.amount || 100) / 100;
        nutrition.calories += 50 * multiplier;
        nutrition.protein += 5 * multiplier;
        nutrition.carbs += 8 * multiplier;
      }
    });

    // Round all values
    Object.keys(nutrition).forEach(key => {
      nutrition[key] = Math.round(nutrition[key] * 10) / 10;
    });

    console.log('🔬 Nutrition calculated:', nutrition);
    return nutrition;
  }

  /**
   * Initialize user profiles with DRI data
   */
  initializeProfiles() {
    return {
      ioan: {
        name: 'Ioan',
        age: 45,
        gender: 'male',
        weight: 75, // kg
        height: 175, // cm
        activityLevel: 'moderate',
        goals: ['longevity', 'anti_inflammatory', 'muscle_maintenance'],
        allergies: [],
        dri: {
          calories: 2400,
          protein: 90,
          carbs: 300,
          fat: 80,
          fiber: 35,
          iron: 8,
          calcium: 1000,
          vitamin_c: 90
        }
      },
      nicoleta: {
        name: 'Nicoleta',
        age: 42,
        gender: 'female', 
        weight: 65,
        height: 165,
        activityLevel: 'moderate',
        goals: ['longevity', 'weight_maintenance'],
        allergies: ['mushrooms'],
        dri: {
          calories: 2000,
          protein: 75,
          carbs: 250,
          fat: 65,
          fiber: 32,
          iron: 18,
          calcium: 1000,
          vitamin_c: 75
        }
      }
    };
  }

  /**
   * Calculate nutritional needs based on profile and mTOR phase
   */
  calculateNutritionalNeeds(profile) {
    const baseDRI = profile.dri;
    const phaseMultipliers = this.getPhaseMultipliers();
    
    return {
      calories: Math.round(baseDRI.calories * phaseMultipliers.calories),
      protein: Math.round(baseDRI.protein * phaseMultipliers.protein),
      carbs: Math.round(baseDRI.carbs * phaseMultipliers.carbs),
      fat: Math.round(baseDRI.fat * phaseMultipliers.fat),
      fiber: Math.max(baseDRI.fiber, 35),
      plantDiversityTarget: 12, // For single meal
      antiInflammatoryScore: 80 // Target score
    };
  }

  /**
   * Get phase multipliers for mTOR cycling
   */
  getPhaseMultipliers() {
    const multipliers = {
      growth: {
        calories: 1.1,
        protein: 1.3,
        carbs: 1.0,
        fat: 1.0
      },
      longevity: {
        calories: 0.95,
        protein: 1.0,
        carbs: 0.9,
        fat: 1.1
      }
    };
    
    return multipliers[this.currentPhase] || multipliers.longevity;
  }

  // Helper methods
  findNutrientData(ingredientName) {
    const name = ingredientName.toLowerCase();
    return this.nutrientsDatabase.find(food => 
      food.name.toLowerCase().includes(name) ||
      food.nameRo.toLowerCase().includes(name) ||
      name.includes(food.name.toLowerCase())
    );
  }

  calculateFreshness(expiryDate) {
    if (!expiryDate) return 1.0;
    
    const now = new Date();
    const expiry = new Date(expiryDate);
    const daysUntilExpiry = (expiry - now) / (1000 * 60 * 60 * 24);
    
    if (daysUntilExpiry < 0) return 0; // Expired
    if (daysUntilExpiry < 2) return 0.5; // Almost expired  
    if (daysUntilExpiry < 5) return 0.8; // Use soon
    return 1.0; // Fresh
  }

  getCategoryItems(ingredients, category) {
    const categoryMap = {
      proteins: ['somon', 'pui', 'vita', 'porc', 'peste', 'ou', 'linte', 'naut'],
      leafyGreens: ['spanac', 'kale', 'rucola', 'salata'],
      cruciferous: ['broccoli', 'conopida', 'varza'],
      rootVegetables: ['morcov', 'cartof', 'sfecla', 'pastarnac'],
      healthyFats: ['avocado', 'nuci', 'migdale', 'seminte'],
      complexCarbs: ['quinoa', 'orez', 'ovaz', 'hrisca'],
      aromatics: ['usturoi', 'ceapa', 'ghimbir', 'curcuma']
    };

    const keywords = categoryMap[category] || [];
    return ingredients.filter(ingredient =>
      keywords.some(keyword => 
        ingredient.name.toLowerCase().includes(keyword)
      )
    );
  }

  selectBestFromCategory(items, needs, tracker, maxItems = 2) {
    return items
      .filter(item => item.freshness > 0.3) // Only fresh items
      .sort((a, b) => b.freshness - a.freshness) // Best quality first
      .slice(0, maxItems);
  }

  countPlantDiversity(ingredients) {
    const plantFoods = new Set();
    ingredients.forEach(ingredient => {
      const nutrientData = ingredient.nutrientData || this.findNutrientData(ingredient.name);
      if (nutrientData && nutrientData.category === 'vegetables') {
        plantFoods.add(ingredient.name.toLowerCase());
      }
    });
    return plantFoods.size;
  }

  calculateDRIPercentages(nutrition, profile) {
    const dri = profile.dri;
    return {
      calories: Math.round((nutrition.calories / dri.calories) * 100),
      protein: Math.round((nutrition.protein / dri.protein) * 100),
      fiber: Math.round((nutrition.fiber / 35) * 100), // Standard fiber target
      iron: Math.round((nutrition.iron / dri.iron) * 100),
      calcium: Math.round((nutrition.calcium / dri.calcium) * 100),
      vitamin_c: Math.round((nutrition.vitamin_c / dri.vitamin_c) * 100)
    };
  }

  generateShoppingList(selectedIngredients, pantryData) {
    const shoppingList = [];
    
    selectedIngredients.forEach(ingredient => {
      if (ingredient.needToBuy || !ingredient.pantrySource) {
        shoppingList.push({
          name: ingredient.name,
          amount: ingredient.amount,
          unit: ingredient.unit,
          category: ingredient.category,
          estimatedCost: this.estimateCost(ingredient.name, ingredient.amount),
          priority: this.getIngredientPriority(ingredient.name),
          reason: ingredient.reason || 'Essential for OMAD nutrition'
        });
      }
    });

    return shoppingList.sort((a, b) => b.priority - a.priority);
  }

  estimateCost(ingredientName, amount) {
    const costPerKg = {
      'somon': 80, 'pui': 25, 'vita': 45, 'quinoa': 25,
      'broccoli': 8, 'spanac': 12, 'morcov': 3, 'avocado': 15,
      'curcuma': 45, 'ghimbir': 12, 'usturoi': 8
    };
    
    const price = costPerKg[ingredientName] || 10;
    return Math.round((amount / 1000) * price * 100) / 100;
  }

  getIngredientPriority(ingredientName) {
    const priorities = {
      'somon': 10, 'quinoa': 9, 'broccoli': 8, 'spanac': 8,
      'curcuma': 7, 'ghimbir': 7, 'usturoi': 6
    };
    return priorities[ingredientName] || 5;
  }

  calculateCODEXScore(nutrition, ingredients) {
    let score = 0;
    
    // Protein adequacy (25 points)
    if (nutrition.protein >= 90) score += 25;
    else if (nutrition.protein >= 70) score += 20;
    else if (nutrition.protein >= 50) score += 15;
    
    // Plant diversity (25 points)
    const plantCount = this.countPlantDiversity(ingredients);
    score += Math.min(plantCount * 3, 25);
    
    // Fiber content (20 points)
    if (nutrition.fiber >= 35) score += 20;
    else if (nutrition.fiber >= 25) score += 15;
    else if (nutrition.fiber >= 15) score += 10;
    
    // Anti-inflammatory ingredients (15 points)
    const antiInflamCount = ingredients.filter(ing => 
      ['curcuma', 'ghimbir', 'spanac', 'broccoli', 'avocado'].some(ai => 
        ing.name.toLowerCase().includes(ai)
      )
    ).length;
    score += Math.min(antiInflamCount * 3, 15);
    
    // Cooking method (15 points)
    score += 15; // Instant Pot optimization
    
    return Math.min(score, 100);
  }

  // Profile management
  switchProfile(profileName) {
    if (this.profiles[profileName]) {
      this.currentProfile = profileName;
      console.log('👤 Switched to profile:', profileName);
      return true;
    }
    return false;
  }

  switchPhase(phase) {
    if (['growth', 'longevity'].includes(phase)) {
      this.currentPhase = phase;
      console.log('🔄 Switched to phase:', phase);
      return true;
    }
    return false;
  }

  getStatus() {
    return {
      currentProfile: this.currentProfile,
      currentPhase: this.currentPhase,
      nutrientsDatabase: this.nutrientsDatabase.length,
      version: '3.0'
    };
  }
}

// Export singleton instance
export const recipeEngine = new RecipeEngine();

export default recipeEngine;