import { mtorTracker } from '../mtor/mtorTracker.js';
import { plantDiversityTracker } from '../plants/plantDiversityTracker.js';

class CodexEngine {
  constructor() {
    this.rules = this.initializeCodexRules();
    this.instantPotRules = this.initializeInstantPotRules();
    
    // Performance caching
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  initializeCodexRules() {
    return {
      // Core CODEX N-OMAD principles
      nutrition: {
        // Prioritize anti-inflammatory foods
        antiInflammatory: {
          highScore: ['turmeric', 'ginger', 'leafy_greens', 'berries', 'fatty_fish', 'nuts', 'olive_oil'],
          mediumScore: ['tomatoes', 'bell_peppers', 'broccoli', 'sweet_potatoes', 'avocados'],
          lowScore: ['whole_grains', 'legumes', 'lean_proteins']
        },
        
        // Plant diversity goals
        plantDiversity: {
          weeklyGoal: 30,
          dailyMinimum: 10,
          categories: {
            leafyGreens: ['spinach', 'kale', 'arugula', 'lettuce', 'chard'],
            cruciferous: ['broccoli', 'cauliflower', 'brussels_sprouts', 'cabbage'],
            berries: ['blueberries', 'strawberries', 'raspberries', 'blackberries'],
            nuts: ['almonds', 'walnuts', 'pistachios', 'brazil_nuts'],
            seeds: ['chia', 'flax', 'pumpkin', 'sunflower'],
            herbs: ['basil', 'oregano', 'thyme', 'rosemary', 'cilantro'],
            spices: ['turmeric', 'ginger', 'cinnamon', 'black_pepper']
          }
        },

        // Macronutrient cycling based on mTOR phases
        macronutrients: {
          highProteinDays: {
            protein: { min: 1.2, max: 1.8, unit: 'g/kg_bodyweight' },
            carbs: { min: 2, max: 4, unit: 'g/kg_bodyweight' },
            fat: { min: 0.8, max: 1.2, unit: 'g/kg_bodyweight' }
          },
          lowProteinDays: {
            protein: { min: 0.6, max: 1.0, unit: 'g/kg_bodyweight' },
            carbs: { min: 4, max: 6, unit: 'g/kg_bodyweight' },
            fat: { min: 1.2, max: 1.8, unit: 'g/kg_bodyweight' }
          }
        }
      },

      // Timing and meal structure
      timing: {
        omadWindow: { start: 16, end: 20 }, // 4-8 PM
        fastingHours: 23,
        mealDuration: { min: 30, max: 60, unit: 'minutes' }
      },

      // Sleep and recovery
      recovery: {
        sleepHours: { min: 7, max: 9 },
        bedtime: { latest: 22 }, // 10 PM
        wakeTime: { earliest: 6, latest: 8 }
      }
    };
  }

  initializeInstantPotRules() {
    return {
      // Stratification rules for Instant Pot cooking
      layering: {
        bottom: ['aromatics', 'liquid', 'spices'],
        middle: ['proteins', 'root_vegetables'],
        top: ['leafy_greens', 'delicate_vegetables'],
        steam_basket: ['quick_cooking_vegetables']
      },

      cookingTimes: {
        proteins: {
          chicken_breast: 8,
          chicken_thigh: 12,
          beef_stew: 35,
          pork_shoulder: 90,
          fish: 3,
          eggs: 5
        },
        vegetables: {
          root_vegetables: 4,
          broccoli: 1,
          leafy_greens: 0, // steam only
          bell_peppers: 2,
          mushrooms: 3
        },
        grains: {
          rice: 3,
          quinoa: 1,
          lentils: 12,
          beans: 30
        }
      },

      pressureSettings: {
        high: ['tough_proteins', 'beans', 'grains'],
        low: ['delicate_fish', 'vegetables', 'eggs']
      }
    };
  }

  // Cache helper methods
  getCacheKey(type, data) {
    return `${type}_${JSON.stringify(data)}`;
  }

  getFromCache(key) {
    const cached = this.cache.get(key);
    if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  setCache(key, data) {
    // Limit cache size to prevent memory issues
    if (this.cache.size > 100) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(key, {
      data: data,
      timestamp: Date.now()
    });
  }

  evaluateMeal(meal) {
    const cacheKey = this.getCacheKey('meal', meal);
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return cached;
    }

    const evaluation = {
      antiInflammatoryScore: this.calculateAntiInflammatoryScore(meal),
      plantDiversityScore: this.calculatePlantDiversityScore(meal),
      macronutrientBalance: this.evaluateMacronutrients(meal),
      timing: this.evaluateTiming(meal),
      overallScore: 0
    };

    evaluation.overallScore = this.calculateOverallScore(evaluation);
    
    this.setCache(cacheKey, evaluation);
    return evaluation;
  }

  calculateAntiInflammatoryScore(meal) {
    let score = 0;
    const ingredients = meal.ingredients || [];

    ingredients.forEach(ingredient => {
      const name = ingredient.name.toLowerCase();
      if (this.rules.nutrition.antiInflammatory.highScore.some(item => name.includes(item))) {
        score += 3;
      } else if (this.rules.nutrition.antiInflammatory.mediumScore.some(item => name.includes(item))) {
        score += 2;
      } else if (this.rules.nutrition.antiInflammatory.lowScore.some(item => name.includes(item))) {
        score += 1;
      }
    });

    return Math.min(score, 100);
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
    const currentPhase = mtorTracker.getCurrentPhase();
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
    const cacheKey = this.getCacheKey('recommendations', {
      date: new Date().toDateString(),
      phase: mtorTracker.getCurrentPhase()
    });
    
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return cached;
    }

    const currentPhase = mtorTracker.getCurrentPhase();
    const dayInCycle = mtorTracker.getDayInCycle();
    const plantProgress = plantDiversityTracker.currentWeekProgress;

    const recommendations = {
      phase: currentPhase,
      dayInCycle: dayInCycle,
      macroTargets: this.rules.nutrition.macronutrients[currentPhase],
      priorityPlants: this.getNeededPlants(plantProgress),
      mealTiming: this.rules.timing.omadWindow,
      antiInflammatoryFocus: this.getAntiInflammatoryFocus(),
      instantPotSuggestion: this.generateInstantPotSuggestion(currentPhase)
    };

    this.setCache(cacheKey, recommendations);
    return recommendations;
  }

  getNeededPlants(currentProgress) {
    const needed = [];
    const categories = this.rules.nutrition.plantDiversity.categories;
    
    Object.entries(categories).forEach(([category, plants]) => {
      const consumedInCategory = currentProgress.categories[category] || 0;
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