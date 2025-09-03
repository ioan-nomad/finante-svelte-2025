import principles from '../config/principles.json' assert { type: 'json' };
import restrictions from '../config/restrictions.json' assert { type: 'json' };

class InstantPotEngine {
  constructor() {
    this.principles = principles;
    this.restrictions = restrictions;
    this.cookingTimes = this.initializeCookingTimes();
    this.layerRules = this.initializeLayerRules();
  }

  initializeCookingTimes() {
    return {
      proteins: {
        chicken_breast: { time: 8, pressure: 'high', natural_release: 5 },
        chicken_thigh: { time: 12, pressure: 'high', natural_release: 10 },
        beef_stew: { time: 35, pressure: 'high', natural_release: 15 },
        pork_shoulder: { time: 90, pressure: 'high', natural_release: 15 },
        fish: { time: 3, pressure: 'low', natural_release: 2 },
        eggs: { time: 5, pressure: 'high', natural_release: 5 },
        tofu: { time: 2, pressure: 'high', natural_release: 10 }
      },
      vegetables: {
        root_vegetables: { time: 4, pressure: 'high', natural_release: 5 },
        broccoli: { time: 1, pressure: 'high', natural_release: 5 },
        cauliflower: { time: 2, pressure: 'high', natural_release: 5 },
        leafy_greens: { time: 0, method: 'steam_only', natural_release: 5 },
        bell_peppers: { time: 2, pressure: 'high', natural_release: 5 },
        mushrooms: { time: 3, pressure: 'high', natural_release: 5 },
        zucchini: { time: 1, pressure: 'high', natural_release: 5 }
      },
      grains: {
        rice: { time: 3, pressure: 'high', natural_release: 10, liquid_ratio: 1.5 },
        quinoa: { time: 1, pressure: 'high', natural_release: 10, liquid_ratio: 2 },
        lentils: { time: 12, pressure: 'high', natural_release: 10, liquid_ratio: 3 },
        beans: { time: 30, pressure: 'high', natural_release: 15, liquid_ratio: 3 }
      }
    };
  }

  initializeLayerRules() {
    return {
      bottom: {
        description: 'Aromatics and liquid base',
        ingredients: ['onions', 'garlic', 'ginger', 'broth', 'coconut_milk', 'spices'],
        purpose: 'flavor_base'
      },
      middle: {
        description: 'Proteins and root vegetables',
        ingredients: ['chicken', 'beef', 'tofu', 'potatoes', 'carrots', 'sweet_potato'],
        purpose: 'main_cooking'
      },
      top: {
        description: 'Delicate vegetables',
        ingredients: ['leafy_greens', 'zucchini', 'bell_peppers'],
        purpose: 'gentle_cooking'
      },
      steam_basket: {
        description: 'Quick-cooking vegetables',
        ingredients: ['broccoli', 'cauliflower', 'green_beans'],
        purpose: 'steam_cooking'
      }
    };
  }

  generateInstantPotRecipe(ingredients, targetPhase = 'high') {
    const recipe = {
      ingredients: this.sortIngredientsByLayer(ingredients),
      layers: this.stratifyIngredients(ingredients),
      cooking_instructions: [],
      total_time: 0,
      pressure_setting: 'high',
      natural_release_time: 10,
      phase_optimized: targetPhase
    };

    // Calculate cooking time based on longest-cooking ingredient
    recipe.total_time = this.calculateCookingTime(ingredients);
    
    // Generate step-by-step instructions
    recipe.cooking_instructions = this.generateInstructions(recipe);
    
    // Add Nico safety adjustments
    recipe.texture_modifications = this.getNicoTextureAdjustments(ingredients);
    
    return recipe;
  }

  sortIngredientsByLayer(ingredients) {
    const sorted = {
      bottom: [],
      middle: [],
      top: [],
      steam_basket: []
    };

    ingredients.forEach(ingredient => {
      const name = ingredient.name.toLowerCase();
      const layer = this.determineLayer(name);
      sorted[layer].push({
        ...ingredient,
        cooking_time: this.getCookingTime(name),
        prep_notes: this.getPrepNotes(name)
      });
    });

    return sorted;
  }

  determineLayer(ingredientName) {
    // Bottom layer: aromatics and liquids
    if (this.layerRules.bottom.ingredients.some(item => 
        ingredientName.includes(item))) {
      return 'bottom';
    }
    
    // Steam basket: quick vegetables
    if (this.layerRules.steam_basket.ingredients.some(item => 
        ingredientName.includes(item))) {
      return 'steam_basket';
    }
    
    // Top layer: delicate vegetables
    if (this.layerRules.top.ingredients.some(item => 
        ingredientName.includes(item))) {
      return 'top';
    }
    
    // Default to middle layer
    return 'middle';
  }

  getCookingTime(ingredientName) {
    for (const [category, items] of Object.entries(this.cookingTimes)) {
      for (const [item, settings] of Object.entries(items)) {
        if (ingredientName.includes(item.replace('_', ' '))) {
          return settings;
        }
      }
    }
    
    // Default settings
    return { time: 5, pressure: 'high', natural_release: 5 };
  }

  calculateCookingTime(ingredients) {
    let maxTime = 0;
    
    ingredients.forEach(ingredient => {
      const cookTime = this.getCookingTime(ingredient.name.toLowerCase());
      maxTime = Math.max(maxTime, cookTime.time);
    });
    
    return maxTime;
  }

  generateInstructions(recipe) {
    const instructions = [];
    
    // Step 1: Prep
    instructions.push({
      step: 1,
      action: 'prep',
      description: 'Prepare all ingredients according to texture requirements',
      details: recipe.texture_modifications
    });
    
    // Step 2: Bottom layer
    if (recipe.layers.bottom.length > 0) {
      instructions.push({
        step: 2,
        action: 'sauté',
        description: `Sauté aromatics: ${recipe.layers.bottom.map(i => i.name).join(', ')}`,
        time: '3-5 minutes',
        setting: 'sauté mode'
      });
    }
    
    // Step 3: Add liquid and middle ingredients
    instructions.push({
      step: 3,
      action: 'layer',
      description: `Add proteins and vegetables: ${recipe.layers.middle.map(i => i.name).join(', ')}`,
      notes: 'Layer evenly, don\'t stir'
    });
    
    // Step 4: Top layer
    if (recipe.layers.top.length > 0) {
      instructions.push({
        step: 4,
        action: 'top_layer',
        description: `Place delicate vegetables on top: ${recipe.layers.top.map(i => i.name).join(', ')}`,
        notes: 'These will steam gently'
      });
    }
    
    // Step 5: Steam basket
    if (recipe.layers.steam_basket.length > 0) {
      instructions.push({
        step: 5,
        action: 'steam_basket',
        description: `Add to steam basket: ${recipe.layers.steam_basket.map(i => i.name).join(', ')}`,
        notes: 'Place basket on top of other ingredients'
      });
    }
    
    // Step 6: Pressure cook
    instructions.push({
      step: 6,
      action: 'pressure_cook',
      description: `Cook on ${recipe.pressure_setting} pressure`,
      time: `${recipe.total_time} minutes`,
      natural_release: `${recipe.natural_release_time} minutes`
    });
    
    return instructions;
  }

  getNicoTextureAdjustments(ingredients) {
    const adjustments = [];
    
    ingredients.forEach(ingredient => {
      const name = ingredient.name.toLowerCase();
      
      if (name.includes('carrot')) {
        adjustments.push({
          ingredient: ingredient.name,
          modification: 'Cut into small, thin pieces for easier chewing'
        });
      }
      
      if (name.includes('meat') || name.includes('chicken')) {
        adjustments.push({
          ingredient: ingredient.name,
          modification: 'Use tender cuts, cook until very soft'
        });
      }
      
      if (name.includes('broccoli') || name.includes('cauliflower')) {
        adjustments.push({
          ingredient: ingredient.name,
          modification: 'Cut into small florets, ensure tender cooking'
        });
      }
    });
    
    return adjustments;
  }

  stratifyIngredients(ingredients) {
    return this.sortIngredientsByLayer(ingredients);
  }

  getPrepNotes(ingredientName) {
    const notes = [];
    
    // Nico-specific prep notes
    if (this.restrictions.nico_restrictions.texture_preferences.avoid.some(item =>
        ingredientName.includes(item.replace('_', ' ')))) {
      notes.push('⚠️ Requires texture modification for Nico');
    }
    
    // Anti-inflammatory prep
    if (ingredientName.includes('turmeric')) {
      notes.push('💡 Add black pepper to enhance absorption');
    }
    
    if (ingredientName.includes('ginger')) {
      notes.push('💡 Fresh ginger has higher anti-inflammatory properties');
    }
    
    return notes;
  }

  optimizeForMTOR(recipe, phase) {
    if (phase === 'high') {
      // High protein phase optimizations
      recipe.protein_boost = true;
      recipe.cooking_modifications = [
        'Focus on protein-rich ingredients',
        'Reduce cooking time for proteins to maintain amino acid profile'
      ];
    } else {
      // Low protein phase optimizations  
      recipe.plant_boost = true;
      recipe.cooking_modifications = [
        'Maximize vegetable variety',
        'Longer cooking times for better digestibility'
      ];
    }
    
    return recipe;
  }
}

export default InstantPotEngine;