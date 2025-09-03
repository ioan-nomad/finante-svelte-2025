class Recipe {
  constructor(data = {}) {
    this.id = data.id || null;
    this.name = data.name || '';
    this.type = data.type || 'dinner'; // breakfast, lunch, dinner, snack
    this.mtorPhase = data.mtor_phase || 'high'; // high, low
    this.prepTime = data.prep_time || 0; // minutes
    this.cookTime = data.cook_time || 0; // minutes
    this.instantPot = data.instant_pot || true;
    this.antiInflammatory = data.anti_inflammatory || false;
    this.plantCount = data.plant_count || 0;
    this.createdAt = data.created_at || new Date();
    
    // Additional properties
    this.ingredients = data.ingredients || [];
    this.instructions = data.instructions || [];
    this.nutritionInfo = data.nutrition_info || {};
    this.servings = data.servings || 2; // Ioan + Nico
    this.difficulty = data.difficulty || 'easy';
    this.tags = data.tags || [];
  }

  // Validation methods
  isValid() {
    const validTypes = ['breakfast', 'lunch', 'dinner', 'snack'];
    const validPhases = ['high', 'low'];
    
    return (
      this.name.length > 0 &&
      validTypes.includes(this.type) &&
      validPhases.includes(this.mtorPhase) &&
      this.prepTime >= 0 &&
      this.cookTime >= 0
    );
  }

  // Nico safety check
  isNicoSafe() {
    const unsafeIngredients = ['mushroom', 'ciuperci', 'fungi'];
    
    return !this.ingredients.some(ingredient => 
      unsafeIngredients.some(unsafe => 
        ingredient.name.toLowerCase().includes(unsafe)
      )
    );
  }

  // Calculate total time
  getTotalTime() {
    return this.prepTime + this.cookTime;
  }

  // Get phase-appropriate macros
  getPhaseTargets(totalCalories = 2500) {
    const phases = {
      high: { protein: 0.30, carbs: 0.35, fat: 0.35 },
      low: { protein: 0.15, carbs: 0.50, fat: 0.35 }
    };
    
    const ratios = phases[this.mtorPhase];
    
    return {
      protein: (totalCalories * ratios.protein) / 4, // grams
      carbs: (totalCalories * ratios.carbs) / 4,     // grams  
      fat: (totalCalories * ratios.fat) / 9,         // grams
      calories: totalCalories
    };
  }

  // Check if recipe meets plant diversity goals
  meetsPlantGoal(minimumPlants = 10) {
    return this.plantCount >= minimumPlants;
  }

  // Calculate anti-inflammatory score
  getAntiInflammatoryScore() {
    let score = 0;
    
    const antiInflammatoryIngredients = [
      'turmeric', 'ginger', 'berries', 'leafy_greens', 
      'fatty_fish', 'nuts', 'olive_oil', 'tomatoes'
    ];
    
    this.ingredients.forEach(ingredient => {
      const name = ingredient.name.toLowerCase();
      antiInflammatoryIngredients.forEach(antiInflam => {
        if (name.includes(antiInflam)) {
          score += 10;
        }
      });
    });
    
    return Math.min(score, 100);
  }

  // Get instant pot cooking layers
  getInstantPotLayers() {
    const layers = {
      bottom: [],    // aromatics, liquids
      middle: [],    // proteins, root vegetables
      top: [],       // delicate vegetables
      steam_basket: [] // quick-cooking vegetables
    };

    this.ingredients.forEach(ingredient => {
      const name = ingredient.name.toLowerCase();
      
      // Bottom layer
      if (['onion', 'garlic', 'ginger', 'broth', 'coconut'].some(item => name.includes(item))) {
        layers.bottom.push(ingredient);
      }
      // Steam basket
      else if (['broccoli', 'cauliflower', 'green_beans'].some(item => name.includes(item))) {
        layers.steam_basket.push(ingredient);
      }
      // Top layer
      else if (['spinach', 'kale', 'zucchini', 'bell_pepper'].some(item => name.includes(item))) {
        layers.top.push(ingredient);
      }
      // Middle layer (default)
      else {
        layers.middle.push(ingredient);
      }
    });

    return layers;
  }

  // Generate shopping list item
  toShoppingItem() {
    return {
      recipe_name: this.name,
      recipe_id: this.id,
      ingredients: this.ingredients.map(ing => ({
        name: ing.name,
        quantity: ing.quantity,
        unit: ing.unit,
        category: this.categorizeIngredient(ing.name)
      })),
      estimated_cost: this.estimateCost(),
      servings: this.servings
    };
  }

  categorizeIngredient(ingredientName) {
    const name = ingredientName.toLowerCase();
    
    if (['chicken', 'beef', 'fish', 'tofu', 'eggs'].some(p => name.includes(p))) {
      return 'proteins';
    }
    if (['broccoli', 'spinach', 'kale', 'lettuce'].some(v => name.includes(v))) {
      return 'vegetables';
    }
    if (['onion', 'garlic', 'ginger', 'turmeric'].some(a => name.includes(a))) {
      return 'aromatics';
    }
    if (['oil', 'butter', 'nuts', 'seeds'].some(f => name.includes(f))) {
      return 'fats';
    }
    
    return 'other';
  }

  estimateCost() {
    // Simple cost estimation in RON
    const baseCosts = {
      proteins: 15,     // RON per serving
      vegetables: 5,    // RON per serving
      aromatics: 2,     // RON per serving
      fats: 3,          // RON per serving
      other: 2          // RON per serving
    };

    let totalCost = 0;
    
    this.ingredients.forEach(ingredient => {
      const category = this.categorizeIngredient(ingredient.name);
      totalCost += baseCosts[category] || baseCosts.other;
    });

    return Math.round(totalCost * this.servings);
  }

  // Export to database format
  toDatabase() {
    return {
      name: this.name,
      type: this.type,
      mtor_phase: this.mtorPhase,
      prep_time: this.prepTime,
      cook_time: this.cookTime,
      instant_pot: this.instantPot ? 1 : 0,
      anti_inflammatory: this.antiInflammatory ? 1 : 0,
      plant_count: this.plantCount
    };
  }

  // Create from database record
  static fromDatabase(record) {
    return new Recipe({
      id: record.id,
      name: record.name,
      type: record.type,
      mtor_phase: record.mtor_phase,
      prep_time: record.prep_time,
      cook_time: record.cook_time,
      instant_pot: record.instant_pot === 1,
      anti_inflammatory: record.anti_inflammatory === 1,
      plant_count: record.plant_count,
      created_at: record.created_at
    });
  }

  // Clone recipe with modifications
  clone(modifications = {}) {
    const clonedData = {
      ...this,
      ...modifications,
      id: null, // New recipe gets new ID
      createdAt: new Date()
    };
    
    return new Recipe(clonedData);
  }

  // Adapt recipe for specific dietary needs
  adaptForNico() {
    const adapted = this.clone({
      name: `${this.name} (Nico Adapted)`,
      tags: [...this.tags, 'nico_safe', 'soft_texture']
    });

    // Remove mushrooms
    adapted.ingredients = adapted.ingredients.filter(ing => 
      !ing.name.toLowerCase().includes('mushroom')
    );

    // Add cooking notes for softer textures
    adapted.instructions = [
      'Cook vegetables until very tender for easier chewing',
      'Cut all ingredients into smaller, bite-sized pieces',
      ...adapted.instructions
    ];

    return adapted;
  }
}

export default Recipe;