// Advanced Test Utilities pentru N-OMAD Suite
export class TestUtils {
  // Mock localStorage
  static mockLocalStorage() {
    const storage = {};
    return {
      getItem: (key) => storage[key] || null,
      setItem: (key, value) => storage[key] = value,
      removeItem: (key) => delete storage[key],
      clear: () => Object.keys(storage).forEach(key => delete storage[key]),
      length: () => Object.keys(storage).length,
      key: (index) => Object.keys(storage)[index] || null
    };
  }

  // Generate test data
  static generateTestData() {
    return {
      accounts: [
        { id: 1, name: 'Test Bank', type: 'bank', balance: 5000, currency: 'RON' },
        { id: 2, name: 'Test Cash', type: 'cash', balance: 500, currency: 'RON' }
      ],
      transactions: [
        { id: 1, amount: -150, category: 'Food', date: '2024-01-15', account: 1, description: 'Lidl shopping' },
        { id: 2, amount: -80, category: 'Transport', date: '2024-01-16', account: 1, description: 'Fuel' },
        { id: 3, amount: 3000, category: 'Income', date: '2024-01-01', account: 1, description: 'Salary' }
      ],
      inventory: [
        { name: 'Lapte', quantity: 2, unit: 'L', category: 'Dairy', expirationDate: '2024-01-25', price: 5.99 },
        { name: 'Pâine', quantity: 1, unit: 'bucată', category: 'Bakery', expirationDate: '2024-01-20', price: 3.49 },
        { name: 'Ouă', quantity: 12, unit: 'bucăți', category: 'Dairy', expirationDate: '2024-01-30', price: 8.99 }
      ],
      recipes: [
        {
          name: 'Omletă Proteică',
          ingredients: ['Ouă', 'Lapte', 'Brânză'],
          nutrition: { calories: 350, protein: 25, carbs: 5, fat: 18 },
          preparationTime: 10,
          difficulty: 'easy'
        }
      ],
      nutritionProfile: {
        weight: 70,
        height: 175,
        age: 30,
        activity: 'moderate',
        goals: ['muscle_gain', 'health'],
        dailyTargets: { calories: 2500, protein: 150, carbs: 200, fat: 80 }
      }
    };
  }

  // Performance testing
  static async measurePerformance(fn, iterations = 1000) {
    const results = [];

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      await fn();
      const end = performance.now();
      results.push(end - start);
    }

    return {
      min: Math.min(...results),
      max: Math.max(...results),
      avg: results.reduce((a, b) => a + b) / results.length,
      median: results.sort()[Math.floor(results.length / 2)],
      iterations
    };
  }

  // Memory leak detection
  static detectMemoryLeaks(testFn, threshold = 1000000) {
    const initialMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;

    return new Promise((resolve) => {
      testFn();

      setTimeout(() => {
        if (typeof window.gc === 'function') {
          window.gc(); // Force garbage collection if available
        }

        const finalMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;
        const memoryDiff = finalMemory - initialMemory;

        resolve({
          initialMemory,
          finalMemory,
          memoryDiff,
          hasLeak: memoryDiff > threshold,
          threshold
        });
      }, 100);
    });
  }

  // Network request mocking
  static mockFetch(responses = {}) {
    const originalFetch = window.fetch;

    window.fetch = (url, options = {}) => {
      const response = responses[url] || { status: 404, data: {} };

      return Promise.resolve({
        ok: response.status < 400,
        status: response.status,
        json: () => Promise.resolve(response.data),
        text: () => Promise.resolve(JSON.stringify(response.data))
      });
    };

    return () => {
      window.fetch = originalFetch;
    };
  }

  // Component testing helpers
  static createTestComponent(component, props = {}) {
    const container = document.createElement('div');
    document.body.appendChild(container);

    // Simulate Svelte component mounting
    const instance = new component({
      target: container,
      props
    });

    return {
      instance,
      container,
      destroy: () => {
        instance.$destroy?.();
        document.body.removeChild(container);
      }
    };
  }

  // Data validation
  static validateData(data, schema) {
    const errors = [];

    for (const [field, rules] of Object.entries(schema)) {
      const value = data[field];

      if (rules.required && (value === undefined || value === null)) {
        errors.push(`${field} is required`);
        continue;
      }

      if (rules.type && typeof value !== rules.type) {
        errors.push(`${field} must be of type ${rules.type}`);
      }

      if (rules.min !== undefined && value < rules.min) {
        errors.push(`${field} must be at least ${rules.min}`);
      }

      if (rules.max !== undefined && value > rules.max) {
        errors.push(`${field} must be at most ${rules.max}`);
      }

      if (rules.pattern && !rules.pattern.test(value)) {
        errors.push(`${field} does not match required pattern`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  // Async testing helpers
  static async waitFor(condition, timeout = 5000, interval = 100) {
    const start = Date.now();

    while (Date.now() - start < timeout) {
      if (await condition()) {
        return true;
      }
      await new Promise(resolve => setTimeout(resolve, interval));
    }

    throw new Error(`Condition not met within ${timeout}ms`);
  }

  // Random data generators
  static randomString(length = 10) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  }

  static randomNumber(min = 0, max = 100) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  static randomDate(start = new Date(2024, 0, 1), end = new Date()) {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  }

  // Test environment setup
  static setupTestEnvironment() {
    // Mock console to capture logs
    const logs = [];
    const originalLog = console.log;
    console.log = (...args) => {
      logs.push(args);
      originalLog(...args);
    };

    // Mock localStorage if not available
    if (typeof localStorage === 'undefined') {
      global.localStorage = this.mockLocalStorage();
    }

    // Mock performance API if not available
    if (typeof performance === 'undefined') {
      global.performance = {
        now: () => Date.now(),
        memory: { usedJSHeapSize: 0 }
      };
    }

    return {
      logs,
      cleanup: () => {
        console.log = originalLog;
      }
    };
  }

  // Security testing helpers
  static testXSSVulnerability(input) {
    const dangerousPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /<iframe/i,
      /<object/i,
      /<embed/i
    ];

    return dangerousPatterns.some(pattern => pattern.test(input));
  }

  static testSQLInjection(input) {
    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER)\b)/i,
      /(UNION\s+SELECT)/i,
      /(OR\s+1\s*=\s*1)/i,
      /(;\s*--)/,
      /(\'\s*;\s*DROP)/i
    ];

    return sqlPatterns.some(pattern => pattern.test(input));
  }
}

// Export pentru utilizare în teste
export default TestUtils;