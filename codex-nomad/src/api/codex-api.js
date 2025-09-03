// RESTful API pentru CODEX N-OMAD
import codexBridge from './bridge.js';

class CodexAPI {
  constructor() {
    this.bridge = codexBridge;
    this.routes = new Map();
    this.middlewares = [];
    this.initializeRoutes();
  }

  // Initialize API routes
  initializeRoutes() {
    // Recipe endpoints
    this.routes.set('GET /api/recipe/today', this.getTodayRecipe.bind(this));
    this.routes.set('GET /api/recipe/weekly', this.getWeeklyPlan.bind(this));
    this.routes.set('POST /api/recipe/generate', this.generateCustomRecipe.bind(this));
    
    // Analysis endpoints
    this.routes.set('POST /api/analyze/receipt', this.analyzeReceipt.bind(this));
    this.routes.set('POST /api/analyze/meal', this.analyzeMeal.bind(this));
    
    // Planning endpoints
    this.routes.set('GET /api/plan/shopping', this.getShoppingList.bind(this));
    this.routes.set('GET /api/plan/mtor', this.getMTORStatus.bind(this));
    
    // Profile endpoints
    this.routes.set('GET /api/profile/:name', this.getProfile.bind(this));
    this.routes.set('PUT /api/profile/:name', this.updateProfile.bind(this));
    
    // Integration endpoints
    this.routes.set('POST /api/sync/finance', this.syncWithFinance.bind(this));
    this.routes.set('GET /api/dashboard/metrics', this.getDashboardMetrics.bind(this));
  }

  // Middleware support
  use(middleware) {
    this.middlewares.push(middleware);
  }

  // Route handler
  async handleRequest(method, path, params = {}, body = {}) {
    const routeKey = `${method.toUpperCase()} ${path}`;
    const handler = this.routes.get(routeKey);
    
    if (!handler) {
      return this.notFound(path);
    }

    try {
      // Apply middlewares
      for (const middleware of this.middlewares) {
        const result = await middleware({ method, path, params, body });
        if (result && result.error) {
          return result;
        }
      }

      // Execute handler
      const result = await handler(params, body);
      return this.success(result);
      
    } catch (error) {
      return this.error(error.message, 500);
    }
  }

  // Recipe endpoints implementation
  async getTodayRecipe(params) {
    const date = params.date ? new Date(params.date) : new Date();
    return await this.bridge.getTodayRecipe(date);
  }

  async getWeeklyPlan(params) {
    const startDate = params.start_date ? new Date(params.start_date) : new Date();
    return await this.bridge.getWeeklyPlan(startDate);
  }

  async generateCustomRecipe(params, body) {
    const {
      ingredients = [],
      phase = 'high',
      preferences = {},
      restrictions = []
    } = body;

    await this.bridge.init();
    
    const customRecipe = this.bridge.instantPot.generateInstantPotRecipe(
      ingredients,
      phase
    );

    // Apply preferences and restrictions
    if (preferences.nico_safe) {
      customRecipe.ingredients = customRecipe.ingredients.filter(ing => 
        !restrictions.includes(ing.name.toLowerCase())
      );
    }

    return {
      success: true,
      data: {
        recipe: customRecipe,
        compliance: this.bridge.evaluateRecipeCompliance(customRecipe),
        estimated_cost: this.estimateRecipeCost(customRecipe)
      }
    };
  }

  // Analysis endpoints implementation
  async analyzeReceipt(params, body) {
    const { items = [], metadata = {} } = body;
    
    if (!Array.isArray(items) || items.length === 0) {
      return this.error('No items provided for analysis', 400);
    }

    const result = await this.bridge.analyzeReceipt(items);
    
    // Add metadata to result
    if (metadata.store_name) {
      result.data.store_info = {
        name: metadata.store_name,
        analysis_date: new Date().toISOString()
      };
    }

    return result;
  }

  async analyzeMeal(params, body) {
    const { meal_data, profile_name = 'Ioan' } = body;
    
    await this.bridge.init();
    
    const analysis = this.bridge.analyzer.analyzeItems(meal_data.ingredients || []);
    const profile = this.bridge.profiles.get(profile_name);
    
    if (profile) {
      analysis.profile_compliance = profile.analyzeMealCompliance(analysis);
    }

    return {
      success: true,
      data: analysis
    };
  }

  // Planning endpoints implementation
  async getShoppingList(params) {
    const {
      days = 7,
      start_date = new Date().toISOString(),
      include_prices = true,
      group_by_store = false
    } = params;

    const result = await this.bridge.getShoppingList();
    
    if (group_by_store) {
      result.data.store_organization = this.organizeByStore(result.data.shopping_list);
    }

    return result;
  }

  async getMTORStatus(params) {
    return await this.bridge.getCurrentMTORStatus();
  }

  // Profile endpoints implementation
  async getProfile(params) {
    const { name } = params;
    
    await this.bridge.init();
    
    const profile = this.bridge.profiles.get(name);
    if (!profile) {
      return this.error(`Profile ${name} not found`, 404);
    }

    return {
      success: true,
      data: {
        profile: profile,
        daily_goals: profile.getDailyGoals(),
        recommended_foods: profile.getRecommendedFoods()
      }
    };
  }

  async updateProfile(params, body) {
    const { name } = params;
    const updates = body;
    
    await this.bridge.init();
    
    const profile = this.bridge.profiles.get(name);
    if (!profile) {
      return this.error(`Profile ${name} not found`, 404);
    }

    // Update profile properties
    Object.keys(updates).forEach(key => {
      if (profile.hasOwnProperty(key)) {
        profile[key] = updates[key];
      }
    });

    // Recalculate derived properties
    profile.bmr = profile.calculateBMR();
    profile.targetCalories = profile.calculateTargetCalories();
    profile.macroTargets = profile.calculateMacroTargets();

    return {
      success: true,
      data: {
        profile: profile,
        message: `Profile ${name} updated successfully`
      }
    };
  }

  // Integration endpoints implementation
  async syncWithFinance(params, body) {
    const { transactions = [], budget_info = {} } = body;
    
    return await this.bridge.syncWithFinanceApp(transactions);
  }

  async getDashboardMetrics(params) {
    const {
      period = 'week',
      include_projections = true
    } = params;

    await this.bridge.init();

    const metrics = {
      current_mtor: await this.bridge.getCurrentMTORStatus(),
      weekly_plan: await this.bridge.getWeeklyPlan(),
      compliance_trends: this.calculateComplianceTrends(period),
      cost_analysis: this.calculateCostAnalysis(period)
    };

    if (include_projections) {
      metrics.projections = this.generateProjections();
    }

    return {
      success: true,
      data: metrics
    };
  }

  // Helper methods
  organizeByStore(shoppingList) {
    const storeMapping = {
      'proteins': ['Carrefour', 'Auchan'],
      'vegetables': ['Piața locală', 'Mega Image'],
      'spices': ['Magazin specialized', 'Online'],
      'other': ['Kaufland', 'Lidl']
    };

    const organization = {};
    
    shoppingList.forEach(item => {
      const stores = storeMapping[item.category] || storeMapping.other;
      const preferredStore = stores[0];
      
      if (!organization[preferredStore]) {
        organization[preferredStore] = [];
      }
      
      organization[preferredStore].push(item);
    });

    return organization;
  }

  estimateRecipeCost(recipe) {
    if (!recipe.ingredients) return 0;
    
    return recipe.ingredients.reduce((total, ingredient) => {
      const baseCost = {
        'proteins': 20,
        'vegetables': 3,
        'spices': 5
      };
      
      const category = ingredient.category || 'other';
      const cost = baseCost[category] || 5;
      
      return total + (cost * (ingredient.quantity || 1) / 100);
    }, 0);
  }

  calculateComplianceTrends(period) {
    // Mock compliance trends calculation
    return {
      plant_diversity: {
        current: 85,
        trend: 'increasing',
        change: 5
      },
      mtor_adherence: {
        current: 92,
        trend: 'stable',
        change: 0
      },
      anti_inflammatory: {
        current: 78,
        trend: 'improving',
        change: 8
      }
    };
  }

  calculateCostAnalysis(period) {
    // Mock cost analysis
    return {
      average_daily_cost: 45,
      monthly_projection: 1350,
      cost_per_plant_species: 3.2,
      efficiency_score: 87
    };
  }

  generateProjections() {
    return {
      next_week_cost: 315,
      plant_goal_achievement: 94,
      potential_savings: 45,
      health_score_projection: 88
    };
  }

  // Response helpers
  success(data, message = 'Success') {
    return {
      success: true,
      message,
      data,
      timestamp: new Date().toISOString()
    };
  }

  error(message, statusCode = 400) {
    return {
      success: false,
      error: message,
      statusCode,
      timestamp: new Date().toISOString()
    };
  }

  notFound(path) {
    return this.error(`Route ${path} not found`, 404);
  }

  // Middleware examples
  static authMiddleware() {
    return async ({ headers }) => {
      // Mock authentication
      if (!headers?.authorization) {
        return {
          error: 'Authorization required',
          statusCode: 401
        };
      }
      
      return null; // Continue processing
    };
  }

  static corsMiddleware() {
    return async (req) => {
      // Mock CORS handling
      return null;
    };
  }

  static rateLimitMiddleware(maxRequests = 100) {
    const requests = new Map();
    
    return async ({ headers }) => {
      const clientId = headers?.['client-id'] || 'anonymous';
      const count = requests.get(clientId) || 0;
      
      if (count >= maxRequests) {
        return {
          error: 'Rate limit exceeded',
          statusCode: 429
        };
      }
      
      requests.set(clientId, count + 1);
      return null;
    };
  }
}

export default CodexAPI;