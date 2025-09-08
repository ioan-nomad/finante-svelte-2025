// modules/nutrition/stores/nutritionStore.js
import { writable, derived, get } from 'svelte/store';
import { nid, today } from '../../../shared/stores/sharedStore.js';
import { codexEngine } from '../codex/codexEngine.js';
import { currentRecommendations, cycleProgress } from '../mtor/mtorTracker.js';
import { currentWeekProgress, antiInflammatoryScore, logPlantConsumption } from '../plants/plantDiversityTracker.js';
let ecosystemStore = null;

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
      // Dezactivat în development
      return null;
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
    try {
      localStorage.setItem('nutritionProfile', JSON.stringify({
        ...profile,
        startDate: profile.startDate.toISOString()
      }));
    } catch(e) {
      // ignoră eroarea
    }
  }
});

// ===== CODEX Recipe Database =====
function createCodexRecipes() {
  const defaultRecipes = [
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
  },

  // MORE BREAKFAST RECIPES
  {
    id: 'ip-steel-cut-oats',
    name: '🌅 IP Steel-Cut Oats cu Afine și Nuci',
    description: 'Ovăz steel-cut perfect în Instant Pot cu 6 super-foods',
    cookingTime: 'medium',
    difficulty: 'easy',
    mealType: 'breakfast',
    plantCount: 6,
    protein: 18,
    instantPot: true,
    nutritionalGoals: ['plant-diversity', 'mtor-high'],
    ingredients: [
      { name: 'Ovăz steel-cut', amount: 200, unit: 'g' },
      { name: 'Lapte migdale', amount: 600, unit: 'ml' },
      { name: 'Afine congelate', amount: 150, unit: 'g' },
      { name: 'Nuci', amount: 60, unit: 'g' },
      { name: 'Semințe chia', amount: 30, unit: 'g' },
      { name: 'Scorțișoară', amount: 1, unit: 'linguriță' },
      { name: 'Vanilie', amount: 1, unit: 'linguriță' },
      { name: 'Miere', amount: 30, unit: 'g' }
    ],
    instantPotInstructions: [
      'Spray IP cu ulei - anti-stick',
      'Add: ovăz, lapte, scorțișoară, vanilie',
      'Pressure Cook: HIGH 4 min, Natural Release 10 min',
      'Stir in: afine, semințe chia, miere',
      'Let afine warm through, top cu nuci'
    ],
    nutritionalHighlight: 'Fibre solubile + antioxidanți + omega-3'
  },

  {
    id: 'veggie-scramble-wrap',
    name: '🌯 Veggie Scramble Breakfast Wrap',
    description: 'Wrap cu ouă, 9 legume și avocado - portabil și nutritiv',
    cookingTime: 'quick',
    difficulty: 'easy',
    mealType: 'breakfast',
    plantCount: 9,
    protein: 22,
    instantPot: false,
    nutritionalGoals: ['plant-diversity', 'mtor-high'],
    ingredients: [
      { name: 'Ouă', amount: 3, unit: 'buc' },
      { name: 'Tortilla integrală', amount: 1, unit: 'buc' },
      { name: 'Spanac baby', amount: 50, unit: 'g' },
      { name: 'Roșii cherry', amount: 100, unit: 'g' },
      { name: 'Ardei roșu', amount: 80, unit: 'g' },
      { name: 'Ceapă verde', amount: 30, unit: 'g' },
      { name: 'Avocado', amount: 0.5, unit: 'buc' },
      { name: 'Ciuperci', amount: 60, unit: 'g' },
      { name: 'Brânză de capră', amount: 40, unit: 'g' },
      { name: 'Ulei măsline', amount: 10, unit: 'ml' },
      { name: 'Oregano proaspăt', amount: 5, unit: 'g' }
    ],
    instructions: [
      'Încălzește uleiul în tigaie antiaderentă',
      'Sauté ciupercile și ardeii 3 minute',
      'Adaugă spanacul până se ofilește',
      'Scramble ouăle cu legumele',
      'Umple tortilla, adaugă avocado și brânza'
    ],
    nutritionalHighlight: '9 culori diferite = spectru complet de nutrienți'
  },

  // MORE LUNCH RECIPES
  {
    id: 'ip-lentil-vegetable-curry',
    name: '🍛 IP Lentil Vegetable Curry',
    description: 'Curry de linte cu 11 legume și condimente anti-inflamatoare',
    cookingTime: 'medium',
    difficulty: 'medium',
    mealType: 'lunch',
    plantCount: 11,
    protein: 20,
    instantPot: true,
    nutritionalGoals: ['anti-inflammatory', 'plant-diversity'],
    ingredients: [
      { name: 'Linte roșie', amount: 200, unit: 'g' },
      { name: 'Lapte cocos', amount: 400, unit: 'ml' },
      { name: 'Ceapă', amount: 150, unit: 'g' },
      { name: 'Usturoi', amount: 4, unit: 'căței' },
      { name: 'Ghimbir proaspăt', amount: 20, unit: 'g' },
      { name: 'Curcuma proaspătă', amount: 15, unit: 'g' },
      { name: 'Ardei roșu', amount: 150, unit: 'g' },
      { name: 'Morcovi', amount: 150, unit: 'g' },
      { name: 'Conopidă', amount: 200, unit: 'g' },
      { name: 'Mazăre verde', amount: 100, unit: 'g' },
      { name: 'Spanac', amount: 100, unit: 'g' },
      { name: 'Coriandru proaspăt', amount: 30, unit: 'g' },
      { name: 'Bulion legume', amount: 300, unit: 'ml' }
    ],
    instantPotInstructions: [
      'Sauté: ceapă, usturoi, ghimbir, curcuma - 3 min',
      'Add: linte, bulion, lapte cocos, condimente',
      'Layer: morcovi, conopidă, ardei (nu amesteca)',
      'Pressure Cook: HIGH 12 min, Quick Release',
      'Stir in: mazăre, spanac, coriandru - 2 min'
    ],
    nutritionalHighlight: 'Curcuma + ghimbir + piperina pentru absorbție maximă'
  },

  {
    id: 'mediterranean-stuffed-peppers',
    name: '🫑 Mediterranean Stuffed Peppers',
    description: 'Ardei umpluți cu quinoa, 8 legume mediteraneene și ierburi',
    cookingTime: 'medium',
    difficulty: 'medium',
    mealType: 'lunch',
    plantCount: 8,
    protein: 16,
    instantPot: true,
    nutritionalGoals: ['plant-diversity', 'anti-inflammatory'],
    ingredients: [
      { name: 'Ardei mari colorați', amount: 4, unit: 'buc' },
      { name: 'Quinoa', amount: 150, unit: 'g' },
      { name: 'Roșii tocate', amount: 400, unit: 'g' },
      { name: 'Măsline Kalamata', amount: 80, unit: 'g' },
      { name: 'Brânză feta', amount: 100, unit: 'g' },
      { name: 'Ceapă roșie', amount: 100, unit: 'g' },
      { name: 'Dovlecei', amount: 150, unit: 'g' },
      { name: 'Busuioc proaspăt', amount: 20, unit: 'g' },
      { name: 'Pătrunjel', amount: 20, unit: 'g' },
      { name: 'Ulei măsline', amount: 30, unit: 'ml' }
    ],
    instantPotInstructions: [
      'Sauté quinoa uscată 2 min până miroase nuci',
      'Add: roșii, ceapă, dovlecei, măsline',
      'Pressure Cook: HIGH 8 min, Quick Release',
      'Stir in: feta, ierburi proaspete',
      'Stuff ardeii, Steam: HIGH 5 min'
    ],
    nutritionalHighlight: 'Licopenă + polifenoli din măsline pentru sănătate cardio'
  },

  // MORE DINNER RECIPES
  {
    id: 'ip-moroccan-tagine',
    name: '🏺 IP Moroccan-Style Vegetable Tagine',
    description: 'Tagine marocan cu 12 legume, condimente și fructe uscate',
    cookingTime: 'medium',
    difficulty: 'medium',
    mealType: 'dinner',
    plantCount: 12,
    protein: 15,
    instantPot: true,
    nutritionalGoals: ['plant-diversity', 'anti-inflammatory'],
    ingredients: [
      { name: 'Naut fiert', amount: 300, unit: 'g' },
      { name: 'Cartofi dulci', amount: 300, unit: 'g' },
      { name: 'Vinete', amount: 200, unit: 'g' },
      { name: 'Dovlecei', amount: 200, unit: 'g' },
      { name: 'Morcovi', amount: 200, unit: 'g' },
      { name: 'Ceapă', amount: 150, unit: 'g' },
      { name: 'Roșii tocate', amount: 400, unit: 'g' },
      { name: 'Caise uscate', amount: 80, unit: 'g' },
      { name: 'Migdale', amount: 60, unit: 'g' },
      { name: 'Scorțișoară', amount: 1, unit: 'linguriță' },
      { name: 'Turmeric', amount: 1, unit: 'linguriță' },
      { name: 'Coriandru proaspăt', amount: 30, unit: 'g' },
      { name: 'Bulion legume', amount: 400, unit: 'ml' }
    ],
    instantPotInstructions: [
      'Sauté: ceapă, condimente - 3 min hasta fragrant',
      'Layer 1: cartofi dulci, morcovi (hard veg)',
      'Layer 2: naut, roșii, bulion',
      'Layer 3: vinete, dovlecei, caise (soft)',
      'Pressure Cook: HIGH 10 min, Natural Release 5 min',
      'Stir in: migdale, coriandru proaspăt'
    ],
    nutritionalHighlight: 'Antioxidanți din 12 culori + fibre pentru microbiota'
  },

  {
    id: 'asian-lettuce-wraps',
    name: '🥬 Asian Mushroom Lettuce Wraps',
    description: 'Wraps cu 3 tipuri ciuperci, legume crocante și dressing asiatic',
    cookingTime: 'quick',
    difficulty: 'easy',
    mealType: 'dinner',
    plantCount: 9,
    protein: 14,
    instantPot: false,
    nutritionalGoals: ['plant-diversity', 'anti-inflammatory'],
    ingredients: [
      { name: 'Salată iceberg', amount: 8, unit: 'frunze' },
      { name: 'Ciuperci shiitake', amount: 150, unit: 'g' },
      { name: 'Ciuperci button', amount: 100, unit: 'g' },
      { name: 'Ciuperci pleurotus', amount: 100, unit: 'g' },
      { name: 'Morcovi julien', amount: 100, unit: 'g' },
      { name: 'Ardei roșu julien', amount: 100, unit: 'g' },
      { name: 'Castane de apă', amount: 80, unit: 'g' },
      { name: 'Ceapă verde', amount: 50, unit: 'g' },
      { name: 'Coriandru proaspăt', amount: 30, unit: 'g' },
      { name: 'Ghimbir proaspăt', amount: 15, unit: 'g' },
      { name: 'Sos soia', amount: 30, unit: 'ml' },
      { name: 'Ulei susan', amount: 15, unit: 'ml' }
    ],
    instructions: [
      'Sauté ciupercile separate până golden - 5 min fiecare',
      'Amestecă ciupercile cu legumele crude',
      'Prepară dressingul din sosuri și ghimbir',
      'Servește în frunzele de salată',
      'Garnish cu coriandru și ceapă verde'
    ],
    nutritionalHighlight: 'Beta-glucani din ciuperci pentru imunitate'
  },

  // HIGH PROTEIN ADDITIONS
  {
    id: 'ip-turkey-chili',
    name: '🌶️ IP Turkey & Three-Bean Chili',
    description: 'Chili proteic cu curcan, 3 tipuri fasole și 8 legume',
    cookingTime: 'medium',
    difficulty: 'easy',
    mealType: 'dinner',
    plantCount: 8,
    protein: 38,
    instantPot: true,
    nutritionalGoals: ['mtor-high', 'plant-diversity'],
    ingredients: [
      { name: 'Carne tocată curcan', amount: 500, unit: 'g' },
      { name: 'Fasole roșie', amount: 150, unit: 'g' },
      { name: 'Fasole neagră', amount: 150, unit: 'g' },
      { name: 'Fasole pinto', amount: 150, unit: 'g' },
      { name: 'Roșii tocate', amount: 800, unit: 'g' },
      { name: 'Ardei roșu', amount: 200, unit: 'g' },
      { name: 'Ceapă', amount: 200, unit: 'g' },
      { name: 'Țelină', amount: 150, unit: 'g' },
      { name: 'Morcovi', amount: 150, unit: 'g' },
      { name: 'Porumb', amount: 150, unit: 'g' },
      { name: 'Chili pudră', amount: 2, unit: 'lingurițe' },
      { name: 'Bulion pui', amount: 500, unit: 'ml' }
    ],
    instantPotInstructions: [
      'Sauté: curcan până brown - 5 min, drain grease',
      'Add: ceapă, țelină, morcovi - sauté 3 min',
      'Add: roșii, fasole, condimente, bulion',
      'Pressure Cook: HIGH 25 min, Natural Release',
      'Stir in: porumb, ardei - Sauté 3 min'
    ],
    nutritionalHighlight: 'Proteină completă + fibre pentru saț durabilă'
  },

  // MORE QUICK OPTIONS
  {
    id: 'power-green-salad',
    name: '💚 Power Green Salad cu 15 Ingrediente',
    description: 'Salată nutritivă cu 15 super-ingredients pentru diversitate maximă',
    cookingTime: 'quick',
    difficulty: 'easy',
    mealType: 'lunch',
    plantCount: 15,
    protein: 18,
    instantPot: false,
    nutritionalGoals: ['plant-diversity', 'anti-inflammatory'],
    ingredients: [
      { name: 'Mix salată', amount: 100, unit: 'g' },
      { name: 'Spanac baby', amount: 50, unit: 'g' },
      { name: 'Rucola', amount: 50, unit: 'g' },
      { name: 'Avocado', amount: 1, unit: 'buc' },
      { name: 'Roșii cherry', amount: 150, unit: 'g' },
      { name: 'Castraveți', amount: 100, unit: 'g' },
      { name: 'Morcovi baby', amount: 100, unit: 'g' },
      { name: 'Ridichi', amount: 80, unit: 'g' },
      { name: 'Naut fiert', amount: 150, unit: 'g' },
      { name: 'Semințe floarea-soarelui', amount: 30, unit: 'g' },
      { name: 'Nuci', amount: 40, unit: 'g' },
      { name: 'Cranberries uscate', amount: 30, unit: 'g' },
      { name: 'Brânză de capră', amount: 50, unit: 'g' },
      { name: 'Ulei măsline extra-virgin', amount: 20, unit: 'ml' },
      { name: 'Oțet balsamic', amount: 15, unit: 'ml' },
      { name: 'Lămâie', amount: 0.5, unit: 'buc' }
    ],
    instructions: [
      'Spală și usucă toate verdeața',
      'Toacă legumele în bucăți uniforme',
      'Amestecă dressingul din ulei, oțet, lămâie',
      'Combină toate ingredientele într-un bol mare',
      'Servește imediat pentru textura optimă'
    ],
    nutritionalHighlight: '15 ingrediente = biodiversitate maximă pentru microbiota'
  },

  {
    id: 'power-breakfast-bowl',
    name: '💪 Power Breakfast Bowl',
    description: 'Start puternic cu 35g proteine și 8 plante diferite',
    cookingTime: 'quick',
    difficulty: 'easy',
    mealType: 'breakfast',
    plantCount: 8,
    protein: 35,
    instantPot: false,
    nutritionalGoals: ['mtor-high', 'energy-boost'],
    ingredients: [
      { name: 'Ovăz', amount: 80, unit: 'g' },
      { name: 'Semințe chia', amount: 20, unit: 'g' },
      { name: 'Semințe in', amount: 15, unit: 'g' },
      { name: 'Migdale', amount: 30, unit: 'g' },
      { name: 'Afine', amount: 50, unit: 'g' },
      { name: 'Banană', amount: 1, unit: 'buc' },
      { name: 'Proteină pudră', amount: 30, unit: 'g' },
      { name: 'Scorțișoară', amount: 2, unit: 'g' }
    ],
    instructions: [
      'Amestecă ovăzul cu semințele chia și in',
      'Adaugă proteina pudră și scorțișoara',
      'Combină cu lapte vegetal sau apă',
      'Top cu afine, banană și migdale',
      'Servește imediat pentru textura optimă'
    ],
    nutritionalHighlight: 'Complete amino acid profile + omega-3 boost'
  },

  {
    id: 'mediterranean-quinoa',
    name: '🌊 Mediterranean Quinoa Power',
    description: 'Quinoa cu 12 plante mediteraneene, anti-inflamator maxim',
    cookingTime: 'medium',
    difficulty: 'easy',
    mealType: 'lunch',
    plantCount: 12,
    protein: 18,
    instantPot: true,
    nutritionalGoals: ['anti-inflammatory', 'plant-diversity'],
    ingredients: [
      { name: 'Quinoa', amount: 150, unit: 'g' },
      { name: 'Roșii cherry', amount: 200, unit: 'g' },
      { name: 'Castravete', amount: 150, unit: 'g' },
      { name: 'Ardei roșu', amount: 1, unit: 'buc' },
      { name: 'Ceapă roșie', amount: 1, unit: 'buc' },
      { name: 'Măsline Kalamata', amount: 50, unit: 'g' },
      { name: 'Capere', amount: 20, unit: 'g' },
      { name: 'Pătrunjel', amount: 30, unit: 'g' },
      { name: 'Mentă', amount: 20, unit: 'g' },
      { name: 'Oregano', amount: 5, unit: 'g' },
      { name: 'Lămâie', amount: 1, unit: 'buc' },
      { name: 'Ulei măsline', amount: 30, unit: 'ml' }
    ],
    instantPotInstructions: [
      'Quinoa + 300ml apă în Instant Pot',
      'Manual/Pressure Cook HIGH 1 minut',
      'Natural Release 10 minute',
      'Fluff și răcește',
      'Amestecă cu restul ingredientelor crude'
    ],
    nutritionalHighlight: 'Polifenoli + fibre + proteine complete'
  },

  {
    id: 'asian-mushroom-fusion',
    name: '🍄 Asian Immunity Boost',
    description: 'Ciuperci medicinale cu ghimbir și turmeric pentru imunitate',
    cookingTime: 'quick',
    difficulty: 'medium',
    mealType: 'dinner',
    plantCount: 9,
    protein: 22,
    instantPot: true,
    nutritionalGoals: ['anti-inflammatory', 'immunity-boost'],
    ingredients: [
      { name: 'Shiitake', amount: 150, unit: 'g' },
      { name: 'Pleurotus', amount: 150, unit: 'g' },
      { name: 'Tofu', amount: 200, unit: 'g' },
      { name: 'Ghimbir proaspăt', amount: 30, unit: 'g' },
      { name: 'Usturoi', amount: 4, unit: 'căței' },
      { name: 'Ceapă verde', amount: 3, unit: 'fire' },
      { name: 'Sos soia', amount: 30, unit: 'ml' },
      { name: 'Ulei susan', amount: 15, unit: 'ml' },
      { name: 'Turmeric', amount: 5, unit: 'g' }
    ],
    instantPotInstructions: [
      'Sauté: ulei susan, ghimbir, usturoi - 2 min',
      'Add ciuperci și tofu cuburi - sauté 3 min',
      'Add sos soia + 100ml apă',
      'Pressure Cook HIGH 3 min, Quick Release',
      'Garnish cu ceapă verde'
    ],
    nutritionalHighlight: 'Beta-glucani + curcumină + gingerol pentru imunitate'
  },

  {
    id: 'protein-packed-dal',
    name: '🌶️ Protein Dal Supreme',
    description: 'Dal indian cu 28g proteine și 10 condimente vindecătoare',
    cookingTime: 'medium',
    difficulty: 'easy',
    mealType: 'dinner',
    plantCount: 10,
    protein: 28,
    instantPot: true,
    nutritionalGoals: ['mtor-high', 'anti-inflammatory'],
    ingredients: [
      { name: 'Linte roșie', amount: 200, unit: 'g' },
      { name: 'Năut', amount: 100, unit: 'g' },
      { name: 'Ceapă', amount: 2, unit: 'buc' },
      { name: 'Roșii', amount: 2, unit: 'buc' },
      { name: 'Ghimbir', amount: 20, unit: 'g' },
      { name: 'Turmeric', amount: 5, unit: 'g' },
      { name: 'Coriandru', amount: 5, unit: 'g' },
      { name: 'Chimion', amount: 3, unit: 'g' },
      { name: 'Garam masala', amount: 5, unit: 'g' },
      { name: 'Frunze curry', amount: 10, unit: 'buc' }
    ],
    instantPotInstructions: [
      'Sauté: ceapă, ghimbir, condimente - 3 min',
      'Add linte, năut, roșii tocate',
      'Add 600ml apă sau bulion',
      'Pressure Cook HIGH 15 min',
      'Natural Release 10 min',
      'Mash parțial pentru consistență cremoasă'
    ],
    nutritionalHighlight: '28g proteine complete + antiinflamator natural'
  },

  {
    id: 'rainbow-veggie-lasagna',
    name: '🌈 Rainbow Veggie Lasagna',
    description: 'Lasagna cu 15 legume colorate, fără gluten',
    cookingTime: 'long',
    difficulty: 'medium',
    mealType: 'dinner',
    plantCount: 15,
    protein: 20,
    instantPot: false,
    nutritionalGoals: ['plant-diversity', 'anti-inflammatory'],
    ingredients: [
      { name: 'Dovlecel', amount: 2, unit: 'buc' },
      { name: 'Vinete', amount: 1, unit: 'buc' },
      { name: 'Ardei roșu', amount: 1, unit: 'buc' },
      { name: 'Ardei galben', amount: 1, unit: 'buc' },
      { name: 'Spanac', amount: 200, unit: 'g' },
      { name: 'Ricotta vegan', amount: 250, unit: 'g' },
      { name: 'Roșii', amount: 400, unit: 'g' },
      { name: 'Morcov', amount: 2, unit: 'buc' },
      { name: 'Broccoli', amount: 200, unit: 'g' },
      { name: 'Conopidă', amount: 200, unit: 'g' },
      { name: 'Pătrunjel', amount: 30, unit: 'g' },
      { name: 'Busuioc', amount: 20, unit: 'g' },
      { name: 'Oregano', amount: 10, unit: 'g' },
      { name: 'Usturoi', amount: 4, unit: 'căței' },
      { name: 'Ceapă', amount: 1, unit: 'buc' }
    ],
    instructions: [
      'Pretăiește toate legumele în felii de 5mm',
      'Sautează separat fiecare legumă',
      'Prepare sosul cu roșii, usturoi, ierburi',
      'Stratifică în tăvă: sosul, legume, ricotta',
      'Coace la 180°C pentru 45 minute',
      'Lasă să se odihnească 15 minute înainte de tăiere'
    ],
    nutritionalHighlight: '15 culori = 15 tipuri diferite de antioxidanți'
  },

  {
    id: 'omega3-power-salad',
    name: '🐟 Omega-3 Brain Boost Salad',
    description: 'Salată cu 5g omega-3 pentru creier și inflamație',
    cookingTime: 'quick',
    difficulty: 'easy',
    mealType: 'lunch',
    plantCount: 11,
    protein: 25,
    instantPot: false,
    nutritionalGoals: ['anti-inflammatory', 'brain-health'],
    ingredients: [
      { name: 'Somon afumat', amount: 100, unit: 'g' },
      { name: 'Nuci', amount: 40, unit: 'g' },
      { name: 'Semințe in', amount: 20, unit: 'g' },
      { name: 'Semințe chia', amount: 15, unit: 'g' },
      { name: 'Avocado', amount: 1, unit: 'buc' },
      { name: 'Spanac baby', amount: 100, unit: 'g' },
      { name: 'Rucola', amount: 50, unit: 'g' },
      { name: 'Sfeclă coaptă', amount: 150, unit: 'g' },
      { name: 'Portocală', amount: 1, unit: 'buc' },
      { name: 'Ulei in', amount: 20, unit: 'ml' },
      { name: 'Oțet balsamic', amount: 10, unit: 'ml' }
    ],
    instructions: [
      'Amestecă verdeața proaspătă în bol mare',
      'Adaugă segmente de portocală și sfeclă',
      'Top cu somon afumat desfăcut în bucăți',
      'Presară nucile și semințele',
      'Dressingul: ulei in + oțet balsamic',
      'Servește imediat pentru prospețime maximă'
    ],
    nutritionalHighlight: '5g Omega-3 = protecție cardiovasculară și cognitivă maximă'
  },

  {
    id: 'gut-healing-soup',
    name: '🍵 Gut Healing Bone Broth',
    description: 'Supă vindecătoare cu colagen și L-glutamină',
    cookingTime: 'long',
    difficulty: 'easy',
    mealType: 'all',
    plantCount: 8,
    protein: 15,
    instantPot: true,
    nutritionalGoals: ['gut-health', 'anti-inflammatory'],
    ingredients: [
      { name: 'Oase vită', amount: 1000, unit: 'g' },
      { name: 'Oțet mere', amount: 30, unit: 'ml' },
      { name: 'Ceapă', amount: 2, unit: 'buc' },
      { name: 'Morcov', amount: 3, unit: 'buc' },
      { name: 'Țelină', amount: 3, unit: 'tije' },
      { name: 'Pătrunjel', amount: 50, unit: 'g' },
      { name: 'Ghimbir', amount: 30, unit: 'g' },
      { name: 'Turmeric', amount: 10, unit: 'g' },
      { name: 'Foi dafin', amount: 3, unit: 'buc' }
    ],
    instantPotInstructions: [
      'Oase + oțet în IP, lasă 30 min',
      'Add legume și condimente',
      'Acoperă cu apă (2L)',
      'Pressure Cook HIGH 120 min',
      'Natural Release complet',
      'Strecoară și servește'
    ],
    nutritionalHighlight: 'Colagen + glucozamină + L-glutamină pentru intestin'
  },

  {
    id: 'sweet-potato-buddha',
    name: '🍠 Sweet Potato Buddha Bowl',
    description: 'Bowl echilibrat cu cartofi dulci și 10 legume',
    cookingTime: 'medium',
    difficulty: 'easy',
    mealType: 'lunch',
    plantCount: 10,
    protein: 18,
    instantPot: true,
    nutritionalGoals: ['plant-diversity', 'energy-boost'],
    ingredients: [
      { name: 'Cartof dulce', amount: 300, unit: 'g' },
      { name: 'Năut', amount: 150, unit: 'g' },
      { name: 'Kale', amount: 100, unit: 'g' },
      { name: 'Varză roșie', amount: 100, unit: 'g' },
      { name: 'Morcov', amount: 100, unit: 'g' },
      { name: 'Avocado', amount: 1, unit: 'buc' },
      { name: 'Semințe dovleac', amount: 30, unit: 'g' },
      { name: 'Tahini', amount: 30, unit: 'g' },
      { name: 'Lămâie', amount: 1, unit: 'buc' },
      { name: 'Sumac', amount: 5, unit: 'g' }
    ],
    instantPotInstructions: [
      'Cartofi dulci cuburi în IP',
      'Pressure Cook HIGH 4 min, Quick Release',
      'Năut separat: HIGH 15 min dacă crud',
      'Kale sauté 2 minute',
      'Asamblează bowl cu toate componentele',
      'Top cu tahini dressing'
    ],
    nutritionalHighlight: 'Beta-caroten + fibre prebiotice + proteine complete'
  },

  {
    id: 'fermented-kraut-bowl',
    name: '🥬 Probiotic Kraut Power',
    description: 'Bowl fermentat cu 100 miliarde probiotice',
    cookingTime: 'quick',
    difficulty: 'easy',
    mealType: 'lunch',
    plantCount: 7,
    protein: 15,
    instantPot: false,
    nutritionalGoals: ['gut-health', 'immunity-boost'],
    ingredients: [
      { name: 'Sauerkraut', amount: 200, unit: 'g' },
      { name: 'Kimchi', amount: 100, unit: 'g' },
      { name: 'Tempeh', amount: 150, unit: 'g' },
      { name: 'Orez integral', amount: 150, unit: 'g' },
      { name: 'Edamame', amount: 100, unit: 'g' },
      { name: 'Alge nori', amount: 5, unit: 'g' },
      { name: 'Susan', amount: 20, unit: 'g' }
    ],
    instructions: [
      'Coace tempeh la tigaie până devine crocant',
      'Încălzește orezul integral',
      'Aranjează toate ingredientele în bowl',
      'NU încălzi sauerkraut/kimchi (păstrează probioticele)',
      'Garnish cu susan și alge nori',
      'Servește la temperatura camerei'
    ],
    nutritionalHighlight: '100+ miliarde CFU probiotice pentru microbiom sănătos'
  },

  {
    id: 'antioxidant-berry-parfait',
    name: '🫐 Antioxidant Berry Parfait',
    description: 'Desert sănătos cu ORAC score peste 10,000',
    cookingTime: 'quick',
    difficulty: 'easy',
    mealType: 'snack',
    plantCount: 8,
    protein: 12,
    instantPot: false,
    nutritionalGoals: ['anti-inflammatory', 'brain-health'],
    ingredients: [
      { name: 'Afine', amount: 100, unit: 'g' },
      { name: 'Zmeură', amount: 80, unit: 'g' },
      { name: 'Mure', amount: 80, unit: 'g' },
      { name: 'Goji', amount: 30, unit: 'g' },
      { name: 'Iaurt grec', amount: 200, unit: 'g' },
      { name: 'Granola', amount: 50, unit: 'g' },
      { name: 'Cacao pudră', amount: 10, unit: 'g' },
      { name: 'Mentă', amount: 5, unit: 'g' }
    ],
    instructions: [
      'Stratifică în pahar: iaurt, berry mix, granola',
      'Repetă straturile pentru efect vizual',
      'Top cu cacao pudră și mentă proaspătă',
      'Servește imediat sau refrigerează max 2h',
      'Amestecă înainte de consum pentru gustul optim'
    ],
    nutritionalHighlight: 'ORAC 10,000+ = protecție celulară maximă'
  }];

  const { subscribe, set, update } = writable(defaultRecipes);

  return {
    subscribe,
    
    addRecipe(recipe) {
      update(recipes => [...recipes, { ...recipe, id: recipe.id || nid() }]);
    },
    
    updateRecipe(id, updates) {
      update(recipes => recipes.map(recipe => 
        recipe.id === id ? { ...recipe, ...updates } : recipe
      ));
    },
    
    removeRecipe(id) {
      update(recipes => recipes.filter(recipe => recipe.id !== id));
    },
    
    loadFromStorage() {
      // Dezactivat în development
      return null;
    },
    
    resetToDefaults() {
      set(defaultRecipes);
      localStorage.setItem('codexRecipes', JSON.stringify(defaultRecipes));
    }
  };
}

export const codexRecipes = createCodexRecipes();


// Auto-save recipes changes
codexRecipes.subscribe(recipes => {
  if (recipes && recipes.length > 0) {
    try {
      localStorage.setItem('nutritionProfile', JSON.stringify($nutritionProfile));
    } catch(e) {
      // Skip în development
    }
  }
});

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

// ===== CODEX Integration Functions =====
export async function logCodexMeal(mealData) {
  // Dynamic import to avoid circular dependencies
  if (!ecosystemStore) {
    const module = await import('../../../shared/stores/ecosystemStore.js');
    ecosystemStore = module.ecosystemStore;
  }
  
  // Evaluate meal with CODEX engine
  const evaluation = codexEngine.evaluateMeal(mealData);
  
  // Log plants for diversity tracking
  if (mealData.ingredients) {
    mealData.ingredients.forEach(ingredient => {
      if (codexEngine.isPlantBased(ingredient.name)) {
        logPlantConsumption({
          name: ingredient.name,
          species: ingredient.species || ingredient.name,
          antiInflammatory: ingredient.antiInflammatory || 'moderate',
          amount: ingredient.amount,
          unit: ingredient.unit
        });
      }
    });
  }
  
  // Add meal to profile with CODEX evaluation
  const enhancedMeal = {
    ...mealData,
    evaluation,
    timestamp: new Date().toISOString(),
    codexScore: evaluation.overallScore,
    antiInflammatoryScore: evaluation.antiInflammatoryScore,
    plantDiversityScore: evaluation.plantDiversityScore
  };
  
  nutritionProfile.addMeal(enhancedMeal);
  
  // Update ecosystem store
  ecosystemStore.update(state => ({
    ...state,
    nutrition: {
      ...state.nutrition,
      lastMeal: enhancedMeal,
      dailyScore: evaluation.overallScore
    }
  }));
  
  return evaluation;
}

export function getCodexRecommendations() {
  return codexEngine.getTodaysRecommendations();
}

export function generateInstantPotRecipe(ingredients, cookingTime) {
  return codexEngine.generateInstantPotRecipe(ingredients, cookingTime);
}

// ===== Derived Stores =====
export const weeklyProgress = derived(
  [nutritionProfile, currentWeekProgress, antiInflammatoryScore],
  ([$profile, $plantProgress, $antiInflammatory]) => {
    const plantProgress = Math.min(100, ($plantProgress.consumedCount / CODEX_PRINCIPLES.WEEKLY_PLANT_GOAL) * 100);
    const mealCount = $profile.mealHistory.length;
    
    return {
      plantProgress: Math.round(plantProgress),
      plantsAchieved: $plantProgress.consumedCount,
      plantsNeeded: $plantProgress.remaining,
      mealsTracked: mealCount,
      currentPhase: $profile.currentPhase,
      cycleDay: $profile.cycleDay,
      inflammationRisk: $profile.inflammationRisk,
      antiInflammatoryScore: $antiInflammatory.score,
      antiInflammatoryPercentage: $antiInflammatory.percentage
    };
  }
);

// Unified CODEX dashboard data
export const codexDashboardData = derived(
  [currentRecommendations, cycleProgress, currentWeekProgress, antiInflammatoryScore, nutritionProfile],
  ([$mTorRecs, $cycle, $plants, $antiInflammatory, $nutrition]) => ({
    mtor: {
      phase: $cycle.phase,
      dayInCycle: $cycle.currentDay,
      daysLeftInPhase: $cycle.daysLeftInPhase,
      recommendations: $mTorRecs
    },
    plants: {
      weeklyProgress: $plants.progressPercentage,
      consumedCount: $plants.consumedCount,
      goal: $plants.goal,
      remaining: $plants.remaining,
      isComplete: $plants.isComplete
    },
    antiInflammatory: {
      score: $antiInflammatory.score,
      plantsCount: $antiInflammatory.antiInflammatoryPlants,
      percentage: $antiInflammatory.percentage
    },
    nutrition: {
      mealsTracked: $nutrition.mealHistory.length,
      lastMealScore: $nutrition.mealHistory[$nutrition.mealHistory.length - 1]?.codexScore || 0,
      averageScore: $nutrition.mealHistory.length > 0 ? 
        $nutrition.mealHistory.reduce((sum, meal) => sum + (meal.codexScore || 0), 0) / $nutrition.mealHistory.length : 0
    }
  })
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
codexRecipes.loadFromStorage();

// Update cycle daily
setInterval(() => {
  nutritionProfile.updateCycleDay();
}, 24 * 60 * 60 * 1000);

// Performance optimized recipe index
export const recipeIndex = derived(codexRecipes, $recipes => {
  const index = {
    byIngredient: new Map(),
    byGoal: new Map(),
    byProtein: new Map(),
    byPlantCount: new Map(),
    byTime: new Map()
  };
  
  $recipes.forEach(recipe => {
    // Index by ingredients
    recipe.ingredients.forEach(ing => {
      const key = ing.name.toLowerCase();
      if (!index.byIngredient.has(key)) {
        index.byIngredient.set(key, new Set());
      }
      index.byIngredient.get(key).add(recipe.id);
    });
    
    // Index by nutritional goals
    recipe.nutritionalGoals.forEach(goal => {
      if (!index.byGoal.has(goal)) {
        index.byGoal.set(goal, new Set());
      }
      index.byGoal.get(goal).add(recipe.id);
    });
    
    // Index by protein range
    const proteinRange = Math.floor(recipe.protein / 10) * 10;
    if (!index.byProtein.has(proteinRange)) {
      index.byProtein.set(proteinRange, new Set());
    }
    index.byProtein.get(proteinRange).add(recipe.id);
    
    // Index by plant count
    const plantRange = Math.floor(recipe.plantCount / 3) * 3;
    if (!index.byPlantCount.has(plantRange)) {
      index.byPlantCount.set(plantRange, new Set());
    }
    index.byPlantCount.get(plantRange).add(recipe.id);
    
    // Index by cooking time
    if (!index.byTime.has(recipe.cookingTime)) {
      index.byTime.set(recipe.cookingTime, new Set());
    }
    index.byTime.get(recipe.cookingTime).add(recipe.id);
  });
  
  return index;
});

// Fast recipe search using index
export function searchRecipes(query, filters = {}) {
  const results = new Set();
  const index = get(recipeIndex);
  const recipes = get(codexRecipes);
  
  if (query) {
    const searchTerm = query.toLowerCase();
    
    // Search in ingredient index
    if (index.byIngredient.has(searchTerm)) {
      index.byIngredient.get(searchTerm).forEach(id => results.add(id));
    }
    
    // Search in recipe names and descriptions
    recipes.forEach(recipe => {
      if (recipe.name.toLowerCase().includes(searchTerm) ||
          recipe.description.toLowerCase().includes(searchTerm)) {
        results.add(recipe.id);
      }
    });
  }
  
  // Apply filters using indexes
  if (filters.goal && index.byGoal.has(filters.goal)) {
    const goalRecipes = index.byGoal.get(filters.goal);
    if (results.size > 0) {
      // Intersection
      results.forEach(id => {
        if (!goalRecipes.has(id)) results.delete(id);
      });
    } else {
      goalRecipes.forEach(id => results.add(id));
    }
  }
  
  if (filters.proteinMin !== undefined) {
    const range = Math.floor(filters.proteinMin / 10) * 10;
    const proteinRecipes = index.byProtein.get(range) || new Set();
    if (results.size > 0) {
      results.forEach(id => {
        if (!proteinRecipes.has(id)) results.delete(id);
      });
    }
  }
  
  return recipes.filter(r => results.has(r.id));
}

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