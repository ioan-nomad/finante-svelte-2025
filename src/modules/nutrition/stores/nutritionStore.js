// modules/nutrition/stores/nutritionStore.js
import { writable, derived, get } from 'svelte/store';
import { nid, today } from '../../../shared/stores/sharedStore.js';

// ===== CODEX N-OMAD Core Principles =====
const CODEX_PRINCIPLES = {
  mTOR_CYCLE_DAYS: 14,
  WEEKLY_PLANT_GOAL: 30,
  HIGH_PROTEIN_DAYS: [0, 1, 2, 7, 8, 9], // Days 1-3, 8-10 in cycle
  ANTI_INFLAMMATORY_PRIORITY: true,
  INSTANT_POT_STRATIFICATION: true
};

// ===== Nutrition Profile Store =====
function createNutritionProfile() {
  const { subscribe, set, update } = writable({
    startDate: new Date(),
    cycleDay: 1,
    currentPhase: 'high', // 'high' or 'low' protein
    weeklyPlantCount: 0,
    dailyPlants: {},
    inflammationRisk: 0.5,
    mealHistory: [],
    preferences: {
      vegetarian: false,
      vegan: false,
      glutenFree: false,
      dairyFree: false,
      nutAllergies: []
    },
    goals: {
      weightLoss: false,
      muscleGain: false,
      antiInflammatory: true,
      longevity: true,
      cognitiveHealth: true
    }
  });

  return {
    subscribe,
    
    updateCycleDay() {
      update(profile => {
        const today = new Date();
        const daysSinceStart = Math.floor((today - profile.startDate) / (1000 * 60 * 60 * 24));
        const cycleDay = (daysSinceStart % CODEX_PRINCIPLES.mTOR_CYCLE_DAYS) + 1;
        const isHighProteinDay = CODEX_PRINCIPLES.HIGH_PROTEIN_DAYS.includes(cycleDay - 1);
        
        return {
          ...profile,
          cycleDay,
          currentPhase: isHighProteinDay ? 'high' : 'low'
        };
      });
    },
    
    addMeal(meal) {
      update(profile => {
        const updatedHistory = [...profile.mealHistory, meal];
        const weeklyPlants = calculateWeeklyPlants(updatedHistory);
        
        return {
          ...profile,
          mealHistory: updatedHistory,
          weeklyPlantCount: weeklyPlants,
          dailyPlants: {
            ...profile.dailyPlants,
            [meal.date]: (profile.dailyPlants[meal.date] || 0) + meal.plantCount
          }
        };
      });
    },
    
    updatePreferences(newPreferences) {
      update(profile => ({
        ...profile,
        preferences: { ...profile.preferences, ...newPreferences }
      }));
    },
    
    updateGoals(newGoals) {
      update(profile => ({
        ...profile,
        goals: { ...profile.goals, ...newGoals }
      }));
    },
    
    loadFromStorage() {
      const saved = localStorage.getItem('nutritionProfile');
      if (saved) {
        try {
          const data = JSON.parse(saved);
          data.startDate = new Date(data.startDate);
          set(data);
        } catch (error) {
          console.error('Error loading nutrition profile:', error);
        }
      }
    }
  };
}

function calculateWeeklyPlants(mealHistory) {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  
  const recentMeals = mealHistory.filter(meal => 
    new Date(meal.date) >= oneWeekAgo
  );
  
  return recentMeals.reduce((total, meal) => total + meal.plantCount, 0);
}

export const nutritionProfile = createNutritionProfile();

// Auto-save profile changes
nutritionProfile.subscribe(profile => {
  if (profile.mealHistory) {
    localStorage.setItem('nutritionProfile', JSON.stringify({
      ...profile,
      startDate: profile.startDate.toISOString()
    }));
  }
});

// ===== CODEX Recipe Database =====
export const codexRecipes = writable([
  // HIGH PROTEIN RECIPES (mTOR High Days)
  {
    id: 'protein-power-bowl',
    name: '💪 Protein Power Bowl',
    description: 'Bowl cu salmón, quinoa și 8 plante pentru mTOR high days',
    cookingTime: 'medium',
    difficulty: 'easy',
    mealType: 'lunch',
    plantCount: 8,
    protein: 45,
    instantPot: false,
    nutritionalGoals: ['mtor-high', 'anti-inflammatory'],
    ingredients: [
      { name: 'Salmón file', amount: 150, unit: 'g' },
      { name: 'Quinoa', amount: 80, unit: 'g' },
      { name: 'Avocado', amount: 1, unit: 'buc' },
      { name: 'Spanac baby', amount: 100, unit: 'g' },
      { name: 'Roșii cherry', amount: 150, unit: 'g' },
      { name: 'Castraveți', amount: 100, unit: 'g' },
      { name: 'Edamame', amount: 80, unit: 'g' },
      { name: 'Semințe chia', amount: 15, unit: 'g' },
      { name: 'Ulei măsline', amount: 15, unit: 'ml' },
      { name: 'Lămâie', amount: 0.5, unit: 'buc' }
    ],
    instructions: [
      'Fierbe quinoa în apă sărată',
      'Gătește salmónul la tigaie cu puțin ulei',
      'Prepară legumele - spală și toacă',
      'Aranjează toate ingredientele în bol',
      'Condimentează cu ulei măsline și lămâie'
    ],
    nutritionalHighlight: 'Omega-3 din salmón + proteină completă din quinoa'
  },

  {
    id: 'instant-pot-chicken-stew',
    name: '🥘 Instant Pot Chicken & Vegetable Stew',
    description: 'Tocană de pui cu 10 legume, perfectă pentru stratificare IP',
    cookingTime: 'medium',
    difficulty: 'easy',
    mealType: 'dinner',
    plantCount: 10,
    protein: 35,
    instantPot: true,
    nutritionalGoals: ['mtor-high', 'plant-diversity'],
    ingredients: [
      { name: 'Piept de pui', amount: 300, unit: 'g' },
      { name: 'Ceapă', amount: 150, unit: 'g' },
      { name: 'Morcovi', amount: 200, unit: 'g' },
      { name: 'Țelină', amount: 150, unit: 'g' },
      { name: 'Cartofi', amount: 300, unit: 'g' },
      { name: 'Dovleac', amount: 200, unit: 'g' },
      { name: 'Mazăre', amount: 100, unit: 'g' },
      { name: 'Porumb', amount: 100, unit: 'g' },
      { name: 'Fasole verde', amount: 150, unit: 'g' },
      { name: 'Roșii tocate', amount: 400, unit: 'ml' },
      { name: 'Bulion pui', amount: 500, unit: 'ml' }
    ],
    instantPotInstructions: [
      'Layer 1: Ceapă, țelină, morcovi (fond)',
      'Layer 2: Pui tăiat cuburi, condimentat',
      'Layer 3: Cartofi, dovleac (legume tari)',
      'Layer 4: Mazăre, porumb, fasole (legume moi)',
      'Add: Roșii + bulion (nu amesteca!)',
      'Pressure Cook: HIGH 15 min, Natural Release 10 min',
      'Stir gently și servește'
    ],
    nutritionalHighlight: 'Stratificare IP păstrează textura și nutrienții'
  },

  // ANTI-INFLAMMATORY / PLANT-FOCUSED RECIPES  
  {
    id: 'golden-turmeric-lentil-soup',
    name: '🌟 Golden Turmeric Lentil Soup',
    description: 'Supă anti-inflamatoare cu turmeric, ghimbir și 12 plante',
    cookingTime: 'medium',
    difficulty: 'easy',
    mealType: 'dinner',
    plantCount: 12,
    protein: 18,
    instantPot: true,
    nutritionalGoals: ['anti-inflammatory', 'plant-diversity'],
    ingredients: [
      { name: 'Linte roșie', amount: 200, unit: 'g' },
      { name: 'Turmeric proaspăt', amount: 30, unit: 'g' },
      { name: 'Ghimbir proaspăt', amount: 20, unit: 'g' },
      { name: 'Ceapă roșie', amount: 150, unit: 'g' },
      { name: 'Usturoi', amount: 4, unit: 'căței' },
      { name: 'Morcovi', amount: 200, unit: 'g' },
      { name: 'Țelină', amount: 100, unit: 'g' },
      { name: 'Ardei roșu', amount: 150, unit: 'g' },
      { name: 'Lapte cocos', amount: 400, unit: 'ml' },
      { name: 'Spanac', amount: 100, unit: 'g' },
      { name: 'Coriandru proaspăt', amount: 30, unit: 'g' },
      { name: 'Semințe floarea-soarelui', amount: 30, unit: 'g' },
      { name: 'Bulion legume', amount: 500, unit: 'ml' }
    ],
    instantPotInstructions: [
      'Sauté: ceapă, usturoi, ghimbir, turmeric - 3 min',
      'Add: morcovi, țelină, ardei - sauté 2 min',
      'Add: linte, bulion legume',
      'Pressure Cook: HIGH 8 min, Quick Release',
      'Stir in: lapte cocos, spanac, coriandru',
      'Let spanac wilt, taste și ajustează condimente'
    ],
    nutritionalHighlight: 'Curcumina + piperina pentru bioavailabilitate maximă'
  },

  {
    id: 'rainbow-buddha-bowl',
    name: '🌈 Rainbow Buddha Bowl',
    description: 'Bowl vegan cu 15+ plante colorate și tahini dressing',
    cookingTime: 'medium',
    difficulty: 'medium',
    mealType: 'lunch',
    plantCount: 15,
    protein: 22,
    instantPot: false,
    nutritionalGoals: ['plant-diversity', 'anti-inflammatory'],
    ingredients: [
      { name: 'Quinoa tricolor', amount: 80, unit: 'g' },
      { name: 'Naut fiert', amount: 150, unit: 'g' },
      { name: 'Sfeclă roșie', amount: 100, unit: 'g' },
      { name: 'Morcovi', amount: 100, unit: 'g' },
      { name: 'Varză roșie', amount: 80, unit: 'g' },
      { name: 'Broccoli', amount: 100, unit: 'g' },
      { name: 'Avocado', amount: 1, unit: 'buc' },
      { name: 'Semințe dovleac', amount: 20, unit: 'g' },
      { name: 'Semințe floarea-soarelui', amount: 20, unit: 'g' },
      { name: 'Rucola', amount: 50, unit: 'g' },
      { name: 'Roșii cherry', amount: 100, unit: 'g' },
      { name: 'Tahini', amount: 30, unit: 'g' },
      { name: 'Lămâie', amount: 1, unit: 'buc' },
      { name: 'Ulei măsline', amount: 15, unit: 'ml' },
      { name: 'Miere', amount: 10, unit: 'g' }
    ],
    instructions: [
      'Coace sfecla și morcovii la cuptor cu puțin ulei',
      'Fierbe quinoa și naut-ul',
      'Pregătește dressingul din tahini, lămâie, miere',
      'Aranjează toate ingredientele în sectoare colorate',
      'Presară semințele și servește cu dressing'
    ],
    nutritionalHighlight: '15 culori diferite = antioxidanți diversi'
  },

  // INSTANT POT SPECIALTIES
  {
    id: 'ip-mediterranean-fish-stew',
    name: '🐟 IP Mediterranean Fish Stew',
    description: 'Ciorbă mediteraneană cu pește și 9 legume în Instant Pot',
    cookingTime: 'quick',
    difficulty: 'medium',
    mealType: 'dinner',
    plantCount: 9,
    protein: 40,
    instantPot: true,
    nutritionalGoals: ['mtor-high', 'anti-inflammatory'],
    ingredients: [
      { name: 'File cod/păstrăv', amount: 400, unit: 'g' },
      { name: 'Ceapă', amount: 150, unit: 'g' },
      { name: 'Usturoi', amount: 4, unit: 'căței' },
      { name: 'Ardei roșu', amount: 200, unit: 'g' },
      { name: 'Roșii tocate', amount: 400, unit: 'ml' },
      { name: 'Măsline Kalamata', amount: 80, unit: 'g' },
      { name: 'Dovlecei', amount: 200, unit: 'g' },
      { name: 'Fenicul', amount: 100, unit: 'g' },
      { name: 'Capers', amount: 30, unit: 'g' },
      { name: 'Vin alb', amount: 100, unit: 'ml' },
      { name: 'Bulion pește', amount: 300, unit: 'ml' }
    ],
    instantPotInstructions: [
      'Sauté: ceapă, usturoi, fenicul - 3 min',
      'Add: ardei roșu - sauté 2 min',
      'Add: roșii, vin, bulion, măsline, capers',
      'Pressure Cook: HIGH 4 min, Quick Release',
      'Add: pește tăiat bucăți, dovlecei',
      'Sauté 3-4 min până peștele e gata'
    ],
    nutritionalHighlight: 'Omega-3 + licopenă pentru sănătate cardio-vasculară'
  },

  // BREAKFAST RECIPES
  {
    id: 'protein-overnight-oats',
    name: '🌅 Protein Overnight Oats',
    description: 'Ovăz over-night cu proteină vegetală și 8 super-foods',
    cookingTime: 'quick',
    difficulty: 'easy',
    mealType: 'breakfast',
    plantCount: 8,
    protein: 25,
    instantPot: false,
    nutritionalGoals: ['mtor-high', 'plant-diversity'],
    ingredients: [
      { name: 'Ovăz', amount: 60, unit: 'g' },
      { name: 'Proteină vegetală (mazăre)', amount: 30, unit: 'g' },
      { name: 'Semințe chia', amount: 20, unit: 'g' },
      { name: 'Migdale măcinate', amount: 30, unit: 'g' },
      { name: 'Afine congelate', amount: 100, unit: 'g' },
      { name: 'Banană', amount: 1, unit: 'buc' },
      { name: 'Lapte migdale', amount: 300, unit: 'ml' },
      { name: 'Miere', amount: 15, unit: 'g' },
      { name: 'Scorțișoară', amount: 1, unit: 'linguriță' }
    ],
    instructions: [
      'Amestecă ovăzul cu laptele și semințele chia',
      'Adaugă proteina vegetală și mierea',
      'Las în frigider peste noapte',
      'Dimineața adaugă fructele și migdalele',
      'Presară scorțișoară înainte de servire'
    ],
    nutritionalHighlight: 'Proteină completă + fibre + omega-3'
  },

  // SNACKS & SMALL MEALS
  {
    id: 'anti-inflammatory-smoothie',
    name: '🥤 Anti-Inflammatory Green Smoothie',
    description: 'Smoothie verde cu turmeric, ghimbir și 7 plante anti-inflamatoare',
    cookingTime: 'quick',
    difficulty: 'easy',
    mealType: 'snack',
    plantCount: 7,
    protein: 12,
    instantPot: false,
    nutritionalGoals: ['anti-inflammatory', 'plant-diversity'],
    ingredients: [
      { name: 'Spanac proaspăt', amount: 100, unit: 'g' },
      { name: 'Ananas', amount: 150, unit: 'g' },
      { name: 'Ghimbir proaspăt', amount: 15, unit: 'g' },
      { name: 'Turmeric pudră', amount: 1, unit: 'linguriță' },
      { name: 'Apă cocos', amount: 300, unit: 'ml' },
      { name: 'Semințe cânepă', amount: 20, unit: 'g' },
      { name: 'Spirulina pudră', amount: 5, unit: 'g' },
      { name: 'Lămâie', amount: 0.5, unit: 'buc' }
    ],
    instructions: [
      'Pune toate ingredientele în blender',
      'Mixează până obții o consistență omogenă',
      'Adaugă apă dacă e prea gros',
      'Servește imediat pentru maximum nutrienți'
    ],
    nutritionalHighlight: 'Chlorofila + curcumina pentru detoxifiere'
  }
]);

// ===== Helper Functions =====
export function addMealToProfile(meal) {
  nutritionProfile.addMeal(meal);
}

export function updateNutritionPreferences(preferences) {
  nutritionProfile.updatePreferences(preferences);
}

export function updateNutritionGoals(goals) {
  nutritionProfile.updateGoals(goals);
}

// ===== Derived Stores =====
export const weeklyProgress = derived(
  nutritionProfile,
  $profile => {
    const plantProgress = Math.min(100, ($profile.weeklyPlantCount / CODEX_PRINCIPLES.WEEKLY_PLANT_GOAL) * 100);
    const mealCount = $profile.mealHistory.length;
    
    return {
      plantProgress: Math.round(plantProgress),
      plantsAchieved: $profile.weeklyPlantCount,
      plantsNeeded: Math.max(0, CODEX_PRINCIPLES.WEEKLY_PLANT_GOAL - $profile.weeklyPlantCount),
      mealsTracked: mealCount,
      currentPhase: $profile.currentPhase,
      cycleDay: $profile.cycleDay,
      inflammationRisk: $profile.inflammationRisk
    };
  }
);

export const todaysRecommendations = derived(
  nutritionProfile,
  $profile => {
    const isHighProtein = $profile.currentPhase === 'high';
    const todayPlants = $profile.dailyPlants[today()] || 0;
    const needMorePlants = todayPlants < 10;

    return {
      proteinFocus: isHighProtein,
      plantFocus: !isHighProtein || needMorePlants,
      antiInflammatory: $profile.inflammationRisk > 0.6,
      instantPotRecommended: true, // Always recommend for convenience
      mealType: getCurrentMealType(),
      targetPlants: isHighProtein ? '5-8 plante' : '8-12 plante',
      targetProtein: isHighProtein ? '25-40g' : '15-25g'
    };
  }
);

function getCurrentMealType() {
  const hour = new Date().getHours();
  if (hour < 11) return 'breakfast';
  if (hour < 15) return 'lunch';
  if (hour < 20) return 'dinner';
  return 'snack';
}

// ===== Initialize =====
nutritionProfile.loadFromStorage();
nutritionProfile.updateCycleDay();

// Update cycle daily
setInterval(() => {
  nutritionProfile.updateCycleDay();
}, 24 * 60 * 60 * 1000);

// ===== Export for Recipe Suggestions =====
export function getRecipeSuggestionsForProfile() {
  const profile = get(nutritionProfile);
  const recipes = get(codexRecipes);
  const recommendations = get(todaysRecommendations);
  
  // Filter recipes based on current nutrition needs
  return recipes.filter(recipe => {
    // Match protein requirements
    if (recommendations.proteinFocus && recipe.protein < 20) return false;
    if (!recommendations.proteinFocus && recipe.protein > 30) return false;
    
    // Match meal type
    if (recipe.mealType !== 'all' && recipe.mealType !== recommendations.mealType) return false;
    
    // Prioritize anti-inflammatory if needed
    if (recommendations.antiInflammatory) {
      return recipe.nutritionalGoals.includes('anti-inflammatory');
    }
    
    return true;
  }).sort((a, b) => {
    // Sort by relevance to current needs
    let scoreA = 0;
    let scoreB = 0;
    
    if (recommendations.plantFocus) {
      scoreA += a.plantCount;
      scoreB += b.plantCount;
    }
    
    if (recommendations.proteinFocus) {
      scoreA += a.protein;
      scoreB += b.protein;
    }
    
    return scoreB - scoreA;
  });
}