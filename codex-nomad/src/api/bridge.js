// Bridge pentru comunicare cu Finance App
import RecipeGenerator from '../engine/recipe-generator.js';
import NutritionAnalyzer from '../engine/nutrition-analyzer.js';
import MealPlanner from '../engine/meal-planner.js';
import InstantPotEngine from '../engine/instant-pot.js';
import Recipe from '../models/Recipe.js';
import Ingredient from '../models/Ingredient.js';
import NutritionProfile from '../models/NutritionProfile.js';

class CodexBridge {
  constructor() {
    this.generator = null;
    this.analyzer = null;
    this.planner = null;
    this.instantPot = null;
    this.profiles = new Map();
    this.initialized = false;
  }

  async init() {
    if (this.initialized) return;
    
    try {
      this.generator = new RecipeGenerator();
      this.analyzer = new NutritionAnalyzer();
      this.planner = new MealPlanner();
      this.instantPot = new InstantPotEngine();
      
      // Initialize profiles
      this.profiles.set('Ioan', NutritionProfile.createIoanProfile());
      this.profiles.set('Nico', NutritionProfile.createNicoProfile());
      
      this.initialized = true;
      console.log('✅ CODEX Bridge initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize CODEX Bridge:', error);
      throw error;
    }
  }

  // Main API methods for Finance App integration

  async getTodayRecipe() {
    await this.init();
    
    try {
      const recipe = this.generator.generateDailyRecipe();
      if (recipe) {
        const recipeObj = Recipe.fromDatabase(recipe);
        return {
          success: true,
          data: {
            recipe: recipeObj,
            instant_pot_instructions: await this.generateInstantPotInstructions(recipeObj),
            compliance: this.evaluateRecipeCompliance(recipeObj),
            estimated_cost: recipeObj.estimateCost()
          }
        };
      }
      
      return {
        success: false,
        message: 'No suitable recipe found for today'
      };
    } catch (error) {
      return {
        success: false,
        message: 'Error generating today\'s recipe',
        error: error.message
      };
    }
  }

  async getWeeklyPlan(startDate = new Date()) {
    await this.init();
    
    try {
      const weeklyPlan = this.planner.generateWeeklyPlan(startDate);
      
      return {
        success: true,
        data: {
          ...weeklyPlan,
          estimated_weekly_cost: this.calculateWeeklyCost(weeklyPlan),
          finance_integration: {
            budget_category: 'Alimente',
            expected_expenses: this.mapToFinanceTransactions(weeklyPlan)
          }
        }
      };
    } catch (error) {
      return {
        success: false,
        message: 'Error generating weekly plan',
        error: error.message
      };
    }
  }

  async analyzeReceipt(items) {
    await this.init();
    
    try {
      const analysis = this.analyzer.analyzeItems(items);
      
      // Enhanced analysis with profile-specific insights
      const ioanCompliance = this.profiles.get('Ioan').analyzeMealCompliance(analysis);
      const nicoCompliance = this.profiles.get('Nico').analyzeMealCompliance(analysis);
      
      return {
        success: true,
        data: {
          general_analysis: analysis,
          ioan_specific: ioanCompliance,
          nico_specific: nicoCompliance,
          shopping_insights: this.generateShoppingInsights(analysis),
          cost_optimization: this.suggestCostOptimizations(items)
        }
      };
    } catch (error) {
      return {
        success: false,
        message: 'Error analyzing receipt',
        error: error.message
      };
    }
  }

  async getShoppingList(recipes = null) {
    await this.init();
    
    try {
      let shoppingList;
      
      if (recipes) {
        shoppingList = this.planner.generateShoppingList(recipes);
      } else {
        // Generate shopping list for next week
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 1);
        const weeklyPlan = this.planner.generateWeeklyPlan(nextWeek);
        shoppingList = weeklyPlan.shopping_list;
      }
      
      return {
        success: true,
        data: {
          shopping_list: shoppingList,
          total_estimated_cost: shoppingList.reduce((sum, item) => sum + (item.estimated_price || 0), 0),
          categories: this.groupShoppingByCategory(shoppingList),
          nico_safety_check: this.checkNicoSafety(shoppingList),
          budget_impact: this.calculateBudgetImpact(shoppingList)
        }
      };
    } catch (error) {
      return {
        success: false,
        message: 'Error generating shopping list',
        error: error.message
      };
    }
  }

  async getCurrentMTORStatus() {
    await this.init();
    
    const today = new Date();
    const dayInCycle = this.generator.getDayInCycle(today);
    const phase = this.generator.getMTORPhase(dayInCycle);
    
    return {
      success: true,
      data: {
        current_day: dayInCycle,
        current_phase: phase,
        cycle_progress: (dayInCycle / 14) * 100,
        next_phase_change: phase === 'high' ? 
          (dayInCycle <= 3 ? 4 - dayInCycle : 8 - dayInCycle) : 
          (dayInCycle <= 7 ? 8 - dayInCycle : 15 - dayInCycle),
        recommendations: this.getMTORRecommendations(phase, dayInCycle),
        nutrition_targets: {
          ioan: this.profiles.get('Ioan').getMTORTargets(phase),
          nico: this.profiles.get('Nico').getMTORTargets(phase)
        }
      }
    };
  }

  // Helper methods

  async generateInstantPotInstructions(recipe) {
    const mockIngredients = [
      { name: 'Chicken Thigh', quantity: 200 },
      { name: 'Broccoli', quantity: 150 },
      { name: 'Sweet Potato', quantity: 100 }
    ];
    
    return this.instantPot.generateInstantPotRecipe(mockIngredients, recipe.mtorPhase);
  }

  evaluateRecipeCompliance(recipe) {
    return {
      mtor_compliance: recipe.mtorPhase ? 100 : 0,
      plant_diversity: recipe.plantCount >= 10 ? 100 : (recipe.plantCount / 10) * 100,
      anti_inflammatory: recipe.antiInflammatory ? 100 : recipe.getAntiInflammatoryScore(),
      nico_safety: recipe.isNicoSafe() ? 100 : 0,
      overall_score: Math.round(
        (recipe.mtorPhase ? 25 : 0) +
        ((recipe.plantCount >= 10 ? 25 : (recipe.plantCount / 10) * 25)) +
        (recipe.antiInflammatory ? 25 : 0) +
        (recipe.isNicoSafe() ? 25 : 0)
      )
    };
  }

  calculateWeeklyCost(weeklyPlan) {
    return weeklyPlan.shopping_list.reduce((sum, item) => 
      sum + (item.total_quantity * (item.estimated_price || 2)), 0
    );
  }

  mapToFinanceTransactions(weeklyPlan) {
    return weeklyPlan.shopping_list.map(item => ({
      description: `CODEX: ${item.name}`,
      amount: item.total_quantity * (item.estimated_price || 2),
      category: 'Alimente',
      date: new Date().toISOString().split('T')[0],
      type: 'expense',
      tags: ['codex', 'planned', item.category]
    }));
  }

  generateShoppingInsights(analysis) {
    const insights = [];
    
    if (analysis.plant_species.size < 10) {
      insights.push({
        type: 'warning',
        message: `Only ${analysis.plant_species.size} plant species found. Aim for 10+ daily.`,
        action: 'Add more diverse vegetables and herbs'
      });
    }
    
    if (analysis.anti_inflammatory_score < 50) {
      insights.push({
        type: 'suggestion',
        message: 'Low anti-inflammatory score detected',
        action: 'Include turmeric, ginger, berries, or leafy greens'
      });
    }
    
    return insights;
  }

  suggestCostOptimizations(items) {
    const optimizations = [];
    
    // Mock cost optimization suggestions
    optimizations.push({
      item: 'Proteins',
      suggestion: 'Consider bulk buying and freezing portions',
      potential_savings: '20-30 RON/week'
    });
    
    optimizations.push({
      item: 'Vegetables',
      suggestion: 'Buy seasonal produce for better prices',
      potential_savings: '10-15 RON/week'
    });
    
    return optimizations;
  }

  groupShoppingByCategory(shoppingList) {
    const categories = {};
    
    shoppingList.forEach(item => {
      if (!categories[item.category]) {
        categories[item.category] = [];
      }
      categories[item.category].push(item);
    });
    
    return categories;
  }

  checkNicoSafety(shoppingList) {
    const unsafe = shoppingList.filter(item => !item.nico_safe);
    
    return {
      all_safe: unsafe.length === 0,
      unsafe_items: unsafe.map(item => item.name),
      alternatives: unsafe.map(item => ({
        item: item.name,
        alternatives: ['zucchini', 'cauliflower', 'eggplant'] // mock alternatives
      }))
    };
  }

  calculateBudgetImpact(shoppingList) {
    const totalCost = shoppingList.reduce((sum, item) => sum + (item.estimated_price || 0), 0);
    
    return {
      estimated_total: totalCost,
      daily_average: totalCost / 7,
      category_breakdown: this.groupShoppingByCategory(shoppingList),
      budget_percentage: (totalCost / 500) * 100 // Assuming 500 RON weekly food budget
    };
  }

  getMTORRecommendations(phase, day) {
    const baseRecs = [];
    
    if (phase === 'high') {
      baseRecs.push('Focus on protein-rich foods');
      baseRecs.push('Include resistance exercise if possible');
      baseRecs.push('Optimal time for muscle building foods');
    } else {
      baseRecs.push('Emphasize plant diversity');
      baseRecs.push('Include autophagy-promoting foods');
      baseRecs.push('Focus on anti-inflammatory ingredients');
    }
    
    return baseRecs;
  }

  // Finance App specific methods

  async syncWithFinanceApp(financeData) {
    // Sync CODEX data with finance transactions
    const codexTransactions = financeData.filter(t => 
      t.category === 'Alimente' && 
      (t.description?.includes('CODEX') || t.tags?.includes('codex'))
    );
    
    return {
      success: true,
      data: {
        codex_transactions: codexTransactions,
        food_budget_usage: this.calculateFoodBudgetUsage(codexTransactions),
        optimization_suggestions: this.generateFinanceOptimizations(codexTransactions)
      }
    };
  }

  calculateFoodBudgetUsage(transactions) {
    const thisMonth = new Date().toISOString().slice(0, 7);
    const monthlyExpenses = transactions
      .filter(t => t.date?.startsWith(thisMonth))
      .reduce((sum, t) => sum + (t.amount || 0), 0);
    
    return {
      monthly_spent: monthlyExpenses,
      budget_percentage: (monthlyExpenses / 2000) * 100, // Assuming 2000 RON monthly budget
      remaining_budget: 2000 - monthlyExpenses
    };
  }

  generateFinanceOptimizations(transactions) {
    return [
      {
        category: 'bulk_buying',
        suggestion: 'Consider bulk buying non-perishables',
        potential_savings: 50
      },
      {
        category: 'seasonal_shopping',
        suggestion: 'Focus on seasonal produce',
        potential_savings: 30
      }
    ];
  }

  // Public interface for Finance App
  getPublicAPI() {
    return {
      getTodayRecipe: this.getTodayRecipe.bind(this),
      getWeeklyPlan: this.getWeeklyPlan.bind(this),
      analyzeReceipt: this.analyzeReceipt.bind(this),
      getShoppingList: this.getShoppingList.bind(this),
      getCurrentMTORStatus: this.getCurrentMTORStatus.bind(this),
      syncWithFinanceApp: this.syncWithFinanceApp.bind(this)
    };
  }
}

// Singleton instance
const codexBridge = new CodexBridge();

export default codexBridge;