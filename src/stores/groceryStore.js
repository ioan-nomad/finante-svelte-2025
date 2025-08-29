import { writable, derived, get } from 'svelte/store';

function createGroceryInventory() {
  const { subscribe, set, update } = writable({
    receipts: [],
    inventory: {},
    priceHistory: {}
  });
  
  return {
    subscribe,
    
    addReceipt(receipt) {
      update(state => {
        // Adaugă bon
        state.receipts.push(receipt);
        
        // Update inventory și price history
        receipt.items.forEach(item => {
          const key = item.name.toLowerCase();
          
          // Update stoc
          if (!state.inventory[key]) {
            state.inventory[key] = {
              name: item.name,
              quantity: 0,
              unit: item.unit,
              category: item.category,
              lastPrice: item.price,
              avgPrice: item.price
            };
          }
          
          state.inventory[key].quantity += item.quantity;
          state.inventory[key].lastPrice = item.pricePerUnit;
          
          // Price history
          if (!state.priceHistory[key]) {
            state.priceHistory[key] = [];
          }
          
          state.priceHistory[key].push({
            date: receipt.date,
            store: receipt.store,
            price: item.pricePerUnit,
            quantity: item.quantity
          });
        });
        
        // Salvare în localStorage
        localStorage.setItem('groceryInventory', JSON.stringify(state));
        
        return state;
      });
    },
    
    updateStock(item) {
      update(state => {
        const key = item.name.toLowerCase();
        
        if (state.inventory[key]) {
          state.inventory[key].quantity += item.quantity || 1;
          state.inventory[key].lastPrice = item.price || state.inventory[key].lastPrice;
        } else {
          state.inventory[key] = {
            name: item.name,
            quantity: item.quantity || 1,
            unit: item.unit || 'buc',
            category: item.category || 'Altele',
            lastPrice: item.price || 0,
            avgPrice: item.price || 0
          };
        }
        
        localStorage.setItem('groceryInventory', JSON.stringify(state));
        return state;
      });
    },
    
    consumeItem(itemName, quantity) {
      update(state => {
        const key = itemName.toLowerCase();
        
        if (state.inventory[key]) {
          state.inventory[key].quantity = Math.max(0, 
            state.inventory[key].quantity - quantity
          );
        }
        
        localStorage.setItem('groceryInventory', JSON.stringify(state));
        return state;
      });
    },
    
    getPriceAnalytics(itemName) {
      const state = get(groceryInventory);
      const key = itemName.toLowerCase();
      const history = state.priceHistory[key] || [];
      
      if (history.length === 0) return null;
      
      const prices = history.map(h => h.price);
      const min = Math.min(...prices);
      const max = Math.max(...prices);
      const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
      const latest = prices[prices.length - 1];
      const trend = latest > avg ? 'up' : latest < avg ? 'down' : 'stable';
      
      return {
        min,
        max,
        avg,
        latest,
        trend,
        history
      };
    },
    
    getExpensesByPeriod(startDate, endDate) {
      const state = get(groceryInventory);
      
      return state.receipts
        .filter(r => r.date >= startDate && r.date <= endDate)
        .reduce((total, receipt) => total + receipt.total, 0);
    },
    
    loadFromStorage() {
      const saved = localStorage.getItem('groceryInventory');
      if (saved) {
        set(JSON.parse(saved));
      }
    }
  };
}

export const groceryInventory = createGroceryInventory();

// Derived stores pentru statistici
export const totalInventoryValue = derived(
  groceryInventory,
  $inventory => {
    return Object.values($inventory.inventory).reduce((total, item) => {
      return total + (item.quantity * item.lastPrice);
    }, 0);
  }
);

export const lowStockItems = derived(
  groceryInventory,
  $inventory => {
    return Object.values($inventory.inventory)
      .filter(item => item.quantity < 2)
      .map(item => item.name);
  }
);