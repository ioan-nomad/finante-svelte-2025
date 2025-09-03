class Ingredient {
  constructor(data = {}) {
    this.id = data.id || null;
    this.name = data.name || '';
    this.category = data.category || 'other';
    this.plantSpecies = data.plant_species || null;
    this.antiInflammatoryScore = data.anti_inflammatory_score || 0;
    this.allergen = data.allergen || false;
    this.unit = data.unit || 'g';
    this.nicoSafe = data.nico_safe !== undefined ? data.nico_safe : true;
    
    // Extended properties
    this.nutritionPer100g = data.nutrition || {};
    this.seasonality = data.seasonality || [];
    this.storageInfo = data.storage || {};
    this.preparationMethods = data.preparation || [];
    this.instantPotCompatible = data.instant_pot_compatible !== undefined ? data.instant_pot_compatible : true;
  }

  // Validation methods
  isValid() {
    const validCategories = [
      'proteins', 'vegetables', 'fruits', 'grains', 'legumes', 
      'nuts', 'seeds', 'spices', 'herbs', 'fats', 'other'
    ];
    
    return (
      this.name.length > 0 &&
      validCategories.includes(this.category) &&
      this.antiInflammatoryScore >= 0 && 
      this.antiInflammatoryScore <= 10
    );
  }

  // Check if ingredient is a plant
  isPlant() {
    const plantCategories = [
      'vegetables', 'fruits', 'grains', 'legumes', 
      'nuts', 'seeds', 'spices', 'herbs'
    ];
    
    return plantCategories.includes(this.category) || this.plantSpecies !== null;
  }

  // Check Nico safety
  checkNicoSafety() {
    const unsafe = [
      'mushroom', 'ciuperci', 'fungi',
      'hard_nuts', 'tough_meat', 'raw_carrot'
    ];
    
    const isSafe = !unsafe.some(item => 
      this.name.toLowerCase().includes(item.replace('_', ' '))
    );
    
    return {
      safe: isSafe && this.nicoSafe,
      reasons: isSafe ? [] : ['Contains restricted ingredients for Nico'],
      alternatives: this.getSafeAlternatives()
    };
  }

  getSafeAlternatives() {
    const alternatives = {
      'mushroom': ['zucchini', 'eggplant', 'cauliflower'],
      'hard_nuts': ['nut_butter', 'ground_nuts', 'soft_seeds'],
      'raw_carrot': ['cooked_carrot', 'sweet_potato', 'butternut_squash']
    };

    for (const [unsafe, alts] of Object.entries(alternatives)) {
      if (this.name.toLowerCase().includes(unsafe)) {
        return alts;
      }
    }
    
    return [];
  }

  // Get anti-inflammatory properties
  getAntiInflammatoryInfo() {
    const properties = {
      score: this.antiInflammatoryScore,
      level: this.getInflammatoryLevel(),
      compounds: this.getActiveCompounds(),
      benefits: this.getHealthBenefits()
    };

    return properties;
  }

  getInflammatoryLevel() {
    if (this.antiInflammatoryScore >= 8) return 'very_high';
    if (this.antiInflammatoryScore >= 6) return 'high';
    if (this.antiInflammatoryScore >= 4) return 'moderate';
    if (this.antiInflammatoryScore >= 2) return 'low';
    return 'minimal';
  }

  getActiveCompounds() {
    const compounds = {
      'turmeric': ['curcumin', 'curcuminoids'],
      'ginger': ['gingerol', 'shogaol'],
      'berries': ['anthocyanins', 'polyphenols'],
      'leafy_greens': ['chlorophyll', 'carotenoids'],
      'fatty_fish': ['omega-3', 'EPA', 'DHA'],
      'olive_oil': ['oleocanthal', 'polyphenols'],
      'green_tea': ['EGCG', 'catechins'],
      'garlic': ['allicin', 'sulfur_compounds']
    };

    for (const [ingredient, compoundList] of Object.entries(compounds)) {
      if (this.name.toLowerCase().includes(ingredient.replace('_', ' '))) {
        return compoundList;
      }
    }

    return [];
  }

  getHealthBenefits() {
    const benefits = [];
    
    if (this.antiInflammatoryScore >= 7) {
      benefits.push('Powerful anti-inflammatory effects');
    }
    
    if (this.isPlant()) {
      benefits.push('Contributes to plant diversity goal');
    }
    
    if (this.category === 'spices' || this.category === 'herbs') {
      benefits.push('Enhances nutrient absorption');
    }
    
    return benefits;
  }

  // Instant Pot compatibility
  getInstantPotSettings() {
    const cookingTimes = {
      // Proteins
      'chicken_breast': { time: 8, pressure: 'high', natural_release: 5 },
      'chicken_thigh': { time: 12, pressure: 'high', natural_release: 10 },
      'beef_stew': { time: 35, pressure: 'high', natural_release: 15 },
      
      // Vegetables
      'broccoli': { time: 1, pressure: 'high', natural_release: 5 },
      'cauliflower': { time: 2, pressure: 'high', natural_release: 5 },
      'carrots': { time: 3, pressure: 'high', natural_release: 5 },
      'sweet_potato': { time: 8, pressure: 'high', natural_release: 5 },
      
      // Grains
      'rice': { time: 3, pressure: 'high', natural_release: 10 },
      'quinoa': { time: 1, pressure: 'high', natural_release: 10 },
      
      // Legumes
      'lentils': { time: 12, pressure: 'high', natural_release: 10 },
      'chickpeas': { time: 35, pressure: 'high', natural_release: 15 }
    };

    const name = this.name.toLowerCase().replace(' ', '_');
    return cookingTimes[name] || { 
      time: 5, 
      pressure: 'high', 
      natural_release: 5 
    };
  }

  // Determine cooking layer for Instant Pot
  getInstantPotLayer() {
    const layers = {
      bottom: ['onion', 'garlic', 'ginger', 'broth'],
      middle: ['chicken', 'beef', 'potato', 'carrot', 'sweet_potato'],
      top: ['spinach', 'kale', 'zucchini', 'bell_pepper'],
      steam_basket: ['broccoli', 'cauliflower', 'green_beans']
    };

    for (const [layer, ingredients] of Object.entries(layers)) {
      if (ingredients.some(ing => this.name.toLowerCase().includes(ing))) {
        return layer;
      }
    }

    return 'middle'; // default
  }

  // Seasonality information
  isInSeason(month = new Date().getMonth() + 1) {
    if (this.seasonality.length === 0) return true; // Available year-round
    
    return this.seasonality.includes(month);
  }

  getSeasonalInfo() {
    const monthNames = [
      'Ian', 'Feb', 'Mar', 'Apr', 'Mai', 'Iun',
      'Iul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];

    return {
      peak_season: this.seasonality.map(m => monthNames[m - 1]),
      currently_in_season: this.isInSeason(),
      year_round: this.seasonality.length === 0
    };
  }

  // Preparation methods for Nico
  getNicoPreparation() {
    const preparations = {
      'carrots': 'Steam until very soft, cut into small pieces',
      'broccoli': 'Cook until tender, chop florets finely',
      'chicken': 'Use tender cuts, cook until falling apart',
      'sweet_potato': 'Mash or cut into soft cubes',
      'cauliflower': 'Steam until very tender, can be mashed'
    };

    for (const [ingredient, method] of Object.entries(preparations)) {
      if (this.name.toLowerCase().includes(ingredient)) {
        return method;
      }
    }

    return 'Standard preparation suitable';
  }

  // Calculate nutritional contribution per serving
  getNutritionPerServing(servingSize = 100) {
    const multiplier = servingSize / 100;
    
    return {
      calories: (this.nutritionPer100g.calories || 0) * multiplier,
      protein: (this.nutritionPer100g.protein || 0) * multiplier,
      carbs: (this.nutritionPer100g.carbs || 0) * multiplier,
      fat: (this.nutritionPer100g.fat || 0) * multiplier,
      fiber: (this.nutritionPer100g.fiber || 0) * multiplier,
      omega3: (this.nutritionPer100g.omega3 || 0) * multiplier
    };
  }

  // Convert to database format
  toDatabase() {
    return {
      name: this.name,
      category: this.category,
      plant_species: this.plantSpecies,
      anti_inflammatory_score: this.antiInflammatoryScore,
      allergen: this.allergen ? 1 : 0,
      unit: this.unit,
      nico_safe: this.nicoSafe ? 1 : 0
    };
  }

  // Create from database record
  static fromDatabase(record) {
    return new Ingredient({
      id: record.id,
      name: record.name,
      category: record.category,
      plant_species: record.plant_species,
      anti_inflammatory_score: record.anti_inflammatory_score,
      allergen: record.allergen === 1,
      unit: record.unit,
      nico_safe: record.nico_safe === 1
    });
  }

  // Generate shopping list format
  toShoppingFormat(quantity = 1) {
    return {
      name: this.name,
      quantity: quantity,
      unit: this.unit,
      category: this.category,
      estimated_price: this.estimatePrice(quantity),
      nico_safe: this.nicoSafe,
      priority: this.antiInflammatoryScore >= 6 ? 'high' : 'normal'
    };
  }

  estimatePrice(quantity = 1) {
    const basePrices = { // RON per unit
      proteins: 20,
      vegetables: 3,
      fruits: 5,
      grains: 2,
      legumes: 4,
      nuts: 15,
      seeds: 8,
      spices: 10,
      herbs: 5,
      fats: 12
    };

    const unitPrice = basePrices[this.category] || 5;
    return Math.round(unitPrice * quantity * 100) / 100; // Round to 2 decimals
  }
}

export default Ingredient;