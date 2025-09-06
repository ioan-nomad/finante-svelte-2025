/**
 * CODEX ENGINE v4.0 - Sistem Complet de Decizie Nutrițională
 * Workflow logic impecabil pentru generare rețete
 */

import { CODEX_AUTHORITY } from './codexAuthority.js';
import { NUTRITIONAL_REQUIREMENTS } from './codexNutritionalRequirements.js';
import { CODEX_INGREDIENTS } from './codexDatabase.js';

export class CodexEngine {
  constructor() {
    this.version = '4.0';
    this.workflow = this.initializeWorkflow();
    this.gastronomicSources = this.loadGastronomicSources();
    this.cookingMethods = this.initializeCookingMethods();
  }

  // ═══════════════════════════════════════════
  // WORKFLOW PRINCIPAL - 9 PAȘI OBLIGATORII
  // ═══════════════════════════════════════════
  
  initializeWorkflow() {
    return {
      steps: [
        '1_PROFILE_LOAD',        // Încarcă profiluri Ioan & Nico
        '2_INVENTORY_CHECK',     // Verifică stocuri disponibile
        '3_REQUIREMENTS_CALC',   // Calculează nevoi nutriționale
        '4_SAFETY_VALIDATION',   // Validare alergii & restricții
        '5_RECIPE_GENERATION',   // Generare rețetă optimă
        '6_NUTRIENT_ANALYSIS',   // Analiză completă nutrienți
        '7_GASTRONOMY_ENHANCE',  // Optimizare gust & compatibilitate
        '8_COOKING_OPTIMIZE',    // Adaptare pentru metoda de gătit
        '9_OUTPUT_FORMAT'        // Formatare finală standardizată
      ],
      
      mandatoryChecks: {
        noMushrooms: true,       // Alergie Nico
        antiInflammatory: true,  // Prioritate #1
        completeNutrition: true, // Toate nutrienții
        ayurvedaCompat: true,    // Compatibilitate ingrediente
        instantPotFirst: true    // Metodă preferată
      }
    };
  }

  // ═══════════════════════════════════════════
  // STEP 1: PROFILE MANAGEMENT
  // ═══════════════════════════════════════════
  
  loadProfiles() {
    return {
      ioan: {
        name: "Ioan",
        age: 46,
        height: 171,
        weight: 75,
        tdee: 2245,
        omadWindow: "06:00-07:00",
        activityLevel: "moderate",
        preferences: {
          spiceLevel: "medium",
          textures: "varied",
          cuisines: ["mediterranean", "asian", "romanian"]
        }
      },
      
      nico: {
        name: "Nico",
        age: 44,
        height: 141,
        weight: 54,
        tdee: 1404,
        omadWindow: "06:00-07:00",
        mobility: "limited",
        allergens: ["mushrooms", "ciuperci"],
        textureNeeds: "soft_cooked",
        preferences: {
          spiceLevel: "mild",
          textures: "soft_uniform"
        }
      },
      
      combined: {
        totalCalories: 3649,
        mealSplit: {
          ioan: "60%",  // 2189 kcal
          nico: "40%"   // 1460 kcal
        },
        sharedIngredients: true,
        cookingMethod: "instant_pot"
      }
    };
  }

  // ═══════════════════════════════════════════
  // STEP 2: INVENTORY INTEGRATION
  // ═══════════════════════════════════════════
  
  async checkInventory() {
    try {
      // Try to access pantry if available
      if (typeof getPantryInventory === 'function') {
        const pantryItems = getPantryInventory();
        return {
          available: pantryItems.filter(item => item.quantity > 0),
          expiringSoon: pantryItems.filter(item => {
            const daysLeft = this.getDaysUntilExpiry(item.expiryDate);
            return daysLeft <= 3 && daysLeft > 0;
          }),
          categories: this.categorizeIngredients(pantryItems)
        };
      }
    } catch (error) {
      console.log('Pantry module not available, using defaults');
    }
    
    return this.getDefaultInventory();
  }
  
  getDefaultInventory() {
    return {
      available: [
        { id: 'salmon_wild', quantity: 500, unit: 'g' },
        { id: 'lentils', quantity: 1000, unit: 'g' },
        { id: 'chickpeas', quantity: 800, unit: 'g' },
        { id: 'turmeric', quantity: 100, unit: 'g' },
        { id: 'ginger', quantity: 200, unit: 'g' },
        { id: 'garlic', quantity: 150, unit: 'g' },
        { id: 'broccoli', quantity: 300, unit: 'g' },
        { id: 'spinach', quantity: 200, unit: 'g' },
        { id: 'sweet_potato', quantity: 1000, unit: 'g' },
        { id: 'olive_oil', quantity: 500, unit: 'ml' },
        { id: 'onion', quantity: 500, unit: 'g' },
        { id: 'kale', quantity: 200, unit: 'g' }
      ],
      expiringSoon: [],
      categories: {
        proteins: ['salmon_wild', 'lentils', 'chickpeas'],
        vegetables: ['broccoli', 'spinach', 'sweet_potato', 'onion', 'kale'],
        spices: ['turmeric', 'ginger', 'garlic'],
        fats: ['olive_oil']
      }
    };
  }

  getDaysUntilExpiry(expiryDate) {
    if (!expiryDate) return 30;
    const today = new Date();
    const expiry = new Date(expiryDate);
    return Math.floor((expiry - today) / (1000 * 60 * 60 * 24));
  }
  
  categorizeIngredients(items) {
    const categories = {
      proteins: [],
      vegetables: [],
      spices: [],
      fats: [],
      grains: []
    };
    
    items.forEach(item => {
      const ingredient = CODEX_INGREDIENTS[item.id];
      if (ingredient) {
        if (ingredient.category === 'protein') categories.proteins.push(item.id);
        else if (ingredient.category === 'vegetable') categories.vegetables.push(item.id);
        else if (ingredient.category === 'spice') categories.spices.push(item.id);
        else if (ingredient.category === 'fat') categories.fats.push(item.id);
        else if (ingredient.category === 'grain') categories.grains.push(item.id);
      }
    });
    
    return categories;
  }

  // ═══════════════════════════════════════════
  // STEP 5: RECIPE GENERATION LOGIC
  // ═══════════════════════════════════════════
  
  async generateOptimalRecipe(options = {}) {
    const {
      cookingMethod = 'instant_pot',
      mealType = 'omad',
      servings = 2,
      useInventory = true
    } = options;
    
    const profiles = this.loadProfiles();
    const requirements = this.calculateDailyRequirements();
    const inventory = useInventory ? await this.checkInventory() : null;
    
    // Build recipe structure
    const recipe = {
      id: `codex_${new Date().toISOString().split('T')[0]}_${Math.random().toString(36).substr(2, 6)}`,
      name: '',
      date: new Date().toISOString(),
      cookingMethod: cookingMethod,
      servings: servings,
      
      // Ingredients with EXACT amounts
      ingredients: [],
      
      // Nutritional totals
      nutrition: {
        calories: 0,
        macros: {},
        vitamins: {},
        minerals: {},
        ratios: {}
      },
      
      // DZR% for both profiles
      dzr: {
        ioan: {},
        nico: {}
      },
      
      // Instructions
      instructions: {
        prep: [],
        cooking: [],
        timing: {}
      },
      
      // Validations
      safety: {},
      compatibility: {}
    };
    
    // Execute workflow steps
    recipe.ingredients = this.selectOptimalIngredients(requirements, inventory, cookingMethod);
    recipe.ingredients = this.calculateExactPortions(recipe.ingredients, requirements);
    recipe.nutrition = this.analyzeNutrition(recipe.ingredients);
    recipe.dzr = this.calculateDZRForBoth(recipe.nutrition);
    recipe.safety = this.validateSafety(recipe.ingredients);
    recipe = this.enhanceWithGastronomy(recipe);
    recipe.instructions = this.optimizeCooking(recipe, cookingMethod);
    recipe.name = this.generateRecipeName(recipe);
    
    return recipe;
  }

  calculatePlantDiversityScore(meal) {
    const ingredients = meal.ingredients || [];
    const plantCount = ingredients.filter(ingredient => 
      this.isPlantBased(ingredient.name)
    ).length;

    return Math.min((plantCount / this.rules.nutrition.plantDiversity.dailyMinimum) * 100, 100);
  }

  isPlantBased(ingredientName) {
    const name = ingredientName.toLowerCase();
    const allPlants = Object.values(this.rules.nutrition.plantDiversity.categories).flat();
    return allPlants.some(plant => name.includes(plant));
  }

  evaluateMacronutrients(meal) {
    // Get current phase from mTOR cycle state
    const currentState = mtorCycleState.get ? mtorCycleState.get() : mtorCycleState;
    const currentPhase = currentState.currentPhase === 'growth' ? 'highProteinDays' : 'lowProteinDays';
    const targets = this.rules.nutrition.macronutrients[currentPhase];
    
    return {
      protein: this.evaluateMacro(meal.protein, targets.protein),
      carbs: this.evaluateMacro(meal.carbs, targets.carbs),
      fat: this.evaluateMacro(meal.fat, targets.fat),
      phase: currentPhase
    };
  }

  evaluateMacro(actual, target) {
    if (actual >= target.min && actual <= target.max) {
      return { score: 100, status: 'optimal' };
    } else if (actual < target.min) {
      return { score: 50, status: 'too_low' };
    } else {
      return { score: 75, status: 'too_high' };
    }
  }

  evaluateTiming(meal) {
    const mealTime = new Date(meal.timestamp).getHours();
    const { start, end } = this.rules.timing.omadWindow;
    
    if (mealTime >= start && mealTime <= end) {
      return { score: 100, status: 'optimal' };
    } else {
      return { score: 50, status: 'outside_window' };
    }
  }

  calculateOverallScore(evaluation) {
    const weights = {
      antiInflammatoryScore: 0.3,
      plantDiversityScore: 0.25,
      macronutrientBalance: 0.25,
      timing: 0.2
    };

    let weightedScore = 0;
    weightedScore += evaluation.antiInflammatoryScore * weights.antiInflammatoryScore;
    weightedScore += evaluation.plantDiversityScore * weights.plantDiversityScore;
    
    const macroAvg = (
      evaluation.macronutrientBalance.protein.score +
      evaluation.macronutrientBalance.carbs.score +
      evaluation.macronutrientBalance.fat.score
    ) / 3;
    weightedScore += macroAvg * weights.macronutrientBalance;
    
    weightedScore += evaluation.timing.score * weights.timing;

    return Math.round(weightedScore);
  }

  generateInstantPotRecipe(desiredIngredients, cookingTime = 20) {
    const recipe = {
      layers: this.stratifyIngredients(desiredIngredients),
      cookingTime: cookingTime,
      pressure: 'high',
      naturalRelease: 10
    };

    recipe.instructions = this.generateCookingInstructions(recipe);
    return recipe;
  }

  stratifyIngredients(ingredients) {
    const layers = {
      bottom: [],
      middle: [],
      top: [],
      steam_basket: []
    };

    ingredients.forEach(ingredient => {
      const name = ingredient.name.toLowerCase();
      
      if (name.includes('onion') || name.includes('garlic') || name.includes('broth')) {
        layers.bottom.push(ingredient);
      } else if (name.includes('chicken') || name.includes('beef') || name.includes('potato')) {
        layers.middle.push(ingredient);
      } else if (name.includes('spinach') || name.includes('kale')) {
        layers.top.push(ingredient);
      } else if (name.includes('broccoli') || name.includes('bell_pepper')) {
        layers.steam_basket.push(ingredient);
      } else {
        layers.middle.push(ingredient);
      }
    });

    return layers;
  }

  generateCookingInstructions(recipe) {
    return [
      `Add aromatics and liquid to bottom: ${recipe.layers.bottom.map(i => i.name).join(', ')}`,
      `Layer proteins and root vegetables: ${recipe.layers.middle.map(i => i.name).join(', ')}`,
      `Place delicate vegetables on top: ${recipe.layers.top.map(i => i.name).join(', ')}`,
      `Use steam basket for: ${recipe.layers.steam_basket.map(i => i.name).join(', ')}`,
      `Cook on ${recipe.pressure} pressure for ${recipe.cookingTime} minutes`,
      `Natural pressure release for ${recipe.naturalRelease} minutes`
    ];
  }

  getTodaysRecommendations() {
    const currentState = mtorCycleState.get ? mtorCycleState.get() : mtorCycleState;
    const currentPhase = currentState.currentPhase;
    const dayInCycle = currentState.dayInPhase;
    
    const cacheKey = this.getCacheKey('recommendations', {
      date: new Date().toDateString(),
      phase: currentPhase
    });
    
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return cached;
    }

    const plantProgressState = currentWeekProgress.get ? currentWeekProgress.get() : currentWeekProgress;

    const phaseKey = currentPhase === 'growth' ? 'highProteinDays' : 'lowProteinDays';
    const recommendations = {
      phase: currentPhase,
      dayInCycle: dayInCycle,
      macroTargets: this.rules.nutrition.macronutrients[phaseKey],
      priorityPlants: this.getNeededPlants(plantProgressState),
      mealTiming: this.rules.timing.omadWindow,
      antiInflammatoryFocus: this.getAntiInflammatoryFocus(),
      instantPotSuggestion: this.generateInstantPotSuggestion(phaseKey)
    };

    this.setCache(cacheKey, recommendations);
    return recommendations;
  }

  getNeededPlants(plantProgressState) {
    const needed = [];
    const categories = this.rules.nutrition.plantDiversity.categories;
    
    // Handle different plantProgressState structures
    const progress = plantProgressState.categories || {};
    
    Object.entries(categories).forEach(([category, plants]) => {
      const consumedInCategory = progress[category] || 0;
      if (consumedInCategory < 3) {
        needed.push({
          category,
          suggestions: plants.slice(0, 5),
          priority: 3 - consumedInCategory
        });
      }
    });

    return needed.sort((a, b) => b.priority - a.priority);
  }

  getAntiInflammatoryFocus() {
    return this.rules.nutrition.antiInflammatory.highScore.slice(0, 3);
  }

  generateInstantPotSuggestion(phase) {
    if (phase === 'highProteinDays') {
      return {
        protein: 'chicken_thigh',
        vegetables: ['broccoli', 'bell_peppers', 'spinach'],
        aromatics: ['garlic', 'ginger', 'turmeric'],
        cookingTime: 12
      };
    } else {
      return {
        base: 'quinoa',
        vegetables: ['sweet_potatoes', 'kale', 'mushrooms'],
        aromatics: ['onions', 'herbs', 'olive_oil'],
        cookingTime: 8
      };
    }
  }
}

export const codexEngine = new CodexEngine();