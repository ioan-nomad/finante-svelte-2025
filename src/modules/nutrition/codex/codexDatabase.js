// CODEX Database - Baza de date locală pentru ingrediente și rețete
export class CodexDatabase {
  constructor() {
    this.data = this.initializeData();
    this.indexes = this.createIndexes();
  }

  initializeData() {
    return {
      ingredients: new Map(),
      recipes: new Map(),
      nutritional_profiles: new Map(),
      plant_species: new Map(),
      cooking_methods: new Map(),
      last_updated: new Date().toISOString()
    };
  }

  // Inițializare cu date de bază
  async initialize() {
    // Load basic ingredients
    await this.loadBasicIngredients();
    await this.loadPlantSpecies();
    await this.loadCookingMethods();
    await this.loadNutritionalProfiles();
    
    console.log('✅ CODEX Database initialized');
  }

  async loadBasicIngredients() {
    const basicIngredients = [
      // Proteins - High mTOR days
      {
        id: 'chicken_thigh',
        name: 'Chicken Thigh',
        name_ro: 'Pulpă de pui',
        category: 'protein',
        plant_species: null,
        anti_inflammatory_score: 3,
        nico_safe: true,
        texture: 'tender_when_cooked',
        instant_pot_settings: {
          layer: 'middle',
          cook_time: 12,
          pressure: 'high',
          natural_release: 10
        },
        nutrition_per_100g: {
          calories: 209,
          protein: 26,
          carbs: 0,
          fat: 11,
          fiber: 0
        },
        common_names: ['pulpe pui', 'coapse pui']
      },

      {
        id: 'salmon',
        name: 'Salmon',
        name_ro: 'Somon',
        category: 'protein',
        plant_species: null,
        anti_inflammatory_score: 9,
        nico_safe: true,
        texture: 'soft_when_cooked',
        instant_pot_settings: {
          layer: 'middle',
          cook_time: 3,
          pressure: 'low',
          natural_release: 5
        },
        nutrition_per_100g: {
          calories: 208,
          protein: 25,
          carbs: 0,
          fat: 12,
          fiber: 0,
          omega3: 2.3
        }
      },

      // Vegetables - High anti-inflammatory
      {
        id: 'turmeric',
        name: 'Turmeric',
        name_ro: 'Curcuma',
        category: 'spice',
        plant_species: 'Curcuma longa',
        anti_inflammatory_score: 10,
        nico_safe: true,
        texture: 'powder',
        instant_pot_settings: {
          layer: 'bottom',
          cook_time: 0,
          add_timing: 'with_aromatics'
        },
        nutrition_per_100g: {
          calories: 312,
          protein: 10,
          carbs: 45,
          fat: 10,
          fiber: 22
        },
        bioactive_compounds: ['curcumin'],
        synergies: ['black_pepper'],
        common_names: ['turmeric', 'curcuma', 'galben de india']
      },

      {
        id: 'ginger',
        name: 'Ginger',
        name_ro: 'Ghimbir',
        category: 'spice',
        plant_species: 'Zingiber officinale',
        anti_inflammatory_score: 9,
        nico_safe: true,
        texture: 'soft_when_cooked',
        instant_pot_settings: {
          layer: 'bottom',
          cook_time: 0,
          add_timing: 'with_aromatics'
        },
        nutrition_per_100g: {
          calories: 80,
          protein: 2,
          carbs: 18,
          fat: 1,
          fiber: 2
        },
        bioactive_compounds: ['gingerol'],
        common_names: ['ginger', 'ghimbir']
      },

      {
        id: 'broccoli',
        name: 'Broccoli',
        name_ro: 'Broccoli',
        category: 'vegetable',
        plant_species: 'Brassica oleracea',
        anti_inflammatory_score: 8,
        nico_safe: true,
        texture: 'soft_when_steamed',
        instant_pot_settings: {
          layer: 'steam_basket',
          cook_time: 1,
          pressure: 'high',
          natural_release: 5
        },
        nutrition_per_100g: {
          calories: 34,
          protein: 3,
          carbs: 7,
          fat: 0,
          fiber: 3
        },
        bioactive_compounds: ['sulforaphane'],
        nico_prep: 'Cut into small florets, cook until very tender'
      },

      {
        id: 'spinach',
        name: 'Spinach',
        name_ro: 'Spanac',
        category: 'leafy_green',
        plant_species: 'Spinacia oleracea',
        anti_inflammatory_score: 7,
        nico_safe: true,
        texture: 'very_soft_cooked',
        instant_pot_settings: {
          layer: 'top',
          cook_time: 0,
          add_timing: 'last_5_minutes'
        },
        nutrition_per_100g: {
          calories: 23,
          protein: 3,
          carbs: 4,
          fat: 0,
          fiber: 2
        },
        common_names: ['spanac', 'spinach']
      },

      {
        id: 'sweet_potato',
        name: 'Sweet Potato',
        name_ro: 'Cartof dulce',
        category: 'root_vegetable',
        plant_species: 'Ipomoea batatas',
        anti_inflammatory_score: 6,
        nico_safe: true,
        texture: 'soft_when_cooked',
        instant_pot_settings: {
          layer: 'middle',
          cook_time: 8,
          pressure: 'high',
          natural_release: 5
        },
        nutrition_per_100g: {
          calories: 86,
          protein: 2,
          carbs: 20,
          fat: 0,
          fiber: 3
        },
        nico_prep: 'Cook until mashable consistency'
      },

      // DANGEROUS for Nico - Mushrooms
      {
        id: 'mushrooms',
        name: 'Mushrooms',
        name_ro: 'Ciuperci',
        category: 'fungus',
        plant_species: null,
        anti_inflammatory_score: 0,
        nico_safe: false,
        allergy_risk: 'HIGH',
        instant_pot_settings: null,
        warning: 'ABSOLUTELY FORBIDDEN for Nico - severe allergy risk',
        alternatives: ['zucchini', 'eggplant', 'cauliflower'],
        common_names: ['ciuperci', 'mushroom', 'champignon', 'fungi']
      },

      // Aromatics
      {
        id: 'onion',
        name: 'Onion',
        name_ro: 'Ceapă',
        category: 'aromatic',
        plant_species: 'Allium cepa',
        anti_inflammatory_score: 5,
        nico_safe: true,
        texture: 'soft_when_cooked',
        instant_pot_settings: {
          layer: 'bottom',
          cook_time: 0,
          add_timing: 'saute_first'
        },
        nutrition_per_100g: {
          calories: 40,
          protein: 1,
          carbs: 9,
          fat: 0,
          fiber: 2
        }
      },

      {
        id: 'garlic',
        name: 'Garlic',
        name_ro: 'Usturoi',
        category: 'aromatic',
        plant_species: 'Allium sativum',
        anti_inflammatory_score: 7,
        nico_safe: true,
        texture: 'soft_when_cooked',
        instant_pot_settings: {
          layer: 'bottom',
          cook_time: 0,
          add_timing: 'with_onions'
        },
        nutrition_per_100g: {
          calories: 149,
          protein: 6,
          carbs: 33,
          fat: 0,
          fiber: 2
        },
        bioactive_compounds: ['allicin']
      }
    ];

    basicIngredients.forEach(ingredient => {
      this.data.ingredients.set(ingredient.id, ingredient);
    });
  }

  async loadPlantSpecies() {
    const plantSpecies = [
      {
        id: 'curcuma_longa',
        scientific_name: 'Curcuma longa',
        common_names: ['Turmeric', 'Curcuma', 'Galben de India'],
        family: 'Zingiberaceae',
        anti_inflammatory_compounds: ['curcumin', 'demethoxycurcumin'],
        optimal_preparation: 'Heat activated with black pepper',
        plant_category: 'spice'
      },
      {
        id: 'spinacia_oleracea',
        scientific_name: 'Spinacia oleracea',
        common_names: ['Spinach', 'Spanac'],
        family: 'Amaranthaceae',
        anti_inflammatory_compounds: ['lutein', 'zeaxanthin', 'nitrates'],
        optimal_preparation: 'Light steaming to preserve nutrients',
        plant_category: 'leafy_green'
      },
      {
        id: 'brassica_oleracea',
        scientific_name: 'Brassica oleracea',
        common_names: ['Broccoli', 'Cauliflower', 'Cabbage'],
        family: 'Brassicaceae',
        anti_inflammatory_compounds: ['sulforaphane', 'indole-3-carbinol'],
        optimal_preparation: 'Steam cooking to activate sulforaphane',
        plant_category: 'cruciferous'
      }
    ];

    plantSpecies.forEach(species => {
      this.data.plant_species.set(species.id, species);
    });
  }

  async loadCookingMethods() {
    const methods = [
      {
        id: 'instant_pot_layered',
        name: 'Instant Pot Layered Cooking',
        description: 'Stratified cooking method for optimal nutrition and texture',
        layers: {
          bottom: 'Aromatics (onion, garlic, ginger) + cooking liquid',
          middle: 'Proteins and root vegetables',
          top: 'Delicate vegetables and leafy greens',
          steam_basket: 'Quick-cooking vegetables'
        },
        benefits: [
          'Preserves nutrients through minimal water use',
          'Creates variety of textures in single pot',
          'Optimal for OMAD - complete meal preparation'
        ],
        nico_adaptations: [
          'Extended cooking time for softer textures',
          'Extra liquid for steam softening',
          'Smaller cuts for easier chewing'
        ]
      },
      {
        id: 'steam_gentle',
        name: 'Gentle Steam Cooking',
        description: 'Low pressure steam for delicate ingredients',
        best_for: ['Leafy greens', 'Delicate vegetables', 'Fish'],
        temperature: 'Low pressure or steam function',
        timing: '1-3 minutes maximum'
      }
    ];

    methods.forEach(method => {
      this.data.cooking_methods.set(method.id, method);
    });
  }

  async loadNutritionalProfiles() {
    const profiles = [
      {
        id: 'ioan_profile',
        name: 'Ioan',
        age: 46,
        weight: 76,
        height: 171,
        bmr: 1645,
        target_calories: 1400,
        macro_targets: {
          high_mtor: { protein: 0.30, carbs: 0.35, fat: 0.35 },
          low_mtor: { protein: 0.18, carbs: 0.47, fat: 0.35 }
        },
        special_requirements: []
      },
      {
        id: 'nico_profile', 
        name: 'Nico',
        age: 44,
        weight: 54,
        height: 141,
        bmr: 1195,
        target_calories: 1100,
        macro_targets: {
          high_mtor: { protein: 0.28, carbs: 0.37, fat: 0.35 },
          low_mtor: { protein: 0.16, carbs: 0.49, fat: 0.35 }
        },
        special_requirements: [
          'NO_MUSHROOMS',
          'SOFT_TEXTURES',
          'ANTI_INFLAMMATORY_FOCUS',
          'MOBILITY_CONSIDERATIONS'
        ],
        allergies: ['mushrooms', 'ciuperci'],
        texture_needs: 'soft_cooked'
      }
    ];

    profiles.forEach(profile => {
      this.data.nutritional_profiles.set(profile.id, profile);
    });
  }

  // Search și query methods
  searchIngredients(query) {
    const results = [];
    const searchTerm = query.toLowerCase();

    this.data.ingredients.forEach((ingredient, id) => {
      let relevanceScore = 0;

      // Check name matches
      if (ingredient.name.toLowerCase().includes(searchTerm)) relevanceScore += 10;
      if (ingredient.name_ro?.toLowerCase().includes(searchTerm)) relevanceScore += 10;
      
      // Check common names
      if (ingredient.common_names?.some(name => 
          name.toLowerCase().includes(searchTerm))) {
        relevanceScore += 8;
      }

      // Check category
      if (ingredient.category.toLowerCase().includes(searchTerm)) relevanceScore += 5;

      if (relevanceScore > 0) {
        results.push({
          ...ingredient,
          relevance_score: relevanceScore
        });
      }
    });

    return results.sort((a, b) => b.relevance_score - a.relevance_score);
  }

  getIngredientById(id) {
    return this.data.ingredients.get(id);
  }

  getIngredientsByCategory(category) {
    const results = [];
    this.data.ingredients.forEach(ingredient => {
      if (ingredient.category === category) {
        results.push(ingredient);
      }
    });
    return results;
  }

  getAntiInflammatoryIngredients(minScore = 7) {
    const results = [];
    this.data.ingredients.forEach(ingredient => {
      if (ingredient.anti_inflammatory_score >= minScore) {
        results.push(ingredient);
      }
    });
    return results.sort((a, b) => b.anti_inflammatory_score - a.anti_inflammatory_score);
  }

  getNicoSafeIngredients() {
    const results = [];
    this.data.ingredients.forEach(ingredient => {
      if (ingredient.nico_safe === true) {
        results.push(ingredient);
      }
    });
    return results;
  }

  getDangerousIngredientsForNico() {
    const results = [];
    this.data.ingredients.forEach(ingredient => {
      if (ingredient.nico_safe === false) {
        results.push({
          ...ingredient,
          alternatives: ingredient.alternatives || []
        });
      }
    });
    return results;
  }

  // Plant diversity tracking
  getPlantSpeciesCount(ingredients) {
    const species = new Set();
    
    ingredients.forEach(ingredientId => {
      const ingredient = this.getIngredientById(ingredientId);
      if (ingredient?.plant_species) {
        species.add(ingredient.plant_species);
      }
    });

    return {
      count: species.size,
      species: Array.from(species),
      goal: 30,
      daily_minimum: 10,
      progress: (species.size / 30) * 100
    };
  }

  // Instant Pot optimization
  getInstantPotLayers(ingredients) {
    const layers = {
      bottom: [],
      middle: [],
      top: [],
      steam_basket: []
    };

    ingredients.forEach(ingredientId => {
      const ingredient = this.getIngredientById(ingredientId);
      if (ingredient?.instant_pot_settings) {
        const layer = ingredient.instant_pot_settings.layer;
        if (layers[layer]) {
          layers[layer].push({
            id: ingredientId,
            name: ingredient.name,
            cook_time: ingredient.instant_pot_settings.cook_time,
            prep_notes: ingredient.nico_prep
          });
        }
      }
    });

    return layers;
  }

  // Validation methods
  validateMealForNico(ingredients) {
    const validation = {
      safe: true,
      warnings: [],
      dangerous_items: [],
      texture_concerns: [],
      alternatives: []
    };

    ingredients.forEach(ingredientId => {
      const ingredient = this.getIngredientById(ingredientId);
      
      if (!ingredient) {
        validation.warnings.push(`Unknown ingredient: ${ingredientId}`);
        return;
      }

      // Check for dangerous ingredients
      if (ingredient.nico_safe === false) {
        validation.safe = false;
        validation.dangerous_items.push({
          name: ingredient.name,
          reason: ingredient.warning || 'Not safe for Nico',
          alternatives: ingredient.alternatives || []
        });
      }

      // Check texture concerns
      if (ingredient.texture && !ingredient.texture.includes('soft')) {
        validation.texture_concerns.push({
          name: ingredient.name,
          concern: `Texture: ${ingredient.texture}`,
          preparation: ingredient.nico_prep || 'Cook until very soft'
        });
      }
    });

    return validation;
  }

  // Export/Import methods
  exportDatabase() {
    return {
      version: '1.0',
      exported_at: new Date().toISOString(),
      data: {
        ingredients: Object.fromEntries(this.data.ingredients),
        plant_species: Object.fromEntries(this.data.plant_species),
        nutritional_profiles: Object.fromEntries(this.data.nutritional_profiles),
        cooking_methods: Object.fromEntries(this.data.cooking_methods)
      }
    };
  }

  importDatabase(importData) {
    try {
      if (importData.data) {
        // Import ingredients
        if (importData.data.ingredients) {
          Object.entries(importData.data.ingredients).forEach(([id, ingredient]) => {
            this.data.ingredients.set(id, ingredient);
          });
        }

        // Import other data similarly
        console.log('✅ Database import successful');
        return true;
      }
    } catch (error) {
      console.error('❌ Database import failed:', error);
      return false;
    }
  }

  createIndexes() {
    // Create indexes for faster searching
    return {
      by_category: new Map(),
      by_anti_inflammatory: new Map(),
      by_plant_species: new Map(),
      nico_safe: new Set(),
      nico_unsafe: new Set()
    };
  }

  rebuildIndexes() {
    // Rebuild search indexes
    this.indexes.by_category.clear();
    this.indexes.by_anti_inflammatory.clear();
    this.indexes.nico_safe.clear();
    this.indexes.nico_unsafe.clear();

    this.data.ingredients.forEach((ingredient, id) => {
      // Category index
      if (!this.indexes.by_category.has(ingredient.category)) {
        this.indexes.by_category.set(ingredient.category, new Set());
      }
      this.indexes.by_category.get(ingredient.category).add(id);

      // Anti-inflammatory index
      const score = ingredient.anti_inflammatory_score || 0;
      if (!this.indexes.by_anti_inflammatory.has(score)) {
        this.indexes.by_anti_inflammatory.set(score, new Set());
      }
      this.indexes.by_anti_inflammatory.get(score).add(id);

      // Nico safety index
      if (ingredient.nico_safe) {
        this.indexes.nico_safe.add(id);
      } else {
        this.indexes.nico_unsafe.add(id);
      }
    });
  }
}

export const codexDatabase = new CodexDatabase();