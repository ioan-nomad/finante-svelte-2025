// =============================================================================
// PLANT DIVERSITY TRACKER - 30+ SPECIES WEEKLY GOAL
// Optimized for anti-inflammatory and longevity benefits
// =============================================================================

import { writable, derived, get } from 'svelte/store';
import { secureStorage } from '../../../lib/security/disabled.js';

// =============================================================================
// PLANT DIVERSITY STATE
// =============================================================================

export const plantDiversityState = writable({
  // Current tracking
  weeklyConsumption: [], // Array of consumed plants this week
  monthlyConsumption: [], // Array of consumed plants this month
  
  // Goals
  weeklyGoal: 30, // 30+ different plant species per week
  monthlyGoal: 50, // 50+ different species per month
  
  // Consumption history
  consumptionHistory: [], // Daily logs
  
  // Personal preferences and restrictions
  preferences: {
    antiInflammatoryFocus: true,
    allergies: [], // List of plants to avoid
    dislikes: [], // Plants user dislikes
    favorites: [], // Preferred plants
    seasonal: true, // Prefer seasonal vegetables
    local: true, // Prefer locally grown
    organic: true // Prefer organic when possible
  },
  
  // Achievement tracking
  achievements: {
    bestWeek: 0,
    bestMonth: 0,
    streaks: {
      current: 0,
      longest: 0
    },
    milestones: []
  }
});

// =============================================================================
// COMPREHENSIVE PLANT DATABASE
// =============================================================================

export const PLANT_DATABASE = {
  // =============================================================================
  // LEAFY GREENS (High Priority - Anti-inflammatory Champions)
  // =============================================================================
  leafyGreens: {
    kale: {
      name: 'Kale',
      species: 'Brassica oleracea',
      antiInflammatory: 'very_high',
      nutrients: ['vitamin_k', 'vitamin_c', 'beta_carotene', 'quercetin'],
      polyphenols: 'high',
      season: ['fall', 'winter', 'spring'],
      score: 98
    },
    spinach: {
      name: 'Spanac',
      species: 'Spinacia oleracea', 
      antiInflammatory: 'high',
      nutrients: ['folate', 'iron', 'magnesium', 'nitrates'],
      polyphenols: 'high',
      season: ['spring', 'fall'],
      score: 95
    },
    arugula: {
      name: 'Rucola',
      species: 'Eruca sativa',
      antiInflammatory: 'high',
      nutrients: ['vitamin_k', 'nitrates', 'glucosinolates'],
      polyphenols: 'moderate',
      season: ['spring', 'fall'],
      score: 92
    },
    watercress: {
      name: 'Năsturel',
      species: 'Nasturtium officinale',
      antiInflammatory: 'very_high',
      nutrients: ['vitamin_k', 'vitamin_c', 'isothiocyanates'],
      polyphenols: 'very_high',
      season: ['spring', 'summer'],
      score: 100
    },
    swissChard: {
      name: 'Sfecla de zahăr (frunze)',
      species: 'Beta vulgaris',
      antiInflammatory: 'high',
      nutrients: ['magnesium', 'potassium', 'betalains'],
      polyphenols: 'high',
      season: ['summer', 'fall'],
      score: 90
    },
    lettuce: {
      name: 'Salată verde',
      species: 'Lactuca sativa',
      antiInflammatory: 'moderate',
      nutrients: ['vitamin_k', 'folate', 'water'],
      polyphenols: 'low',
      season: ['spring', 'summer', 'fall'],
      score: 75
    },
    endive: {
      name: 'Andivă',
      species: 'Cichorium endivia',
      antiInflammatory: 'moderate',
      nutrients: ['vitamin_k', 'folate', 'fiber'],
      polyphenols: 'moderate',
      season: ['fall', 'winter'],
      score: 82
    },
    radicchio: {
      name: 'Radicchio',
      species: 'Cichorium intybus',
      antiInflammatory: 'high',
      nutrients: ['anthocyanins', 'vitamin_k', 'inulin'],
      polyphenols: 'high',
      season: ['fall', 'winter'],
      score: 88
    }
  },

  // =============================================================================
  // CRUCIFEROUS VEGETABLES (Detox Champions)
  // =============================================================================
  cruciferous: {
    broccoli: {
      name: 'Broccoli',
      species: 'Brassica oleracea',
      antiInflammatory: 'very_high',
      nutrients: ['sulforaphane', 'vitamin_c', 'fiber', 'folate'],
      polyphenols: 'high',
      season: ['fall', 'winter', 'spring'],
      score: 95
    },
    broccoliSprouts: {
      name: 'Broccoli germinat',
      species: 'Brassica oleracea (sprouts)',
      antiInflammatory: 'extremely_high',
      nutrients: ['sulforaphane', 'glucosinolates'],
      polyphenols: 'very_high',
      season: ['year_round'],
      score: 100
    },
    cauliflower: {
      name: 'Conopidă',
      species: 'Brassica oleracea',
      antiInflammatory: 'high',
      nutrients: ['vitamin_c', 'fiber', 'choline'],
      polyphenols: 'moderate',
      season: ['fall', 'winter'],
      score: 88
    },
    brusselsSprouts: {
      name: 'Varză de Bruxelles',
      species: 'Brassica oleracea',
      antiInflammatory: 'high',
      nutrients: ['vitamin_k', 'vitamin_c', 'glucosinolates'],
      polyphenols: 'high',
      season: ['fall', 'winter'],
      score: 90
    },
    cabbage: {
      name: 'Varză',
      species: 'Brassica oleracea',
      antiInflammatory: 'high',
      nutrients: ['vitamin_c', 'vitamin_k', 'fiber'],
      polyphenols: 'moderate',
      season: ['fall', 'winter'],
      score: 85
    },
    redCabbage: {
      name: 'Varză roșie',
      species: 'Brassica oleracea',
      antiInflammatory: 'very_high',
      nutrients: ['anthocyanins', 'vitamin_c', 'polyphenols'],
      polyphenols: 'very_high',
      season: ['fall', 'winter'],
      score: 92
    },
    bokChoy: {
      name: 'Bok choy',
      species: 'Brassica rapa',
      antiInflammatory: 'high',
      nutrients: ['vitamin_a', 'vitamin_c', 'calcium'],
      polyphenols: 'moderate',
      season: ['spring', 'fall'],
      score: 87
    },
    radishes: {
      name: 'Ridichi',
      species: 'Raphanus sativus',
      antiInflammatory: 'moderate',
      nutrients: ['vitamin_c', 'fiber', 'isothiocyanates'],
      polyphenols: 'moderate',
      season: ['spring', 'summer'],
      score: 80
    }
  },

  // =============================================================================
  // COLORFUL VEGETABLES (Antioxidant Powerhouses)
  // =============================================================================
  colorfulVegetables: {
    redPeppers: {
      name: 'Ardei roșii',
      species: 'Capsicum annuum',
      antiInflammatory: 'high',
      nutrients: ['vitamin_c', 'beta_carotene', 'lycopene'],
      polyphenols: 'high',
      season: ['summer', 'fall'],
      score: 90
    },
    yellowPeppers: {
      name: 'Ardei galbeni',
      species: 'Capsicum annuum',
      antiInflammatory: 'high',
      nutrients: ['vitamin_c', 'beta_carotene', 'flavonoids'],
      polyphenols: 'high',
      season: ['summer', 'fall'],
      score: 88
    },
    carrots: {
      name: 'Morcovi',
      species: 'Daucus carota',
      antiInflammatory: 'moderate',
      nutrients: ['beta_carotene', 'fiber', 'potassium'],
      polyphenols: 'moderate',
      season: ['fall', 'winter'],
      score: 85
    },
    sweetPotatoes: {
      name: 'Cartof dulce',
      species: 'Ipomoea batatas',
      antiInflammatory: 'high',
      nutrients: ['beta_carotene', 'fiber', 'potassium'],
      polyphenols: 'moderate',
      season: ['fall', 'winter'],
      score: 90
    },
    beets: {
      name: 'Sfeclă roșie',
      species: 'Beta vulgaris',
      antiInflammatory: 'high',
      nutrients: ['betalains', 'nitrates', 'folate'],
      polyphenols: 'high',
      season: ['fall', 'winter'],
      score: 92
    },
    purpleEggplant: {
      name: 'Vânătă',
      species: 'Solanum melongena',
      antiInflammatory: 'moderate',
      nutrients: ['nasunin', 'fiber', 'potassium'],
      polyphenols: 'high',
      season: ['summer', 'fall'],
      score: 85
    },
    tomatoes: {
      name: 'Roșii',
      species: 'Solanum lycopersicum',
      antiInflammatory: 'high',
      nutrients: ['lycopene', 'vitamin_c', 'potassium'],
      polyphenols: 'high',
      season: ['summer'],
      score: 87
    },
    purpleOnions: {
      name: 'Ceapă roșie',
      species: 'Allium cepa',
      antiInflammatory: 'high',
      nutrients: ['quercetin', 'anthocyanins', 'sulfur_compounds'],
      polyphenols: 'very_high',
      season: ['summer', 'fall'],
      score: 90
    }
  },

  // =============================================================================
  // BERRIES (Antioxidant & Brain Health Champions)
  // =============================================================================
  berries: {
    blueberries: {
      name: 'Afine',
      species: 'Vaccinium corymbosum',
      antiInflammatory: 'very_high',
      nutrients: ['anthocyanins', 'vitamin_c', 'pterostilbene'],
      polyphenols: 'very_high',
      season: ['summer'],
      score: 98
    },
    blackberries: {
      name: 'Mure',
      species: 'Rubus fruticosus',
      antiInflammatory: 'very_high',
      nutrients: ['anthocyanins', 'fiber', 'vitamin_c'],
      polyphenols: 'very_high',
      season: ['summer'],
      score: 95
    },
    raspberries: {
      name: 'Zmeură',
      species: 'Rubus idaeus',
      antiInflammatory: 'high',
      nutrients: ['ellagic_acid', 'fiber', 'vitamin_c'],
      polyphenols: 'high',
      season: ['summer'],
      score: 93
    },
    strawberries: {
      name: 'Căpșuni',
      species: 'Fragaria × ananassa',
      antiInflammatory: 'high',
      nutrients: ['vitamin_c', 'folate', 'anthocyanins'],
      polyphenols: 'high',
      season: ['spring', 'summer'],
      score: 90
    },
    cranberries: {
      name: 'Merișoare',
      species: 'Vaccinium macrocarpon',
      antiInflammatory: 'high',
      nutrients: ['proanthocyanins', 'vitamin_c'],
      polyphenols: 'high',
      season: ['fall'],
      score: 88
    },
    elderberries: {
      name: 'Soc',
      species: 'Sambucus canadensis',
      antiInflammatory: 'very_high',
      nutrients: ['anthocyanins', 'vitamin_c', 'quercetin'],
      polyphenols: 'very_high',
      season: ['fall'],
      score: 95
    }
  },

  // =============================================================================
  // HERBS & SPICES (Concentrated Anti-inflammatory Compounds)
  // =============================================================================
  herbsSpices: {
    turmeric: {
      name: 'Curcuma',
      species: 'Curcuma longa',
      antiInflammatory: 'extremely_high',
      nutrients: ['curcumin', 'volatile_oils'],
      polyphenols: 'very_high',
      season: ['year_round'],
      score: 100
    },
    ginger: {
      name: 'Ghimbir',
      species: 'Zingiber officinale',
      antiInflammatory: 'very_high',
      nutrients: ['gingerol', 'shogaol'],
      polyphenols: 'high',
      season: ['year_round'],
      score: 95
    },
    garlic: {
      name: 'Usturoi',
      species: 'Allium sativum',
      antiInflammatory: 'very_high',
      nutrients: ['allicin', 'sulfur_compounds'],
      polyphenols: 'high',
      season: ['year_round'],
      score: 93
    },
    oregano: {
      name: 'Oregano',
      species: 'Origanum vulgare',
      antiInflammatory: 'very_high',
      nutrients: ['carvacrol', 'thymol'],
      polyphenols: 'very_high',
      season: ['summer'],
      score: 90
    },
    rosemary: {
      name: 'Rozmarin',
      species: 'Rosmarinus officinalis',
      antiInflammatory: 'high',
      nutrients: ['rosmarinic_acid', 'carnosol'],
      polyphenols: 'high',
      season: ['year_round'],
      score: 92
    },
    thyme: {
      name: 'Cimbru',
      species: 'Thymus vulgaris',
      antiInflammatory: 'high',
      nutrients: ['thymol', 'carvacrol'],
      polyphenols: 'high',
      season: ['summer'],
      score: 88
    },
    parsley: {
      name: 'Pătrunjel',
      species: 'Petroselinum crispum',
      antiInflammatory: 'moderate',
      nutrients: ['vitamin_k', 'vitamin_c', 'apigenin'],
      polyphenols: 'moderate',
      season: ['year_round'],
      score: 85
    },
    cilantro: {
      name: 'Coriandru verde',
      species: 'Coriandrum sativum',
      antiInflammatory: 'moderate',
      nutrients: ['vitamin_k', 'detox_compounds'],
      polyphenols: 'moderate',
      season: ['year_round'],
      score: 82
    },
    basil: {
      name: 'Busuioc',
      species: 'Ocimum basilicum',
      antiInflammatory: 'moderate',
      nutrients: ['eugenol', 'rosmarinic_acid'],
      polyphenols: 'moderate',
      season: ['summer'],
      score: 85
    }
  },

  // =============================================================================
  // ADDITIONAL CATEGORIES
  // =============================================================================
  alliums: {
    onions: {
      name: 'Ceapă albă',
      species: 'Allium cepa',
      antiInflammatory: 'high',
      nutrients: ['quercetin', 'sulfur_compounds'],
      polyphenols: 'high',
      season: ['year_round'],
      score: 87
    },
    leeks: {
      name: 'Praz',
      species: 'Allium ampeloprasum',
      antiInflammatory: 'moderate',
      nutrients: ['vitamin_k', 'folate'],
      polyphenols: 'moderate',
      season: ['fall', 'winter'],
      score: 80
    },
    shallots: {
      name: 'Șalote',
      species: 'Allium ascalonicum',
      antiInflammatory: 'high',
      nutrients: ['quercetin', 'phenolic_compounds'],
      polyphenols: 'high',
      season: ['year_round'],
      score: 85
    },
    greenOnions: {
      name: 'Ceapă verde',
      species: 'Allium fistulosum',
      antiInflammatory: 'moderate',
      nutrients: ['vitamin_k', 'vitamin_c'],
      polyphenols: 'moderate',
      season: ['year_round'],
      score: 78
    }
  },

  mushrooms: {
    shiitake: {
      name: 'Ciuperci shiitake',
      species: 'Lentinula edodes',
      antiInflammatory: 'high',
      nutrients: ['lentinan', 'eritadenine'],
      polyphenols: 'moderate',
      season: ['year_round'],
      score: 90
    },
    oyster: {
      name: 'Pleurotus',
      species: 'Pleurotus ostreatus',
      antiInflammatory: 'moderate',
      nutrients: ['beta_glucans', 'potassium'],
      polyphenols: 'moderate',
      season: ['year_round'],
      score: 82
    },
    reishi: {
      name: 'Ganoderma (Reishi)',
      species: 'Ganoderma lucidum',
      antiInflammatory: 'very_high',
      nutrients: ['triterpenes', 'beta_glucans'],
      polyphenols: 'high',
      season: ['year_round'],
      score: 95
    }
  }
};

// =============================================================================
// DERIVED STORES
// =============================================================================

export const currentWeekProgress = derived(plantDiversityState, ($state) => {
  const consumed = $state.weeklyConsumption;
  const unique = new Set(consumed.map(plant => plant.species));
  
  return {
    consumedCount: unique.size,
    goal: $state.weeklyGoal,
    progressPercentage: (unique.size / $state.weeklyGoal) * 100,
    remaining: Math.max(0, $state.weeklyGoal - unique.size),
    isComplete: unique.size >= $state.weeklyGoal
  };
});

export const antiInflammatoryScore = derived(plantDiversityState, ($state) => {
  const consumed = $state.weeklyConsumption;
  let totalScore = 0;
  let antiInflammatoryCount = 0;
  
  consumed.forEach(plant => {
    if (plant.antiInflammatory === 'extremely_high') {
      totalScore += 100;
      antiInflammatoryCount++;
    } else if (plant.antiInflammatory === 'very_high') {
      totalScore += 80;
      antiInflammatoryCount++;
    } else if (plant.antiInflammatory === 'high') {
      totalScore += 60;
      antiInflammatoryCount++;
    } else if (plant.antiInflammatory === 'moderate') {
      totalScore += 40;
      antiInflammatoryCount++;
    }
  });
  
  return {
    score: consumed.length > 0 ? Math.round(totalScore / consumed.length) : 0,
    antiInflammatoryPlants: antiInflammatoryCount,
    totalPlants: consumed.length,
    percentage: consumed.length > 0 ? Math.round((antiInflammatoryCount / consumed.length) * 100) : 0
  };
});

export const plantRecommendations = derived(plantDiversityState, ($state) => {
  const consumed = new Set($state.weeklyConsumption.map(plant => plant.species));
  const currentSeason = getCurrentSeason();
  const recommendations = [];
  
  // Find high-scoring plants not yet consumed this week
  Object.values(PLANT_DATABASE).forEach(category => {
    Object.values(category).forEach(plant => {
      if (!consumed.has(plant.species) && 
          (plant.season.includes(currentSeason) || plant.season.includes('year_round')) &&
          plant.antiInflammatory === 'very_high' || plant.antiInflammatory === 'extremely_high') {
        recommendations.push(plant);
      }
    });
  });
  
  // Sort by anti-inflammatory score and season appropriateness
  return recommendations
    .sort((a, b) => b.score - a.score)
    .slice(0, 10); // Top 10 recommendations
});

// =============================================================================
// TRACKING FUNCTIONS
// =============================================================================

export function logPlantConsumption(plantData) {
  plantDiversityState.update(state => {
    const consumption = {
      ...plantData,
      timestamp: new Date().toISOString(),
      date: new Date().toISOString().split('T')[0],
      week: getWeekNumber(new Date()),
      month: new Date().getMonth() + 1
    };
    
    // Add to weekly consumption
    state.weeklyConsumption.push(consumption);
    
    // Add to monthly consumption
    state.monthlyConsumption.push(consumption);
    
    // Add to history
    state.consumptionHistory.push(consumption);
    
    // Clean up old data (keep last 3 months)
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    
    state.consumptionHistory = state.consumptionHistory.filter(
      item => new Date(item.timestamp) > threeMonthsAgo
    );
    
    // Update achievements
    updateAchievements(state);
    
    return state;
  });
  
  savePlantData();
}

export function resetWeeklyTracking() {
  plantDiversityState.update(state => {
    state.weeklyConsumption = [];
    return state;
  });
  
  savePlantData();
}

export function updatePreferences(preferences) {
  plantDiversityState.update(state => {
    state.preferences = { ...state.preferences, ...preferences };
    return state;
  });
  
  savePlantData();
}

export function getPlantByName(name) {
  for (const category of Object.values(PLANT_DATABASE)) {
    for (const plant of Object.values(category)) {
      if (plant.name.toLowerCase().includes(name.toLowerCase())) {
        return plant;
      }
    }
  }
  return null;
}

export function searchPlants(query) {
  const results = [];
  const queryLower = query.toLowerCase();
  
  for (const category of Object.values(PLANT_DATABASE)) {
    for (const plant of Object.values(category)) {
      if (plant.name.toLowerCase().includes(queryLower) ||
          plant.species.toLowerCase().includes(queryLower)) {
        results.push(plant);
      }
    }
  }
  
  return results.sort((a, b) => b.score - a.score);
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function getCurrentSeason() {
  const month = new Date().getMonth() + 1;
  if (month >= 3 && month <= 5) return 'spring';
  if (month >= 6 && month <= 8) return 'summer';
  if (month >= 9 && month <= 11) return 'fall';
  return 'winter';
}

function getWeekNumber(date) {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}

function updateAchievements(state) {
  const weeklyCount = new Set(state.weeklyConsumption.map(p => p.species)).size;
  const monthlyCount = new Set(state.monthlyConsumption.map(p => p.species)).size;
  
  // Update best records
  if (weeklyCount > state.achievements.bestWeek) {
    state.achievements.bestWeek = weeklyCount;
  }
  
  if (monthlyCount > state.achievements.bestMonth) {
    state.achievements.bestMonth = monthlyCount;
  }
  
  // Update streaks
  if (weeklyCount >= state.weeklyGoal) {
    state.achievements.streaks.current++;
    if (state.achievements.streaks.current > state.achievements.streaks.longest) {
      state.achievements.streaks.longest = state.achievements.streaks.current;
    }
  } else {
    state.achievements.streaks.current = 0;
  }
  
  // Check for milestones
  const milestones = [10, 20, 30, 40, 50];
  milestones.forEach(milestone => {
    if (weeklyCount >= milestone && 
        !state.achievements.milestones.includes(milestone)) {
      state.achievements.milestones.push(milestone);
    }
  });
}

// =============================================================================
// PERSISTENCE
// =============================================================================

export function savePlantData() {
  try {
    secureStorage.secureSave('plant_diversity_data', get(plantDiversityState));
  } catch (error) {
    console.error('Error saving plant diversity data:', error);
  }
}

export function loadPlantData() {
  try {
    const saved = secureStorage.secureLoad('plant_diversity_data');
    if (saved) {
      plantDiversityState.set(saved);
    }
  } catch (error) {
    console.error('Error loading plant diversity data:', error);
  }
}

// Auto-save on changes
plantDiversityState.subscribe(() => savePlantData());

// Initialize on load
if (typeof window !== 'undefined') {
  loadPlantData();
}

export default {
  plantDiversityState,
  currentWeekProgress,
  antiInflammatoryScore,
  plantRecommendations,
  logPlantConsumption,
  resetWeeklyTracking,
  updatePreferences,
  getPlantByName,
  searchPlants,
  PLANT_DATABASE
};