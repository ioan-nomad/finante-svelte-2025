// CODEX Scoring - Sistema de evaluare și scoring pentru conformitatea CODEX
import { codexCore } from './codexCore.js';
import { codexDatabase } from './codexDatabase.js';

export class CodexScoring {
  constructor() {
    this.weights = this.initializeWeights();
    this.thresholds = this.initializeThresholds();
    this.scoringHistory = new Map();
  }

  initializeWeights() {
    return {
      // Primary scoring components
      timing_compliance: 0.15,        // OMAD 06:00-07:00
      plant_diversity: 0.25,          // 30+ species/week, 10+ daily
      anti_inflammatory: 0.25,        // High priority ingredients
      mtor_compliance: 0.20,          // Phase-appropriate nutrition
      instant_pot_optimization: 0.15, // Cooking method adherence
      
      // Nico-specific modifiers
      nico_safety: 0.30,              // Critical - no mushrooms
      texture_suitability: 0.15,     // Soft, digestible textures
      
      // Bonus factors
      scientific_backing: 0.05,       // Evidence-based choices
      cost_efficiency: 0.05,          // Budget consciousness
      preparation_simplicity: 0.05    // OMAD-friendly prep
    };
  }

  initializeThresholds() {
    return {
      excellent: 90,      // A+ grade
      good: 80,           // A grade  
      satisfactory: 70,   // B grade
      needs_improvement: 60, // C grade
      poor: 50            // Below acceptable
    };
  }

  // Main scoring method
  scoreMeal(meal, options = {}) {
    const scores = {
      timestamp: new Date().toISOString(),
      meal_id: meal.id || this.generateMealId(),
      components: {},
      modifiers: {},
      total_score: 0,
      grade: '',
      recommendations: [],
      violations: []
    };

    // Core scoring components
    scores.components.timing = this.scoreTiming(meal);
    scores.components.plant_diversity = this.scorePlantDiversity(meal);
    scores.components.anti_inflammatory = this.scoreAntiInflammatory(meal);
    scores.components.mtor_compliance = this.scoreMTORCompliance(meal);
    scores.components.instant_pot = this.scoreInstantPotOptimization(meal);

    // Critical modifiers (especially for Nico)
    scores.modifiers.nico_safety = this.scoreNicoSafety(meal);
    scores.modifiers.texture_suitability = this.scoreTextureSuitability(meal);

    // Calculate total score
    scores.total_score = this.calculateTotalScore(scores);
    scores.grade = this.assignGrade(scores.total_score);

    // Generate recommendations
    scores.recommendations = this.generateRecommendations(scores);
    scores.violations = this.identifyViolations(scores);

    // Store for trend analysis
    this.scoringHistory.set(scores.meal_id, scores);

    return scores;
  }

  scoreTiming(meal) {
    const timing = {
      score: 0,
      status: 'violation',
      details: {}
    };

    if (!meal.timestamp) {
      timing.details.error = 'No timestamp provided';
      return timing;
    }

    const mealTime = new Date(meal.timestamp);
    const hour = mealTime.getHours();
    const minute = mealTime.getMinutes();
    
    // OMAD window: 06:00 - 07:00
    if (hour === 6 || (hour === 7 && minute === 0)) {
      timing.score = 100;
      timing.status = 'optimal';
      timing.details.window = 'Perfect OMAD timing';
    } else if (hour === 5 || hour === 7 || hour === 8) {
      timing.score = 70;
      timing.status = 'acceptable';
      timing.details.window = 'Close to optimal window';
    } else {
      timing.score = 0;
      timing.status = 'violation';
      timing.details.window = `Outside OMAD window (${hour}:${minute.toString().padStart(2, '0')})`;
    }

    return timing;
  }

  scorePlantDiversity(meal) {
    const diversity = {
      score: 0,
      species_count: 0,
      species_list: [],
      daily_progress: 0,
      status: 'poor'
    };

    if (!meal.ingredients || meal.ingredients.length === 0) {
      return diversity;
    }

    const plantSpecies = new Set();
    
    meal.ingredients.forEach(ingredientRef => {
      const ingredient = codexDatabase.getIngredientById(ingredientRef.id || ingredientRef);
      if (ingredient?.plant_species) {
        plantSpecies.add(ingredient.plant_species);
        diversity.species_list.push({
          name: ingredient.name,
          species: ingredient.plant_species,
          category: ingredient.category
        });
      }
    });

    diversity.species_count = plantSpecies.size;
    diversity.daily_progress = (diversity.species_count / 10) * 100; // Daily target: 10
    
    // Scoring based on daily target
    if (diversity.species_count >= 15) {
      diversity.score = 100;
      diversity.status = 'exceptional';
    } else if (diversity.species_count >= 10) {
      diversity.score = 90;
      diversity.status = 'optimal';
    } else if (diversity.species_count >= 7) {
      diversity.score = 75;
      diversity.status = 'good';
    } else if (diversity.species_count >= 5) {
      diversity.score = 60;
      diversity.status = 'acceptable';
    } else {
      diversity.score = 30;
      diversity.status = 'poor';
    }

    return diversity;
  }

  scoreAntiInflammatory(meal) {
    const antiInflam = {
      score: 0,
      total_score: 0,
      max_possible: 0,
      high_value_ingredients: [],
      status: 'poor'
    };

    if (!meal.ingredients || meal.ingredients.length === 0) {
      return antiInflam;
    }

    meal.ingredients.forEach(ingredientRef => {
      const ingredient = codexDatabase.getIngredientById(ingredientRef.id || ingredientRef);
      if (ingredient) {
        const score = ingredient.anti_inflammatory_score || 0;
        antiInflam.total_score += score;
        antiInflam.max_possible += 10; // Max score per ingredient

        if (score >= 8) {
          antiInflam.high_value_ingredients.push({
            name: ingredient.name,
            score: score,
            compounds: ingredient.bioactive_compounds || []
          });
        }
      }
    });

    // Calculate percentage score
    if (antiInflam.max_possible > 0) {
      antiInflam.score = Math.min((antiInflam.total_score / antiInflam.max_possible) * 100, 100);
    }

    // Determine status
    if (antiInflam.score >= 80) antiInflam.status = 'excellent';
    else if (antiInflam.score >= 70) antiInflam.status = 'good';
    else if (antiInflam.score >= 60) antiInflam.status = 'acceptable';
    else antiInflam.status = 'needs_improvement';

    return antiInflam;
  }

  scoreMTORCompliance(meal) {
    const mtor = {
      score: 0,
      current_phase: codexCore.cycles.getCurrentPhase(),
      protein_ratio: 0,
      target_range: '',
      status: 'unknown'
    };

    // Calculate protein ratio from meal
    if (meal.nutrition) {
      const totalCals = meal.nutrition.calories || 2500;
      const proteinCals = (meal.nutrition.protein || 0) * 4;
      mtor.protein_ratio = proteinCals / totalCals;
    } else {
      // Estimate from ingredients
      mtor.protein_ratio = this.estimateProteinRatio(meal.ingredients);
    }

    // Score based on current mTOR phase
    if (mtor.current_phase === 'high') {
      mtor.target_range = '25-35%';
      if (mtor.protein_ratio >= 0.25 && mtor.protein_ratio <= 0.35) {
        mtor.score = 100;
        mtor.status = 'optimal';
      } else if (mtor.protein_ratio >= 0.20 && mtor.protein_ratio <= 0.40) {
        mtor.score = 75;
        mtor.status = 'good';
      } else {
        mtor.score = 40;
        mtor.status = 'poor';
      }
    } else {
      mtor.target_range = '15-20%';
      if (mtor.protein_ratio >= 0.15 && mtor.protein_ratio <= 0.20) {
        mtor.score = 100;
        mtor.status = 'optimal';
      } else if (mtor.protein_ratio >= 0.12 && mtor.protein_ratio <= 0.25) {
        mtor.score = 75;
        mtor.status = 'good';
      } else {
        mtor.score = 40;
        mtor.status = 'poor';
      }
    }

    return mtor;
  }

  scoreInstantPotOptimization(meal) {
    const instantPot = {
      score: 0,
      layers_used: 0,
      optimal_layering: false,
      cooking_efficiency: 0,
      status: 'not_optimized'
    };

    if (!meal.ingredients) return instantPot;

    // Check if ingredients are layered optimally
    const layers = codexDatabase.getInstantPotLayers(
      meal.ingredients.map(ing => ing.id || ing)
    );

    const usedLayers = Object.values(layers).filter(layer => layer.length > 0);
    instantPot.layers_used = usedLayers.length;

    // Score based on layer utilization and optimization
    if (instantPot.layers_used >= 3) {
      instantPot.score = 90;
      instantPot.optimal_layering = true;
      instantPot.status = 'excellent';
    } else if (instantPot.layers_used === 2) {
      instantPot.score = 75;
      instantPot.status = 'good';
    } else if (instantPot.layers_used === 1) {
      instantPot.score = 50;
      instantPot.status = 'basic';
    } else {
      instantPot.score = 0;
      instantPot.status = 'not_instant_pot';
    }

    // Bonus for optimal cooking times
    if (this.hasOptimalCookingTimes(layers)) {
      instantPot.score = Math.min(instantPot.score + 10, 100);
      instantPot.cooking_efficiency = 100;
    }

    return instantPot;
  }

  scoreNicoSafety(meal) {
    const safety = {
      score: 0,
      safe: true,
      dangerous_items: [],
      texture_warnings: [],
      alternatives_needed: [],
      status: 'safe'
    };

    if (!meal.ingredients) return safety;

    meal.ingredients.forEach(ingredientRef => {
      const ingredient = codexDatabase.getIngredientById(ingredientRef.id || ingredientRef);
      if (!ingredient) return;

      // Check for dangerous ingredients (mushrooms)
      if (ingredient.nico_safe === false) {
        safety.safe = false;
        safety.dangerous_items.push({
          name: ingredient.name,
          reason: ingredient.warning || 'Not safe for Nico',
          alternatives: ingredient.alternatives || []
        });
      }

      // Check texture concerns
      if (ingredient.texture && !ingredient.texture.includes('soft')) {
        safety.texture_warnings.push({
          name: ingredient.name,
          concern: ingredient.texture,
          preparation: ingredient.nico_prep || 'Cook until very soft'
        });
      }
    });

    // Critical scoring: any dangerous item = 0 score
    if (!safety.safe) {
      safety.score = 0;
      safety.status = 'DANGEROUS - contains prohibited items';
    } else if (safety.texture_warnings.length > 0) {
      safety.score = 70;
      safety.status = 'needs_texture_modification';
    } else {
      safety.score = 100;
      safety.status = 'safe';
    }

    return safety;
  }

  scoreTextureSuitability(meal) {
    const texture = {
      score: 0,
      suitable_items: 0,
      total_items: 0,
      modifications_needed: [],
      status: 'unknown'
    };

    if (!meal.ingredients) return texture;

    meal.ingredients.forEach(ingredientRef => {
      const ingredient = codexDatabase.getIngredientById(ingredientRef.id || ingredientRef);
      if (!ingredient) return;

      texture.total_items++;

      const isTextureGood = ingredient.texture && (
        ingredient.texture.includes('soft') ||
        ingredient.texture.includes('tender') ||
        ingredient.texture.includes('liquid') ||
        ingredient.texture.includes('powder')
      );

      if (isTextureGood || ingredient.nico_prep) {
        texture.suitable_items++;
      } else {
        texture.modifications_needed.push({
          name: ingredient.name,
          current_texture: ingredient.texture || 'unknown',
          suggestion: 'Cook until soft and tender'
        });
      }
    });

    // Calculate score
    if (texture.total_items > 0) {
      texture.score = (texture.suitable_items / texture.total_items) * 100;
    }

    // Status determination
    if (texture.score >= 90) texture.status = 'excellent';
    else if (texture.score >= 80) texture.status = 'good';
    else if (texture.score >= 70) texture.status = 'acceptable';
    else texture.status = 'needs_modification';

    return texture;
  }

  calculateTotalScore(scores) {
    let total = 0;
    const weights = this.weights;

    // Core components
    total += scores.components.timing.score * weights.timing_compliance;
    total += scores.components.plant_diversity.score * weights.plant_diversity;
    total += scores.components.anti_inflammatory.score * weights.anti_inflammatory;
    total += scores.components.mtor_compliance.score * weights.mtor_compliance;
    total += scores.components.instant_pot.score * weights.instant_pot_optimization;

    // Critical modifiers (especially for Nico)
    const nicoSafetyMultiplier = scores.modifiers.nico_safety.safe ? 1.0 : 0.0;
    total *= nicoSafetyMultiplier; // Zero score if not safe for Nico

    // Texture adjustment
    const textureBonus = scores.modifiers.texture_suitability.score * weights.texture_suitability * 0.01;
    total += textureBonus;

    return Math.round(Math.max(0, Math.min(100, total)));
  }

  assignGrade(score) {
    if (score >= this.thresholds.excellent) return 'A+';
    if (score >= this.thresholds.good) return 'A';
    if (score >= this.thresholds.satisfactory) return 'B';
    if (score >= this.thresholds.needs_improvement) return 'C';
    return 'F';
  }

  generateRecommendations(scores) {
    const recommendations = [];

    // Timing recommendations
    if (scores.components.timing.score < 90) {
      recommendations.push({
        category: 'timing',
        priority: 'high',
        message: 'Eat between 06:00-07:00 for optimal OMAD compliance',
        action: 'Adjust meal timing to morning window'
      });
    }

    // Plant diversity recommendations
    const plantScore = scores.components.plant_diversity;
    if (plantScore.species_count < 10) {
      recommendations.push({
        category: 'plant_diversity',
        priority: 'high',
        message: `Add ${10 - plantScore.species_count} more plant species`,
        action: 'Include herbs, spices, or colorful vegetables'
      });
    }

    // Anti-inflammatory recommendations
    if (scores.components.anti_inflammatory.score < 70) {
      recommendations.push({
        category: 'anti_inflammatory',
        priority: 'high',
        message: 'Increase anti-inflammatory ingredients',
        action: 'Add turmeric, ginger, berries, or leafy greens'
      });
    }

    // mTOR compliance recommendations
    const mtorScore = scores.components.mtor_compliance;
    if (mtorScore.score < 80) {
      if (mtorScore.current_phase === 'high') {
        recommendations.push({
          category: 'mtor',
          priority: 'medium',
          message: 'Increase protein for high mTOR phase',
          action: 'Add lean proteins, eggs, or Greek yogurt'
        });
      } else {
        recommendations.push({
          category: 'mtor',
          priority: 'medium',
          message: 'Focus on plant proteins for low mTOR phase',
          action: 'Emphasize legumes, nuts, and diverse vegetables'
        });
      }
    }

    // Nico safety recommendations
    if (!scores.modifiers.nico_safety.safe) {
      scores.modifiers.nico_safety.dangerous_items.forEach(item => {
        recommendations.push({
          category: 'nico_safety',
          priority: 'CRITICAL',
          message: `Remove ${item.name} - not safe for Nico`,
          action: `Replace with: ${item.alternatives.join(', ')}`
        });
      });
    }

    // Texture recommendations
    if (scores.modifiers.texture_suitability.score < 80) {
      recommendations.push({
        category: 'texture',
        priority: 'high',
        message: 'Improve texture suitability for Nico',
        action: 'Cook ingredients until very soft and tender'
      });
    }

    return recommendations;
  }

  identifyViolations(scores) {
    const violations = [];

    // Critical violations
    if (!scores.modifiers.nico_safety.safe) {
      violations.push({
        type: 'CRITICAL',
        category: 'nico_safety',
        message: 'Contains ingredients dangerous for Nico',
        items: scores.modifiers.nico_safety.dangerous_items.map(item => item.name)
      });
    }

    // Timing violations
    if (scores.components.timing.status === 'violation') {
      violations.push({
        type: 'major',
        category: 'timing',
        message: 'Meal outside OMAD window',
        details: scores.components.timing.details.window
      });
    }

    // Plant diversity violations
    if (scores.components.plant_diversity.species_count < 5) {
      violations.push({
        type: 'major',
        category: 'plant_diversity',
        message: 'Insufficient plant diversity',
        current: scores.components.plant_diversity.species_count,
        minimum: 5
      });
    }

    return violations;
  }

  // Helper methods
  estimateProteinRatio(ingredients) {
    if (!ingredients) return 0.2;

    let totalProtein = 0;
    let totalCalories = 0;

    ingredients.forEach(ingredientRef => {
      const ingredient = codexDatabase.getIngredientById(ingredientRef.id || ingredientRef);
      if (ingredient?.nutrition_per_100g) {
        const quantity = ingredientRef.quantity || 100;
        const multiplier = quantity / 100;
        
        totalProtein += (ingredient.nutrition_per_100g.protein || 0) * multiplier;
        totalCalories += (ingredient.nutrition_per_100g.calories || 0) * multiplier;
      }
    });

    return totalCalories > 0 ? (totalProtein * 4) / totalCalories : 0.2;
  }

  hasOptimalCookingTimes(layers) {
    // Check if cooking times are well-distributed across layers
    const layerTimes = [];
    Object.values(layers).forEach(layer => {
      layer.forEach(item => {
        if (item.cook_time) layerTimes.push(item.cook_time);
      });
    });

    return layerTimes.length > 0 && Math.max(...layerTimes) - Math.min(...layerTimes) <= 15;
  }

  generateMealId() {
    return `meal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Trend analysis methods
  getScoreHistory(days = 7) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    const recentScores = Array.from(this.scoringHistory.values())
      .filter(score => new Date(score.timestamp) >= cutoff)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return recentScores;
  }

  calculateTrends(days = 7) {
    const history = this.getScoreHistory(days);
    
    if (history.length < 2) return null;

    const trends = {
      overall: this.calculateTrend(history.map(s => s.total_score)),
      plant_diversity: this.calculateTrend(history.map(s => s.components.plant_diversity.score)),
      anti_inflammatory: this.calculateTrend(history.map(s => s.components.anti_inflammatory.score)),
      mtor_compliance: this.calculateTrend(history.map(s => s.components.mtor_compliance.score)),
      average_score: history.reduce((sum, s) => sum + s.total_score, 0) / history.length
    };

    return trends;
  }

  calculateTrend(values) {
    if (values.length < 2) return 0;
    
    const first = values[values.length - 1];
    const last = values[0];
    const change = last - first;
    
    return {
      change: Math.round(change),
      direction: change > 2 ? 'improving' : change < -2 ? 'declining' : 'stable',
      percentage: Math.round((change / first) * 100)
    };
  }
}

export const codexScoring = new CodexScoring();