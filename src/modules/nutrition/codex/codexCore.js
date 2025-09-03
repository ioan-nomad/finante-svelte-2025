// CODEX Core - Principiile fundamentale N-OMAD
export class CodexCore {
  constructor() {
    this.principles = this.initializePrinciples();
    this.profiles = this.initializeProfiles();
    this.cycles = this.initializeCycles();
  }

  initializePrinciples() {
    return {
      // Principiile de bază CODEX N-OMAD
      core: {
        meal_frequency: 'OMAD', // One Meal A Day
        meal_window: { start: '06:00', end: '07:00' },
        cooking_method: 'instant_pot_exclusive',
        plant_diversity_goal: 30, // species per week
        daily_plant_minimum: 10,
        anti_inflammatory_priority: true,
        mtor_cycling: true,
        autophagy_optimization: true
      },
      
      // Reguli mTOR cycling
      mtor: {
        cycle_length: 14, // days
        high_protein_days: [1, 2, 3, 8, 9, 10],
        low_protein_days: [4, 5, 6, 7, 11, 12, 13, 14],
        protein_targets: {
          high: { min: 1.6, max: 2.0, unit: 'g/kg' },
          low: { min: 0.8, max: 1.2, unit: 'g/kg' }
        }
      },

      // Scoring system
      scoring: {
        plant_diversity: { weight: 0.3, max: 100 },
        anti_inflammatory: { weight: 0.3, max: 100 },
        mtor_compliance: { weight: 0.2, max: 100 },
        instant_pot_optimization: { weight: 0.2, max: 100 }
      }
    };
  }

  initializeProfiles() {
    return {
      Ioan: {
        age: 46,
        height: 171, // cm
        weight: 76, // kg
        gender: 'male',
        activity_level: 'sedentary',
        bmr: 1645,
        target_calories: 1400,
        conditions: [],
        allergies: [],
        preferences: ['variety', 'efficiency']
      },
      
      Nico: {
        age: 44,
        height: 141, // cm
        weight: 54, // kg
        gender: 'female',
        activity_level: 'sedentary',
        bmr: 1195,
        target_calories: 1100,
        conditions: ['mobility_reduced', 'inflammation_prone'],
        allergies: ['mushrooms', 'ciuperci'],
        preferences: ['soft_texture', 'anti_inflammatory']
      }
    };
  }

  initializeCycles() {
    return {
      current_cycle_start: new Date('2025-01-01'),
      cycle_length: 14,
      
      // Calculează ziua în ciclu
      getCurrentDay(date = new Date()) {
        const diffTime = Math.abs(date - this.current_cycle_start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return (diffDays % this.cycle_length) + 1;
      },

      // Determină faza mTOR
      getCurrentPhase(date = new Date()) {
        const day = this.getCurrentDay(date);
        const highDays = [1, 2, 3, 8, 9, 10];
        return highDays.includes(day) ? 'high' : 'low';
      },

      // Progres în ciclu
      getCycleProgress(date = new Date()) {
        const day = this.getCurrentDay(date);
        return {
          current_day: day,
          total_days: this.cycle_length,
          progress_percentage: (day / this.cycle_length) * 100,
          phase: this.getCurrentPhase(date),
          next_phase_change: this.getNextPhaseChange(day)
        };
      },

      getNextPhaseChange(currentDay) {
        const highDays = [1, 2, 3, 8, 9, 10];
        const isHighDay = highDays.includes(currentDay);
        
        if (isHighDay) {
          // Căutăm următoarea zi low
          if (currentDay === 3) return 1; // day 4
          if (currentDay === 10) return 1; // day 11
          return 1;
        } else {
          // Căutăm următoarea zi high
          if (currentDay >= 4 && currentDay <= 7) return 8 - currentDay; // to day 8
          if (currentDay >= 11) return 15 - currentDay; // to day 1 of next cycle
          return 1;
        }
      }
    };
  }

  // Validare conformitate CODEX
  validateMealCompliance(meal) {
    const compliance = {
      total_score: 0,
      details: {},
      violations: [],
      recommendations: []
    };

    // 1. Verificare timing OMAD
    const mealTime = new Date(meal.timestamp);
    const hour = mealTime.getHours();
    const minute = mealTime.getMinutes();
    const mealMinutes = hour * 60 + minute;
    const windowStart = 6 * 60; // 06:00
    const windowEnd = 7 * 60;   // 07:00

    if (mealMinutes >= windowStart && mealMinutes <= windowEnd) {
      compliance.details.timing = { score: 100, status: 'optimal' };
    } else {
      compliance.details.timing = { score: 0, status: 'violation' };
      compliance.violations.push('Meal outside OMAD window (06:00-07:00)');
    }

    // 2. Plant diversity check
    const plantCount = this.countPlantSpecies(meal.ingredients || []);
    const plantScore = Math.min((plantCount / 10) * 100, 100);
    compliance.details.plant_diversity = {
      score: plantScore,
      count: plantCount,
      target: 10,
      status: plantCount >= 10 ? 'optimal' : 'needs_improvement'
    };

    if (plantCount < 10) {
      compliance.recommendations.push(`Add ${10 - plantCount} more plant species`);
    }

    // 3. Anti-inflammatory assessment
    const antiInflamScore = this.calculateAntiInflammatoryScore(meal.ingredients || []);
    compliance.details.anti_inflammatory = {
      score: antiInflamScore,
      status: antiInflamScore >= 70 ? 'good' : 'needs_improvement'
    };

    // 4. mTOR phase compliance
    const currentPhase = this.cycles.getCurrentPhase();
    const mtorScore = this.assessMTORCompliance(meal, currentPhase);
    compliance.details.mtor_compliance = mtorScore;

    // 5. Nico safety check
    const nicoSafety = this.checkNicoSafety(meal.ingredients || []);
    compliance.details.nico_safety = nicoSafety;
    
    if (!nicoSafety.safe) {
      compliance.violations.push(...nicoSafety.violations);
    }

    // Calculate total score
    compliance.total_score = Math.round(
      (compliance.details.timing.score * 0.2) +
      (compliance.details.plant_diversity.score * 0.3) +
      (compliance.details.anti_inflammatory.score * 0.3) +
      (compliance.details.mtor_compliance.score * 0.2)
    );

    return compliance;
  }

  countPlantSpecies(ingredients) {
    const plantCategories = [
      'vegetables', 'fruits', 'herbs', 'spices', 'nuts', 'seeds',
      'legumes', 'grains', 'leafy_greens'
    ];
    
    const uniquePlants = new Set();
    
    ingredients.forEach(ingredient => {
      const name = ingredient.name.toLowerCase();
      // Simplified plant detection - în realitate ar fi mai complex
      if (plantCategories.some(category => 
          ingredient.category === category || name.includes(category))) {
        uniquePlants.add(ingredient.plant_species || ingredient.name);
      }
    });

    return uniquePlants.size;
  }

  calculateAntiInflammatoryScore(ingredients) {
    const antiInflammatoryFoods = {
      turmeric: 10, curcuma: 10,
      ginger: 9, ghimbir: 9,
      berries: 8, afine: 8, mure: 8,
      leafy_greens: 7, spanac: 7, kale: 7,
      fatty_fish: 8, salmon: 8, sardine: 8,
      olive_oil: 7,
      nuts: 6, nuci: 6, migdale: 6,
      tomatoes: 5, rosii: 5,
      broccoli: 6,
      sweet_potato: 5, cartof_dulce: 5
    };

    let totalScore = 0;
    let maxPossible = 0;

    ingredients.forEach(ingredient => {
      const name = ingredient.name.toLowerCase();
      maxPossible += 10; // Max score per ingredient
      
      for (const [food, score] of Object.entries(antiInflammatoryFoods)) {
        if (name.includes(food)) {
          totalScore += score;
          break;
        }
      }
    });

    return maxPossible > 0 ? Math.round((totalScore / maxPossible) * 100) : 0;
  }

  assessMTORCompliance(meal, phase) {
    const proteinRatio = this.calculateProteinRatio(meal);
    let score = 50; // base score
    let status = 'neutral';

    if (phase === 'high') {
      // High protein phase - target 25-35% protein
      if (proteinRatio >= 0.25 && proteinRatio <= 0.35) {
        score = 100;
        status = 'optimal';
      } else if (proteinRatio >= 0.20) {
        score = 75;
        status = 'good';
      }
    } else {
      // Low protein phase - target 15-20% protein
      if (proteinRatio >= 0.15 && proteinRatio <= 0.20) {
        score = 100;
        status = 'optimal';
      } else if (proteinRatio <= 0.25) {
        score = 75;
        status = 'good';
      }
    }

    return {
      score,
      status,
      phase,
      protein_ratio: proteinRatio,
      target_range: phase === 'high' ? '25-35%' : '15-20%'
    };
  }

  calculateProteinRatio(meal) {
    if (!meal.nutrition) return 0.2; // default
    
    const totalCalories = meal.nutrition.calories || 2500;
    const proteinCalories = (meal.nutrition.protein || 0) * 4;
    
    return proteinCalories / totalCalories;
  }

  checkNicoSafety(ingredients) {
    const unsafeForNico = [
      'mushroom', 'ciuperci', 'fungi', 'champignon',
      'shiitake', 'portobello', 'oyster_mushroom'
    ];

    const violations = [];
    const warnings = [];

    ingredients.forEach(ingredient => {
      const name = ingredient.name.toLowerCase();
      
      // Check for mushrooms
      unsafeForNico.forEach(unsafe => {
        if (name.includes(unsafe)) {
          violations.push(`Contains ${unsafe} - UNSAFE for Nico`);
        }
      });

      // Check for hard textures
      const hardTextures = ['nuts', 'raw_carrot', 'tough_meat'];
      hardTextures.forEach(texture => {
        if (name.includes(texture)) {
          warnings.push(`${ingredient.name} may need texture modification for Nico`);
        }
      });
    });

    return {
      safe: violations.length === 0,
      violations,
      warnings,
      recommendations: violations.length > 0 ? 
        ['Remove mushrooms completely', 'Use alternatives: zucchini, eggplant, cauliflower'] : 
        []
    };
  }

  // Generare recomandări pentru ziua curentă
  generateDailyRecommendations(date = new Date()) {
    const cycleInfo = this.cycles.getCycleProgress(date);
    const phase = cycleInfo.phase;
    
    return {
      date: date.toISOString().split('T')[0],
      cycle_info: cycleInfo,
      meal_timing: this.principles.core.meal_window,
      
      nutrition_targets: this.getNutritionTargets(phase),
      priority_foods: this.getPriorityFoods(phase),
      plant_focus: this.getPlantFocus(),
      instant_pot_suggestions: this.getInstantPotSuggestions(phase),
      
      nico_considerations: [
        'NO mushrooms in any form',
        'Ensure soft textures - cook vegetables thoroughly',
        'Focus on anti-inflammatory ingredients'
      ]
    };
  }

  getNutritionTargets(phase) {
    const totalCalories = this.profiles.Ioan.target_calories + this.profiles.Nico.target_calories;
    
    if (phase === 'high') {
      return {
        calories: totalCalories,
        protein: Math.round(totalCalories * 0.30 / 4), // grams
        carbs: Math.round(totalCalories * 0.35 / 4),   // grams
        fat: Math.round(totalCalories * 0.35 / 9),     // grams
        focus: 'Muscle maintenance & growth'
      };
    } else {
      return {
        calories: totalCalories,
        protein: Math.round(totalCalories * 0.18 / 4), // grams
        carbs: Math.round(totalCalories * 0.47 / 4),   // grams
        fat: Math.round(totalCalories * 0.35 / 9),     // grams
        focus: 'Autophagy & plant diversity'
      };
    }
  }

  getPriorityFoods(phase) {
    const base = [
      'Turmeric + black pepper',
      'Ginger (fresh)',
      'Leafy greens variety',
      'Colorful vegetables'
    ];

    if (phase === 'high') {
      return [
        ...base,
        'Lean proteins (chicken, fish)',
        'Eggs',
        'Greek yogurt',
        'Quinoa'
      ];
    } else {
      return [
        ...base,
        'Legumes and beans',
        'Nuts and seeds',
        'Avocado',
        'Berries'
      ];
    }
  }

  getPlantFocus() {
    return {
      daily_minimum: 10,
      weekly_target: 30,
      categories_to_include: [
        'Leafy greens (3+ types)',
        'Cruciferous vegetables',
        'Colorful peppers',
        'Herbs and spices',
        'Berries or colorful fruits'
      ]
    };
  }

  getInstantPotSuggestions(phase) {
    return {
      cooking_method: 'Layered one-pot meal',
      layers: {
        bottom: 'Aromatics (onion, garlic, ginger) + liquid',
        middle: phase === 'high' ? 'Protein + root vegetables' : 'Legumes + hearty vegetables',
        top: 'Leafy greens and delicate vegetables',
        steam_basket: 'Quick-cooking vegetables (broccoli, cauliflower)'
      },
      cooking_time: phase === 'high' ? '12-15 minutes' : '8-10 minutes',
      natural_release: '10 minutes'
    };
  }
}

export const codexCore = new CodexCore();