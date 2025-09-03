import { writable, derived, get } from 'svelte/store';
import { secureStorage } from '../../lib/security/crypto.js';
import { debounce } from '../../lib/utils.js';

// =============================================================================
// CODEX N-OMAD ECOSYSTEM STORE
// Unified synchronization across Finance, Pantry & Nutrition modules
// =============================================================================

// Core ecosystem state
export const ecosystemData = writable({
  // Unified inventory (shared between pantry & nutrition)
  inventory: [],
  
  // Shopping integration (finance + pantry costs)
  shoppingList: [],
  
  // Receipt analysis results
  receiptAnalysis: [],
  
  // CODEX compliance tracking
  codexCompliance: {
    currentScore: 0,
    weeklyGoals: {},
    violations: []
  },
  
  // mTOR cycling state
  mtorCycle: {
    currentPhase: 'growth', // growth, maintenance, autophagy
    dayInCycle: 1,
    cycleLength: 7,
    startDate: new Date().toISOString().split('T')[0]
  },
  
  // Plant diversity tracking (30+ species goal)
  plantDiversity: {
    consumed: [],
    weeklyCount: 0,
    monthlyGoal: 30,
    antiInflammatoryFocus: true
  },
  
  // Cross-module synchronization timestamps
  lastSync: {
    finance: null,
    pantry: null,
    nutrition: null
  }
});

// =============================================================================
// UNIFIED INVENTORY MANAGEMENT
// =============================================================================

export const unifiedInventory = derived(ecosystemData, ($ecosystem) => $ecosystem.inventory);

export function addToInventory(item) {
  ecosystemData.update(data => {
    const existingItem = data.inventory.find(i => 
      i.name.toLowerCase() === item.name.toLowerCase() && 
      i.category === item.category
    );
    
    if (existingItem) {
      existingItem.quantity += item.quantity;
      existingItem.lastUpdated = new Date().toISOString();
    } else {
      data.inventory.push({
        id: Date.now() + Math.random(),
        name: item.name,
        category: item.category,
        quantity: item.quantity,
        unit: item.unit || 'bucăți',
        expiryDate: item.expiryDate,
        cost: item.cost || 0,
        nutritionValue: item.nutritionValue || {},
        codexApproved: item.codexApproved || false,
        antiInflammatory: item.antiInflammatory || false,
        plantSpecies: item.plantSpecies || null,
        lastUpdated: new Date().toISOString(),
        addedBy: item.addedBy || 'manual'
      });
    }
    
    // Update plant diversity if it's a plant
    if (item.plantSpecies && !data.plantDiversity.consumed.includes(item.plantSpecies)) {
      data.plantDiversity.consumed.push(item.plantSpecies);
      data.plantDiversity.weeklyCount = calculateWeeklyPlantCount(data.plantDiversity.consumed);
    }
    
    return data;
  });
  
  saveEcosystemData();
}

export function removeFromInventory(itemId, quantity = 1) {
  ecosystemData.update(data => {
    const item = data.inventory.find(i => i.id === itemId);
    if (item) {
      item.quantity -= quantity;
      if (item.quantity <= 0) {
        data.inventory = data.inventory.filter(i => i.id !== itemId);
      }
    }
    return data;
  });
  
  saveEcosystemData();
}

// =============================================================================
// SMART SHOPPING INTEGRATION
// =============================================================================

export const smartShopping = derived(ecosystemData, ($ecosystem) => $ecosystem.shoppingList);

export function generateSmartShoppingList(recipeIngredients, budgetLimit = null) {
  const currentInventory = get(unifiedInventory);
  const missingItems = [];
  let totalEstimatedCost = 0;
  
  recipeIngredients.forEach(ingredient => {
    const inventoryItem = currentInventory.find(item => 
      item.name.toLowerCase().includes(ingredient.name.toLowerCase()) ||
      ingredient.name.toLowerCase().includes(item.name.toLowerCase())
    );
    
    const needed = ingredient.quantity;
    const available = inventoryItem ? inventoryItem.quantity : 0;
    
    if (needed > available) {
      const toBuy = needed - available;
      const estimatedCost = estimateIngredientCost(ingredient.name, toBuy);
      
      missingItems.push({
        id: Date.now() + Math.random(),
        name: ingredient.name,
        quantity: toBuy,
        unit: ingredient.unit,
        category: ingredient.category,
        estimatedCost: estimatedCost,
        priority: ingredient.codexImportance || 'medium',
        antiInflammatory: ingredient.antiInflammatory || false,
        plantSpecies: ingredient.plantSpecies || null,
        forRecipe: ingredient.recipeId || null
      });
      
      totalEstimatedCost += estimatedCost;
    }
  });
  
  // Budget validation
  if (budgetLimit && totalEstimatedCost > budgetLimit) {
    // Prioritize CODEX-approved and anti-inflammatory items
    missingItems.sort((a, b) => {
      const aScore = (a.antiInflammatory ? 2 : 0) + (a.priority === 'high' ? 1 : 0);
      const bScore = (b.antiInflammatory ? 2 : 0) + (b.priority === 'high' ? 1 : 0);
      return bScore - aScore;
    });
  }
  
  ecosystemData.update(data => {
    data.shoppingList = missingItems;
    return data;
  });
  
  return {
    items: missingItems,
    totalCost: totalEstimatedCost,
    withinBudget: !budgetLimit || totalEstimatedCost <= budgetLimit
  };
}

// =============================================================================
// RECEIPT ANALYSIS & AUTO-SYNC
// =============================================================================

export function processReceiptData(receiptData) {
  const analysis = {
    id: Date.now(),
    timestamp: new Date().toISOString(),
    items: [],
    totalCost: 0,
    codexCompliance: 0,
    antiInflammatoryItems: 0,
    plantSpeciesFound: []
  };
  
  receiptData.items.forEach(item => {
    // Enhanced item analysis with CODEX matching
    const enhancedItem = {
      ...item,
      codexApproved: checkCODEXApproval(item.name),
      antiInflammatory: checkAntiInflammatory(item.name),
      plantSpecies: identifyPlantSpecies(item.name),
      nutritionValue: estimateNutritionValue(item.name),
      category: categorizeItem(item.name)
    };
    
    analysis.items.push(enhancedItem);
    analysis.totalCost += item.cost;
    
    if (enhancedItem.codexApproved) analysis.codexCompliance++;
    if (enhancedItem.antiInflammatory) analysis.antiInflammatoryItems++;
    if (enhancedItem.plantSpecies) analysis.plantSpeciesFound.push(enhancedItem.plantSpecies);
    
    // Auto-add to inventory
    addToInventory(enhancedItem);
  });
  
  // Calculate compliance percentage
  analysis.codexCompliance = (analysis.codexCompliance / analysis.items.length) * 100;
  
  ecosystemData.update(data => {
    data.receiptAnalysis.unshift(analysis);
    // Keep only last 50 analyses
    if (data.receiptAnalysis.length > 50) {
      data.receiptAnalysis = data.receiptAnalysis.slice(0, 50);
    }
    return data;
  });
  
  // Trigger finance transaction creation
  createFinanceTransaction(analysis);
  
  return analysis;
}

// =============================================================================
// CODEX COMPLIANCE TRACKING
// =============================================================================

export const codexCompliance = derived(ecosystemData, ($ecosystem) => $ecosystem.codexCompliance);

export function updateCODEXCompliance(mealData) {
  ecosystemData.update(data => {
    const score = calculateCODEXScore(mealData);
    data.codexCompliance.currentScore = score;
    
    // Track weekly goals
    const week = getWeekNumber(new Date());
    if (!data.codexCompliance.weeklyGoals[week]) {
      data.codexCompliance.weeklyGoals[week] = {
        targetScore: 85,
        currentScore: score,
        mealsLogged: 1
      };
    } else {
      data.codexCompliance.weeklyGoals[week].currentScore = 
        (data.codexCompliance.weeklyGoals[week].currentScore + score) / 2;
      data.codexCompliance.weeklyGoals[week].mealsLogged++;
    }
    
    return data;
  });
  
  saveEcosystemData();
}

// =============================================================================
// mTOR CYCLING MANAGEMENT
// =============================================================================

export const mtorCycle = derived(ecosystemData, ($ecosystem) => $ecosystem.mtorCycle);

export function advanceMTORCycle() {
  ecosystemData.update(data => {
    data.mtorCycle.dayInCycle++;
    
    if (data.mtorCycle.dayInCycle > data.mtorCycle.cycleLength) {
      data.mtorCycle.dayInCycle = 1;
      // Rotate phases: growth → maintenance → autophagy → growth
      const phases = ['growth', 'maintenance', 'autophagy'];
      const currentIndex = phases.indexOf(data.mtorCycle.currentPhase);
      data.mtorCycle.currentPhase = phases[(currentIndex + 1) % phases.length];
    }
    
    return data;
  });
  
  saveEcosystemData();
}

export function getMTORRecommendations(currentPhase) {
  const recommendations = {
    growth: {
      protein: 'high',
      carbs: 'moderate',
      fasting: 'none',
      exercise: 'strength',
      supplements: ['creatine', 'leucine']
    },
    maintenance: {
      protein: 'moderate',
      carbs: 'low',
      fasting: 'intermittent',
      exercise: 'mixed',
      supplements: ['omega-3', 'magnesium']
    },
    autophagy: {
      protein: 'low',
      carbs: 'very_low',
      fasting: 'extended',
      exercise: 'light',
      supplements: ['berberine', 'resveratrol']
    }
  };
  
  return recommendations[currentPhase] || recommendations.maintenance;
}

// =============================================================================
// PLANT DIVERSITY TRACKING
// =============================================================================

export const plantDiversity = derived(ecosystemData, ($ecosystem) => $ecosystem.plantDiversity);

function calculateWeeklyPlantCount(plantList) {
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  
  // This would need to track when plants were consumed
  // For now, return current unique count
  return new Set(plantList).size;
}

export function logPlantConsumption(plantSpecies, antiInflammatory = false) {
  ecosystemData.update(data => {
    if (!data.plantDiversity.consumed.includes(plantSpecies)) {
      data.plantDiversity.consumed.push(plantSpecies);
      data.plantDiversity.weeklyCount = calculateWeeklyPlantCount(data.plantDiversity.consumed);
    }
    return data;
  });
  
  saveEcosystemData();
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function estimateIngredientCost(ingredientName, quantity) {
  // Basic cost estimation - would be enhanced with real data
  const baseCosts = {
    'broccoli': 8,
    'spanac': 12,
    'somon': 45,
    'avocado': 15,
    'nuci': 25,
    'ulei masline': 35,
    'quinoa': 20
  };
  
  const match = Object.keys(baseCosts).find(key => 
    ingredientName.toLowerCase().includes(key.toLowerCase())
  );
  
  return match ? baseCosts[match] * quantity : quantity * 5; // Default 5 RON per unit
}

function checkCODEXApproval(itemName) {
  const codexApproved = [
    'broccoli', 'spanac', 'kale', 'rucola', 'somon', 'sardine', 'avocado',
    'nuci', 'migdale', 'seminte', 'ulei masline', 'ulei cocos', 'quinoa',
    'hrisca', 'linte', 'fasole', 'naut', 'dovleac', 'morcovi', 'sfecla'
  ];
  
  return codexApproved.some(approved => 
    itemName.toLowerCase().includes(approved.toLowerCase())
  );
}

function checkAntiInflammatory(itemName) {
  const antiInflammatory = [
    'curcuma', 'ghimbir', 'somon', 'sardine', 'ton', 'nuci', 'migdale',
    'seminte in', 'seminte chia', 'spanac', 'kale', 'broccoli', 'afine',
    'mure', 'visine', 'cirese', 'rodie', 'ceai verde', 'ulei masline'
  ];
  
  return antiInflammatory.some(anti => 
    itemName.toLowerCase().includes(anti.toLowerCase())
  );
}

function identifyPlantSpecies(itemName) {
  const plantSpecies = {
    'broccoli': 'Brassica oleracea',
    'spanac': 'Spinacia oleracea',
    'morcovi': 'Daucus carota',
    'rosii': 'Solanum lycopersicum',
    'castraveti': 'Cucumis sativus',
    'ardei': 'Capsicum annuum',
    'ceapa': 'Allium cepa',
    'usturoi': 'Allium sativum'
  };
  
  const match = Object.keys(plantSpecies).find(key => 
    itemName.toLowerCase().includes(key.toLowerCase())
  );
  
  return match ? plantSpecies[match] : null;
}

function estimateNutritionValue(itemName) {
  // Basic nutrition estimation
  return {
    calories: Math.floor(Math.random() * 200) + 50,
    protein: Math.floor(Math.random() * 20) + 2,
    carbs: Math.floor(Math.random() * 30) + 5,
    fat: Math.floor(Math.random() * 15) + 1,
    fiber: Math.floor(Math.random() * 10) + 1
  };
}

function categorizeItem(itemName) {
  const categories = {
    'Legume': ['broccoli', 'spanac', 'morcovi', 'rosii', 'castraveti'],
    'Fructe': ['mere', 'banane', 'portocale', 'afine', 'capsuni'],
    'Proteine': ['somon', 'pui', 'vita', 'ou', 'ton', 'sardine'],
    'Cereale': ['quinoa', 'orez', 'ovaz', 'hrisca', 'paine'],
    'Lactate': ['lapte', 'branza', 'iaurt', 'unt', 'cascaval'],
    'Uleiuri': ['ulei masline', 'ulei cocos', 'unt', 'avocado']
  };
  
  for (const [category, items] of Object.entries(categories)) {
    if (items.some(item => itemName.toLowerCase().includes(item.toLowerCase()))) {
      return category;
    }
  }
  
  return 'Altele';
}

function calculateCODEXScore(mealData) {
  let score = 0;
  const maxScore = 100;
  
  // Basic scoring - would be enhanced with real CODEX rules
  if (mealData.vegetables >= 2) score += 30;
  if (mealData.protein > 0) score += 20;
  if (mealData.healthyFats > 0) score += 20;
  if (mealData.processedFoods === 0) score += 30;
  
  return Math.min(score, maxScore);
}

function createFinanceTransaction(analysis) {
  // This would integrate with the finance module
  const transaction = {
    id: Date.now(),
    type: 'expense',
    category: 'Alimente',
    amount: analysis.totalCost,
    description: `Auto-import din bon: ${analysis.items.length} articole`,
    date: new Date().toISOString().split('T')[0],
    metadata: {
      source: 'receipt_scan',
      codexCompliance: analysis.codexCompliance,
      antiInflammatoryItems: analysis.antiInflammatoryItems
    }
  };
  
  // Would dispatch to finance store
  console.log('Creating finance transaction:', transaction);
}

function getWeekNumber(date) {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}

// =============================================================================
// PERSISTENCE
// =============================================================================

export async function saveEcosystemData() {
  try {
    const data = get(ecosystemData);
    if (navigator.storage?.estimate) {
      const {usage, quota} = await navigator.storage.estimate();
      if ((usage / quota) * 100 > 90) {
        data.receiptAnalysis = data.receiptAnalysis.slice(0, 30);
        data.codexCompliance.weeklyGoals = Object.fromEntries(
          Object.entries(data.codexCompliance.weeklyGoals).slice(-4)
        );
      }
    }
    secureStorage.secureSave('ecosystem_data', data);
  } catch (error) {
    console.error('Error saving:', error);
    localStorage.setItem('ecosystem_backup', JSON.stringify(get(ecosystemData)));
  }
}

const debouncedSave = debounce(() => saveEcosystemData(), 1000);

export function loadEcosystemData() {
  try {
    const saved = secureStorage.secureLoad('ecosystem_data');
    if (saved) {
      ecosystemData.set(saved);
    }
  } catch (error) {
    console.error('Error loading ecosystem data:', error);
  }
}

// Auto-save on changes with debouncing
ecosystemData.subscribe(() => debouncedSave());

// Initialize on load
if (typeof window !== 'undefined') {
  loadEcosystemData();
}

// =============================================================================
// UNIFIED METRICS
// =============================================================================

export const unifiedMetrics = derived(ecosystemData, ($ecosystem) => ({
  // Financial metrics
  monthlyFoodBudget: 2000, // Would come from finance module
  currentFoodSpent: $ecosystem.receiptAnalysis
    .filter(r => new Date(r.timestamp).getMonth() === new Date().getMonth())
    .reduce((sum, r) => sum + r.totalCost, 0),
  
  // Nutrition metrics
  codexScore: $ecosystem.codexCompliance.currentScore,
  plantDiversityScore: ($ecosystem.plantDiversity.weeklyCount / $ecosystem.plantDiversity.monthlyGoal) * 100,
  
  // mTOR cycle
  currentPhase: $ecosystem.mtorCycle.currentPhase,
  dayInCycle: $ecosystem.mtorCycle.dayInCycle,
  
  // Inventory health
  inventoryValue: $ecosystem.inventory.reduce((sum, item) => sum + (item.cost * item.quantity), 0),
  expiringItems: $ecosystem.inventory.filter(item => {
    if (!item.expiryDate) return false;
    const expiry = new Date(item.expiryDate);
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    return expiry <= threeDaysFromNow;
  }).length
}));