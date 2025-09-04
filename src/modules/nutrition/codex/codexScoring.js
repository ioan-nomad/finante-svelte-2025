/**
 * Evidence-Based Recipe Scoring System
 */

import CODEX_INGREDIENTS from './codexDatabase.js';

export class CodexScorer {
  constructor() {
    this.weights = {
      antiInflammatory: 0.30,
      nutrientDensity: 0.25,
      glycemicImpact: 0.20,
      microbiome: 0.15,
      bioavailability: 0.10
    };
  }
  
  scoreRecipe(recipe) {
    const scores = {
      antiInflammatory: this.calcAntiInflammatory(recipe),
      nutrientDensity: this.calcNutrientDensity(recipe),
      glycemicImpact: this.calcGlycemicImpact(recipe),
      microbiome: this.calcMicrobiome(recipe),
      bioavailability: this.calcBioavailability(recipe)
    };
    
    const weighted = Object.keys(scores).reduce((sum, key) => {
      return sum + (scores[key] * this.weights[key]);
    }, 0);
    
    return {
      overall: Math.round(weighted),
      breakdown: scores,
      timestamp: new Date().toISOString(),
      evidence: this.getEvidence(scores)
    };
  }
  
  calcAntiInflammatory(recipe) {
    // Dietary Inflammatory Index (DII)
    // Shivappa et al. 2014, PMID: 24172307
    const diiWeights = {
      turmeric: -0.785,
      ginger: -0.453,
      garlic: -0.412,
      omega3: -0.436,
      fiber: -0.663,
      sugar: 0.439,
      saturatedFat: 0.373
    };
    
    let score = 0;
    recipe.ingredients.forEach(ing => {
      const key = ing.name.toLowerCase();
      if (diiWeights[key]) {
        score += diiWeights[key] * (ing.amount / 100);
      }
    });
    
    // Normalize to 0-100
    return Math.max(0, Math.min(100, 50 - (score * 10)));
  }
  
  calcNutrientDensity(recipe) {
    // NRF9.3 Score (Drewnowski 2019, PMID: 31111871)
    const nutrients = recipe.getTotalNutrients();
    const calories = recipe.getTotalCalories();
    
    const beneficial = [
      nutrients.protein * 2,
      nutrients.fiber * 3,
      nutrients.vitaminA * 0.001,
      nutrients.vitaminC * 0.001,
      nutrients.vitaminE * 0.001,
      nutrients.calcium * 0.001,
      nutrients.iron * 0.1,
      nutrients.magnesium * 0.003,
      nutrients.potassium * 0.0003
    ].reduce((a, b) => a + b, 0);
    
    const limiting = [
      nutrients.saturatedFat * 0.1,
      nutrients.sugar * 0.1,
      nutrients.sodium * 0.0001
    ].reduce((a, b) => a + b, 0);
    
    const nrf = ((beneficial - limiting) / calories) * 100;
    return Math.max(0, Math.min(100, nrf));
  }
  
  calcGlycemicImpact(recipe) {
    // Based on Atkinson 2021, PMID: 34506976
    let totalGL = 0;
    let totalCarbs = 0;
    
    recipe.ingredients.forEach(ing => {
      const gi = this.getGlycemicIndex(ing.name);
      const carbs = ing.carbs || 0;
      const gl = (gi * carbs) / 100;
      totalGL += gl;
      totalCarbs += carbs;
    });
    
    // Score: Low GL (<10) = 100, Medium (10-20) = 60, High (>20) = 20
    if (totalGL < 10) return 100;
    if (totalGL < 20) return 60;
    return 20;
  }
  
  calcMicrobiome(recipe) {
    // McDonald 2018, PMID: 29795809
    const plantCount = new Set(
      recipe.ingredients
        .filter(ing => this.isPlant(ing.name))
        .map(ing => ing.name)
    ).size;
    
    // 5+ different plants = excellent
    return Math.min(100, plantCount * 20);
  }
  
  calcBioavailability(recipe) {
    let score = 50; // baseline
    
    // Check for synergistic combinations
    const ingredients = recipe.ingredients.map(i => i.name.toLowerCase());
    
    if (ingredients.includes('turmeric') && ingredients.includes('black pepper')) {
      score += 25; // Piperine enhancement
    }
    
    if (ingredients.includes('tomato') && ingredients.some(i => i.includes('oil'))) {
      score += 15; // Lycopene + fat
    }
    
    if (ingredients.includes('spinach') && ingredients.includes('lemon')) {
      score += 10; // Iron + vitamin C
    }
    
    return Math.min(100, score);
  }
  
  getGlycemicIndex(food) {
    const giValues = {
      'white rice': 73,
      'brown rice': 55,
      'quinoa': 53,
      'lentils': 29,
      'chickpeas': 33,
      'sweet potato': 70,
      'potato': 85
    };
    return giValues[food.toLowerCase()] || 50;
  }
  
  isPlant(food) {
    const plants = [
      'spinach', 'kale', 'broccoli', 'carrot', 'tomato',
      'onion', 'garlic', 'ginger', 'turmeric', 'pepper',
      'lentils', 'chickpeas', 'beans', 'quinoa', 'rice'
    ];
    return plants.some(p => food.toLowerCase().includes(p));
  }
  
  getEvidence(scores) {
    return {
      antiInflammatory: "Shivappa 2014, PMID: 24172307",
      nutrientDensity: "Drewnowski 2019, PMID: 31111871",
      glycemicImpact: "Atkinson 2021, PMID: 34506976",
      microbiome: "McDonald 2018, PMID: 29795809",
      bioavailability: "Sabra 2023, PMID: 36678332"
    };
  }
}

export default CodexScorer;
