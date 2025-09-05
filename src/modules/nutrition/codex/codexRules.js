// =============================================================================
// CODEX N-OMAD - COMPLETE NUTRITIONAL OPTIMIZATION SYSTEM
// Based on latest research: inflammation, longevity, cognitive performance
// =============================================================================

export const CODEX_RULES = {
  // =============================================================================
  // TIER 1: FOUNDATIONAL ANTI-INFLAMMATORY FOODS
  // =============================================================================
  TIER1_FOODS: {
    // Omega-3 Rich Fish (2-3x weekly)
    wildCaughtFish: {
      salmon: { score: 100, omega3: 'very_high', mercury: 'low' },
      sardines: { score: 98, omega3: 'very_high', mercury: 'very_low' },
      mackerel: { score: 95, omega3: 'high', mercury: 'low' },
      anchovies: { score: 97, omega3: 'high', mercury: 'very_low' },
      wildTuna: { score: 85, omega3: 'moderate', mercury: 'moderate' }
    },
    
    // Cruciferous Vegetables (daily)
    cruciferous: {
      broccoli: { score: 95, sulforaphane: 'high', detox: 'excellent' },
      broccoliSprouts: { score: 100, sulforaphane: 'very_high', detox: 'exceptional' },
      kale: { score: 92, antioxidants: 'very_high', minerals: 'high' },
      cauliflower: { score: 88, fiber: 'high', versatility: 'high' },
      brusselsSprouts: { score: 90, glucosinolates: 'high' },
      cabbage: { score: 85, vitamin_c: 'high', affordable: true }
    },
    
    // Leafy Greens (daily)
    leafyGreens: {
      spinach: { score: 95, folate: 'very_high', iron: 'high' },
      arugula: { score: 92, nitrates: 'high', peppery: true },
      swissChard: { score: 90, magnesium: 'high', colorful: true },
      watercress: { score: 100, density: 'highest', peppery: true },
      lettuce: { score: 75, hydrating: true, versatile: true }
    },
    
    // Healthy Fats (daily)
    healthyFats: {
      extraVirginOliveOil: { score: 98, polyphenols: 'high', stable: true },
      avocado: { score: 95, monounsaturated: 'high', potassium: 'high' },
      nuts: {
        walnuts: { score: 95, omega3: 'plant_high', brain: 'excellent' },
        almonds: { score: 90, vitamin_e: 'high', magnesium: 'high' },
        pecans: { score: 88, antioxidants: 'high' },
        macadamia: { score: 92, monounsaturated: 'very_high' }
      },
      seeds: {
        chiaSeeds: { score: 95, omega3: 'plant_high', fiber: 'very_high' },
        flaxSeeds: { score: 90, lignans: 'high', omega3: 'plant_high' },
        pumpkinSeeds: { score: 88, zinc: 'high', magnesium: 'high' }
      }
    }
  },

  // =============================================================================
  // TIER 2: OPTIMIZATION ENHANCERS
  // =============================================================================
  TIER2_FOODS: {
    // Colorful Vegetables (variety daily)
    colorfulVegetables: {
      red: {
        redPeppers: { score: 90, vitamin_c: 'very_high', antioxidants: 'high' },
        tomatoes: { score: 85, lycopene: 'high', cooked_better: true },
        redOnions: { score: 88, quercetin: 'high', prebiotics: 'moderate' }
      },
      orange: {
        carrots: { score: 85, beta_carotene: 'very_high', fiber: 'high' },
        sweetPotatoes: { score: 90, beta_carotene: 'very_high', potassium: 'high' },
        butternutSquash: { score: 88, vitamin_a: 'very_high' }
      },
      purple: {
        redCabbage: { score: 92, anthocyanins: 'high', vitamin_c: 'high' },
        eggplant: { score: 85, nasunin: 'high', fiber: 'moderate' },
        purpleOnions: { score: 87, anthocyanins: 'moderate' }
      }
    },
    
    // Berries & Low-Sugar Fruits
    berries: {
      blueberries: { score: 98, anthocyanins: 'very_high', brain: 'excellent' },
      blackberries: { score: 95, fiber: 'very_high', antioxidants: 'high' },
      raspberries: { score: 93, fiber: 'very_high', vitamin_c: 'high' },
      strawberries: { score: 90, vitamin_c: 'very_high', folate: 'high' },
      cranberries: { score: 88, proanthocyanins: 'high', urinary: 'excellent' }
    },
    
    // Herbs & Spices (daily rotation)
    herbsSpices: {
      turmeric: { score: 100, curcumin: 'very_high', antiInflammatory: 'exceptional' },
      ginger: { score: 95, gingerol: 'high', digestive: 'excellent' },
      garlic: { score: 93, allicin: 'high', cardiovascular: 'excellent' },
      oregano: { score: 90, antioxidants: 'very_high', antimicrobial: 'high' },
      rosemary: { score: 92, rosmarinic_acid: 'high', cognitive: 'good' },
      thyme: { score: 88, thymol: 'high', respiratory: 'good' }
    }
  },

  // =============================================================================
  // TIER 3: STRATEGIC ADDITIONS
  // =============================================================================
  TIER3_FOODS: {
    // Fermented Foods (for microbiome)
    fermented: {
      sauerkraut: { score: 90, probiotics: 'high', vitamin_c: 'high' },
      kimchi: { score: 95, probiotics: 'high', spicy: true },
      kefir: { score: 88, probiotics: 'very_high', protein: 'moderate' },
      yogurt: { score: 85, probiotics: 'moderate', protein: 'high' },
      miso: { score: 87, probiotics: 'moderate', umami: 'high' }
    },
    
    // Ancient Grains (limited portions)
    ancientGrains: {
      quinoa: { score: 88, complete_protein: true, fiber: 'high' },
      buckwheat: { score: 85, rutin: 'high', gluten_free: true },
      amaranth: { score: 82, protein: 'high', minerals: 'high' },
      teff: { score: 80, iron: 'high', calcium: 'high' }
    },
    
    // Legumes (moderate portions)
    legumes: {
      lentils: { score: 85, protein: 'high', folate: 'very_high' },
      chickpeas: { score: 83, protein: 'high', fiber: 'high' },
      blackBeans: { score: 82, anthocyanins: 'moderate', protein: 'high' },
      kidney_beans: { score: 80, protein: 'high', iron: 'high' }
    }
  },

  // =============================================================================
  // AVOID LIST (INFLAMMATORY FOODS)
  // =============================================================================
  AVOID_FOODS: {
    // High Inflammatory Score - Complete Avoidance
    highInflammatory: {
      processedMeats: { score: -95, nitrates: 'high', cancer_risk: 'high' },
      transAts: { score: -100, cardiovascular_damage: 'severe' },
      highFructoseCornSyrup: { score: -98, metabolic_damage: 'severe' },
      artificialSweeteners: { score: -85, microbiome_disruption: 'high' },
      deepFriedFoods: { score: -90, oxidized_fats: 'very_high' }
    },
    
    // Moderate Inflammatory - Minimize
    moderateInflammatory: {
      refinedSugar: { score: -75, insulin_spike: 'high', addiction: 'moderate' },
      whiteFlour: { score: -70, blood_sugar_spike: 'high', nutrients: 'very_low' },
      conventionalDairy: { score: -60, inflammation: 'moderate', hormones: 'moderate' },
      farmedFish: { score: -45, omega6_high: true, antibiotics: 'possible' },
      conventionalMeat: { score: -55, omega6_high: true, hormones: 'high' }
    },
    
    // Contextual Avoidance - Individual Sensitivity
    contextualAvoid: {
      gluten: { score: -40, individual_sensitivity: 'high' },
      nightshades: { score: -30, individual_sensitivity: 'moderate' },
      lectins: { score: -25, individual_sensitivity: 'moderate' },
      oxalates: { score: -20, kidney_stone_risk: 'individual' }
    }
  },

  // =============================================================================
  // DAILY OPTIMIZATION TARGETS
  // =============================================================================
  DAILY_TARGETS: {
    // Minimum Daily Requirements
    minimums: {
      vegetables: { servings: 6, variety: 5, colors: 3 },
      leafyGreens: { cups: 2, raw_preferred: true },
      cruciferous: { servings: 1, raw_and_cooked: true },
      berries: { cup: 0.5, frozen_acceptable: true },
      healthyFats: { servings: 3, variety: 2 },
      herbs_spices: { types: 3, turmeric_daily: true }
    },
    
    // Optimal Ranges
    optimal: {
      plant_foods: { servings: '8-12', variety: '15-20' },
      fiber: { grams: '35-50', soluble_insoluble_balance: true },
      omega3: { grams: '2-4', epa_dha_preferred: true },
      polyphenols: { mg: '500-1000', variety: 'essential' },
      water: { liters: '2.5-3.5', quality: 'filtered' }
    },
    
    // Weekly Targets
    weekly: {
      fish: { servings: '2-3', wild_caught: 'preferred' },
      fermented_foods: { servings: '4-7', variety: 2 },
      plant_species: { count: '30+', new_species: 'monthly' },
      meal_prep: { sessions: '2-3', batch_cooking: true }
    }
  },

  // =============================================================================
  // MEAL TIMING & METABOLIC OPTIMIZATION
  // =============================================================================
  MEAL_TIMING: {
    // Intermittent Fasting Windows
    fastingWindows: {
      beginner: { fast: 12, eat: 12, description: '8pm-8am fast' },
      intermediate: { fast: 14, eat: 10, description: '7pm-9am fast' },
      advanced: { fast: 16, eat: 8, description: '6pm-10am fast' },
      expert: { fast: 18, eat: 6, description: '4pm-10am fast' }
    },
    
    // Meal Distribution
    mealDistribution: {
      twoMeals: { 
        meal1: { time: '10-11am', calories: '30-40%' },
        meal2: { time: '4-6pm', calories: '60-70%' }
      },
      threeMeals: {
        breakfast: { time: '8-9am', calories: '25-30%' },
        lunch: { time: '1-2pm', calories: '35-40%' },
        dinner: { time: '6-7pm', calories: '30-35%' }
      }
    },
    
    // Circadian Optimization
    circadianTiming: {
      earlyMorning: { sunlight: 'required', water: 'large_glass', movement: 'light' },
      morning: { protein: 'high', carbs: 'moderate', fats: 'moderate' },
      afternoon: { largest_meal: 'preferred', social_eating: 'optimal' },
      evening: { protein: 'moderate', carbs: 'low', fats: 'high' },
      nighttime: { eating_cutoff: '3hrs_before_bed', blue_light: 'minimize' }
    }
  },

  // =============================================================================
  // BIOMARKER TARGETS
  // =============================================================================
  BIOMARKER_TARGETS: {
    // Primary Inflammation Markers
    inflammation: {
      hsCRP: { optimal: '<1.0', good: '<2.0', units: 'mg/L' },
      il6: { optimal: '<1.5', good: '<3.0', units: 'pg/mL' },
      tnf_alpha: { optimal: '<8.0', good: '<12.0', units: 'pg/mL' }
    },
    
    // Metabolic Health
    metabolic: {
      glucose_fasting: { optimal: '80-90', acceptable: '70-99', units: 'mg/dL' },
      insulin_fasting: { optimal: '<5', acceptable: '<10', units: 'μIU/mL' },
      hba1c: { optimal: '<5.0', good: '<5.6', units: '%' },
      triglycerides: { optimal: '<100', acceptable: '<150', units: 'mg/dL' }
    },
    
    // Cardiovascular
    cardiovascular: {
      ldl_particle_size: { optimal: 'large', avoid: 'small_dense' },
      hdl: { optimal: '>60', minimum: '>40', units: 'mg/dL' },
      apoB: { optimal: '<80', acceptable: '<100', units: 'mg/dL' }
    },
    
    // Micronutrients
    micronutrients: {
      vitamin_d: { optimal: '40-60', minimum: '>30', units: 'ng/mL' },
      b12: { optimal: '>400', minimum: '>200', units: 'pg/mL' },
      omega3_index: { optimal: '>8%', minimum: '>4%' },
      magnesium_rbc: { optimal: '6.0-6.5', minimum: '>4.2', units: 'mg/dL' }
    }
  },

  // =============================================================================
  // SUPPLEMENT PROTOCOLS
  // =============================================================================
  SUPPLEMENTS: {
    // Tier 1: Foundation (most people benefit)
    foundation: {
      omega3: {
        dose: '2-3g EPA+DHA',
        timing: 'with_meals',
        quality: 'third_party_tested',
        notes: 'molecular_distilled'
      },
      vitaminD3: {
        dose: '2000-4000 IU',
        timing: 'morning_with_fat',
        cofactor: 'vitamin_k2',
        notes: 'test_blood_levels'
      },
      magnesium: {
        dose: '400-600mg',
        form: 'glycinate_preferred',
        timing: 'evening',
        notes: 'avoid_oxide_form'
      }
    },
    
    // Tier 2: Optimization (based on testing/goals)
    optimization: {
      curcumin: {
        dose: '500-1000mg',
        bioavailability: 'piperine_or_liposomal',
        timing: 'with_meals',
        notes: 'anti_inflammatory'
      },
      probiotics: {
        cfu: '50-100_billion',
        strains: 'multiple_species',
        timing: 'empty_stomach',
        notes: 'rotate_brands'
      },
      berberine: {
        dose: '500mg_2x_daily',
        timing: 'before_meals',
        target: 'metabolic_health',
        notes: 'glucose_control'
      }
    }
  }
};

// =============================================================================
// CODEX SCORING ALGORITHM
// =============================================================================

export function calculateCODEXScore(mealData) {
  let score = 0;
  let maxScore = 1000;
  let breakdown = {
    tier1_foods: 0,
    tier2_foods: 0,
    tier3_foods: 0,
    inflammatory_penalty: 0,
    variety_bonus: 0,
    timing_bonus: 0
  };

  // Tier 1 Foods Scoring (0-400 points)
  const tier1Score = calculateTier1Score(mealData.ingredients);
  breakdown.tier1_foods = tier1Score;
  score += tier1Score;

  // Tier 2 Foods Scoring (0-300 points)
  const tier2Score = calculateTier2Score(mealData.ingredients);
  breakdown.tier2_foods = tier2Score;
  score += tier2Score;

  // Tier 3 Foods Scoring (0-200 points)
  const tier3Score = calculateTier3Score(mealData.ingredients);
  breakdown.tier3_foods = tier3Score;
  score += tier3Score;

  // Inflammatory Foods Penalty (0 to -500 points)
  const inflammatoryPenalty = calculateInflammatoryPenalty(mealData.ingredients);
  breakdown.inflammatory_penalty = inflammatoryPenalty;
  score += inflammatoryPenalty;

  // Variety Bonus (0-50 points)
  const varietyBonus = calculateVarietyBonus(mealData.ingredients);
  breakdown.variety_bonus = varietyBonus;
  score += varietyBonus;

  // Timing Bonus (0-50 points)
  const timingBonus = calculateTimingBonus(mealData.timing);
  breakdown.timing_bonus = timingBonus;
  score += timingBonus;

  // Normalize to 0-100 scale
  const finalScore = Math.max(0, Math.min(100, (score / maxScore) * 100));

  return {
    score: Math.round(finalScore),
    breakdown: breakdown,
    recommendations: generateRecommendations(mealData, breakdown),
    grade: getGrade(finalScore)
  };
}

function calculateTier1Score(ingredients) {
  // Tier 1: Anti-inflammatory heroes (0-400 points max)
  let score = 0;
  const tier1Foods = {
    // Anti-inflammatory spices
    turmeric: 50,
    ginger: 45,
    garlic: 40,
    cinnamon: 35,
    
    // Omega-3 rich fish
    salmon_wild: 60,
    sardines: 58,
    mackerel: 55,
    anchovies: 57,
    
    // Cruciferous vegetables
    broccoli: 45,
    kale: 48,
    cauliflower: 40,
    brussels_sprouts: 42,
    
    // Leafy greens
    spinach: 35,
    arugula: 38,
    watercress: 40,
    swiss_chard: 36,
    
    // Healthy fats
    olive_oil: 45,
    avocado: 42,
    walnuts: 40,
    almonds: 35
  };
  
  ingredients.forEach(ingredient => {
    const ingredientId = ingredient.id || ingredient.name?.toLowerCase().replace(/\s+/g, '_');
    if (tier1Foods[ingredientId]) {
      // Score based on amount (grams) and tier1 value
      const amountMultiplier = Math.min(ingredient.amount / 100, 1.5); // Cap at 150% for large portions
      score += tier1Foods[ingredientId] * amountMultiplier;
    }
  });
  
  // Cap at maximum 400 points
  return Math.min(400, Math.round(score));
}

function calculateTier2Score(ingredients) {
  // Tier 2: Support foods (0-300 points max)
  let score = 0;
  const tier2Foods = {
    // Colorful vegetables
    tomato: 30,
    red_pepper: 32,
    carrot: 28,
    sweet_potato: 35,
    purple_cabbage: 33,
    
    // Berries
    blueberries: 40,
    strawberries: 35,
    raspberries: 38,
    blackberries: 36,
    
    // Herbs
    rosemary: 30,
    oregano: 28,
    thyme: 27,
    basil: 26,
    
    // Seeds
    chia_seeds: 35,
    flax_seeds: 38,
    hemp_seeds: 33,
    pumpkin_seeds: 30
  };
  
  ingredients.forEach(ingredient => {
    const ingredientId = ingredient.id || ingredient.name?.toLowerCase().replace(/\s+/g, '_');
    if (tier2Foods[ingredientId]) {
      const amountMultiplier = Math.min(ingredient.amount / 50, 1.2);
      score += tier2Foods[ingredientId] * amountMultiplier;
    }
  });
  
  return Math.min(300, Math.round(score));
}

function calculateTier3Score(ingredients) {
  // Tier 3: Strategic additions (0-200 points max)
  let score = 0;
  const tier3Foods = {
    // Fermented foods
    sauerkraut: 25,
    kimchi: 28,
    kefir: 22,
    yogurt: 20,
    miso: 24,
    
    // Ancient grains
    quinoa: 22,
    buckwheat: 20,
    amaranth: 18,
    teff: 17,
    
    // Legumes
    lentils: 25,
    chickpeas: 23,
    black_beans: 22,
    kidney_beans: 20
  };
  
  ingredients.forEach(ingredient => {
    const ingredientId = ingredient.id || ingredient.name?.toLowerCase().replace(/\s+/g, '_');
    if (tier3Foods[ingredientId]) {
      const amountMultiplier = Math.min(ingredient.amount / 80, 1);
      score += tier3Foods[ingredientId] * amountMultiplier;
    }
  });
  
  return Math.min(200, Math.round(score));
}

function calculateInflammatoryPenalty(ingredients) {
  // Negative points for inflammatory foods (0 to -500 points)
  let penalty = 0;
  const inflammatoryFoods = {
    // High inflammatory
    processed_meat: -50,
    white_sugar: -45,
    white_flour: -40,
    trans_fat: -60,
    high_fructose_corn_syrup: -55,
    
    // Moderate inflammatory
    refined_oil: -30,
    conventional_dairy: -25,
    farmed_fish: -20,
    alcohol: -35,
    
    // Mild inflammatory
    white_rice: -15,
    white_bread: -18,
    pasta_white: -16
  };
  
  ingredients.forEach(ingredient => {
    const ingredientId = ingredient.id || ingredient.name?.toLowerCase().replace(/\s+/g, '_');
    
    // Check for inflammatory ingredients
    Object.keys(inflammatoryFoods).forEach(badFood => {
      if (ingredientId.includes(badFood) || ingredient.name?.toLowerCase().includes(badFood)) {
        const amountMultiplier = ingredient.amount / 100;
        penalty += inflammatoryFoods[badFood] * amountMultiplier;
      }
    });
    
    // Check for mushrooms (Nico allergy) - automatic heavy penalty
    if (ingredientId.includes('mushroom') || 
        ingredientId.includes('ciuperci') || 
        ingredient.name?.toLowerCase().includes('mushroom')) {
      penalty -= 200; // Heavy penalty for allergen
    }
  });
  
  // Cap penalty at -500
  return Math.max(-500, Math.round(penalty));
}

function calculateVarietyBonus(ingredients) {
  // Bonus for ingredient variety (0-50 points)
  let bonus = 0;
  
  // Count unique plant species
  const plantSpecies = new Set();
  const colors = new Set();
  
  ingredients.forEach(ingredient => {
    const name = (ingredient.name || ingredient.id || '').toLowerCase();
    
    // Track plant species
    if (!name.includes('meat') && !name.includes('fish') && !name.includes('chicken')) {
      plantSpecies.add(name);
      
      // Track colors for phytonutrient diversity
      if (name.includes('red') || name.includes('tomato')) colors.add('red');
      if (name.includes('orange') || name.includes('carrot') || name.includes('sweet_potato')) colors.add('orange');
      if (name.includes('yellow') || name.includes('corn')) colors.add('yellow');
      if (name.includes('green') || name.includes('spinach') || name.includes('broccoli')) colors.add('green');
      if (name.includes('purple') || name.includes('eggplant')) colors.add('purple');
      if (name.includes('white') || name.includes('garlic') || name.includes('onion')) colors.add('white');
    }
  });
  
  // 2 points per unique plant (max 30 points)
  bonus += Math.min(30, plantSpecies.size * 2);
  
  // 4 points per color represented (max 20 points for 5+ colors)
  bonus += Math.min(20, colors.size * 4);
  
  return Math.round(bonus);
}

function calculateTimingBonus(timing) {
  // Bonus for optimal meal timing (0-50 points)
  if (!timing) return 0;
  
  let bonus = 0;
  const currentHour = new Date().getHours();
  
  // OMAD window optimization (6-7 AM is optimal)
  if (timing === 'OMAD' || timing === 'omad') {
    if (currentHour >= 6 && currentHour <= 7) {
      bonus = 50; // Perfect timing
    } else if (currentHour >= 5 && currentHour <= 8) {
      bonus = 40; // Good timing
    } else if (currentHour >= 4 && currentHour <= 10) {
      bonus = 30; // Acceptable timing
    } else if (currentHour >= 11 && currentHour <= 14) {
      bonus = 20; // Suboptimal but acceptable
    } else {
      bonus = 10; // Outside optimal window
    }
  } else if (timing === 'IF' || timing === 'intermittent') {
    // Intermittent fasting window
    if (currentHour >= 12 && currentHour <= 20) {
      bonus = 35; // Within 8-hour window
    } else {
      bonus = 0; // Outside window
    }
  } else {
    // Regular meal timing
    if ((currentHour >= 6 && currentHour <= 9) ||   // Breakfast
        (currentHour >= 12 && currentHour <= 14) ||  // Lunch
        (currentHour >= 18 && currentHour <= 20)) {  // Dinner
      bonus = 25;
    }
  }
  
  return bonus;
}

function generateRecommendations(mealData, breakdown) {
  const recommendations = [];
  
  if (breakdown.tier1_foods < 200) {
    recommendations.push("Add more Tier 1 foods: wild fish, cruciferous vegetables, leafy greens");
  }
  
  if (breakdown.inflammatory_penalty < -100) {
    recommendations.push("Reduce inflammatory foods: processed items, refined sugars, trans fats");
  }
  
  if (breakdown.variety_bonus < 25) {
    recommendations.push("Increase variety: aim for 5+ different colored vegetables");
  }
  
  return recommendations;
}

function getGrade(score) {
  if (score >= 90) return 'A+ Excellent - Optimal Anti-Inflammatory';
  if (score >= 85) return 'A Very Good - Strong Protection';
  if (score >= 80) return 'A- Good - Beneficial';
  if (score >= 75) return 'B+ Above Average';
  if (score >= 70) return 'B Acceptable';
  if (score >= 65) return 'B- Room for Improvement';
  if (score >= 60) return 'C+ Needs Enhancement';
  if (score >= 55) return 'C Suboptimal';
  if (score >= 50) return 'C- Poor';
  return 'D Inflammatory Risk - Revise Recipe';
}

export default CODEX_RULES;