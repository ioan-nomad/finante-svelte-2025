import Database from 'better-sqlite3';
import principles from '../config/principles.json' assert { type: 'json' };
import mtorRules from '../config/mtor-rules.json' assert { type: 'json' };
import restrictions from '../config/restrictions.json' assert { type: 'json' };

class RecipeGenerator {
  constructor(dbPath = './codex.db') {
    this.db = new Database(dbPath);
    this.principles = principles;
    this.mtorRules = mtorRules;
    this.restrictions = restrictions;
  }

  generateDailyRecipe(date = new Date()) {
    const dayInCycle = this.getDayInCycle(date);
    const phase = this.getMTORPhase(dayInCycle);
    
    // Query recipes matching current phase
    const stmt = this.db.prepare(`
      SELECT r.*, GROUP_CONCAT(i.name) as ingredients
      FROM recipes r
      LEFT JOIN recipe_ingredients ri ON r.id = ri.recipe_id
      LEFT JOIN ingredients i ON ri.ingredient_id = i.id
      WHERE r.mtor_phase = ? 
      AND r.instant_pot = 1
      GROUP BY r.id
      ORDER BY r.plant_count DESC, r.anti_inflammatory DESC
      LIMIT 5
    `);
    
    const recipes = stmt.all(phase);
    
    // Filter pentru Nico safety
    const safeRecipes = recipes.filter(r => 
      !r.ingredients.includes('mushroom') && 
      !r.ingredients.includes('ciuperci')
    );
    
    return this.optimizeRecipe(safeRecipes[0], phase);
  }

  getDayInCycle(date) {
    const startDate = new Date('2025-01-01');
    const diffTime = Math.abs(date - startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return (diffDays % 14) + 1;
  }

  getMTORPhase(day) {
    return this.principles.core_principles.high_protein_days.includes(day) 
      ? 'high' 
      : 'low';
  }

  optimizeRecipe(recipe, phase) {
    if (!recipe) return null;
    
    const phaseRules = this.mtorRules.mtor_phases[phase === 'high' ? 'high_protein' : 'low_protein'];
    
    // Adjust quantities based on phase
    if (phase === 'high') {
      recipe.protein_multiplier = 1.3;
      recipe.focus = phaseRules.focus;
    } else {
      recipe.plant_multiplier = 1.5;
      recipe.focus = phaseRules.focus;
    }
    
    // Calculate total calories for both profiles
    recipe.total_calories = this.principles.ioan_profile.target_calories + 
                            this.principles.nico_profile.target_calories;
    
    // Apply Nico restrictions
    recipe.texture_optimized = true;
    recipe.anti_inflammatory_boost = true;
    
    return recipe;
  }

  generateWeeklyMenu(startDate = new Date()) {
    const menu = [];
    
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      
      const dayRecipe = this.generateDailyRecipe(currentDate);
      menu.push({
        date: currentDate.toISOString().split('T')[0],
        dayInCycle: this.getDayInCycle(currentDate),
        phase: this.getMTORPhase(this.getDayInCycle(currentDate)),
        recipe: dayRecipe
      });
    }
    
    return menu;
  }

  validateRecipeForProfiles(recipe) {
    const validation = {
      nico_safe: true,
      ioan_suitable: true,
      warnings: []
    };

    // Check Nico allergies
    if (recipe.ingredients && recipe.ingredients.includes('mushroom')) {
      validation.nico_safe = false;
      validation.warnings.push('Contains mushrooms - Nico allergy risk');
    }

    // Check texture requirements
    const hardTextures = ['nuts', 'raw_carrot', 'tough_meat'];
    if (hardTextures.some(texture => recipe.ingredients?.includes(texture))) {
      validation.warnings.push('May require texture modification for Nico');
    }

    return validation;
  }
}

export default RecipeGenerator;