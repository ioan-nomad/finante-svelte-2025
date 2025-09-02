import { writable, derived, get } from 'svelte/store';
import { secureStorage } from '../../../lib/security/crypto.js';
import { addToInventory, removeFromInventory, unifiedInventory } from '../../../shared/stores/ecosystemStore.js';
import { getPlantByName, logPlantConsumption } from '../../nutrition/plants/plantDiversityTracker.js';

// Enhanced grocery inventory store with ecosystem integration
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
    
    addItem: (item) => {
      // Enhanced item with nutrition analysis
      const enhancedItem = enhanceItemWithNutritionData(item);
      
      // Add to local pantry
      update(state => ({
        ...state,
        inventory: [...state.inventory, {
          ...enhancedItem,
          id: Date.now().toString(36) + Math.random().toString(36).substr(2),
          addedDate: new Date().toISOString()
        }],
        lastUpdated: new Date().toISOString()
      }));
      
      // Sync to unified ecosystem inventory
      addToInventory({
        ...enhancedItem,
        addedBy: 'pantry_manual'
      });
      
      // Log plant consumption if it's a plant
      if (enhancedItem.plantSpecies) {
        logPlantConsumption(enhancedItem.plantSpecies, enhancedItem.antiInflammatory);
      }
    },
    
    consumeItem: (name, amount) => {
      update(state => {
        const inventory = state.inventory.map(item => {
          if (item.name.toLowerCase().includes(name.toLowerCase())) {
            const newQuantity = Math.max(0, (item.quantity || 0) - amount);
            
            // Sync consumption to unified inventory
            if (item.ecosystemId) {
              removeFromInventory(item.ecosystemId, amount);
            }
            
            // Log plant consumption if it's a plant and being consumed
            if (item.plantSpecies && amount > 0) {
              logPlantConsumption(item.plantSpecies, item.antiInflammatory);
            }
            
            return {
              ...item,
              quantity: newQuantity,
              lastConsumed: new Date().toISOString()
            };
          }
          return item;
        });
        return { ...state, inventory, lastUpdated: new Date().toISOString() };
      });
    },
    
    loadFromStorage: () => {
      try {
        const saved = secureStorage.secureLoad('pantry_inventory');
        if (saved) {
          set(saved);
        }
      } catch (error) {
        console.error('Error loading pantry data:', error);
      }
    },
    
    saveToStorage: () => {
      try {
        const state = get(groceryInventory);
        secureStorage.secureSave('pantry_inventory', state);
      } catch (error) {
        console.error('Error saving pantry data:', error);
      }
    },
    
    // New ecosystem integration methods
    syncWithEcosystem: () => {
      const localState = get(groceryInventory);
      const unifiedItems = get(unifiedInventory);
      
      // Sync items that exist in unified inventory but not locally
      const missingItems = unifiedItems.filter(unifiedItem => 
        !localState.inventory.some(localItem => 
          localItem.name === unifiedItem.name && localItem.category === unifiedItem.category
        )
      );
      
      if (missingItems.length > 0) {
        update(state => ({
          ...state,
          inventory: [...state.inventory, ...missingItems.map(item => ({
            ...item,
            id: Date.now().toString(36) + Math.random().toString(36).substr(2),
            addedDate: item.lastUpdated || new Date().toISOString(),
            ecosystemId: item.id
          }))],
          lastUpdated: new Date().toISOString()
        }));
      }
    },
    
    getItemNutritionInfo: (itemName) => {
      const plantInfo = getPlantByName(itemName);
      return plantInfo ? {
        plantSpecies: plantInfo.species,
        antiInflammatory: plantInfo.antiInflammatory,
        polyphenols: plantInfo.polyphenols,
        nutrients: plantInfo.nutrients,
        score: plantInfo.score
      } : null;
    }
  };
}

export const groceryInventory = createGroceryInventory();

// Enhanced shopping lists store with CODEX integration
export const shoppingLists = writable([]);

// Meal plans store with nutrition analysis
export const mealPlans = writable([]);

// Derived store for nutrition-enhanced inventory
export const nutritionEnhancedInventory = derived(
  [groceryInventory, unifiedInventory],
  ([$local, $unified]) => {
    return $local.inventory.map(item => {
      // Find matching unified inventory item for additional data
      const unifiedItem = $unified.find(u => 
        u.name === item.name && u.category === item.category
      );
      
      return {
        ...item,
        ...unifiedItem,
        hasNutritionData: !!unifiedItem,
        codexScore: unifiedItem?.score || 0,
        antiInflammatoryLevel: unifiedItem?.antiInflammatory || 'unknown'
      };
    });
  }
);

// Helper function to enhance items with nutrition data
function enhanceItemWithNutritionData(item) {
  const plantInfo = getPlantByName(item.name);
  
  return {
    ...item,
    plantSpecies: plantInfo?.species || null,
    antiInflammatory: plantInfo?.antiInflammatory || 'unknown',
    polyphenols: plantInfo?.polyphenols || 'unknown',
    nutrients: plantInfo?.nutrients || [],
    codexScore: plantInfo?.score || 0,
    season: plantInfo?.season || ['year_round'],
    enhancedAt: new Date().toISOString()
  };
}

// Smart shopping list generation based on CODEX needs
export function generateCODEXShoppingList(weeklyMenuPlan = []) {
  const currentInventory = get(groceryInventory);
  const recommendations = [];
  
  // High-priority CODEX foods that should always be available
  const codexEssentials = [
    { name: 'Broccoli', category: 'Legume', minQuantity: 3, priority: 'high' },
    { name: 'Spanac', category: 'Legume', minQuantity: 2, priority: 'high' },
    { name: 'Somon', category: 'Carne', minQuantity: 1, priority: 'high' },
    { name: 'Afine', category: 'Fructe', minQuantity: 1, priority: 'high' },
    { name: 'Nuci', category: 'Snacks', minQuantity: 1, priority: 'high' },
    { name: 'Ulei masline', category: 'Condimente', minQuantity: 1, priority: 'high' },
    { name: 'Curcuma', category: 'Condimente', minQuantity: 1, priority: 'medium' },
    { name: 'Usturoi', category: 'Condimente', minQuantity: 1, priority: 'medium' }
  ];
  
  codexEssentials.forEach(essential => {
    const existingItem = currentInventory.inventory.find(
      item => item.name.toLowerCase().includes(essential.name.toLowerCase())
    );
    
    const currentQuantity = existingItem?.quantity || 0;
    
    if (currentQuantity < essential.minQuantity) {
      const nutritionInfo = getPlantByName(essential.name);
      
      recommendations.push({
        ...essential,
        needed: essential.minQuantity - currentQuantity,
        nutritionInfo,
        reason: `CODEX essential - current: ${currentQuantity}, need: ${essential.minQuantity}`
      });
    }
  });
  
  return recommendations;
}

// Recipe ingredient availability checker
export function checkRecipeIngredientAvailability(recipeIngredients) {
  const currentInventory = get(groceryInventory);
  const availability = [];
  
  recipeIngredients.forEach(ingredient => {
    const availableItem = currentInventory.inventory.find(
      item => item.name.toLowerCase().includes(ingredient.name.toLowerCase())
    );
    
    availability.push({
      ingredient: ingredient.name,
      needed: ingredient.quantity,
      available: availableItem?.quantity || 0,
      sufficient: (availableItem?.quantity || 0) >= ingredient.quantity,
      nutritionScore: availableItem?.codexScore || 0
    });
  });
  
  return availability;
}

// Initialize from secure storage
if (typeof window !== 'undefined') {
  groceryInventory.loadFromStorage();
  
  // Auto-save on changes with secure storage
  groceryInventory.subscribe(value => {
    if (value.lastUpdated) {
      try {
        secureStorage.secureSave('pantry_inventory', value);
      } catch (error) {
        console.error('Error auto-saving pantry data:', error);
      }
    }
  });
  
  // Sync with ecosystem on startup
  setTimeout(() => {
    groceryInventory.syncWithEcosystem();
  }, 1000);
}