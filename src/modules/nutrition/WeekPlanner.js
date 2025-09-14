import { RecipeEngine } from './RecipeEngine.js';
import { shoppingListManager } from './ShoppingListManager.js';

export class WeekPlanner {
  constructor() {
    this.recipeEngine = new RecipeEngine();
    this.days = ['Luni', 'Marți', 'Miercuri', 'Joi', 'Vineri', 'Sâmbătă', 'Duminică'];
    this.mealTimes = {
      default: '18:00',
      weekend: '19:00'
    };
  }

  async generateWeekPlan(profile = 'ioan', preferences = {}) {
    const weekPlan = {
      id: Date.now().toString(),
      profile: profile,
      week: this.getCurrentWeek(),
      meals: [],
      nutrition: {
        avgCalories: 0,
        avgProtein: 0,
        totalPlants: new Set(),
        weeklyScore: 0
      },
      shoppingList: null,
      totalCost: 0,
      generatedAt: new Date().toISOString()
    };

    // Generate 7 unique meals
    for (let i = 0; i < 7; i++) {
      const dayIndex = new Date().getDay() + i;
      const isWeekend = dayIndex % 7 === 0 || dayIndex % 7 === 6;

      // Alternate between high and low mTOR phases
      const mTORPhase = i < 4 ? 'growth' : 'longevity';

      const meal = await this.generateDayMeal(i, mTORPhase, isWeekend, preferences);
      weekPlan.meals.push(meal);

      // Update nutrition tracking
      this.updateNutritionStats(weekPlan.nutrition, meal);
    }

    // Calculate averages
    weekPlan.nutrition.avgCalories = Math.round(
      weekPlan.meals.reduce((sum, m) => sum + m.recipe.nutrition.calories, 0) / 7
    );
    weekPlan.nutrition.avgProtein = Math.round(
      weekPlan.meals.reduce((sum, m) => sum + m.recipe.nutrition.protein, 0) / 7
    );
    weekPlan.nutrition.totalPlants = weekPlan.nutrition.totalPlants.size;
    weekPlan.nutrition.weeklyScore = this.calculateWeeklyScore(weekPlan);

    // Generate shopping list for the week
    weekPlan.shoppingList = shoppingListManager.generateSmartShoppingList(
      weekPlan.meals.map(m => m.recipe)
    );
    weekPlan.totalCost = weekPlan.shoppingList.totalCost;

    // Save to localStorage
    this.saveWeekPlan(weekPlan);

    return weekPlan;
  }

  async generateDayMeal(dayIndex, mTORPhase, isWeekend, preferences) {
    const day = this.days[dayIndex];

    // Vary preferences for diversity
    const dayPreferences = {
      ...preferences,
      variety: this.getDayVariety(dayIndex),
      cookingTime: isWeekend ? 45 : 30,
      mTORPhase: mTORPhase
    };

    const recipe = await this.recipeEngine.generateOMADRecipe(dayPreferences);

    return {
      day: day,
      date: this.getDateForDay(dayIndex),
      mealTime: isWeekend ? this.mealTimes.weekend : this.mealTimes.default,
      mTORPhase: mTORPhase,
      recipe: recipe,
      prepared: false,
      notes: ''
    };
  }

  getDayVariety(dayIndex) {
    const varieties = [
      'Mediterranean',
      'Asian Fusion',
      'Traditional Romanian',
      'Indian Inspired',
      'Nordic',
      'Mexican',
      'Middle Eastern'
    ];
    return varieties[dayIndex % varieties.length];
  }

  getCurrentWeek() {
    const now = new Date();
    const weekStart = new Date(now.setDate(now.getDate() - now.getDay() + 1));
    const weekEnd = new Date(now.setDate(now.getDate() - now.getDay() + 7));

    return {
      start: weekStart.toISOString().split('T')[0],
      end: weekEnd.toISOString().split('T')[0],
      number: this.getWeekNumber(new Date())
    };
  }

  getWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  }

  getDateForDay(dayIndex) {
    const date = new Date();
    date.setDate(date.getDate() + dayIndex);
    return date.toISOString().split('T')[0];
  }

  updateNutritionStats(stats, meal) {
    // Add plants to set
    meal.recipe.ingredients.forEach(ing => {
      if (this.isPlant(ing.name)) {
        stats.totalPlants.add(ing.name.toLowerCase());
      }
    });
  }

  isPlant(ingredient) {
    const nonPlants = ['somon', 'pui', 'vită', 'porc', 'ou', 'iaurt', 'brânză'];
    return !nonPlants.some(np => ingredient.toLowerCase().includes(np));
  }

  calculateWeeklyScore(weekPlan) {
    let score = 0;

    // Nutrition balance (30 points)
    if (weekPlan.nutrition.avgCalories >= 2200 && weekPlan.nutrition.avgCalories <= 2600) {
      score += 30;
    } else {
      score += 15;
    }

    // Protein adequacy (20 points)
    if (weekPlan.nutrition.avgProtein >= 80) {
      score += 20;
    } else {
      score += Math.round((weekPlan.nutrition.avgProtein / 80) * 20);
    }

    // Plant diversity (30 points)
    score += Math.min(30, weekPlan.nutrition.totalPlants);

    // Recipe variety (20 points)
    const uniqueCuisines = new Set(weekPlan.meals.map(m => m.recipe.metadata?.variety));
    score += Math.min(20, uniqueCuisines.size * 4);

    return Math.min(100, score);
  }

  saveWeekPlan(weekPlan) {
    const history = JSON.parse(localStorage.getItem('weekPlanHistory') || '[]');
    history.unshift(weekPlan);

    // Keep only last 12 weeks
    if (history.length > 12) {
      history.pop();
    }

    localStorage.setItem('weekPlanHistory', JSON.stringify(history));
    localStorage.setItem('currentWeekPlan', JSON.stringify(weekPlan));
  }

  async loadCurrentWeekPlan() {
    const saved = localStorage.getItem('currentWeekPlan');
    if (saved) {
      return JSON.parse(saved);
    }
    return null;
  }

  async updateMealStatus(dayIndex, prepared = true, notes = '') {
    const weekPlan = await this.loadCurrentWeekPlan();
    if (weekPlan && weekPlan.meals[dayIndex]) {
      weekPlan.meals[dayIndex].prepared = prepared;
      weekPlan.meals[dayIndex].notes = notes;
      this.saveWeekPlan(weekPlan);
      return weekPlan;
    }
    return null;
  }

  exportWeekPlan(weekPlan, format = 'pdf') {
    // Different export formats
    switch(format) {
      case 'pdf':
        return this.exportToPDF(weekPlan);
      case 'calendar':
        return this.exportToCalendar(weekPlan);
      case 'markdown':
        return this.exportToMarkdown(weekPlan);
      default:
        return this.exportToText(weekPlan);
    }
  }

  exportToText(weekPlan) {
    let text = `📅 PLAN OMAD - Săptămâna ${weekPlan.week.number}\n`;
    text += `${weekPlan.week.start} → ${weekPlan.week.end}\n`;
    text += `${'='.repeat(60)}\n\n`;

    weekPlan.meals.forEach((meal, idx) => {
      text += `${meal.day.toUpperCase()} - ${meal.date}\n`;
      text += `⏰ Ora mesei: ${meal.mealTime}\n`;
      text += `🔄 Fază mTOR: ${meal.mTORPhase}\n`;
      text += `🍽️ ${meal.recipe.name}\n`;
      text += `   Calorii: ${meal.recipe.nutrition.calories} kcal\n`;
      text += `   Proteine: ${meal.recipe.nutrition.protein}g\n`;
      text += `   CODEX Score: ${meal.recipe.codexScore}\n`;
      text += `   Ingrediente principale:\n`;

      meal.recipe.ingredients.slice(0, 5).forEach(ing => {
        text += `     • ${ing.name}: ${ing.amount}${ing.unit}\n`;
      });

      text += '\n';
    });

    text += `${'='.repeat(60)}\n`;
    text += `📊 STATISTICI SĂPTĂMÂNALE:\n`;
    text += `   Calorii medii: ${weekPlan.nutrition.avgCalories} kcal\n`;
    text += `   Proteine medii: ${weekPlan.nutrition.avgProtein}g\n`;
    text += `   Diversitate plante: ${weekPlan.nutrition.totalPlants} specii\n`;
    text += `   Scor săptămânal: ${weekPlan.nutrition.weeklyScore}/100\n`;
    text += `   Cost total estimat: ${weekPlan.totalCost.toFixed(2)} RON\n`;

    return text;
  }

  exportToMarkdown(weekPlan) {
    let md = `# 📅 OMAD Week Plan - Week ${weekPlan.week.number}\n\n`;
    md += `**Period**: ${weekPlan.week.start} → ${weekPlan.week.end}\n\n`;

    md += `## 📊 Week Statistics\n\n`;
    md += `| Metric | Value |\n`;
    md += `|--------|-------|\n`;
    md += `| Avg Calories | ${weekPlan.nutrition.avgCalories} kcal |\n`;
    md += `| Avg Protein | ${weekPlan.nutrition.avgProtein}g |\n`;
    md += `| Plant Diversity | ${weekPlan.nutrition.totalPlants} species |\n`;
    md += `| Weekly Score | ${weekPlan.nutrition.weeklyScore}/100 |\n`;
    md += `| Total Cost | ${weekPlan.totalCost.toFixed(2)} RON |\n\n`;

    md += `## 🍽️ Daily Meals\n\n`;

    weekPlan.meals.forEach(meal => {
      md += `### ${meal.day} - ${meal.date}\n\n`;
      md += `- **Time**: ${meal.mealTime}\n`;
      md += `- **mTOR Phase**: ${meal.mTORPhase}\n`;
      md += `- **Recipe**: ${meal.recipe.name}\n`;
      md += `- **Nutrition**: ${meal.recipe.nutrition.calories} kcal | ${meal.recipe.nutrition.protein}g protein\n`;
      md += `- **CODEX Score**: ${meal.recipe.codexScore}/100\n\n`;
    });

    return md;
  }
}

export const weekPlanner = new WeekPlanner();