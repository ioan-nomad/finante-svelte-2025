import Database from 'better-sqlite3';
import principles from '../config/principles.json' assert { type: 'json' };

class NutritionAnalyzer {
  constructor(dbPath = './codex.db') {
    this.db = new Database(dbPath);
    this.principles = principles;
  }

  analyzeItems(items) {
    const analysis = {
      total_items: items.length,
      plant_species: new Set(),
      anti_inflammatory_score: 0,
      nutrition_totals: {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        fiber: 0,
        omega3: 0
      },
      codex_compliance: {
        plant_diversity: 0,
        anti_inflammatory: 0,
        overall_score: 0
      },
      warnings: [],
      recommendations: []
    };

    // Analyze each item
    items.forEach(item => {
      const ingredient = this.findIngredient(item.name || item.description);
      if (ingredient) {
        this.addToAnalysis(analysis, ingredient, item.quantity || 1);
      } else {
        analysis.warnings.push(`Unknown ingredient: ${item.name || item.description}`);
      }
    });

    // Calculate final scores
    this.calculateScores(analysis);
    this.generateRecommendations(analysis);

    return analysis;
  }

  findIngredient(name) {
    const normalizedName = name.toLowerCase().trim();
    
    // Try exact match first
    let stmt = this.db.prepare('SELECT * FROM ingredients WHERE LOWER(name) = ?');
    let ingredient = stmt.get(normalizedName);
    
    if (!ingredient) {
      // Try partial match
      stmt = this.db.prepare('SELECT * FROM ingredients WHERE LOWER(name) LIKE ?');
      ingredient = stmt.get(`%${normalizedName}%`);
    }

    return ingredient;
  }

  addToAnalysis(analysis, ingredient, quantity) {
    // Add to plant species if it's a plant
    if (ingredient.plant_species) {
      analysis.plant_species.add(ingredient.plant_species);
    }

    // Add anti-inflammatory score
    analysis.anti_inflammatory_score += ingredient.anti_inflammatory_score || 0;

    // Get nutrition values
    const nutrition = this.getNutritionValues(ingredient.id);
    if (nutrition) {
      analysis.nutrition_totals.calories += (nutrition.calories || 0) * quantity / 100;
      analysis.nutrition_totals.protein += (nutrition.protein || 0) * quantity / 100;
      analysis.nutrition_totals.carbs += (nutrition.carbs || 0) * quantity / 100;
      analysis.nutrition_totals.fat += (nutrition.fat || 0) * quantity / 100;
      analysis.nutrition_totals.fiber += (nutrition.fiber || 0) * quantity / 100;
      analysis.nutrition_totals.omega3 += (nutrition.omega3 || 0) * quantity / 100;
    }

    // Check for Nico restrictions
    if (!ingredient.nico_safe) {
      analysis.warnings.push(`⚠️ ${ingredient.name} not safe for Nico`);
    }
  }

  getNutritionValues(ingredientId) {
    const stmt = this.db.prepare('SELECT * FROM nutrition_values WHERE ingredient_id = ?');
    return stmt.get(ingredientId);
  }

  calculateScores(analysis) {
    const plantCount = analysis.plant_species.size;
    const dailyGoal = this.principles.core_principles.daily_plant_minimum;
    
    // Plant diversity score (0-100)
    analysis.codex_compliance.plant_diversity = Math.min(
      (plantCount / dailyGoal) * 100, 
      100
    );

    // Anti-inflammatory score (0-100)
    const maxAntiInflammatory = analysis.total_items * 10; // Max 10 per ingredient
    analysis.codex_compliance.anti_inflammatory = Math.min(
      (analysis.anti_inflammatory_score / maxAntiInflammatory) * 100,
      100
    );

    // Overall CODEX score
    analysis.codex_compliance.overall_score = Math.round(
      (analysis.codex_compliance.plant_diversity * 0.4) +
      (analysis.codex_compliance.anti_inflammatory * 0.6)
    );
  }

  generateRecommendations(analysis) {
    const plantCount = analysis.plant_species.size;
    const dailyGoal = this.principles.core_principles.daily_plant_minimum;

    if (plantCount < dailyGoal) {
      const needed = dailyGoal - plantCount;
      analysis.recommendations.push(
        `🌱 Add ${needed} more plant species to reach daily goal`
      );
    }

    if (analysis.codex_compliance.anti_inflammatory < 70) {
      analysis.recommendations.push(
        '🔥 Focus on anti-inflammatory foods: turmeric, ginger, berries, leafy greens'
      );
    }

    // Macro balance recommendations
    const totalCals = analysis.nutrition_totals.calories;
    const proteinCals = analysis.nutrition_totals.protein * 4;
    const proteinRatio = proteinCals / totalCals;

    if (proteinRatio < 0.15) {
      analysis.recommendations.push('💪 Consider adding more protein sources');
    }

    if (analysis.nutrition_totals.omega3 < 1) {
      analysis.recommendations.push('🐟 Add omega-3 rich foods: fatty fish, walnuts, flax seeds');
    }
  }

  analyzeMTORCompliance(analysis, currentPhase) {
    const compliance = {
      phase: currentPhase,
      protein_target_met: false,
      macro_balance: {},
      phase_score: 0
    };

    const totalCals = analysis.nutrition_totals.calories;
    const proteinRatio = (analysis.nutrition_totals.protein * 4) / totalCals;
    const targetCals = this.principles.ioan_profile.target_calories + 
                      this.principles.nico_profile.target_calories;

    if (currentPhase === 'high') {
      compliance.protein_target_met = proteinRatio >= 0.25;
      compliance.phase_score = proteinRatio >= 0.30 ? 100 : 
                               proteinRatio >= 0.25 ? 80 : 50;
    } else {
      compliance.protein_target_met = proteinRatio <= 0.20;
      compliance.phase_score = proteinRatio <= 0.15 ? 100 :
                               proteinRatio <= 0.20 ? 80 : 50;
    }

    return compliance;
  }
}

export default NutritionAnalyzer;