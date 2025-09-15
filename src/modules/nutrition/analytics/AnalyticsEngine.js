// src/modules/nutrition/analytics/AnalyticsEngine.js
import { ROMANIAN_FOODS_DATABASE } from '../database/FoodDatabase.js';

export class AnalyticsEngine {
  constructor() {
    this.data = this.loadHistoricalData();
    this.patterns = new Map();
    this.insights = [];
    this.lastAnalysis = null;
    this.cache = new Map();
  }

  // Load all historical data from localStorage
  loadHistoricalData() {
    try {
      const sources = {
        recipes: JSON.parse(localStorage.getItem('generated_recipes') || '[]'),
        meals: JSON.parse(localStorage.getItem('meal_history') || '[]'),
        shopping: JSON.parse(localStorage.getItem('shopping_history') || '[]'),
        biomarkers: JSON.parse(localStorage.getItem('biomarker_history') || '[]'),
        mtor: JSON.parse(localStorage.getItem('mtor_cycles') || '[]'),
        pantry: JSON.parse(localStorage.getItem('pantry_history') || '[]'),
        finance: JSON.parse(localStorage.getItem('fs_data') || '{}').transactions || []
      };

      // Process and normalize data
      return {
        recipes: this.normalizeRecipes(sources.recipes),
        meals: this.normalizeMeals(sources.meals),
        shopping: this.normalizeShopping(sources.shopping),
        biomarkers: sources.biomarkers,
        mtor: sources.mtor,
        pantry: sources.pantry,
        finance: this.filterFoodTransactions(sources.finance),
        timestamps: {
          firstEntry: this.findEarliestDate(sources),
          lastUpdate: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('Error loading historical data:', error);
      return this.getEmptyDataStructure();
    }
  }

  // Normalize recipe data for analysis
  normalizeRecipes(recipes) {
    return recipes.map(recipe => ({
      ...recipe,
      timestamp: recipe.generatedAt || recipe.timestamp || new Date().toISOString(),
      nutritionDensity: this.calculateNutritionDensity(recipe),
      costEfficiency: this.calculateCostEfficiency(recipe),
      diversityScore: this.calculateDiversityScore(recipe)
    }));
  }

  // Calculate nutrition density (nutrients per calorie)
  calculateNutritionDensity(recipe) {
    if (!recipe.nutrition) return 0;

    const { calories, protein, fiber, vitamins = {}, minerals = {} } = recipe.nutrition;
    if (!calories || calories === 0) return 0;

    // Weighted score based on important nutrients
    const proteinScore = (protein || 0) / calories * 100;
    const fiberScore = (fiber || 0) / calories * 50;
    const microScore = (Object.keys(vitamins).length + Object.keys(minerals).length) * 2;

    return Math.round(proteinScore + fiberScore + microScore);
  }

  // Calculate cost efficiency (nutrition per RON)
  calculateCostEfficiency(recipe) {
    if (!recipe.totalCost || recipe.totalCost === 0) return 100;
    if (!recipe.nutrition) return 0;

    const { calories, protein } = recipe.nutrition;
    const costPerCalorie = recipe.totalCost / (calories || 1);
    const costPerProtein = recipe.totalCost / (protein || 1);

    // Lower cost per nutrient = higher efficiency
    return Math.round(100 / (costPerCalorie + costPerProtein));
  }

  // Calculate plant diversity score
  calculateDiversityScore(recipe) {
    if (!recipe.ingredients) return 0;

    const plantIngredients = recipe.ingredients.filter(ing => {
      const food = ROMANIAN_FOODS_DATABASE.find(f =>
        f.name.toLowerCase() === ing.name.toLowerCase()
      );
      return food && (food.category === 'Legume' || food.category === 'Fructe');
    });

    return Math.min(plantIngredients.length * 10, 100);
  }

  // COST PER NUTRIENT ANALYSIS
  async analyzeCostPerNutrient(period = 30) {
    const cacheKey = `cpn_${period}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - period);

    const relevantMeals = this.data.meals.filter(meal => {
      const mealDate = new Date(meal.timestamp);
      return mealDate >= startDate && mealDate <= endDate;
    });

    const analysis = {
      period: period,
      metrics: {
        protein: { total: 0, cost: 0, efficiency: 0 },
        carbs: { total: 0, cost: 0, efficiency: 0 },
        fats: { total: 0, cost: 0, efficiency: 0 },
        fiber: { total: 0, cost: 0, efficiency: 0 },
        calories: { total: 0, cost: 0, efficiency: 0 }
      },
      trends: [],
      recommendations: []
    };

    // Calculate totals
    relevantMeals.forEach(meal => {
      if (meal.nutrition && meal.totalCost) {
        analysis.metrics.protein.total += meal.nutrition.protein || 0;
        analysis.metrics.carbs.total += meal.nutrition.carbs || 0;
        analysis.metrics.fats.total += meal.nutrition.fats || 0;
        analysis.metrics.fiber.total += meal.nutrition.fiber || 0;
        analysis.metrics.calories.total += meal.nutrition.calories || 0;

        // Distribute cost proportionally
        const totalNutrients = (meal.nutrition.protein || 0) +
                               (meal.nutrition.carbs || 0) +
                               (meal.nutrition.fats || 0);

        if (totalNutrients > 0) {
          analysis.metrics.protein.cost += meal.totalCost * (meal.nutrition.protein / totalNutrients);
          analysis.metrics.carbs.cost += meal.totalCost * (meal.nutrition.carbs / totalNutrients);
          analysis.metrics.fats.cost += meal.totalCost * (meal.nutrition.fats / totalNutrients);
        }
      }
    });

    // Calculate efficiency (grams per RON)
    Object.keys(analysis.metrics).forEach(nutrient => {
      const metric = analysis.metrics[nutrient];
      if (metric.cost > 0) {
        metric.efficiency = Math.round((metric.total / metric.cost) * 10) / 10;
      }
    });

    // Generate insights
    analysis.recommendations = this.generateCostInsights(analysis.metrics);

    this.cache.set(cacheKey, analysis);
    return analysis;
  }

  // DEFICIENCY TRENDS ANALYSIS
  async analyzeDeficiencyTrends() {
    const trends = {
      timeframe: 'last_30_days',
      deficiencies: [],
      improvements: [],
      patterns: [],
      riskScore: 0
    };

    // Analyze biomarker trends
    if (this.data.biomarkers.length > 0) {
      const recentBiomarkers = this.data.biomarkers.slice(-10);

      // Check for consistent deficiencies
      const nutrients = ['vitaminD', 'b12', 'iron', 'magnesium', 'omega3'];

      nutrients.forEach(nutrient => {
        const values = recentBiomarkers
          .map(b => b[nutrient])
          .filter(v => v !== undefined);

        if (values.length > 0) {
          const avg = values.reduce((a, b) => a + b, 0) / values.length;
          const trend = this.calculateTrend(values);

          if (avg < this.getNutrientThreshold(nutrient)) {
            trends.deficiencies.push({
              nutrient: nutrient,
              severity: this.getSeverity(avg, nutrient),
              trend: trend,
              avgValue: avg,
              recommendation: this.getDeficiencyRecommendation(nutrient)
            });
          } else if (trend > 0.1) {
            trends.improvements.push({
              nutrient: nutrient,
              improvement: `${Math.round(trend * 100)}%`,
              currentValue: values[values.length - 1]
            });
          }
        }
      });
    }

    // Calculate risk score (0-100)
    trends.riskScore = Math.min(trends.deficiencies.length * 20, 100);

    // Identify patterns
    trends.patterns = this.identifyNutritionalPatterns();

    return trends;
  }

  // SHOPPING PATTERNS ML ANALYSIS
  async analyzeShoppingPatterns() {
    const patterns = {
      frequency: {},
      preferences: {},
      seasonal: {},
      predictions: {},
      optimizations: []
    };

    // Analyze shopping frequency
    const shoppingDates = this.data.shopping.map(s => new Date(s.timestamp));
    if (shoppingDates.length > 1) {
      const intervals = [];
      for (let i = 1; i < shoppingDates.length; i++) {
        const days = Math.round((shoppingDates[i] - shoppingDates[i-1]) / (1000 * 60 * 60 * 24));
        intervals.push(days);
      }

      patterns.frequency = {
        avgDaysBetween: Math.round(intervals.reduce((a, b) => a + b, 0) / intervals.length),
        mostCommon: this.mode(intervals),
        nextPredicted: this.predictNextShopping(shoppingDates)
      };
    }

    // Analyze product preferences
    const allItems = this.data.shopping.flatMap(s => s.items || []);
    const itemFrequency = {};

    allItems.forEach(item => {
      const key = item.name.toLowerCase();
      itemFrequency[key] = (itemFrequency[key] || 0) + 1;
    });

    // Sort by frequency and get top items
    patterns.preferences = Object.entries(itemFrequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([name, count]) => ({
        name: name,
        frequency: count,
        percentage: Math.round((count / this.data.shopping.length) * 100),
        category: this.categorizeItem(name)
      }));

    // Seasonal patterns (simplified)
    patterns.seasonal = this.analyzeSeasonalPatterns(this.data.shopping);

    // ML-based predictions
    patterns.predictions = this.generateShoppingPredictions(patterns);

    // Cost optimizations
    patterns.optimizations = this.generateOptimizations(patterns);

    return patterns;
  }

  // MONTHLY/YEARLY COMPARISONS
  async generateComparisons(type = 'monthly') {
    const comparisons = {
      type: type,
      periods: [],
      charts: {
        cost: [],
        nutrition: [],
        diversity: [],
        compliance: []
      },
      insights: []
    };

    if (type === 'monthly') {
      // Get last 6 months
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const period = await this.analyzePeriod(date);
        comparisons.periods.push(period);
      }
    } else {
      // Get last 3 years
      for (let i = 2; i >= 0; i--) {
        const date = new Date();
        date.setFullYear(date.getFullYear() - i);
        const period = await this.analyzeYear(date);
        comparisons.periods.push(period);
      }
    }

    // Generate chart data
    comparisons.periods.forEach(period => {
      comparisons.charts.cost.push({
        label: period.label,
        value: period.totalCost,
        change: period.costChange
      });

      comparisons.charts.nutrition.push({
        label: period.label,
        protein: period.avgProtein,
        calories: period.avgCalories,
        score: period.nutritionScore
      });

      comparisons.charts.diversity.push({
        label: period.label,
        plants: period.uniquePlants,
        recipes: period.uniqueRecipes
      });

      comparisons.charts.compliance.push({
        label: period.label,
        codex: period.codexCompliance,
        mtor: period.mtorCompliance
      });
    });

    // Generate insights
    comparisons.insights = this.generateComparativeInsights(comparisons);

    return comparisons;
  }

  // Analyze a specific month
  async analyzePeriod(date) {
    const year = date.getFullYear();
    const month = date.getMonth();
    const monthName = date.toLocaleDateString('ro-RO', { month: 'long', year: 'numeric' });

    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0);

    const periodMeals = this.data.meals.filter(meal => {
      const mealDate = new Date(meal.timestamp);
      return mealDate >= startDate && mealDate <= endDate;
    });

    const periodShopping = this.data.shopping.filter(shop => {
      const shopDate = new Date(shop.timestamp);
      return shopDate >= startDate && shopDate <= endDate;
    });

    return {
      label: monthName,
      totalCost: periodShopping.reduce((sum, s) => sum + (s.totalCost || 0), 0),
      avgProtein: this.average(periodMeals.map(m => m.nutrition?.protein || 0)),
      avgCalories: this.average(periodMeals.map(m => m.nutrition?.calories || 0)),
      nutritionScore: this.average(periodMeals.map(m => m.codexScore || 0)),
      uniquePlants: new Set(periodMeals.flatMap(m =>
        (m.ingredients || []).filter(i => this.isPlant(i.name)).map(i => i.name)
      )).size,
      uniqueRecipes: new Set(periodMeals.map(m => m.name)).size,
      codexCompliance: this.calculateCompliance(periodMeals, 'codex'),
      mtorCompliance: this.calculateCompliance(periodMeals, 'mtor'),
      costChange: 0 // Will be calculated comparing to previous period
    };
  }

  // EXPORT REPORTS
  async generateReport(format = 'json', period = 30) {
    const report = {
      metadata: {
        generatedAt: new Date().toISOString(),
        period: `Last ${period} days`,
        format: format,
        version: '1.0.0'
      },
      summary: await this.generateExecutiveSummary(period),
      costAnalysis: await this.analyzeCostPerNutrient(period),
      deficiencies: await this.analyzeDeficiencyTrends(),
      shoppingPatterns: await this.analyzeShoppingPatterns(),
      comparisons: await this.generateComparisons('monthly'),
      recommendations: await this.generateRecommendations(),
      achievements: await this.calculateAchievements()
    };

    switch (format) {
      case 'json':
        return JSON.stringify(report, null, 2);

      case 'csv':
        return this.convertToCSV(report);

      case 'markdown':
        return this.convertToMarkdown(report);

      case 'pdf':
        return this.generatePDFReport(report);

      default:
        return report;
    }
  }

  // Generate executive summary
  async generateExecutiveSummary(period) {
    const meals = this.data.meals.filter(m => {
      const mealDate = new Date(m.timestamp);
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - period);
      return mealDate >= cutoff;
    });

    return {
      totalMeals: meals.length,
      avgDailyCost: Math.round(
        meals.reduce((sum, m) => sum + (m.totalCost || 0), 0) / period
      ),
      avgProtein: Math.round(
        this.average(meals.map(m => m.nutrition?.protein || 0))
      ),
      avgCalories: Math.round(
        this.average(meals.map(m => m.nutrition?.calories || 0))
      ),
      codexScore: Math.round(
        this.average(meals.map(m => m.codexScore || 0))
      ),
      plantDiversity: new Set(
        meals.flatMap(m =>
          (m.ingredients || []).filter(i => this.isPlant(i.name)).map(i => i.name)
        )
      ).size,
      topAchievement: this.getTopAchievement(meals),
      mainChallenge: this.getMainChallenge(meals),
      trend: this.calculateOverallTrend(meals)
    };
  }

  // Generate actionable recommendations
  async generateRecommendations() {
    const recommendations = [];

    // Cost optimization recommendations
    const costAnalysis = await this.analyzeCostPerNutrient(30);
    if (costAnalysis.metrics.protein.efficiency < 5) {
      recommendations.push({
        category: 'cost',
        priority: 'high',
        title: 'Optimizează sursa de proteină',
        description: 'Costul per gram de proteină este ridicat. Consideră alternative mai eficiente.',
        suggestions: [
          'Ouă în loc de carne roșie (-40% cost)',
          'Brânză cottage în loc de brânză aged (-30% cost)',
          'Leguminoase + cereale pentru proteină completă'
        ]
      });
    }

    // Deficiency recommendations
    const deficiencies = await this.analyzeDeficiencyTrends();
    deficiencies.deficiencies.forEach(def => {
      recommendations.push({
        category: 'nutrition',
        priority: def.severity === 'severe' ? 'critical' : 'medium',
        title: `Deficiență ${def.nutrient}`,
        description: def.recommendation,
        suggestions: this.getFoodSuggestions(def.nutrient)
      });
    });

    // Shopping optimization
    const patterns = await this.analyzeShoppingPatterns();
    if (patterns.optimizations.length > 0) {
      recommendations.push({
        category: 'shopping',
        priority: 'low',
        title: 'Optimizare shopping',
        description: 'Poți reduce costurile prin planificare mai bună.',
        suggestions: patterns.optimizations.slice(0, 3)
      });
    }

    // Sort by priority
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    recommendations.sort((a, b) =>
      priorityOrder[a.priority] - priorityOrder[b.priority]
    );

    return recommendations;
  }

  // Helper functions
  average(arr) {
    if (!arr || arr.length === 0) return 0;
    return arr.reduce((a, b) => a + b, 0) / arr.length;
  }

  mode(arr) {
    const frequency = {};
    arr.forEach(val => {
      frequency[val] = (frequency[val] || 0) + 1;
    });

    let maxFreq = 0;
    let mode = null;

    for (const [val, freq] of Object.entries(frequency)) {
      if (freq > maxFreq) {
        maxFreq = freq;
        mode = parseInt(val);
      }
    }

    return mode;
  }

  calculateTrend(values) {
    if (values.length < 2) return 0;

    // Simple linear regression
    const n = values.length;
    const indices = Array.from({ length: n }, (_, i) => i);

    const sumX = indices.reduce((a, b) => a + b, 0);
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = indices.reduce((sum, x, i) => sum + x * values[i], 0);
    const sumX2 = indices.reduce((sum, x) => sum + x * x, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);

    return slope;
  }

  getNutrientThreshold(nutrient) {
    const thresholds = {
      vitaminD: 30,  // ng/mL
      b12: 200,      // pg/mL
      iron: 50,      // μg/dL
      magnesium: 1.7, // mg/dL
      omega3: 4      // % of total fatty acids
    };

    return thresholds[nutrient] || 0;
  }

  getSeverity(value, nutrient) {
    const threshold = this.getNutrientThreshold(nutrient);
    const ratio = value / threshold;

    if (ratio < 0.5) return 'severe';
    if (ratio < 0.7) return 'moderate';
    if (ratio < 0.9) return 'mild';
    return 'normal';
  }

  getDeficiencyRecommendation(nutrient) {
    const recommendations = {
      vitaminD: 'Expunere la soare 15-20 min/zi sau supliment D3 2000 IU',
      b12: 'Adaugă carne roșie, ouă sau supliment B12 methylcobalamin',
      iron: 'Combină surse de fier cu vitamina C pentru absorbție optimă',
      magnesium: 'Adaugă nuci, semințe și legume cu frunze verzi',
      omega3: 'Pește gras 2x/săptămână sau supliment EPA/DHA'
    };

    return recommendations[nutrient] || 'Consultă un specialist pentru recomandări personalizate';
  }

  getFoodSuggestions(nutrient) {
    const foods = {
      vitaminD: ['Somon', 'Macrou', 'Gălbenuș ou', 'Ciuperci UV'],
      b12: ['Ficat vită', 'Sardine', 'Brânză', 'Ou'],
      iron: ['Spanac', 'Linte', 'Carne roșie', 'Quinoa'],
      magnesium: ['Migdale', 'Avocado', 'Ciocolată neagră', 'Spanac'],
      omega3: ['Somon sălbatic', 'Nuci', 'Semințe chia', 'Sardine']
    };

    return foods[nutrient] || [];
  }

  isPlant(itemName) {
    const plantCategories = ['Legume', 'Fructe', 'Nuci și Semințe'];
    const food = ROMANIAN_FOODS_DATABASE.find(f =>
      f.name.toLowerCase() === itemName.toLowerCase()
    );

    return food && plantCategories.includes(food.category);
  }

  categorizeItem(itemName) {
    const food = ROMANIAN_FOODS_DATABASE.find(f =>
      f.name.toLowerCase() === itemName.toLowerCase()
    );

    return food ? food.category : 'Altele';
  }

  predictNextShopping(dates) {
    if (dates.length < 2) return null;

    const intervals = [];
    for (let i = 1; i < dates.length; i++) {
      intervals.push(dates[i] - dates[i-1]);
    }

    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const lastDate = dates[dates.length - 1];
    const nextDate = new Date(lastDate.getTime() + avgInterval);

    return nextDate.toLocaleDateString('ro-RO');
  }

  analyzeSeasonalPatterns(shoppingData) {
    const seasonal = {
      spring: [],
      summer: [],
      autumn: [],
      winter: []
    };

    shoppingData.forEach(shop => {
      const month = new Date(shop.timestamp).getMonth();
      const season = this.getSeason(month);

      (shop.items || []).forEach(item => {
        seasonal[season].push(item.name);
      });
    });

    // Find most common items per season
    const patterns = {};
    Object.keys(seasonal).forEach(season => {
      const frequency = {};
      seasonal[season].forEach(item => {
        frequency[item] = (frequency[item] || 0) + 1;
      });

      patterns[season] = Object.entries(frequency)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, count]) => ({ name, count }));
    });

    return patterns;
  }

  getSeason(month) {
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'autumn';
    return 'winter';
  }

  generateShoppingPredictions(patterns) {
    const predictions = {
      nextShoppingList: [],
      estimatedCost: 0,
      confidence: 0
    };

    // Use frequency data to predict next list
    if (patterns.preferences.length > 0) {
      // Take items with >50% frequency
      predictions.nextShoppingList = patterns.preferences
        .filter(item => item.percentage > 50)
        .map(item => ({
          name: item.name,
          probability: item.percentage,
          category: item.category
        }));

      // Estimate cost based on historical average
      const avgCost = this.data.shopping.reduce((sum, s) =>
        sum + (s.totalCost || 0), 0
      ) / Math.max(this.data.shopping.length, 1);

      predictions.estimatedCost = Math.round(avgCost);
      predictions.confidence = Math.min(
        patterns.preferences[0]?.percentage || 0,
        85
      );
    }

    return predictions;
  }

  generateOptimizations(patterns) {
    const optimizations = [];

    // Bulk buying optimization
    patterns.preferences
      .filter(item => item.frequency > 5)
      .forEach(item => {
        optimizations.push(
          `Cumpără ${item.name} în cantități mai mari pentru -15% cost`
        );
      });

    // Seasonal optimization
    const currentSeason = this.getSeason(new Date().getMonth());
    if (patterns.seasonal[currentSeason]?.length > 0) {
      optimizations.push(
        `Produse de sezon disponibile: ${patterns.seasonal[currentSeason]
          .slice(0, 3)
          .map(i => i.name)
          .join(', ')}`
      );
    }

    // Shopping frequency optimization
    if (patterns.frequency.avgDaysBetween < 5) {
      optimizations.push(
        'Reduce frecvența cumpărăturilor la 7 zile pentru economie timp/benzină'
      );
    }

    return optimizations.slice(0, 5);
  }

  calculateCompliance(meals, type) {
    if (meals.length === 0) return 0;

    if (type === 'codex') {
      const scores = meals.map(m => m.codexScore || 0);
      return Math.round(this.average(scores));
    }

    if (type === 'mtor') {
      // Check if meals follow mTOR cycling pattern
      let compliant = 0;
      meals.forEach((meal, idx) => {
        const dayInCycle = idx % 14;
        const expectedPhase = dayInCycle < 4 ? 'growth' : 'longevity';
        const actualProtein = meal.nutrition?.protein || 0;

        if (expectedPhase === 'growth' && actualProtein > 100) compliant++;
        if (expectedPhase === 'longevity' && actualProtein < 60) compliant++;
      });

      return Math.round((compliant / meals.length) * 100);
    }

    return 0;
  }

  identifyNutritionalPatterns() {
    const patterns = [];

    // Pattern 1: Protein cycling
    const proteinValues = this.data.meals
      .slice(-14)
      .map(m => m.nutrition?.protein || 0);

    if (proteinValues.length >= 14) {
      const highDays = proteinValues.filter(p => p > 100).length;
      const lowDays = proteinValues.filter(p => p < 60).length;

      if (highDays >= 3 && lowDays >= 7) {
        patterns.push({
          type: 'mTOR Cycling',
          status: 'Active',
          compliance: Math.round(((highDays + lowDays) / 14) * 100)
        });
      }
    }

    // Pattern 2: Plant diversity
    const recentMeals = this.data.meals.slice(-7);
    const uniquePlants = new Set(
      recentMeals.flatMap(m =>
        (m.ingredients || [])
          .filter(i => this.isPlant(i.name))
          .map(i => i.name)
      )
    );

    if (uniquePlants.size >= 30) {
      patterns.push({
        type: 'Plant Diversity',
        status: 'Excellent',
        count: uniquePlants.size
      });
    }

    // Pattern 3: Intermittent fasting
    const mealTimes = recentMeals
      .map(m => m.mealTime)
      .filter(t => t);

    if (mealTimes.length > 0) {
      const avgHour = this.average(
        mealTimes.map(t => parseInt(t.split(':')[0]))
      );

      if (avgHour >= 16 && avgHour <= 20) {
        patterns.push({
          type: 'OMAD Protocol',
          status: 'Consistent',
          avgTime: `${Math.round(avgHour)}:00`
        });
      }
    }

    return patterns;
  }

  generateCostInsights(metrics) {
    const insights = [];

    // Most efficient nutrient source
    const efficiencies = Object.entries(metrics)
      .map(([nutrient, data]) => ({
        nutrient,
        efficiency: data.efficiency
      }))
      .sort((a, b) => b.efficiency - a.efficiency);

    if (efficiencies[0]) {
      insights.push(
        `Cea mai eficientă sursă: ${efficiencies[0].nutrient} (${efficiencies[0].efficiency}g/RON)`
      );
    }

    // Cost optimization opportunity
    const proteinCostPerGram = metrics.protein.cost / metrics.protein.total;
    if (proteinCostPerGram > 0.5) {
      insights.push(
        'Consideră surse de proteină mai accesibile (ouă, brânză cottage)'
      );
    }

    // Calorie efficiency
    const calorieCost = metrics.calories.cost / metrics.calories.total;
    if (calorieCost > 0.01) {
      insights.push(
        'Cost per calorie ridicat - adaugă carbohidrați complecși (orez, cartofi)'
      );
    }

    return insights;
  }

  generateComparativeInsights(comparisons) {
    const insights = [];

    // Cost trend
    const costTrend = this.calculateTrend(
      comparisons.charts.cost.map(c => c.value)
    );

    if (costTrend > 0) {
      insights.push({
        type: 'warning',
        message: `Costurile cresc cu ${Math.round(costTrend)}% lunar`
      });
    } else if (costTrend < -5) {
      insights.push({
        type: 'success',
        message: `Excelent! Ai redus costurile cu ${Math.abs(Math.round(costTrend))}%`
      });
    }

    // Nutrition improvement
    const nutritionTrend = this.calculateTrend(
      comparisons.charts.nutrition.map(c => c.score)
    );

    if (nutritionTrend > 0) {
      insights.push({
        type: 'success',
        message: 'Scorul nutrițional se îmbunătățește constant'
      });
    }

    // Diversity trend
    const latestDiversity = comparisons.charts.diversity[comparisons.charts.diversity.length - 1];
    if (latestDiversity && latestDiversity.plants >= 30) {
      insights.push({
        type: 'achievement',
        message: `Diversitate excelentă: ${latestDiversity.plants} plante unice`
      });
    }

    return insights;
  }

  calculateAchievements() {
    const achievements = [];

    // Check various milestones
    if (this.data.meals.length >= 30) {
      achievements.push({
        icon: '🏆',
        title: '30 Days Strong',
        description: 'Ai folosit sistemul pentru 30+ mese'
      });
    }

    const uniquePlants = new Set(
      this.data.meals.flatMap(m =>
        (m.ingredients || [])
          .filter(i => this.isPlant(i.name))
          .map(i => i.name)
      )
    );

    if (uniquePlants.size >= 50) {
      achievements.push({
        icon: '🌿',
        title: 'Plant Master',
        description: `${uniquePlants.size} plante diferite consumate`
      });
    }

    const avgCODEX = this.average(
      this.data.meals.map(m => m.codexScore || 0)
    );

    if (avgCODEX >= 80) {
      achievements.push({
        icon: '⭐',
        title: 'CODEX Champion',
        description: `Scor mediu CODEX: ${Math.round(avgCODEX)}`
      });
    }

    return achievements;
  }

  getTopAchievement(meals) {
    const achievements = [];

    // Check for streaks
    let currentStreak = 0;
    const today = new Date();

    for (let i = 0; i < 30; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);

      const hasMeal = meals.some(m => {
        const mealDate = new Date(m.timestamp);
        return mealDate.toDateString() === checkDate.toDateString();
      });

      if (hasMeal) {
        currentStreak++;
      } else {
        break;
      }
    }

    if (currentStreak >= 7) {
      return `${currentStreak} zile consecutive OMAD`;
    }

    // Check for high scores
    const bestScore = Math.max(...meals.map(m => m.codexScore || 0));
    if (bestScore >= 90) {
      return `Scor CODEX record: ${bestScore}`;
    }

    return 'Continuă să folosești sistemul pentru achievements';
  }

  getMainChallenge(meals) {
    // Identify the biggest area for improvement
    const avgProtein = this.average(meals.map(m => m.nutrition?.protein || 0));
    if (avgProtein < 80) {
      return 'Crește aportul de proteine la 100g+';
    }

    const avgScore = this.average(meals.map(m => m.codexScore || 0));
    if (avgScore < 70) {
      return 'Îmbunătățește scorul CODEX prin diversitate';
    }

    const avgCost = this.average(meals.map(m => m.totalCost || 0));
    if (avgCost > 100) {
      return 'Optimizează costurile - țintă <80 RON/zi';
    }

    return 'Menține consistența pentru rezultate optime';
  }

  calculateOverallTrend(meals) {
    if (meals.length < 7) return 'insufficient_data';

    // Compare last week with previous week
    const lastWeek = meals.slice(-7);
    const prevWeek = meals.slice(-14, -7);

    if (prevWeek.length < 7) return 'improving';

    const lastWeekScore = this.average(lastWeek.map(m => m.codexScore || 0));
    const prevWeekScore = this.average(prevWeek.map(m => m.codexScore || 0));

    const improvement = ((lastWeekScore - prevWeekScore) / prevWeekScore) * 100;

    if (improvement > 5) return 'significant_improvement';
    if (improvement > 0) return 'improving';
    if (improvement > -5) return 'stable';
    return 'declining';
  }

  convertToCSV(report) {
    // Simplified CSV conversion
    const rows = [];

    // Header
    rows.push(['N-OMAD Analytics Report', new Date().toLocaleDateString('ro-RO')]);
    rows.push([]);

    // Summary section
    rows.push(['SUMMARY']);
    rows.push(['Metric', 'Value']);
    rows.push(['Total Meals', report.summary.totalMeals]);
    rows.push(['Avg Daily Cost', report.summary.avgDailyCost + ' RON']);
    rows.push(['Avg Protein', report.summary.avgProtein + 'g']);
    rows.push(['Avg Calories', report.summary.avgCalories]);
    rows.push(['CODEX Score', report.summary.codexScore]);
    rows.push(['Plant Diversity', report.summary.plantDiversity]);
    rows.push([]);

    // Cost analysis
    rows.push(['COST PER NUTRIENT']);
    rows.push(['Nutrient', 'Total (g)', 'Cost (RON)', 'Efficiency (g/RON)']);
    Object.entries(report.costAnalysis.metrics).forEach(([nutrient, data]) => {
      rows.push([
        nutrient,
        data.total.toFixed(1),
        data.cost.toFixed(2),
        data.efficiency.toFixed(2)
      ]);
    });

    // Convert to CSV string
    return rows.map(row => row.join(',')).join('\n');
  }

  convertToMarkdown(report) {
    let md = '# N-OMAD Analytics Report\n\n';
    md += `Generated: ${new Date().toLocaleDateString('ro-RO')}\n\n`;

    // Executive Summary
    md += '## Executive Summary\n\n';
    md += `- **Total Meals**: ${report.summary.totalMeals}\n`;
    md += `- **Avg Daily Cost**: ${report.summary.avgDailyCost} RON\n`;
    md += `- **Avg Protein**: ${report.summary.avgProtein}g\n`;
    md += `- **Avg Calories**: ${report.summary.avgCalories}\n`;
    md += `- **CODEX Score**: ${report.summary.codexScore}/100\n`;
    md += `- **Plant Diversity**: ${report.summary.plantDiversity} unique plants\n`;
    md += `- **Trend**: ${report.summary.trend}\n\n`;

    // Cost Analysis
    md += '## Cost Per Nutrient Analysis\n\n';
    md += '| Nutrient | Total | Cost | Efficiency |\n';
    md += '|----------|-------|------|------------|\n';

    Object.entries(report.costAnalysis.metrics).forEach(([nutrient, data]) => {
      md += `| ${nutrient} | ${data.total.toFixed(1)}g | ${data.cost.toFixed(2)} RON | ${data.efficiency.toFixed(2)}g/RON |\n`;
    });

    md += '\n';

    // Deficiencies
    if (report.deficiencies.deficiencies.length > 0) {
      md += '## Nutritional Deficiencies\n\n';
      report.deficiencies.deficiencies.forEach(def => {
        md += `### ${def.nutrient}\n`;
        md += `- **Severity**: ${def.severity}\n`;
        md += `- **Trend**: ${def.trend > 0 ? 'Improving' : 'Declining'}\n`;
        md += `- **Recommendation**: ${def.recommendation}\n\n`;
      });
    }

    // Recommendations
    md += '## Recommendations\n\n';
    report.recommendations.forEach((rec, idx) => {
      md += `### ${idx + 1}. ${rec.title} (${rec.priority})\n`;
      md += `${rec.description}\n\n`;

      if (rec.suggestions && rec.suggestions.length > 0) {
        md += 'Suggestions:\n';
        rec.suggestions.forEach(sug => {
          md += `- ${sug}\n`;
        });
        md += '\n';
      }
    });

    // Achievements
    if (report.achievements.length > 0) {
      md += '## Achievements\n\n';
      report.achievements.forEach(ach => {
        md += `${ach.icon} **${ach.title}**: ${ach.description}\n\n`;
      });
    }

    return md;
  }

  generatePDFReport(report) {
    // This would require a PDF library like jsPDF
    // For now, return a structured object ready for PDF conversion
    return {
      format: 'A4',
      orientation: 'portrait',
      content: report,
      styles: {
        header: { fontSize: 18, bold: true },
        subheader: { fontSize: 14, bold: true },
        normal: { fontSize: 11 }
      },
      charts: {
        costTrend: report.comparisons.charts.cost,
        nutritionTrend: report.comparisons.charts.nutrition,
        diversityTrend: report.comparisons.charts.diversity
      }
    };
  }

  // Helper to get empty data structure
  getEmptyDataStructure() {
    return {
      recipes: [],
      meals: [],
      shopping: [],
      biomarkers: [],
      mtor: [],
      pantry: [],
      finance: [],
      timestamps: {
        firstEntry: null,
        lastUpdate: new Date().toISOString()
      }
    };
  }

  // Normalize meals data
  normalizeMeals(meals) {
    return meals.map(meal => ({
      ...meal,
      timestamp: meal.timestamp || meal.date || new Date().toISOString(),
      codexScore: meal.codexScore || this.calculateCODEXScore(meal),
      totalCost: meal.totalCost || this.estimateMealCost(meal)
    }));
  }

  // Normalize shopping data
  normalizeShopping(shopping) {
    return shopping.map(shop => ({
      ...shop,
      timestamp: shop.timestamp || shop.date || new Date().toISOString(),
      totalCost: shop.totalCost || this.calculateShoppingTotal(shop)
    }));
  }

  // Filter food-related transactions
  filterFoodTransactions(transactions) {
    const foodCategories = ['Alimente', 'Groceries', 'Supermarket', 'Restaurant'];

    return transactions.filter(t =>
      foodCategories.some(cat =>
        t.category?.toLowerCase().includes(cat.toLowerCase())
      )
    );
  }

  // Find earliest date in data
  findEarliestDate(sources) {
    const dates = [];

    Object.values(sources).forEach(source => {
      if (Array.isArray(source)) {
        source.forEach(item => {
          if (item.timestamp || item.date) {
            dates.push(new Date(item.timestamp || item.date));
          }
        });
      }
    });

    if (dates.length === 0) return null;

    dates.sort((a, b) => a - b);
    return dates[0].toISOString();
  }

  // Calculate CODEX score for a meal
  calculateCODEXScore(meal) {
    let score = 50; // Base score

    if (meal.nutrition) {
      // Protein target: 100g
      if (meal.nutrition.protein >= 100) score += 20;
      else score += (meal.nutrition.protein / 100) * 20;

      // Fiber target: 30g
      if (meal.nutrition.fiber >= 30) score += 15;
      else score += (meal.nutrition.fiber / 30) * 15;

      // Calorie range: 1800-2200
      if (meal.nutrition.calories >= 1800 && meal.nutrition.calories <= 2200) {
        score += 15;
      }
    }

    // Plant diversity
    if (meal.ingredients) {
      const plants = meal.ingredients.filter(i => this.isPlant(i.name));
      score += Math.min(plants.length * 2, 20);
    }

    return Math.min(Math.round(score), 100);
  }

  // Estimate meal cost
  estimateMealCost(meal) {
    if (!meal.ingredients) return 0;

    let totalCost = 0;

    meal.ingredients.forEach(ing => {
      const food = ROMANIAN_FOODS_DATABASE.find(f =>
        f.name.toLowerCase() === ing.name.toLowerCase()
      );

      if (food && food.price) {
        const amount = ing.amount || 100;
        const costPer100g = food.price;
        totalCost += (amount / 100) * costPer100g;
      }
    });

    return Math.round(totalCost * 100) / 100;
  }

  // Calculate shopping total
  calculateShoppingTotal(shop) {
    if (!shop.items) return 0;

    return shop.items.reduce((sum, item) => {
      return sum + (item.price || 0) * (item.quantity || 1);
    }, 0);
  }

  // Analyze a full year
  async analyzeYear(date) {
    const year = date.getFullYear();
    const yearMeals = this.data.meals.filter(meal => {
      const mealDate = new Date(meal.timestamp);
      return mealDate.getFullYear() === year;
    });

    return {
      label: year.toString(),
      totalCost: yearMeals.reduce((sum, m) => sum + (m.totalCost || 0), 0),
      avgProtein: this.average(yearMeals.map(m => m.nutrition?.protein || 0)),
      avgCalories: this.average(yearMeals.map(m => m.nutrition?.calories || 0)),
      nutritionScore: this.average(yearMeals.map(m => m.codexScore || 0)),
      uniquePlants: new Set(yearMeals.flatMap(m =>
        (m.ingredients || []).filter(i => this.isPlant(i.name)).map(i => i.name)
      )).size,
      uniqueRecipes: new Set(yearMeals.map(m => m.name)).size,
      codexCompliance: this.calculateCompliance(yearMeals, 'codex'),
      mtorCompliance: this.calculateCompliance(yearMeals, 'mtor'),
      costChange: 0
    };
  }
}

// Export singleton instance
export const analyticsEngine = new AnalyticsEngine();