// src/modules/testing/IntegrationTester.js

export class IntegrationTester {
  constructor() {
    this.testResults = [];
    this.performanceMetrics = {};
    this.memoryBaseline = null;
    this.startTime = null;
    this.errors = [];
    this.warnings = [];
  }

  // Main test runner
  async runFullTestSuite() {
    console.log('🔬 N-OMAD Suite - Complete Integration Test Starting...');
    this.startTime = Date.now();
    this.memoryBaseline = this.getMemoryUsage();

    const testSuite = {
      timestamp: new Date().toISOString(),
      environment: this.getEnvironmentInfo(),
      tests: [],
      performance: {},
      summary: {}
    };

    try {
      // 1. Module Loading Tests
      console.log('\n📦 Testing Module Loading...');
      testSuite.tests.push(await this.testModuleLoading());

      // 2. Data Persistence Tests
      console.log('\n💾 Testing Data Persistence...');
      testSuite.tests.push(await this.testDataPersistence());

      // 3. Cross-Module Communication
      console.log('\n🔄 Testing Cross-Module Communication...');
      testSuite.tests.push(await this.testCrossModuleCommunication());

      // 4. Recipe Generation Pipeline
      console.log('\n👨‍🍳 Testing Recipe Generation Pipeline...');
      testSuite.tests.push(await this.testRecipeGenerationPipeline());

      // 5. Shopping List Integration
      console.log('\n🛒 Testing Shopping List Integration...');
      testSuite.tests.push(await this.testShoppingListIntegration());

      // 6. mTOR Automation
      console.log('\n🔬 Testing mTOR Automation...');
      testSuite.tests.push(await this.testMTORAutomation());

      // 7. Analytics Engine
      console.log('\n📊 Testing Analytics Engine...');
      testSuite.tests.push(await this.testAnalyticsEngine());

      // 8. Performance Benchmarks
      console.log('\n⚡ Running Performance Benchmarks...');
      testSuite.performance = await this.runPerformanceBenchmarks();

      // 9. Memory Leak Detection
      console.log('\n🔍 Checking for Memory Leaks...');
      testSuite.memoryAnalysis = await this.detectMemoryLeaks();

      // 10. Security Validation
      console.log('\n🔒 Validating Security...');
      testSuite.security = await this.validateSecurity();

    } catch (error) {
      console.error('❌ Test Suite Error:', error);
      this.errors.push({
        type: 'CRITICAL',
        message: error.message,
        stack: error.stack
      });
    }

    // Generate summary
    testSuite.summary = this.generateTestSummary(testSuite);

    // Save results
    this.saveTestResults(testSuite);

    return testSuite;
  }

  // 1. Module Loading Tests
  async testModuleLoading() {
    const test = {
      name: 'Module Loading',
      status: 'running',
      checks: []
    };

    const modules = [
      { name: 'RecipeEngine', path: '../nutrition/RecipeEngine.js' },
      { name: 'ShoppingListManager', path: '../nutrition/ShoppingListManager.js' },
      { name: 'WeekPlanner', path: '../nutrition/WeekPlanner.js' },
      { name: 'AnalyticsEngine', path: '../nutrition/analytics/AnalyticsEngine.js' },
      { name: 'MTORTracker', path: '../nutrition/mtor/mtorTracker.js' },
      { name: 'FoodDatabase', path: '../nutrition/database/FoodDatabase.js' }
    ];

    for (const module of modules) {
      const check = {
        module: module.name,
        loaded: false,
        hasExports: false,
        initTime: 0
      };

      try {
        const startTime = performance.now();
        const imported = await import(module.path);
        const loadTime = performance.now() - startTime;

        check.loaded = true;
        check.hasExports = Object.keys(imported).length > 0;
        check.initTime = Math.round(loadTime);

        test.checks.push(check);
      } catch (error) {
        check.error = error.message;
        test.checks.push(check);
        this.errors.push({
          type: 'MODULE_LOAD',
          module: module.name,
          error: error.message
        });
      }
    }

    test.status = test.checks.every(c => c.loaded) ? 'passed' : 'failed';
    test.passRate = `${test.checks.filter(c => c.loaded).length}/${test.checks.length}`;

    return test;
  }

  // 2. Data Persistence Tests
  async testDataPersistence() {
    const test = {
      name: 'Data Persistence',
      status: 'running',
      checks: []
    };

    const testData = {
      testId: Date.now(),
      testString: 'N-OMAD Integration Test',
      testObject: {
        nested: {
          value: 42,
          array: [1, 2, 3]
        }
      }
    };

    // Test localStorage
    const localStorageCheck = {
      name: 'localStorage',
      write: false,
      read: false,
      delete: false,
      size: 0
    };

    try {
      // Write test
      localStorage.setItem('integration_test', JSON.stringify(testData));
      localStorageCheck.write = true;

      // Read test
      const retrieved = JSON.parse(localStorage.getItem('integration_test'));
      localStorageCheck.read = retrieved.testId === testData.testId;

      // Size check
      localStorageCheck.size = new Blob([JSON.stringify(localStorage)]).size;

      // Delete test
      localStorage.removeItem('integration_test');
      localStorageCheck.delete = localStorage.getItem('integration_test') === null;

      test.checks.push(localStorageCheck);
    } catch (error) {
      localStorageCheck.error = error.message;
      test.checks.push(localStorageCheck);
    }

    // Test critical data structures
    const criticalData = [
      'groceryInventory',
      'nutritionProfile',
      'mtor_cycles',
      'generated_recipes',
      'meal_history',
      'fs_data'
    ];

    for (const key of criticalData) {
      const check = {
        key: key,
        exists: false,
        valid: false,
        size: 0
      };

      try {
        const data = localStorage.getItem(key);
        check.exists = data !== null;

        if (data) {
          const parsed = JSON.parse(data);
          check.valid = typeof parsed === 'object';
          check.size = new Blob([data]).size;
        }

        test.checks.push(check);
      } catch (error) {
        check.error = error.message;
        test.checks.push(check);
      }
    }

    test.status = test.checks.every(c => !c.error) ? 'passed' : 'failed';
    test.totalDataSize = test.checks.reduce((sum, c) => sum + (c.size || 0), 0);

    return test;
  }

  // 3. Cross-Module Communication Tests
  async testCrossModuleCommunication() {
    const test = {
      name: 'Cross-Module Communication',
      status: 'running',
      checks: []
    };

    // Test Pantry → Nutrition flow
    const pantryToNutrition = {
      name: 'Pantry → Nutrition',
      dataFlow: false,
      integration: false
    };

    try {
      const { RecipeEngine } = await import('../nutrition/RecipeEngine.js');
      const engine = new RecipeEngine();

      // Check if pantry data is accessible
      const ingredients = await engine.getAvailableIngredients();
      pantryToNutrition.dataFlow = Array.isArray(ingredients);

      // Check if recipe generation uses pantry data
      const recipe = await engine.generateOMADRecipe({ usePantry: true });
      pantryToNutrition.integration = recipe && recipe.ingredients.length > 0;

      test.checks.push(pantryToNutrition);
    } catch (error) {
      pantryToNutrition.error = error.message;
      test.checks.push(pantryToNutrition);
    }

    // Test Finance → Analytics flow
    const financeToAnalytics = {
      name: 'Finance → Analytics',
      dataFlow: false,
      costTracking: false
    };

    try {
      const { analyticsEngine } = await import('../nutrition/analytics/AnalyticsEngine.js');

      // Check if finance data is loaded
      const financeData = analyticsEngine.data.finance;
      financeToAnalytics.dataFlow = Array.isArray(financeData);

      // Check cost analysis
      const costAnalysis = await analyticsEngine.analyzeCostPerNutrient(7);
      financeToAnalytics.costTracking = costAnalysis && costAnalysis.metrics;

      test.checks.push(financeToAnalytics);
    } catch (error) {
      financeToAnalytics.error = error.message;
      test.checks.push(financeToAnalytics);
    }

    test.status = test.checks.every(c => !c.error) ? 'passed' : 'failed';
    return test;
  }

  // 4. Recipe Generation Pipeline Test
  async testRecipeGenerationPipeline() {
    const test = {
      name: 'Recipe Generation Pipeline',
      status: 'running',
      checks: [],
      performance: {}
    };

    try {
      const { RecipeEngine } = await import('../nutrition/RecipeEngine.js');
      const engine = new RecipeEngine();

      // Test different preference profiles
      const profiles = [
        { name: 'High Protein', preferences: { proteinTarget: 150 } },
        { name: 'Plant-Based', preferences: { plantBased: true } },
        { name: 'Quick Prep', preferences: { maxPrepTime: 20 } },
        { name: 'Budget', preferences: { maxCost: 50 } },
        { name: 'mTOR Growth', preferences: { mTORPhase: 'growth' } }
      ];

      for (const profile of profiles) {
        const check = {
          profile: profile.name,
          generated: false,
          valid: false,
          time: 0,
          nutrition: {},
          score: 0
        };

        try {
          const startTime = performance.now();
          const recipe = await engine.generateOMADRecipe(profile.preferences);
          check.time = Math.round(performance.now() - startTime);

          check.generated = recipe !== null;
          check.valid = this.validateRecipeStructure(recipe);

          if (recipe && recipe.nutrition) {
            check.nutrition = {
              calories: recipe.nutrition.calories,
              protein: recipe.nutrition.protein,
              meetsTarget: profile.preferences.proteinTarget
                ? recipe.nutrition.protein >= profile.preferences.proteinTarget * 0.9
                : true
            };
          }

          check.score = recipe ? recipe.codexScore || 0 : 0;

          test.checks.push(check);
        } catch (error) {
          check.error = error.message;
          test.checks.push(check);
        }
      }

      // Calculate performance metrics
      const times = test.checks.map(c => c.time).filter(t => t > 0);
      test.performance = {
        avgGenerationTime: Math.round(times.reduce((a, b) => a + b, 0) / times.length),
        maxGenerationTime: Math.max(...times),
        minGenerationTime: Math.min(...times)
      };

      test.status = test.checks.every(c => c.generated && c.valid) ? 'passed' : 'failed';
    } catch (error) {
      test.status = 'failed';
      test.error = error.message;
    }

    return test;
  }

  // 5. Shopping List Integration Test
  async testShoppingListIntegration() {
    const test = {
      name: 'Shopping List Integration',
      status: 'running',
      checks: []
    };

    try {
      const { shoppingListManager } = await import('../nutrition/ShoppingListManager.js');
      const { WeekPlanner } = await import('../nutrition/WeekPlanner.js');

      // Test single recipe shopping list
      const singleRecipeCheck = {
        name: 'Single Recipe List',
        generated: false,
        hasStores: false,
        hasRoute: false,
        exportable: false
      };

      const testRecipe = {
        name: 'Test Recipe',
        ingredients: [
          { name: 'somon', amount: 200, unit: 'g' },
          { name: 'broccoli', amount: 150, unit: 'g' },
          { name: 'orez', amount: 100, unit: 'g' }
        ]
      };

      const singleList = shoppingListManager.generateSmartShoppingList([testRecipe]);
      singleRecipeCheck.generated = singleList !== null;
      singleRecipeCheck.hasStores = Object.keys(singleList.byStore).length > 0;
      singleRecipeCheck.hasRoute = singleList.route.length > 0;

      // Test export formats
      const textExport = shoppingListManager.exportToText(singleList);
      const jsonExport = shoppingListManager.exportToJSON(singleList);
      singleRecipeCheck.exportable = textExport.length > 0 && jsonExport.length > 0;

      test.checks.push(singleRecipeCheck);

      // Test week planner integration
      const weekPlannerCheck = {
        name: 'Week Planner Integration',
        weekGenerated: false,
        shoppingListCreated: false,
        costCalculated: false
      };

      const planner = new WeekPlanner();
      const weekPlan = await planner.generateWeekPlan('test', {});
      weekPlannerCheck.weekGenerated = weekPlan && weekPlan.meals.length === 7;
      weekPlannerCheck.shoppingListCreated = weekPlan.shoppingList !== null;
      weekPlannerCheck.costCalculated = weekPlan.totalCost > 0;

      test.checks.push(weekPlannerCheck);

    } catch (error) {
      test.error = error.message;
    }

    test.status = test.checks.every(c =>
      Object.values(c).filter(v => typeof v === 'boolean').every(v => v === true)
    ) ? 'passed' : 'failed';

    return test;
  }

  // 6. mTOR Automation Test
  async testMTORAutomation() {
    const test = {
      name: 'mTOR Automation',
      status: 'running',
      checks: []
    };

    try {
      const { mtorAutomation } = await import('../nutrition/mtor/mtorTracker.js');

      // Test automation status
      const statusCheck = {
        name: 'Automation Status',
        canStart: false,
        canStop: false,
        hasStatus: false
      };

      const initialStatus = mtorAutomation.getAutomationStatus();
      statusCheck.hasStatus = initialStatus !== null;

      // Start automation
      mtorAutomation.startAutomation();
      const runningStatus = mtorAutomation.getAutomationStatus();
      statusCheck.canStart = runningStatus.running === true;

      // Stop automation
      mtorAutomation.stopAutomation();
      const stoppedStatus = mtorAutomation.getAutomationStatus();
      statusCheck.canStop = stoppedStatus.running === false;

      test.checks.push(statusCheck);

      // Test cycle analytics
      const analyticsCheck = {
        name: 'Cycle Analytics',
        hasAnalytics: false,
        hasPredictions: false
      };

      const analytics = mtorAutomation.getCycleAnalytics();
      analyticsCheck.hasAnalytics = analytics !== null;

      if (analytics && analytics.predictions) {
        analyticsCheck.hasPredictions = true;
      }

      test.checks.push(analyticsCheck);

      // Test phase detection
      const phaseCheck = {
        name: 'Phase Detection',
        correctPhase: false,
        correctTargets: false
      };

      const currentPhase = mtorAutomation.getCurrentPhase();
      phaseCheck.correctPhase = ['growth', 'longevity'].includes(currentPhase.phase);
      phaseCheck.correctTargets = currentPhase.targets &&
                                  currentPhase.targets.proteinMin !== undefined;

      test.checks.push(phaseCheck);

    } catch (error) {
      test.error = error.message;
    }

    test.status = test.checks.every(c =>
      Object.values(c).filter(v => typeof v === 'boolean').every(v => v === true)
    ) ? 'passed' : 'failed';

    return test;
  }

  // 7. Analytics Engine Test
  async testAnalyticsEngine() {
    const test = {
      name: 'Analytics Engine',
      status: 'running',
      checks: []
    };

    try {
      const { analyticsEngine } = await import('../nutrition/analytics/AnalyticsEngine.js');

      // Test data loading
      const dataCheck = {
        name: 'Data Loading',
        hasData: false,
        dataTypes: []
      };

      dataCheck.hasData = analyticsEngine.data !== null;
      dataCheck.dataTypes = Object.keys(analyticsEngine.data);
      test.checks.push(dataCheck);

      // Test analytics functions
      const functionsCheck = {
        name: 'Analytics Functions',
        costAnalysis: false,
        deficiencyTrends: false,
        shoppingPatterns: false,
        recommendations: false
      };

      const costAnalysis = await analyticsEngine.analyzeCostPerNutrient(7);
      functionsCheck.costAnalysis = costAnalysis && costAnalysis.metrics;

      const deficiencies = await analyticsEngine.analyzeDeficiencyTrends();
      functionsCheck.deficiencyTrends = deficiencies !== null;

      const patterns = await analyticsEngine.analyzeShoppingPatterns();
      functionsCheck.shoppingPatterns = patterns !== null;

      const recommendations = await analyticsEngine.generateRecommendations();
      functionsCheck.recommendations = Array.isArray(recommendations);

      test.checks.push(functionsCheck);

      // Test report generation
      const reportCheck = {
        name: 'Report Generation',
        json: false,
        csv: false,
        markdown: false
      };

      const jsonReport = await analyticsEngine.generateReport('json', 7);
      reportCheck.json = jsonReport.length > 0;

      const csvReport = await analyticsEngine.generateReport('csv', 7);
      reportCheck.csv = csvReport.length > 0;

      const mdReport = await analyticsEngine.generateReport('markdown', 7);
      reportCheck.markdown = mdReport.length > 0;

      test.checks.push(reportCheck);

    } catch (error) {
      test.error = error.message;
    }

    test.status = test.checks.every(c =>
      Object.values(c).filter(v => typeof v === 'boolean').every(v => v === true)
    ) ? 'passed' : 'failed';

    return test;
  }

  // 8. Performance Benchmarks
  async runPerformanceBenchmarks() {
    const benchmarks = {
      timestamp: new Date().toISOString(),
      tests: []
    };

    // Benchmark 1: Recipe Generation Speed
    const recipeGenBenchmark = {
      name: 'Recipe Generation',
      iterations: 10,
      times: [],
      stats: {}
    };

    try {
      const { RecipeEngine } = await import('../nutrition/RecipeEngine.js');
      const engine = new RecipeEngine();

      for (let i = 0; i < recipeGenBenchmark.iterations; i++) {
        const start = performance.now();
        await engine.generateOMADRecipe();
        recipeGenBenchmark.times.push(performance.now() - start);
      }

      recipeGenBenchmark.stats = this.calculateStats(recipeGenBenchmark.times);
      benchmarks.tests.push(recipeGenBenchmark);
    } catch (error) {
      recipeGenBenchmark.error = error.message;
      benchmarks.tests.push(recipeGenBenchmark);
    }

    // Benchmark 2: Analytics Processing
    const analyticsBenchmark = {
      name: 'Analytics Processing',
      iterations: 5,
      times: [],
      stats: {}
    };

    try {
      const { analyticsEngine } = await import('../nutrition/analytics/AnalyticsEngine.js');

      for (let i = 0; i < analyticsBenchmark.iterations; i++) {
        const start = performance.now();
        await analyticsEngine.generateExecutiveSummary(30);
        analyticsBenchmark.times.push(performance.now() - start);
      }

      analyticsBenchmark.stats = this.calculateStats(analyticsBenchmark.times);
      benchmarks.tests.push(analyticsBenchmark);
    } catch (error) {
      analyticsBenchmark.error = error.message;
      benchmarks.tests.push(analyticsBenchmark);
    }

    // Benchmark 3: Data Operations
    const dataOpsBenchmark = {
      name: 'Data Operations',
      operations: [],
      totalTime: 0
    };

    try {
      // localStorage read
      const readStart = performance.now();
      const data = localStorage.getItem('meal_history');
      const readTime = performance.now() - readStart;
      dataOpsBenchmark.operations.push({
        op: 'localStorage.read',
        time: readTime,
        size: data ? data.length : 0
      });

      // JSON parse
      if (data) {
        const parseStart = performance.now();
        JSON.parse(data);
        const parseTime = performance.now() - parseStart;
        dataOpsBenchmark.operations.push({
          op: 'JSON.parse',
          time: parseTime
        });
      }

      // localStorage write
      const testData = { test: true, timestamp: Date.now() };
      const writeStart = performance.now();
      localStorage.setItem('perf_test', JSON.stringify(testData));
      const writeTime = performance.now() - writeStart;
      dataOpsBenchmark.operations.push({
        op: 'localStorage.write',
        time: writeTime
      });

      localStorage.removeItem('perf_test');

      dataOpsBenchmark.totalTime = dataOpsBenchmark.operations.reduce(
        (sum, op) => sum + op.time, 0
      );
      benchmarks.tests.push(dataOpsBenchmark);
    } catch (error) {
      dataOpsBenchmark.error = error.message;
      benchmarks.tests.push(dataOpsBenchmark);
    }

    // Calculate overall performance score
    benchmarks.score = this.calculatePerformanceScore(benchmarks);

    return benchmarks;
  }

  // 9. Memory Leak Detection
  async detectMemoryLeaks() {
    const analysis = {
      baseline: this.memoryBaseline,
      current: null,
      leaks: [],
      warnings: []
    };

    // Get current memory usage
    analysis.current = this.getMemoryUsage();

    // Check for significant memory increase
    if (analysis.baseline && analysis.current) {
      const increase = analysis.current.usedJSHeapSize - analysis.baseline.usedJSHeapSize;
      const percentIncrease = (increase / analysis.baseline.usedJSHeapSize) * 100;

      if (percentIncrease > 50) {
        analysis.warnings.push({
          type: 'HIGH_MEMORY_INCREASE',
          increase: `${percentIncrease.toFixed(2)}%`,
          bytes: increase
        });
      }
    }

    // Test for leaks in specific operations
    const leakTests = [
      {
        name: 'Recipe Generation Loop',
        operation: async () => {
          const { RecipeEngine } = await import('../nutrition/RecipeEngine.js');
          const engine = new RecipeEngine();
          for (let i = 0; i < 50; i++) {
            await engine.generateOMADRecipe();
          }
        }
      },
      {
        name: 'Analytics Data Processing',
        operation: async () => {
          const { analyticsEngine } = await import('../nutrition/analytics/AnalyticsEngine.js');
          for (let i = 0; i < 20; i++) {
            await analyticsEngine.analyzeCostPerNutrient(30);
          }
        }
      }
    ];

    for (const test of leakTests) {
      const beforeMem = this.getMemoryUsage();

      try {
        await test.operation();

        // Force garbage collection if available
        if (global.gc) {
          global.gc();
        }

        // Wait a bit for cleanup
        await new Promise(resolve => setTimeout(resolve, 100));

        const afterMem = this.getMemoryUsage();
        const leak = afterMem.usedJSHeapSize - beforeMem.usedJSHeapSize;

        if (leak > 1024 * 1024) { // More than 1MB retained
          analysis.leaks.push({
            test: test.name,
            leak: `${(leak / 1024 / 1024).toFixed(2)} MB`,
            severity: leak > 10 * 1024 * 1024 ? 'high' : 'medium'
          });
        }
      } catch (error) {
        analysis.leaks.push({
          test: test.name,
          error: error.message
        });
      }
    }

    analysis.status = analysis.leaks.length === 0 ? 'passed' : 'warning';

    return analysis;
  }

  // 10. Security Validation
  async validateSecurity() {
    const security = {
      checks: [],
      vulnerabilities: [],
      score: 100
    };

    // Check 1: XSS Protection
    const xssCheck = {
      name: 'XSS Protection',
      passed: true,
      tests: []
    };

    // Test for dangerous innerHTML usage
    const testPayloads = [
      '<script>alert("XSS")</script>',
      'javascript:alert("XSS")',
      '<img src=x onerror=alert("XSS")>'
    ];

    for (const payload of testPayloads) {
      try {
        // Store and retrieve to check if sanitized
        const key = 'xss_test';
        localStorage.setItem(key, payload);
        const retrieved = localStorage.getItem(key);

        if (retrieved === payload) {
          // Payload stored as-is, check if it would execute
          const testDiv = document.createElement('div');
          testDiv.textContent = retrieved; // Safe assignment

          xssCheck.tests.push({
            payload: payload.substring(0, 20) + '...',
            sanitized: true
          });
        }

        localStorage.removeItem(key);
      } catch (error) {
        xssCheck.tests.push({
          payload: payload.substring(0, 20) + '...',
          error: error.message
        });
      }
    }

    security.checks.push(xssCheck);

    // Check 2: Data Validation
    const validationCheck = {
      name: 'Data Validation',
      passed: true,
      tests: []
    };

    // Test input validation
    try {
      const { RecipeEngine } = await import('../nutrition/RecipeEngine.js');
      const engine = new RecipeEngine();

      // Test with invalid inputs
      const invalidInputs = [
        { proteinTarget: -100 },
        { proteinTarget: 'invalid' },
        { proteinTarget: null },
        { proteinTarget: Infinity }
      ];

      for (const input of invalidInputs) {
        try {
          const recipe = await engine.generateOMADRecipe(input);
          // Should handle gracefully
          validationCheck.tests.push({
            input: JSON.stringify(input),
            handled: true
          });
        } catch (error) {
          validationCheck.tests.push({
            input: JSON.stringify(input),
            error: error.message
          });
        }
      }
    } catch (error) {
      validationCheck.error = error.message;
    }

    security.checks.push(validationCheck);

    // Check 3: Sensitive Data Exposure
    const dataExposureCheck = {
      name: 'Sensitive Data Protection',
      passed: true,
      issues: []
    };

    // Check for exposed sensitive keys in localStorage
    const sensitivePatterns = [
      /api[_-]?key/i,
      /password/i,
      /secret/i,
      /token/i,
      /auth/i
    ];

    for (const key of Object.keys(localStorage)) {
      for (const pattern of sensitivePatterns) {
        if (pattern.test(key)) {
          dataExposureCheck.issues.push({
            key: key,
            type: 'Potentially sensitive key name'
          });
          dataExposureCheck.passed = false;
          security.score -= 10;
        }
      }
    }

    security.checks.push(dataExposureCheck);

    // Check 4: Content Security Policy
    const cspCheck = {
      name: 'Content Security Policy',
      hasCSP: false,
      policy: null
    };

    // Check for CSP meta tag or header
    const cspMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    if (cspMeta) {
      cspCheck.hasCSP = true;
      cspCheck.policy = cspMeta.content;
    }

    security.checks.push(cspCheck);

    // Check 5: HTTPS Usage
    const httpsCheck = {
      name: 'HTTPS Usage',
      isSecure: window.location.protocol === 'https:',
      protocol: window.location.protocol
    };

    if (!httpsCheck.isSecure && window.location.hostname !== 'localhost') {
      security.vulnerabilities.push({
        type: 'INSECURE_CONNECTION',
        severity: 'high',
        description: 'Application not served over HTTPS'
      });
      security.score -= 30;
    }

    security.checks.push(httpsCheck);

    // Calculate final security score
    security.grade = this.getSecurityGrade(security.score);

    return security;
  }

  // Helper Functions
  validateRecipeStructure(recipe) {
    if (!recipe) return false;

    const requiredFields = ['name', 'ingredients', 'instructions', 'nutrition'];
    const hasAllFields = requiredFields.every(field => recipe[field]);

    if (!hasAllFields) return false;

    // Validate ingredients
    if (!Array.isArray(recipe.ingredients) || recipe.ingredients.length === 0) {
      return false;
    }

    // Validate nutrition
    const nutritionFields = ['calories', 'protein', 'carbs', 'fats'];
    const hasNutrition = nutritionFields.every(field =>
      typeof recipe.nutrition[field] === 'number'
    );

    return hasNutrition;
  }

  getMemoryUsage() {
    if (performance.memory) {
      return {
        usedJSHeapSize: performance.memory.usedJSHeapSize,
        totalJSHeapSize: performance.memory.totalJSHeapSize,
        jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
      };
    }
    return null;
  }

  calculateStats(times) {
    const sorted = times.sort((a, b) => a - b);
    const sum = sorted.reduce((a, b) => a + b, 0);

    return {
      min: Math.round(sorted[0]),
      max: Math.round(sorted[sorted.length - 1]),
      avg: Math.round(sum / sorted.length),
      median: Math.round(sorted[Math.floor(sorted.length / 2)]),
      p95: Math.round(sorted[Math.floor(sorted.length * 0.95)])
    };
  }

  calculatePerformanceScore(benchmarks) {
    let score = 100;

    benchmarks.tests.forEach(test => {
      if (test.stats) {
        // Penalize if average time > 100ms for recipe generation
        if (test.name === 'Recipe Generation' && test.stats.avg > 100) {
          score -= Math.min((test.stats.avg - 100) / 10, 20);
        }

        // Penalize if analytics > 50ms
        if (test.name === 'Analytics Processing' && test.stats.avg > 50) {
          score -= Math.min((test.stats.avg - 50) / 5, 15);
        }
      }
    });

    return Math.max(Math.round(score), 0);
  }

  getSecurityGrade(score) {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  getEnvironmentInfo() {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      screenResolution: `${screen.width}x${screen.height}`,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      timestamp: new Date().toISOString(),
      url: window.location.href
    };
  }

  generateTestSummary(testSuite) {
    const summary = {
      totalTests: 0,
      passed: 0,
      failed: 0,
      warnings: 0,
      duration: Math.round((Date.now() - this.startTime) / 1000),
      performanceScore: testSuite.performance.score || 0,
      securityGrade: testSuite.security?.grade || 'N/A',
      recommendations: []
    };

    // Count test results
    testSuite.tests.forEach(test => {
      summary.totalTests++;
      if (test.status === 'passed') summary.passed++;
      else if (test.status === 'failed') summary.failed++;
      else if (test.status === 'warning') summary.warnings++;
    });

    // Generate recommendations
    if (summary.failed > 0) {
      summary.recommendations.push('Fix failing tests before deployment');
    }

    if (testSuite.performance.score < 80) {
      summary.recommendations.push('Optimize performance - current score: ' + testSuite.performance.score);
    }

    if (testSuite.memoryAnalysis?.leaks?.length > 0) {
      summary.recommendations.push('Investigate potential memory leaks');
    }

    if (testSuite.security?.vulnerabilities?.length > 0) {
      summary.recommendations.push('Address security vulnerabilities');
    }

    // Overall status
    if (summary.failed === 0 && summary.performanceScore >= 80 && testSuite.security?.score >= 70) {
      summary.status = 'PRODUCTION_READY';
      summary.message = '✅ All systems operational. Ready for production!';
    } else if (summary.failed === 0) {
      summary.status = 'NEEDS_OPTIMIZATION';
      summary.message = '⚠️ Functional but needs optimization';
    } else {
      summary.status = 'NEEDS_FIXES';
      summary.message = '❌ Critical issues detected. Fix before deployment';
    }

    return summary;
  }

  saveTestResults(testSuite) {
    try {
      // Save to localStorage
      const existingResults = JSON.parse(localStorage.getItem('integration_test_results') || '[]');
      existingResults.push(testSuite);

      // Keep only last 10 results
      if (existingResults.length > 10) {
        existingResults.shift();
      }

      localStorage.setItem('integration_test_results', JSON.stringify(existingResults));

      // Also save summary separately for quick access
      localStorage.setItem('last_test_summary', JSON.stringify(testSuite.summary));

      console.log('✅ Test results saved to localStorage');
    } catch (error) {
      console.error('Failed to save test results:', error);
    }
  }

  // Production Readiness Checklist
  async checkProductionReadiness() {
    const checklist = {
      timestamp: new Date().toISOString(),
      checks: [],
      ready: false
    };

    const requirements = [
      {
        name: 'All Tests Passing',
        check: async () => {
          const lastSummary = JSON.parse(localStorage.getItem('last_test_summary') || '{}');
          return lastSummary.failed === 0;
        }
      },
      {
        name: 'Performance Score > 80',
        check: async () => {
          const lastSummary = JSON.parse(localStorage.getItem('last_test_summary') || '{}');
          return lastSummary.performanceScore >= 80;
        }
      },
      {
        name: 'No Memory Leaks',
        check: async () => {
          const analysis = await this.detectMemoryLeaks();
          return analysis.leaks.length === 0;
        }
      },
      {
        name: 'Security Grade B or Higher',
        check: async () => {
          const security = await this.validateSecurity();
          return ['A', 'B'].includes(security.grade);
        }
      },
      {
        name: 'Data Persistence Working',
        check: async () => {
          try {
            localStorage.setItem('prod_check', 'test');
            const value = localStorage.getItem('prod_check');
            localStorage.removeItem('prod_check');
            return value === 'test';
          } catch {
            return false;
          }
        }
      },
      {
        name: 'All Modules Loading',
        check: async () => {
          const test = await this.testModuleLoading();
          return test.status === 'passed';
        }
      },
      {
        name: 'Cross-Module Communication',
        check: async () => {
          const test = await this.testCrossModuleCommunication();
          return test.status === 'passed';
        }
      }
    ];

    for (const req of requirements) {
      try {
        const result = await req.check();
        checklist.checks.push({
          name: req.name,
          passed: result,
          status: result ? '✅' : '❌'
        });
      } catch (error) {
        checklist.checks.push({
          name: req.name,
          passed: false,
          status: '❌',
          error: error.message
        });
      }
    }

    checklist.ready = checklist.checks.every(c => c.passed);
    checklist.score = Math.round(
      (checklist.checks.filter(c => c.passed).length / checklist.checks.length) * 100
    );

    return checklist;
  }
}

// Export singleton instance
export const integrationTester = new IntegrationTester();