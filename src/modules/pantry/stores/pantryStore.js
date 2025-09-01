import { writable, derived, get } from 'svelte/store';

// Grocery inventory store
function createGroceryInventory() {
  const { subscribe, set, update } = writable({
    inventory: [],
    categories: [
      'Fructe', 'Legume', 'Lactate', 'Carne', 'Băuturi',
      'Condimente', 'Conserve', 'Congelate', 'Snacks', 'Altele'
    ],
    lastUpdated: null
  });

  return {
    subscribe,
    set,
    update,
    
    addItem: (item) => update(state => ({
      ...state,
      inventory: [...state.inventory, {
        ...item,
        id: Date.now().toString(36) + Math.random().toString(36).substr(2),
        addedDate: new Date().toISOString()
      }],
      lastUpdated: new Date().toISOString()
    })),
    
    consumeItem: (name, amount) => update(state => {
      const inventory = state.inventory.map(item => {
        if (item.name.toLowerCase().includes(name.toLowerCase())) {
          return {
            ...item,
            quantity: Math.max(0, (item.quantity || 0) - amount)
          };
        }
        return item;
      });
      return { ...state, inventory, lastUpdated: new Date().toISOString() };
    }),
    
    loadFromStorage: () => {
      const saved = localStorage.getItem('groceryInventory');
      if (saved) {
        set(JSON.parse(saved));
      }
    },
    
    saveToStorage: () => {
      const state = get(groceryInventory);
      localStorage.setItem('groceryInventory', JSON.stringify(state));
    }
  };
}

export const groceryInventory = createGroceryInventory();

// Shopping lists store  
export const shoppingLists = writable([]);

// Meal plans store
export const mealPlans = writable([]);

// Initialize from localStorage
if (typeof window !== 'undefined') {
  groceryInventory.loadFromStorage();
  
  // Auto-save on changes
  groceryInventory.subscribe(value => {
    if (value.lastUpdated) {
      localStorage.setItem('groceryInventory', JSON.stringify(value));
    }
  });
}