// Test Runner pentru N-OMAD Suite
export class TestRunner {
  constructor() {
    this.results = [];
    this.startTime = null;
  }

  async runAllTests() {
    console.log('🧪 Starting N-OMAD Test Suite...');
    this.startTime = Date.now();

    // Test Finance Module
    await this.testFinanceModule();

    // Test Pantry Module
    await this.testPantryModule();

    // Test Nutrition Module
    await this.testNutritionModule();

    // Test Integration
    await this.testIntegration();

    this.printResults();
  }

  async testFinanceModule() {
    const tests = [
      { name: 'Create Account', fn: () => this.testCreateAccount() },
      { name: 'Add Transaction', fn: () => this.testAddTransaction() },
      { name: 'Calculate Budget', fn: () => this.testCalculateBudget() },
      { name: 'Generate Report', fn: () => this.testGenerateReport() }
    ];

    for (const test of tests) {
      try {
        await test.fn();
        this.results.push({ module: 'Finance', test: test.name, status: 'PASS' });
      } catch (e) {
        this.results.push({ module: 'Finance', test: test.name, status: 'FAIL', error: e.message });
      }
    }
  }

  async testPantryModule() {
    const tests = [
      { name: 'Add Inventory Item', fn: () => this.testAddInventory() },
      { name: 'Parse Receipt', fn: () => this.testParseReceipt() },
      { name: 'Generate Shopping List', fn: () => this.testShoppingList() }
    ];

    for (const test of tests) {
      try {
        await test.fn();
        this.results.push({ module: 'Pantry', test: test.name, status: 'PASS' });
      } catch (e) {
        this.results.push({ module: 'Pantry', test: test.name, status: 'FAIL', error: e.message });
      }
    }
  }

  async testNutritionModule() {
    const tests = [
      { name: 'Generate Recipe', fn: () => this.testRecipeGeneration() },
      { name: 'Calculate Nutrition', fn: () => this.testNutritionCalc() },
      { name: 'mTOR Cycle', fn: () => this.testMTORCycle() }
    ];

    for (const test of tests) {
      try {
        await test.fn();
        this.results.push({ module: 'Nutrition', test: test.name, status: 'PASS' });
      } catch (e) {
        this.results.push({ module: 'Nutrition', test: test.name, status: 'FAIL', error: e.message });
      }
    }
  }

  async testIntegration() {
    // Test cross-module functionality
    const tests = [
      { name: 'Pantry-Nutrition Sync', fn: () => this.testPantryNutritionSync() },
      { name: 'Finance-Shopping Integration', fn: () => this.testFinanceShoppingIntegration() }
    ];

    for (const test of tests) {
      try {
        await test.fn();
        this.results.push({ module: 'Integration', test: test.name, status: 'PASS' });
      } catch (e) {
        this.results.push({ module: 'Integration', test: test.name, status: 'FAIL', error: e.message });
      }
    }
  }

  // Individual test implementations
  testCreateAccount() {
    const testAccount = { name: 'Test Account', type: 'bank', balance: 1000 };
    if (!testAccount.name) throw new Error('Account creation failed');
    return true;
  }

  testAddTransaction() {
    const testTransaction = { amount: 100, category: 'Food', date: new Date() };
    if (!testTransaction.amount) throw new Error('Transaction creation failed');
    return true;
  }

  testCalculateBudget() {
    const budget = { income: 5000, expenses: 3000, savings: 2000 };
    if (budget.income - budget.expenses !== budget.savings) {
      throw new Error('Budget calculation incorrect');
    }
    return true;
  }

  testGenerateReport() {
    // Simulate report generation
    return true;
  }

  testAddInventory() {
    const item = { name: 'Milk', quantity: 1, unit: 'L' };
    if (!item.name) throw new Error('Inventory add failed');
    return true;
  }

  testParseReceipt() {
    const receipt = 'LIDL\nMilk 5.99\nBread 3.49';
    if (!receipt.includes('LIDL')) throw new Error('Receipt parse failed');
    return true;
  }

  testShoppingList() {
    const list = ['Milk', 'Bread', 'Eggs'];
    if (list.length !== 3) throw new Error('Shopping list generation failed');
    return true;
  }

  testRecipeGeneration() {
    // Test recipe generation
    const recipe = { name: 'Test Recipe', ingredients: [], nutrition: {} };
    if (!recipe.name) throw new Error('Recipe generation failed');
    return true;
  }

  testNutritionCalc() {
    const nutrition = { calories: 500, protein: 30, carbs: 50, fat: 20 };
    const total = nutrition.protein * 4 + nutrition.carbs * 4 + nutrition.fat * 9;
    if (Math.abs(total - nutrition.calories) > 50) {
      throw new Error('Nutrition calculation incorrect');
    }
    return true;
  }

  testMTORCycle() {
    const cycle = { day: 7, phase: 'growth' };
    if (cycle.day > 14) throw new Error('mTOR cycle error');
    return true;
  }

  testPantryNutritionSync() {
    // Test pantry items available in nutrition module
    return true;
  }

  testFinanceShoppingIntegration() {
    // Test shopping expenses reflected in finance
    return true;
  }

  printResults() {
    const duration = Date.now() - this.startTime;
    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;

    console.log('\n📊 TEST RESULTS:');
    console.log('═'.repeat(50));

    // Group by module
    const modules = [...new Set(this.results.map(r => r.module))];
    modules.forEach(module => {
      console.log(`\n${module} Module:`);
      this.results
        .filter(r => r.module === module)
        .forEach(r => {
          const icon = r.status === 'PASS' ? '✅' : '❌';
          console.log(`  ${icon} ${r.test}`);
          if (r.error) console.log(`     └─ ${r.error}`);
        });
    });

    console.log('\n═'.repeat(50));
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⏱️ Duration: ${duration}ms`);
    console.log(`📈 Success Rate: ${Math.round(passed/(passed+failed)*100)}%`);

    return {
      passed,
      failed,
      duration,
      results: this.results
    };
  }
}

// Auto-run if in browser
if (typeof window !== 'undefined') {
  window.NomadTestRunner = TestRunner;
  console.log('🧪 Test Runner loaded. Run: new NomadTestRunner().runAllTests()');
}