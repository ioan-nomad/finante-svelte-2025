class NutritionProfile {
  constructor(data = {}) {
    this.id = data.id || null;
    this.name = data.name || '';
    this.age = data.age || 0;
    this.height = data.height || 0; // cm
    this.weight = data.weight || 0; // kg
    this.gender = data.gender || 'unspecified';
    this.activityLevel = data.activity_level || 'sedentary';
    this.conditions = data.conditions || [];
    this.allergies = data.allergies || [];
    this.preferences = data.preferences || [];
    this.goals = data.goals || [];
    this.createdAt = data.created_at || new Date();
    
    // Calculated properties
    this.bmr = this.calculateBMR();
    this.targetCalories = data.target_calories || this.calculateTargetCalories();
    this.macroTargets = this.calculateMacroTargets();
  }

  // BMR Calculation using Mifflin-St Jeor Equation
  calculateBMR() {
    if (!this.weight || !this.height || !this.age) return 0;
    
    let bmr;
    if (this.gender === 'male') {
      bmr = 88.362 + (13.397 * this.weight) + (4.799 * this.height) - (5.677 * this.age);
    } else if (this.gender === 'female') {
      bmr = 447.593 + (9.247 * this.weight) + (3.098 * this.height) - (4.330 * this.age);
    } else {
      // Average of male/female calculation
      const maleBmr = 88.362 + (13.397 * this.weight) + (4.799 * this.height) - (5.677 * this.age);
      const femaleBmr = 447.593 + (9.247 * this.weight) + (3.098 * this.height) - (4.330 * this.age);
      bmr = (maleBmr + femaleBmr) / 2;
    }
    
    return Math.round(bmr);
  }

  // Calculate target calories based on activity level and goals
  calculateTargetCalories() {
    const activityMultipliers = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      very_active: 1.9
    };

    const baseCals = this.bmr * (activityMultipliers[this.activityLevel] || 1.2);
    
    // Adjust for goals
    if (this.goals.includes('weight_loss')) {
      return Math.round(baseCals * 0.8); // 20% deficit
    } else if (this.goals.includes('weight_gain')) {
      return Math.round(baseCals * 1.2); // 20% surplus
    }
    
    return Math.round(baseCals);
  }

  // Calculate macro targets based on conditions and goals
  calculateMacroTargets() {
    let proteinRatio = 0.25; // default
    let carbRatio = 0.45;
    let fatRatio = 0.30;

    // Adjust for conditions
    if (this.conditions.includes('inflammation_prone')) {
      proteinRatio = 0.22;
      carbRatio = 0.38;
      fatRatio = 0.40; // Higher healthy fats for anti-inflammatory
    }

    if (this.conditions.includes('mobility_reduced')) {
      proteinRatio = 0.28; // Higher protein to maintain muscle
    }

    if (this.age > 40) {
      proteinRatio += 0.03; // Slight protein increase for age
    }

    return {
      protein: {
        ratio: proteinRatio,
        grams: Math.round((this.targetCalories * proteinRatio) / 4),
        calories: Math.round(this.targetCalories * proteinRatio)
      },
      carbs: {
        ratio: carbRatio,
        grams: Math.round((this.targetCalories * carbRatio) / 4),
        calories: Math.round(this.targetCalories * carbRatio)
      },
      fat: {
        ratio: fatRatio,
        grams: Math.round((this.targetCalories * fatRatio) / 9),
        calories: Math.round(this.targetCalories * fatRatio)
      }
    };
  }

  // Get mTOR phase-specific targets
  getMTORTargets(phase = 'high') {
    const baseTargets = this.macroTargets;
    
    if (phase === 'high') {
      // High protein phase
      return {
        protein: {
          ...baseTargets.protein,
          grams: Math.round(baseTargets.protein.grams * 1.3),
          ratio: Math.min(baseTargets.protein.ratio * 1.3, 0.35)
        },
        carbs: {
          ...baseTargets.carbs,
          grams: Math.round(baseTargets.carbs.grams * 0.9),
          ratio: baseTargets.carbs.ratio * 0.9
        },
        fat: baseTargets.fat
      };
    } else {
      // Low protein phase
      return {
        protein: {
          ...baseTargets.protein,
          grams: Math.round(baseTargets.protein.grams * 0.7),
          ratio: baseTargets.protein.ratio * 0.7
        },
        carbs: {
          ...baseTargets.carbs,
          grams: Math.round(baseTargets.carbs.grams * 1.2),
          ratio: Math.min(baseTargets.carbs.ratio * 1.2, 0.55)
        },
        fat: baseTargets.fat
      };
    }
  }

  // Check if ingredient/food is safe for this profile
  isSafeFor(ingredient) {
    const safety = {
      safe: true,
      warnings: [],
      alternatives: []
    };

    // Check allergies
    this.allergies.forEach(allergy => {
      if (ingredient.name.toLowerCase().includes(allergy.toLowerCase())) {
        safety.safe = false;
        safety.warnings.push(`Allergy risk: ${allergy}`);
      }
    });

    // Check condition-specific restrictions
    if (this.conditions.includes('mobility_reduced')) {
      const hardTextures = ['nuts', 'raw_carrot', 'tough_meat'];
      if (hardTextures.some(texture => ingredient.name.toLowerCase().includes(texture))) {
        safety.warnings.push('May need texture modification');
      }
    }

    if (this.conditions.includes('inflammation_prone')) {
      if (ingredient.antiInflammatoryScore < 5) {
        safety.warnings.push('Consider higher anti-inflammatory alternatives');
      }
    }

    return safety;
  }

  // Get daily nutrition goals
  getDailyGoals() {
    return {
      calories: this.targetCalories,
      protein: this.macroTargets.protein.grams,
      carbs: this.macroTargets.carbs.grams,
      fat: this.macroTargets.fat.grams,
      fiber: Math.max(25, this.age * 0.4), // Age-adjusted fiber
      plant_species: this.conditions.includes('inflammation_prone') ? 12 : 10,
      anti_inflammatory_score: this.conditions.includes('inflammation_prone') ? 80 : 60,
      omega3: this.conditions.includes('inflammation_prone') ? 2.0 : 1.5, // grams
      water: Math.round(this.weight * 35) // ml per kg bodyweight
    };
  }

  // Analyze meal compliance for this profile
  analyzeMealCompliance(mealAnalysis) {
    const goals = this.getDailyGoals();
    const compliance = {
      overall_score: 0,
      details: {},
      recommendations: []
    };

    // Calorie compliance
    const calorieRatio = mealAnalysis.nutrition_totals.calories / goals.calories;
    compliance.details.calories = {
      target: goals.calories,
      actual: mealAnalysis.nutrition_totals.calories,
      compliance: calorieRatio >= 0.8 && calorieRatio <= 1.2 ? 100 : 50
    };

    // Protein compliance
    const proteinRatio = mealAnalysis.nutrition_totals.protein / goals.protein;
    compliance.details.protein = {
      target: goals.protein,
      actual: mealAnalysis.nutrition_totals.protein,
      compliance: proteinRatio >= 0.8 && proteinRatio <= 1.3 ? 100 : 60
    };

    // Plant diversity compliance
    const plantRatio = mealAnalysis.plant_species.size / goals.plant_species;
    compliance.details.plant_diversity = {
      target: goals.plant_species,
      actual: mealAnalysis.plant_species.size,
      compliance: plantRatio >= 1.0 ? 100 : plantRatio * 100
    };

    // Anti-inflammatory compliance
    compliance.details.anti_inflammatory = {
      target: goals.anti_inflammatory_score,
      actual: mealAnalysis.anti_inflammatory_score,
      compliance: (mealAnalysis.anti_inflammatory_score / goals.anti_inflammatory_score) * 100
    };

    // Calculate overall score
    compliance.overall_score = Math.round(
      (compliance.details.calories.compliance * 0.25) +
      (compliance.details.protein.compliance * 0.25) +
      (compliance.details.plant_diversity.compliance * 0.25) +
      (compliance.details.anti_inflammatory.compliance * 0.25)
    );

    // Generate recommendations
    this.generatePersonalizedRecommendations(compliance, goals, mealAnalysis);

    return compliance;
  }

  generatePersonalizedRecommendations(compliance, goals, mealAnalysis) {
    const recs = compliance.recommendations;

    // Personalized recommendations based on profile
    if (this.conditions.includes('inflammation_prone')) {
      if (compliance.details.anti_inflammatory.compliance < 80) {
        recs.push('🔥 Focus on anti-inflammatory foods: turmeric, ginger, berries, fatty fish');
      }
    }

    if (this.conditions.includes('mobility_reduced')) {
      recs.push('🥄 Ensure all foods are cooked to soft textures for easier consumption');
    }

    if (this.age > 45) {
      if (compliance.details.protein.compliance < 90) {
        recs.push('💪 Consider increasing protein intake to support muscle maintenance');
      }
      recs.push('🦴 Include calcium-rich foods for bone health');
    }

    // Goal-specific recommendations
    if (this.goals.includes('weight_loss') && mealAnalysis.nutrition_totals.calories > goals.calories) {
      recs.push('⚖️ Consider reducing portion sizes to meet weight loss goals');
    }

    if (this.goals.includes('muscle_gain') && compliance.details.protein.compliance < 100) {
      recs.push('🏋️ Increase protein intake to support muscle building');
    }
  }

  // Get recommended foods for this profile
  getRecommendedFoods() {
    const recommendations = {
      high_priority: [],
      moderate_priority: [],
      avoid: []
    };

    // Base recommendations
    recommendations.high_priority.push(
      'Leafy greens (spinach, kale)',
      'Fatty fish (salmon, sardines)',
      'Berries (blueberries, strawberries)',
      'Nuts and seeds'
    );

    // Condition-specific recommendations
    if (this.conditions.includes('inflammation_prone')) {
      recommendations.high_priority.push(
        'Turmeric with black pepper',
        'Ginger',
        'Extra virgin olive oil',
        'Green tea'
      );
      recommendations.avoid.push(
        'Processed foods',
        'Refined sugars',
        'Trans fats'
      );
    }

    if (this.conditions.includes('mobility_reduced')) {
      recommendations.moderate_priority.push(
        'Soft-cooked vegetables',
        'Tender proteins',
        'Smooth textures'
      );
      recommendations.avoid.push(
        'Hard nuts',
        'Tough meats',
        'Raw hard vegetables'
      );
    }

    // Age-specific recommendations
    if (this.age > 40) {
      recommendations.high_priority.push(
        'Calcium-rich foods',
        'Vitamin D sources',
        'Omega-3 rich foods'
      );
    }

    return recommendations;
  }

  // Export to database format
  toDatabase() {
    return {
      name: this.name,
      age: this.age,
      height: this.height,
      weight: this.weight,
      gender: this.gender,
      activity_level: this.activityLevel,
      conditions: JSON.stringify(this.conditions),
      allergies: JSON.stringify(this.allergies),
      preferences: JSON.stringify(this.preferences),
      goals: JSON.stringify(this.goals),
      target_calories: this.targetCalories
    };
  }

  // Create from database record
  static fromDatabase(record) {
    return new NutritionProfile({
      id: record.id,
      name: record.name,
      age: record.age,
      height: record.height,
      weight: record.weight,
      gender: record.gender,
      activity_level: record.activity_level,
      conditions: JSON.parse(record.conditions || '[]'),
      allergies: JSON.parse(record.allergies || '[]'),
      preferences: JSON.parse(record.preferences || '[]'),
      goals: JSON.parse(record.goals || '[]'),
      target_calories: record.target_calories,
      created_at: record.created_at
    });
  }

  // Create Ioan's profile
  static createIoanProfile() {
    return new NutritionProfile({
      name: 'Ioan',
      age: 46,
      height: 171,
      weight: 76,
      gender: 'male',
      activity_level: 'sedentary',
      conditions: ['desk_work'],
      allergies: [],
      preferences: ['variety', 'efficiency'],
      goals: ['health_optimization', 'longevity']
    });
  }

  // Create Nico's profile
  static createNicoProfile() {
    return new NutritionProfile({
      name: 'Nico',
      age: 44,
      height: 141,
      weight: 54,
      gender: 'female',
      activity_level: 'sedentary',
      conditions: ['mobility_reduced', 'inflammation_prone'],
      allergies: ['mushrooms'],
      preferences: ['soft_texture', 'anti_inflammatory'],
      goals: ['inflammation_reduction', 'comfort_eating']
    });
  }
}

export default NutritionProfile;