// CODEX Recipes - Generator și manager de rețete optimizate
import { codexCore } from './codexCore.js';
import { codexDatabase } from './codexDatabase.js';
import { codexScoring } from './codexScoring.js';

export class CodexRecipes {
  constructor() {
    this.recipeDatabase = new Map();
    this.generationRules = this.initializeGenerationRules();
    this.instantPotTemplates = this.initializeInstantPotTemplates();
  }

  initializeGenerationRules() {
    return {
      // Base requirements pentru orice rețetă CODEX
      base_requirements: {
        cooking_method: 'instant_pot_exclusive',
        meal_timing: 'OMAD_06_07',
        plant_species_minimum: 10,
        anti_inflammatory_priority: true,
        nico_safe: true,
        single_pot: true
      },

      // Rules pentru high mTOR phase
      high_mtor_rules: {
        protein_target: '25-35%',
        protein_sources: ['chicken_thigh', 'salmon', 'eggs', 'greek_yogurt'],
        plant_complement: 'moderate_variety',
        focus: 'muscle_maintenance'
      },

      // Rules pentru low mTOR phase
      low_mtor_rules: {
        protein_target: '15-20%',
        protein_sources: ['legumes', 'quinoa', 'nuts', 'seeds'],
        plant_complement: 'maximum_variety',
        focus: 'autophagy_activation'
      },

      // Nico-specific adaptations
      nico_adaptations: {
        texture_requirement: 'soft_when_cooked',
        allergen_exclusions: ['mushrooms', 'ciuperci'],
        cooking_modifications: 'extended_time_soft_texture',
        preparation_notes: 'small_pieces_easy_chewing'
      }
    };
  }

  initializeInstantPotTemplates() {
    return {
      layered_complete_meal: {
        name: 'Layered Complete OMAD Meal',
        description: 'Full nutritional profile in stratified Instant Pot cooking',
        layers: {
          bottom: {
            purpose: 'Aromatics and liquid base',
            typical_ingredients: ['onion', 'garlic', 'ginger', 'turmeric'],
            liquid_requirements: '1-2 cups',
            saute_first: true
          },
          middle: {
            purpose: 'Main proteins and hearty vegetables',
            cooking_time_driver: true,
            typical_ingredients: ['protein_source', 'root_vegetables']
          },
          top: {
            purpose: 'Delicate vegetables',
            minimal_cooking: true,
            typical_ingredients: ['leafy_greens', 'zucchini']
          },
          steam_basket: {
            purpose: 'Quick-cooking vegetables',
            steam_only: true,
            typical_ingredients: ['broccoli', 'cauliflower']
          }
        },
        cooking_parameters: {
          pressure: 'high',
          natural_release: 10,
          total_time_estimate: '25-35 minutes'
        }
      },

      one_pot_stew: {
        name: 'CODEX One-Pot Stew',
        description: 'Nutrient-dense stew with maximum plant diversity',
        method: 'all_ingredients_together',
        cooking_parameters: {
          pressure: 'high',
          cook_time: '15 minutes',
          natural_release: 15
        },
        optimization: 'plant_diversity_maximized'
      }
    };
  }

  // Main recipe generation method
  async generateDailyRecipe(date = new Date(), options = {}) {
    const cycleInfo = codexCore.cycles.getCycleProgress(date);
    const phase = cycleInfo.phase;
    
    const recipe = {
      id: this.generateRecipeId(date),
      date: date.toISOString().split('T')[0],
      mtor_phase: phase,
      cycle_day: cycleInfo.current_day,
      
      meta: {
        generated_at: new Date().toISOString(),
        codex_version: '1.0',
        target_profiles: ['Ioan', 'Nico']
      },

      ingredients: [],
      instructions: [],
      nutrition_estimate: {},
      instant_pot_setup: {},
      
      compliance_prediction: {},
      nico_adaptations: []
    };

    // Generate ingredients based on phase
    recipe.ingredients = await this.generateIngredients(phase, options);
    
    // Create Instant Pot instructions
    recipe.instant_pot_setup = this.generateInstantPotInstructions(recipe.ingredients);
    
    // Generate cooking instructions
    recipe.instructions = this.generateCookingInstructions(recipe.instant_pot_setup);
    
    // Add Nico adaptations
    recipe.nico_adaptations = this.generateNicoAdaptations(recipe.ingredients);
    
    // Estimate nutrition
    recipe.nutrition_estimate = this.estimateNutrition(recipe.ingredients);
    
    // Predict CODEX compliance
    recipe.compliance_prediction = this.predictCompliance(recipe);
    
    // Store in database
    this.recipeDatabase.set(recipe.id, recipe);
    
    return recipe;
  }

  async generateIngredients(phase, options = {}) {
    const ingredients = [];
    
    // Base aromatic foundation (always present)
    const aromatics = this.selectAromatics();
    ingredients.push(...aromatics);
    
    // Protein selection based on mTOR phase
    const proteins = this.selectProteins(phase, options.protein_preference);
    ingredients.push(...proteins);
    
    // Vegetable selection for plant diversity
    const vegetables = await this.selectVegetables(phase, options.plant_focus);
    ingredients.push(...vegetables);
    
    // Spices and herbs for anti-inflammatory boost
    const spicesHerbs = this.selectSpicesAndHerbs();
    ingredients.push(...spicesHerbs);
    
    // Fat sources
    const fats = this.selectHealthyFats();
    ingredients.push(...fats);
    
    // Validate and optimize selection
    return this.optimizeIngredientSelection(ingredients, phase);
  }

  selectAromatics() {
    // Core aromatics for Instant Pot base layer
    return [
      {
        id: 'onion',
        quantity: 150, // grams
        role: 'aromatic_base',
        layer: 'bottom',
        preparation: 'diced medium'
      },
      {
        id: 'garlic',
        quantity: 20,
        role: 'aromatic_base',
        layer: 'bottom',
        preparation: 'minced'
      },
      {
        id: 'ginger',
        quantity: 15,
        role: 'anti_inflammatory',
        layer: 'bottom',
        preparation: 'minced fresh'
      }
    ];
  }

  selectProteins(phase, preference = null) {
    const proteinOptions = {
      high: [
        { id: 'chicken_thigh', quantity: 300, priority: 1 },
        { id: 'salmon', quantity: 250, priority: 2 },
        { id: 'eggs', quantity: 3, priority: 3 }
      ],
      low: [
        { id: 'lentils', quantity: 100, priority: 1 },
        { id: 'quinoa', quantity: 80, priority: 2 },
        { id: 'chickpeas', quantity: 120, priority: 3 }
      ]
    };

    const availableProteins = proteinOptions[phase];
    const selected = preference ? 
      availableProteins.find(p => p.id === preference) || availableProteins[0] :
      availableProteins[0];

    return [{
      ...selected,
      role: 'primary_protein',
      layer: 'middle',
      preparation: this.getProteinPreparation(selected.id)
    }];
  }

  async selectVegetables(phase, plantFocus = 'diversity') {
    const vegetables = [];
    
    // Ensure we hit plant diversity targets
    const categories = [
      'leafy_greens',
      'cruciferous', 
      'root_vegetables',
      'colorful_vegetables'
    ];

    for (const category of categories) {
      const vegOptions = codexDatabase.getIngredientsByCategory(category);
      const nicoSafeOptions = vegOptions.filter(v => v.nico_safe);
      
      if (nicoSafeOptions.length > 0) {
        // Select 2-3 from each category for diversity
        const selected = nicoSafeOptions.slice(0, Math.min(3, nicoSafeOptions.length));
        
        selected.forEach(veg => {
          vegetables.push({
            id: veg.id,
            quantity: this.calculateVegetableQuantity(veg, phase),
            role: 'plant_diversity',
            layer: this.determineVegetableLayer(veg),
            preparation: veg.nico_prep || 'standard_prep'
          });
        });
      }
    }

    return vegetables;
  }

  selectSpicesAndHerbs() {
    // Anti-inflammatory powerhouse spices
    return [
      {
        id: 'turmeric',
        quantity: 10,
        role: 'anti_inflammatory_primary',
        layer: 'bottom',
        preparation: 'add_with_black_pepper',
        synergy: ['black_pepper']
      },
      {
        id: 'black_pepper',
        quantity: 2,
        role: 'bioavailability_enhancer',
        layer: 'bottom',
        preparation: 'freshly_ground'
      }
    ];
  }

  selectHealthyFats() {
    return [
      {
        id: 'olive_oil',
        quantity: 15,
        role: 'healthy_fat',
        layer: 'bottom',
        preparation: 'extra_virgin_saute'
      }
    ];
  }

  generateInstantPotInstructions(ingredients) {
    const layers = {
      bottom: [],
      middle: [],
      top: [],
      steam_basket: []
    };

    // Sort ingredients by layer
    ingredients.forEach(ingredient => {
      const layer = ingredient.layer || 'middle';
      layers[layer].push(ingredient);
    });

    // Calculate cooking time (based on longest-cooking ingredient)
    const cookTimes = ingredients
      .map(ing => {
        const ingredient = codexDatabase.getIngredientById(ing.id);
        return ingredient?.instant_pot_settings?.cook_time || 5;
      })
      .filter(time => time > 0);

    const maxCookTime = Math.max(...cookTimes, 8);

    return {
      method: 'layered_cooking',
      layers: layers,
      cooking_parameters: {
        pressure: 'high',
        cook_time: maxCookTime,
        natural_release: 10,
        total_time_estimate: maxCookTime + 25 // Including prep and release
      },
      liquid_requirements: {
        minimum: '1 cup',
        recommended: '1.5 cups',
        type: 'vegetable_broth_or_water'
      }
    };
  }

  generateCookingInstructions(instantPotSetup) {
    const instructions = [];

    // Prep phase
    instructions.push({
      step: 1,
      phase: 'preparation',
      action: 'Prepare all ingredients according to specifications',
      details: 'Cut vegetables to Nico-friendly sizes (small, soft pieces)',
      time_estimate: '10-15 minutes'
    });

    // Saute phase
    if (instantPotSetup.layers.bottom.length > 0) {
      instructions.push({
        step: 2,
        phase: 'aromatics',
        action: 'Set Instant Pot to SAUTE mode',
        details: `Heat oil and cook: ${instantPotSetup.layers.bottom.map(ing => ing.id).join(', ')}`,
        time_estimate: '3-5 minutes',
        nico_note: 'Cook until very fragrant and soft'
      });
    }

    // Layering phase
    instructions.push({
      step: 3,
      phase: 'layering',
      action: 'Add ingredients in layers - DO NOT STIR',
      details: {
        middle: instantPotSetup.layers.middle.map(ing => `${ing.id} (${ing.quantity}g)`),
        top: instantPotSetup.layers.top.map(ing => `${ing.id} (${ing.quantity}g)`),
        steam_basket: instantPotSetup.layers.steam_basket.map(ing => `${ing.id} in steam basket`)
      },
      liquid: instantPotSetup.liquid_requirements.recommended
    });

    // Pressure cooking phase
    instructions.push({
      step: 4,
      phase: 'pressure_cooking',
      action: `Cook on HIGH pressure for ${instantPotSetup.cooking_parameters.cook_time} minutes`,
      details: `Natural release for ${instantPotSetup.cooking_parameters.natural_release} minutes, then quick release`,
      total_time: instantPotSetup.cooking_parameters.total_time_estimate
    });

    // Finishing touches
    instructions.push({
      step: 5,
      phase: 'finishing',
      action: 'Check texture and adjust for Nico',
      details: 'All vegetables should be easily mashable with fork',
      nico_adaptation: 'If any items too firm, cook additional 2-3 minutes'
    });

    return instructions;
  }

  generateNicoAdaptations(ingredients) {
    const adaptations = [];

    // Check each ingredient for Nico considerations
    ingredients.forEach(ingredient => {
      const ingredientData = codexDatabase.getIngredientById(ingredient.id);
      
      if (!ingredientData) return;

      // Safety check
      if (!ingredientData.nico_safe) {
        adaptations.push({
          type: 'CRITICAL_REMOVAL',
          ingredient: ingredient.id,
          reason: 'Not safe for Nico',
          action: 'REMOVE COMPLETELY',
          alternatives: ingredientData.alternatives || []
        });
        return;
      }

      // Texture adaptations
      if (ingredientData.nico_prep) {
        adaptations.push({
          type: 'texture_modification',
          ingredient: ingredient.id,
          modification: ingredientData.nico_prep,
          reason: 'Optimal texture for Nico'
        });
      }

      // Cooking time extensions
      if (ingredient.role === 'plant_diversity' && 
          !ingredientData.texture?.includes('soft')) {
        adaptations.push({
          type: 'extended_cooking',
          ingredient: ingredient.id,
          modification: 'Add extra 2-3 minutes cooking time',
          reason: 'Ensure soft, digestible texture'
        });
      }
    });

    // General Nico meal adaptations
    adaptations.push({
      type: 'serving_suggestion',
      modification: 'Serve with extra cooking liquid for easier swallowing',
      reason: 'Mobility and texture considerations'
    });

    return adaptations;
  }

  estimateNutrition(ingredients) {
    let totalNutrition = {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0,
      omega3: 0
    };

    ingredients.forEach(ingredient => {
      const ingredientData = codexDatabase.getIngredientById(ingredient.id);
      if (ingredientData?.nutrition_per_100g) {
        const multiplier = ingredient.quantity / 100;
        
        totalNutrition.calories += (ingredientData.nutrition_per_100g.calories || 0) * multiplier;
        totalNutrition.protein += (ingredientData.nutrition_per_100g.protein || 0) * multiplier;
        totalNutrition.carbs += (ingredientData.nutrition_per_100g.carbs || 0) * multiplier;
        totalNutrition.fat += (ingredientData.nutrition_per_100g.fat || 0) * multiplier;
        totalNutrition.fiber += (ingredientData.nutrition_per_100g.fiber || 0) * multiplier;
        totalNutrition.omega3 += (ingredientData.nutrition_per_100g.omega3 || 0) * multiplier;
      }
    });

    // Calculate ratios
    const totalCalories = totalNutrition.calories;
    return {
      ...totalNutrition,
      macros: {
        protein_ratio: (totalNutrition.protein * 4) / totalCalories,
        carb_ratio: (totalNutrition.carbs * 4) / totalCalories,
        fat_ratio: (totalNutrition.fat * 9) / totalCalories
      },
      per_person: {
        ioan_portion: this.calculatePortion(totalNutrition, 'Ioan'),
        nico_portion: this.calculatePortion(totalNutrition, 'Nico')
      }
    };
  }

  predictCompliance(recipe) {
    // Create a mock meal object for scoring
    const mockMeal = {
      id: recipe.id,
      timestamp: `${recipe.date}T06:30:00.000Z`, // Optimal OMAD time
      ingredients: recipe.ingredients,
      nutrition: recipe.nutrition_estimate
    };

    // Use codexScoring to predict compliance
    const scoring = codexScoring.scoreMeal(mockMeal);

    return {
      predicted_score: scoring.total_score,
      predicted_grade: scoring.grade,
      strong_points: this.identifyStrengths(scoring),
      improvement_areas: this.identifyImprovementAreas(scoring),
      nico_safety: scoring.modifiers.nico_safety.safe,
      confidence: this.calculatePredictionConfidence(scoring)
    };
  }

  // Helper methods
  calculateVegetableQuantity(vegetable, phase) {
    // Base quantities adjusted for mTOR phase
    const baseQuantities = {
      leafy_greens: 100,
      cruciferous: 150,
      root_vegetables: 120,
      colorful_vegetables: 100
    };

    const baseQty = baseQuantities[vegetable.category] || 100;
    
    // Increase vegetables in low mTOR phase
    return phase === 'low' ? Math.round(baseQty * 1.2) : baseQty;
  }

  determineVegetableLayer(vegetable) {
    const layerMapping = {
      leafy_greens: 'top',
      cruciferous: 'steam_basket',
      root_vegetables: 'middle',
      colorful_vegetables: 'middle'
    };

    return layerMapping[vegetable.category] || 'middle';
  }

  getProteinPreparation(proteinId) {
    const preparations = {
      chicken_thigh: 'Cut into bite-sized pieces, season well',
      salmon: 'Cut into portions, remove any bones',
      lentils: 'Rinse well before cooking',
      quinoa: 'Rinse until water runs clear'
    };

    return preparations[proteinId] || 'Standard preparation';
  }

  calculatePortion(totalNutrition, profileName) {
    const profiles = codexDatabase.data.nutritional_profiles;
    const profile = profiles.get(`${profileName.toLowerCase()}_profile`);
    
    if (!profile) return totalNutrition;

    const totalTarget = 2500; // Combined target calories
    const personalRatio = profile.target_calories / totalTarget;

    return {
      calories: Math.round(totalNutrition.calories * personalRatio),
      protein: Math.round(totalNutrition.protein * personalRatio),
      carbs: Math.round(totalNutrition.carbs * personalRatio),
      fat: Math.round(totalNutrition.fat * personalRatio)
    };
  }

  identifyStrengths(scoring) {
    const strengths = [];
    
    if (scoring.components.plant_diversity.score >= 90) {
      strengths.push('Excellent plant diversity');
    }
    
    if (scoring.components.anti_inflammatory.score >= 80) {
      strengths.push('High anti-inflammatory content');
    }
    
    if (scoring.modifiers.nico_safety.safe) {
      strengths.push('Completely safe for Nico');
    }
    
    return strengths;
  }

  identifyImprovementAreas(scoring) {
    const areas = [];
    
    if (scoring.components.plant_diversity.score < 70) {
      areas.push('Increase plant species variety');
    }
    
    if (scoring.components.anti_inflammatory.score < 60) {
      areas.push('Add more anti-inflammatory ingredients');
    }
    
    return areas;
  }

  calculatePredictionConfidence(scoring) {
    // Higher confidence for recipes with clear compliance patterns
    let confidence = 70; // base confidence
    
    if (scoring.modifiers.nico_safety.safe) confidence += 15;
    if (scoring.components.plant_diversity.score > 80) confidence += 10;
    if (scoring.violations.length === 0) confidence += 5;
    
    return Math.min(confidence, 95);
  }

  optimizeIngredientSelection(ingredients, phase) {
    // Remove any unsafe ingredients for Nico
    const safeIngredients = ingredients.filter(ingredient => {
      const data = codexDatabase.getIngredientById(ingredient.id);
      return data?.nico_safe !== false;
    });

    // Ensure minimum plant diversity
    const plantCount = this.countPlantSpecies(safeIngredients);
    if (plantCount < 8) {
      // Add more diverse plants
      const additionalPlants = this.selectAdditionalPlants(8 - plantCount);
      safeIngredients.push(...additionalPlants);
    }

    return safeIngredients;
  }

  countPlantSpecies(ingredients) {
    const species = new Set();
    ingredients.forEach(ingredient => {
      const data = codexDatabase.getIngredientById(ingredient.id);
      if (data?.plant_species) {
        species.add(data.plant_species);
      }
    });
    return species.size;
  }

  selectAdditionalPlants(needed) {
    const additionalPlants = [];
    const safeVegetables = codexDatabase.getNicoSafeIngredients()
      .filter(ing => ing.category === 'vegetable' || ing.category === 'herb')
      .slice(0, needed);

    safeVegetables.forEach(veg => {
      additionalPlants.push({
        id: veg.id,
        quantity: 50,
        role: 'diversity_booster',
        layer: 'top',
        preparation: 'finely_chopped'
      });
    });

    return additionalPlants;
  }

  generateRecipeId(date) {
    const dateStr = date.toISOString().split('T')[0];
    const phase = codexCore.cycles.getCurrentPhase(date);
    const randomSuffix = Math.random().toString(36).substr(2, 6);
    
    return `codex_${dateStr}_${phase}_${randomSuffix}`;
  }

  // Public API methods
  async getTodayRecipe() {
    return await this.generateDailyRecipe(new Date());
  }

  async getWeeklyRecipes(startDate = new Date()) {
    const recipes = [];
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      
      const recipe = await this.generateDailyRecipe(date);
      recipes.push(recipe);
    }

    return {
      week_start: startDate.toISOString().split('T')[0],
      recipes: recipes,
      weekly_summary: this.generateWeeklySummary(recipes)
    };
  }

  generateWeeklySummary(recipes) {
    const allIngredients = recipes.flatMap(r => r.ingredients);
    const plantSpeciesCount = this.countPlantSpecies(allIngredients);
    
    return {
      total_recipes: recipes.length,
      plant_species_variety: plantSpeciesCount,
      plant_goal_achievement: (plantSpeciesCount / 30) * 100,
      all_nico_safe: recipes.every(r => 
        r.compliance_prediction.nico_safety
      ),
      average_predicted_score: Math.round(
        recipes.reduce((sum, r) => 
          sum + r.compliance_prediction.predicted_score, 0) / recipes.length
      )
    };
  }
}

export const codexRecipes = new CodexRecipes();