import { codexDatabase } from './codexDatabase.js';
import { codexScoring } from './codexScoring.js';
import { groceryInventory } from '../../../stores/groceryStore.js';
import { get } from 'svelte/store';

export class SmartRecipeGenerator {
  constructor() {
    this.nutrients = codexDatabase?.nutrients || {};
    this.instantPotLayers = this.initializeLayers();
    this.recipeTemplates = this.initializeTemplates();
  }

  initializeLayers() {
    return {
      bottom: ['liquids', 'aromatics'],
      middle: ['proteins', 'dense_vegetables'],
      top: ['quick_cooking', 'greens'],
      garnish: ['fresh_herbs', 'seeds', 'nuts']
    };
  }

  initializeTemplates() {
    return {
      highProtein: {
        name: 'High mTOR Bowl',
        proteinTarget: 35,
        plantTarget: 12,
        layers: {
          bottom: ['bone_broth', 'onions', 'garlic'],
          middle: ['chicken_thigh', 'sweet_potato'],
          top: ['broccoli', 'kale'],
          garnish: ['pumpkin_seeds', 'parsley']
        }
      },
      plantFocus: {
        name: 'Plant Diversity Bowl',
        proteinTarget: 20,
        plantTarget: 18,
        layers: {
          bottom: ['vegetable_broth', 'leeks', 'celery'],
          middle: ['lentils', 'butternut_squash'],
          top: ['swiss_chard', 'zucchini'],
          garnish: ['hemp_seeds', 'cilantro']
        }
      }
    };
  }

  generateOMADRecipe(preferences = {}) {
    const inventory = get(groceryInventory)?.inventory || {};
    const availableIngredients = Object.keys(inventory).filter(
      item => inventory[item].quantity > 0
    );

    const recipe = {
      id: Date.now().toString(),
      name: preferences.mTORPhase === 'high' 
        ? 'Power OMAD Bowl' 
        : 'Plant Rainbow Bowl',
      servings: 1,
      timing: '6-7 PM',
      instantPotTime: 12,
      layers: this.generateLayers(preferences, availableIngredients),
      nutrition: this.calculateNutrition(preferences),
      instructions: this.generateInstructions(preferences),
      shoppingList: this.generateShoppingList(preferences, availableIngredients)
    };

    return recipe;
  }

  generateLayers(preferences, available) {
    const template = preferences.mTORPhase === 'high' 
      ? this.recipeTemplates.highProtein 
      : this.recipeTemplates.plantFocus;

    return {
      bottom: template.layers.bottom.map(item => ({
        ingredient: item,
        amount: this.calculateAmount(item),
        available: available.includes(item)
      })),
      middle: template.layers.middle.map(item => ({
        ingredient: item,
        amount: this.calculateAmount(item),
        available: available.includes(item)
      })),
      top: template.layers.top.map(item => ({
        ingredient: item,
        amount: this.calculateAmount(item),
        available: available.includes(item)
      })),
      garnish: template.layers.garnish.map(item => ({
        ingredient: item,
        amount: this.calculateAmount(item),
        available: available.includes(item)
      }))
    };
  }

  calculateAmount(ingredient) {
    const amounts = {
      chicken_thigh: '200g',
      lentils: '150g',
      sweet_potato: '150g',
      broccoli: '100g',
      kale: '50g',
      bone_broth: '250ml',
      vegetable_broth: '250ml',
      pumpkin_seeds: '30g',
      hemp_seeds: '20g'
    };
    return amounts[ingredient] || '100g';
  }

  calculateNutrition(preferences) {
    return {
      calories: preferences.mTORPhase === 'high' ? 850 : 750,
      protein: preferences.mTORPhase === 'high' ? 65 : 40,
      carbs: 85,
      fat: 35,
      fiber: 18,
      plantSpecies: preferences.mTORPhase === 'high' ? 12 : 18
    };
  }

  generateInstructions(preferences) {
    return [
      'Add liquids and aromatics to Instant Pot',
      'Layer proteins and dense vegetables',
      'Top with quick-cooking vegetables',
      'Pressure cook HIGH for 12 minutes',
      'Natural release 5 minutes',
      'Quick release remaining pressure',
      'Add fresh garnishes before serving'
    ];
  }

  generateShoppingList(preferences, available) {
    const needed = [];
    const recipe = preferences.mTORPhase === 'high' 
      ? this.recipeTemplates.highProtein 
      : this.recipeTemplates.plantFocus;

    Object.values(recipe.layers).flat().forEach(ingredient => {
      if (!available.includes(ingredient)) {
        needed.push({
          item: ingredient,
          amount: this.calculateAmount(ingredient),
          store: 'Kaufland',
          estimatedPrice: this.estimatePrice(ingredient)
        });
      }
    });

    return needed;
  }

  estimatePrice(ingredient) {
    const prices = {
      chicken_thigh: 25,
      lentils: 8,
      sweet_potato: 5,
      broccoli: 12,
      kale: 15
    };
    return prices[ingredient] || 10;
  }

  generateTargetedRecipe(target) {
    return this.generateOMADRecipe({ 
      mTORPhase: target.includes('high') ? 'high' : 'low' 
    });
  }
}

export const recipeGenerator = new SmartRecipeGenerator();
export const generateOMADRecipe = (prefs) => recipeGenerator.generateOMADRecipe(prefs);
export const generateTargetedRecipe = (target) => recipeGenerator.generateTargetedRecipe(target);