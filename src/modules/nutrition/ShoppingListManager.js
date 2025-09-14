export class ShoppingListManager {
  constructor() {
    this.stores = {
      'Kaufland': ['carne', 'pește', 'legume', 'fructe', 'lactate', 'pâine'],
      'Lidl': ['conserve', 'paste', 'ulei', 'nuci', 'semințe'],
      'Mega Image': ['bio', 'organic', 'specialități'],
      'Plafar': ['condimente', 'ceai', 'suplimente'],
      'Piață': ['legume', 'fructe', 'verdeață', 'ouă']
    };

    this.priceDatabase = {
      'somon': 65,
      'piept de pui': 25,
      'broccoli': 12,
      'spanac': 15,
      'quinoa': 35,
      'avocado': 8,
      'nuci': 45,
      'ulei de măsline': 40,
      'usturoi': 15,
      'ceapă': 4,
      'morcov': 3,
      'cartofi dulci': 8,
      'linte': 18,
      'năut': 16,
      'semințe chia': 65,
      'curcuma': 25,
      'ghimbir': 30
    };
  }

  generateSmartShoppingList(recipes, pantryInventory = {}) {
    const neededItems = new Map();

    // Collect all needed ingredients from recipes
    recipes.forEach(recipe => {
      recipe.ingredients?.forEach(ing => {
        const key = this.normalizeIngredientName(ing.name);
        const current = neededItems.get(key) || {
          name: ing.name,
          totalAmount: 0,
          unit: ing.unit,
          recipes: []
        };

        current.totalAmount += ing.amount;
        current.recipes.push(recipe.name);
        neededItems.set(key, current);
      });
    });

    // Subtract what's in pantry
    Object.entries(pantryInventory).forEach(([item, data]) => {
      const key = this.normalizeIngredientName(item);
      if (neededItems.has(key)) {
        const needed = neededItems.get(key);
        needed.totalAmount = Math.max(0, needed.totalAmount - (data.quantity || 0));
        if (needed.totalAmount === 0) {
          neededItems.delete(key);
        }
      }
    });

    // Group by store
    const byStore = this.groupByOptimalStore(neededItems);

    // Calculate costs
    const withCosts = this.calculateCosts(byStore);

    // Generate optimal route
    const route = this.generateShoppingRoute(withCosts);

    return {
      items: Array.from(neededItems.values()),
      byStore: withCosts,
      route: route,
      totalCost: this.calculateTotalCost(withCosts),
      estimatedTime: this.estimateShoppingTime(withCosts),
      generatedAt: new Date().toISOString()
    };
  }

  normalizeIngredientName(name) {
    return name.toLowerCase()
      .replace(/[ăâ]/g, 'a')
      .replace(/[îș]/g, 'i')
      .replace(/[ț]/g, 't')
      .trim();
  }

  groupByOptimalStore(items) {
    const storeGroups = {};

    items.forEach((item, key) => {
      const bestStore = this.findBestStore(key);
      if (!storeGroups[bestStore]) {
        storeGroups[bestStore] = [];
      }
      storeGroups[bestStore].push({
        ...item,
        estimatedPrice: this.estimatePrice(key, item.totalAmount)
      });
    });

    return storeGroups;
  }

  findBestStore(ingredient) {
    // Find which store is best for this ingredient
    for (const [store, categories] of Object.entries(this.stores)) {
      if (categories.some(cat => ingredient.includes(cat))) {
        return store;
      }
    }
    return 'Kaufland'; // Default
  }

  estimatePrice(ingredient, amount) {
    const pricePerKg = this.priceDatabase[ingredient] || 20;
    return Math.round((amount / 1000) * pricePerKg * 100) / 100;
  }

  calculateCosts(byStore) {
    const result = {};

    Object.entries(byStore).forEach(([store, items]) => {
      result[store] = {
        items: items,
        subtotal: items.reduce((sum, item) => sum + item.estimatedPrice, 0),
        estimatedTime: Math.round(5 + items.length * 2) // minutes
      };
    });

    return result;
  }

  calculateTotalCost(byStore) {
    return Object.values(byStore).reduce((sum, store) => sum + store.subtotal, 0);
  }

  estimateShoppingTime(byStore) {
    const stores = Object.keys(byStore).length;
    const items = Object.values(byStore).reduce((sum, s) => sum + s.items.length, 0);
    return stores * 15 + items * 2; // minutes
  }

  generateShoppingRoute(byStore) {
    // Optimal route based on store locations
    const priority = ['Piață', 'Lidl', 'Kaufland', 'Mega Image', 'Plafar'];
    return priority.filter(store => byStore[store]);
  }

  exportToText(shoppingList) {
    let text = `🛒 LISTĂ CUMPĂRĂTURI - ${new Date().toLocaleDateString('ro-RO')}\n`;
    text += `${'='.repeat(50)}\n\n`;

    shoppingList.route.forEach(store => {
      const storeData = shoppingList.byStore[store];
      text += `📍 ${store.toUpperCase()}\n`;
      text += `⏱️ Timp estimat: ${storeData.estimatedTime} minute\n`;
      text += `💰 Cost estimat: ${storeData.subtotal.toFixed(2)} RON\n\n`;

      storeData.items.forEach(item => {
        text += `  ☐ ${item.name} - ${item.totalAmount}${item.unit} (~${item.estimatedPrice.toFixed(2)} RON)\n`;
      });
      text += '\n';
    });

    text += `${'='.repeat(50)}\n`;
    text += `💰 TOTAL ESTIMAT: ${shoppingList.totalCost.toFixed(2)} RON\n`;
    text += `⏱️ TIMP TOTAL: ${shoppingList.estimatedTime} minute\n`;

    return text;
  }

  exportToJSON(shoppingList) {
    return JSON.stringify(shoppingList, null, 2);
  }

  exportToTodoist(shoppingList) {
    const tasks = [];

    shoppingList.route.forEach(store => {
      const storeData = shoppingList.byStore[store];
      const task = {
        content: `🛒 Shopping la ${store}`,
        description: `Cost estimat: ${storeData.subtotal.toFixed(2)} RON`,
        due_string: 'today',
        priority: 2,
        labels: ['shopping', 'nutrition'],
        sub_tasks: storeData.items.map(item => ({
          content: `${item.name} - ${item.totalAmount}${item.unit}`,
          due_string: 'today'
        }))
      };
      tasks.push(task);
    });

    return tasks;
  }

  async saveToLocalStorage(shoppingList) {
    const history = JSON.parse(localStorage.getItem('shoppingHistory') || '[]');
    history.unshift({
      ...shoppingList,
      id: Date.now().toString(),
      completed: false
    });

    // Keep only last 30 lists
    if (history.length > 30) {
      history.pop();
    }

    localStorage.setItem('shoppingHistory', JSON.stringify(history));
    localStorage.setItem('currentShoppingList', JSON.stringify(shoppingList));

    return shoppingList;
  }
}

export const shoppingListManager = new ShoppingListManager();