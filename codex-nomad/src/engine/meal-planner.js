import RecipeGenerator from './recipe-generator.js';
import NutritionAnalyzer from './nutrition-analyzer.js';
import InstantPotEngine from './instant-pot.js';
import principles from '../config/principles.json' assert { type: 'json' };
import mtorRules from '../config/mtor-rules.json' assert { type: 'json' };

class MealPlanner {
  constructor(dbPath = './codex.db') {
    this.recipeGenerator = new RecipeGenerator(dbPath);
    this.nutritionAnalyzer = new NutritionAnalyzer(dbPath);
    this.instantPot = new InstantPotEngine();
    this.principles = principles;
    this.mtorRules = mtorRules;
  }

  generateWeeklyPlan(startDate = new Date()) {
    const weeklyPlan = {
      start_date: startDate.toISOString().split('T')[0],
      total_days: 7,
      mtor_cycle_position: this.getCurrentCyclePosition(startDate),
      daily_meals: [],
      weekly_summary: {
        plant_species_goal: this.principles.core_principles.weekly_plant_goal,
        unique_plants: new Set(),
        total_anti_inflammatory_score: 0,
        phase_distribution: { high: 0, low: 0 }
      }
    };

    // Generate daily meals
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      
      const dailyMeal = this.planDailyMeal(currentDate);
      weeklyPlan.daily_meals.push(dailyMeal);
      
      // Update weekly summary
      this.updateWeeklySummary(weeklyPlan.weekly_summary, dailyMeal);
    }

    // Generate shopping list
    weeklyPlan.shopping_list = this.generateShoppingList(weeklyPlan.daily_meals);
    
    // Calculate compliance scores
    weeklyPlan.compliance = this.calculateWeeklyCompliance(weeklyPlan);
    
    return weeklyPlan;
  }

  planDailyMeal(date) {
    const dayInCycle = this.recipeGenerator.getDayInCycle(date);
    const phase = this.recipeGenerator.getMTORPhase(dayInCycle);
    
    const dailyMeal = {
      date: date.toISOString().split('T')[0],
      day_in_cycle: dayInCycle,
      mtor_phase: phase,
      meal_window: this.principles.meal_timing,
      recipe: null,
      nutrition_targets: this.getDailyNutritionTargets(phase),
      instant_pot_instructions: null,
      compliance_score: 0
    };

    // Generate recipe for the day
    const recipe = this.recipeGenerator.generateDailyRecipe(date);
    if (recipe) {
      dailyMeal.recipe = recipe;
      
      // Generate Instant Pot instructions
      if (recipe.ingredients) {
        const ingredients = this.parseRecipeIngredients(recipe);
        dailyMeal.instant_pot_instructions = this.instantPot.generateInstantPotRecipe(
          ingredients, 
          phase
        );
      }
      
      // Calculate compliance
      dailyMeal.compliance_score = this.calculateDailyCompliance(dailyMeal, phase);
    }

    return dailyMeal;
  }

  getDailyNutritionTargets(phase) {
    const phaseRules = this.mtorRules.mtor_phases[phase === 'high' ? 'high_protein' : 'low_protein'];
    const totalCalories = this.principles.ioan_profile.target_calories + 
                         this.principles.nico_profile.target_calories;

    return {
      total_calories: totalCalories,
      protein: {
        grams: totalCalories * phaseRules.protein_ratio / 4,
        ratio: phaseRules.protein_ratio,
        per_kg: phaseRules.protein_per_kg
      },
      carbs: {
        grams: totalCalories * phaseRules.carb_ratio / 4,
        ratio: phaseRules.carb_ratio
      },
      fat: {
        grams: totalCalories * phaseRules.fat_ratio / 9,
        ratio: phaseRules.fat_ratio
      },
      plant_minimum: this.principles.core_principles.daily_plant_minimum,
      anti_inflammatory_priority: this.principles.core_principles.anti_inflammatory_priority
    };
  }

  parseRecipeIngredients(recipe) {
    // Mock ingredient parsing - în realitate ar veni din DB
    const mockIngredients = [
      { name: 'Chicken Thigh', quantity: 200, unit: 'g' },
      { name: 'Broccoli', quantity: 150, unit: 'g' },
      { name: 'Sweet Potato', quantity: 100, unit: 'g' },
      { name: 'Onion', quantity: 50, unit: 'g' },
      { name: 'Garlic', quantity: 10, unit: 'g' },
      { name: 'Turmeric', quantity: 5, unit: 'g' },
      { name: 'Coconut Oil', quantity: 15, unit: 'ml' }
    ];
    
    return mockIngredients;
  }

  calculateDailyCompliance(dailyMeal, phase) {
    let score = 0;
    const maxScore = 100;
    
    // Phase compliance (40 points)
    if (dailyMeal.recipe && dailyMeal.recipe.mtor_phase === phase) {
      score += 40;
    }
    
    // Plant diversity (30 points)
    if (dailyMeal.recipe && dailyMeal.recipe.plant_count >= 
        this.principles.core_principles.daily_plant_minimum) {
      score += 30;
    }
    
    // Anti-inflammatory (20 points)
    if (dailyMeal.recipe && dailyMeal.recipe.anti_inflammatory) {
      score += 20;
    }
    
    // Instant Pot cooking (10 points)
    if (dailyMeal.instant_pot_instructions) {
      score += 10;
    }
    
    return Math.min(score, maxScore);
  }

  updateWeeklySummary(summary, dailyMeal) {
    // Track phase distribution
    if (dailyMeal.mtor_phase === 'high') {
      summary.phase_distribution.high++;
    } else {
      summary.phase_distribution.low++;
    }
    
    // Mock plant tracking - în realitate din DB
    if (dailyMeal.recipe) {
      const mockPlants = ['broccoli', 'sweet_potato', 'onion', 'garlic', 'turmeric'];
      mockPlants.forEach(plant => summary.unique_plants.add(plant));
      summary.total_anti_inflammatory_score += dailyMeal.recipe.anti_inflammatory ? 10 : 0;
    }
  }

  generateShoppingList(dailyMeals) {
    const ingredients = new Map();
    
    dailyMeals.forEach(meal => {
      if (meal.instant_pot_instructions && meal.instant_pot_instructions.ingredients) {
        Object.values(meal.instant_pot_instructions.ingredients).flat().forEach(ingredient => {
          const name = ingredient.name;
          if (ingredients.has(name)) {
            ingredients.get(name).total_quantity += ingredient.quantity || 0;
            ingredients.get(name).days.push(meal.date);
          } else {
            ingredients.set(name, {
              name: name,
              total_quantity: ingredient.quantity || 0,
              unit: ingredient.unit || 'g',
              days: [meal.date],
              category: this.categorizeIngredient(name),
              nico_safe: !name.toLowerCase().includes('mushroom')
            });
          }
        });
      }
    });
    
    // Convert to array and sort by category
    return Array.from(ingredients.values()).sort((a, b) => 
      a.category.localeCompare(b.category)
    );
  }

  categorizeIngredient(ingredientName) {
    const name = ingredientName.toLowerCase();
    
    if (['chicken', 'beef', 'fish', 'tofu', 'eggs'].some(protein => name.includes(protein))) {
      return 'proteins';
    }
    if (['broccoli', 'spinach', 'kale', 'lettuce'].some(veg => name.includes(veg))) {
      return 'leafy_greens';
    }
    if (['potato', 'carrot', 'onion', 'garlic'].some(veg => name.includes(veg))) {
      return 'vegetables';
    }
    if (['turmeric', 'ginger', 'pepper', 'salt'].some(spice => name.includes(spice))) {
      return 'spices';
    }
    if (['oil', 'butter', 'nuts', 'seeds'].some(fat => name.includes(fat))) {
      return 'fats';
    }
    
    return 'other';
  }

  calculateWeeklyCompliance(weeklyPlan) {
    const compliance = {
      overall_score: 0,
      plant_diversity: {
        achieved: weeklyPlan.weekly_summary.unique_plants.size,
        target: weeklyPlan.weekly_summary.plant_species_goal,
        score: 0
      },
      mtor_balance: {
        high_days: weeklyPlan.weekly_summary.phase_distribution.high,
        low_days: weeklyPlan.weekly_summary.phase_distribution.low,
        score: 0
      },
      anti_inflammatory: {
        total_score: weeklyPlan.weekly_summary.total_anti_inflammatory_score,
        daily_average: weeklyPlan.weekly_summary.total_anti_inflammatory_score / 7,
        score: 0
      }
    };
    
    // Calculate individual scores
    compliance.plant_diversity.score = Math.min(
      (compliance.plant_diversity.achieved / compliance.plant_diversity.target) * 100,
      100
    );
    
    // mTOR balance should be roughly 3:4 ratio
    const idealRatio = 3/7; // 3 high days out of 7
    const actualRatio = compliance.mtor_balance.high_days / 7;
    compliance.mtor_balance.score = 100 - Math.abs(idealRatio - actualRatio) * 200;
    
    compliance.anti_inflammatory.score = Math.min(
      compliance.anti_inflammatory.daily_average * 10,
      100
    );
    
    // Overall score (weighted average)
    compliance.overall_score = Math.round(
      (compliance.plant_diversity.score * 0.4) +
      (compliance.mtor_balance.score * 0.3) +
      (compliance.anti_inflammatory.score * 0.3)
    );
    
    return compliance;
  }

  getCurrentCyclePosition(date) {
    const dayInCycle = this.recipeGenerator.getDayInCycle(date);
    return {
      current_day: dayInCycle,
      total_days: 14,
      progress_percentage: (dayInCycle / 14) * 100,
      next_phase_in: dayInCycle <= 7 ? 8 - dayInCycle : 15 - dayInCycle
    };
  }

  adaptPlanForConditions(weeklyPlan) {
    // Adapt plan for Nico's mobility and inflammation conditions
    weeklyPlan.daily_meals.forEach(meal => {
      if (meal.instant_pot_instructions) {
        // Extend cooking times for softer textures
        meal.instant_pot_instructions.texture_adaptations = {
          longer_cooking: true,
          softer_textures: true,
          no_mushrooms: true
        };
      }
    });
    
    return weeklyPlan;
  }
}

export default MealPlanner;