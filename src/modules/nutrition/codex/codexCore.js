/**
 * CODEX Core v3.0 - SAFETY-FIRST Anti-Inflammatory System
 * Priority #1: Inflammatory Control with Medical Safety
 */

export const CODEX_PRINCIPLES = {
  version: "3.0",
  lastUpdated: "2025-01-09",
  
  // PRIORITATEA #1 ABSOLUTĂ
  SAFETY_GATES: {
    nico_restrictions: {
      allergens: ["ciuperci", "mushrooms", "fungi", "champignon"],
      texture_needs: "soft_cooked", // pentru handicap structural
      portion_size: "smaller_frequent", // metabolism optimization
      special_nutrients: {
        protein: "43-54g/day", // 0.8-1g/kg pentru sarcopenie prevention
        calcium: "1200mg", // bone health critical
        vitamin_d: "2000-4000IU", // mobility limitation = less sun
        omega3: "2-3g", // anti-inflammatory essential
        magnesium: "400mg" // muscle function + bone
      }
    },
    
    medical_safety: {
      check_allergens: true,
      check_textures: true,
      check_portions: true,
      priority: "ABSOLUTE"
    }
  },
  
  // PRIORITATEA #2 - ANTI-INFLAMAȚIE MAXIMĂ
  INFLAMMATION_CONTROL: {
    priority: "CRITICAL",
    biomarkers: {
      "hs-CRP": {
        target: "<0.5 mg/L", // țintă agresivă pentru handicap
        critical: "<1.0 mg/L",
        panic: ">3.0 mg/L"
      },
      "IL-6": {
        target: "<1.0 pg/mL",
        critical: "<1.5 pg/mL"
      },
      "TNF-α": {
        target: "<5.0 pg/mL",
        critical: "<8.1 pg/mL"
      }
    },
    
    // Alimente OBLIGATORII zilnic pentru Nico
    daily_requirements: {
      turmeric_ginger: {
        amount: "5g turmeric + 3g ginger",
        with: "black_pepper + fat",
        reason: "Reduces joint inflammation"
      },
      omega3_sources: {
        options: ["sardines", "salmon", "mackerel", "walnuts", "chia"],
        amount: "100g fish OR 30g walnuts+chia",
        reason: "Systemic inflammation reduction"
      },
      colorful_vegetables: {
        minimum: 5,
        colors: ["red", "orange", "yellow", "green", "purple"],
        reason: "Polyphenol variety"
      }
    }
  },
  
  // WORKFLOW CORECT
  EVALUATION_WORKFLOW: {
    step1_safety: {
      order: 1,
      type: "GATE", // Pass/Fail
      checks: [
        "no_mushrooms",
        "texture_appropriate",
        "portion_controlled"
      ]
    },
    step2_inflammation: {
      order: 2,
      type: "SCORE", // 0-100
      weight: 0.40, // 40% din scor
      focus: "DII_index"
    },
    step3_nutrients: {
      order: 3,
      type: "SCORE",
      weight: 0.35, // 35% din scor
      focus: "protein_calcium_d3"
    },
    step4_metabolic: {
      order: 4,
      type: "SCORE",
      weight: 0.25, // 25% din scor
      focus: "glycemic_control"
    }
  }
};

// FUNCȚIA PRINCIPALĂ DE EVALUARE
export function evaluateMealForNico(mealData) {
  // STEP 1: SAFETY GATE (Non-negociabil)
  const safetyCheck = {
    no_mushrooms: !mealData.ingredients.some(i => 
      CODEX_PRINCIPLES.SAFETY_GATES.nico_restrictions.allergens
        .some(allergen => i.name.toLowerCase().includes(allergen))
    ),
    texture_safe: mealData.cooking_method === 'instant_pot' || 
                  mealData.cooking_time >= 30,
    portion_appropriate: mealData.total_weight <= 400 // grams
  };
  
  if (!Object.values(safetyCheck).every(check => check === true)) {
    return {
      approved: false,
      score: 0,
      violations: Object.entries(safetyCheck)
        .filter(([_, pass]) => !pass)
        .map(([rule, _]) => rule),
      message: "Meal unsafe for Nico - modify ingredients or cooking method"
    };
  }
  
  // STEP 2: INFLAMMATION SCORE (40% weight)
  const inflammationScore = calculateAntiInflammatoryScore(mealData);
  
  // STEP 3: NUTRIENT SCORE (35% weight)  
  const nutrientScore = calculateNicoNutrientScore(mealData);
  
  // STEP 4: METABOLIC SCORE (25% weight)
  const metabolicScore = calculateMetabolicScore(mealData);
  
  const totalScore = Math.round(
    inflammationScore * 0.40 +
    nutrientScore * 0.35 +
    metabolicScore * 0.25
  );
  
  return {
    approved: true,
    total_score: totalScore,
    breakdown: {
      safety: "PASSED",
      inflammation: inflammationScore,
      nutrients: nutrientScore,
      metabolic: metabolicScore
    },
    grade: getGrade(totalScore),
    recommendations: generateNicoRecommendations(mealData, totalScore)
  };
}

function calculateAntiInflammatoryScore(mealData) {
  let score = 50; // baseline
  
  // BOOST pentru anti-inflammatory heroes
  if (hasIngredient(mealData, 'turmeric')) score += 20;
  if (hasIngredient(mealData, 'ginger')) score += 15;
  if (hasIngredient(mealData, 'garlic')) score += 10;
  if (hasOmega3Fish(mealData)) score += 20;
  if (getColorfulVegCount(mealData) >= 5) score += 15;
  
  // PENALTY pentru inflammatory foods
  if (hasIngredient(mealData, 'sugar')) score -= 20;
  if (hasIngredient(mealData, 'white_flour')) score -= 15;
  if (hasProcessedMeat(mealData)) score -= 30;
  
  return Math.max(0, Math.min(100, score));
}

function calculateNicoNutrientScore(mealData) {
  const nutrients = mealData.total_nutrients || {};
  let score = 0;
  
  // Protein adequacy (critical pentru handicap)
  const proteinTarget = 50; // grams
  const proteinActual = nutrients.protein || 0;
  score += Math.min(40, (proteinActual / proteinTarget) * 40);
  
  // Calcium pentru oase
  const calciumTarget = 400; // mg per meal (1200/3)
  const calciumActual = nutrients.calcium || 0;
  score += Math.min(30, (calciumActual / calciumTarget) * 30);
  
  // Vitamin D carriers
  if (hasVitaminDSource(mealData)) score += 15;
  
  // Magnesium pentru mușchi
  const magnesiumTarget = 130; // mg per meal
  const magnesiumActual = nutrients.magnesium || 0;
  score += Math.min(15, (magnesiumActual / magnesiumTarget) * 15);
  
  return Math.round(score);
}

function calculateMetabolicScore(mealData) {
  let score = 70; // baseline
  
  // Simple implementation for now
  const carbs = mealData.total_nutrients?.carbs || 0;
  const fiber = mealData.total_nutrients?.fiber || 0;
  
  // Low glycemic load preferred
  if (carbs < 30) score += 15;
  if (fiber > 10) score += 15;
  
  return Math.max(0, Math.min(100, score));
}

function getGrade(score) {
  if (score >= 90) return 'A+ Excellent for Nico';
  if (score >= 80) return 'A Good for Nico';
  if (score >= 70) return 'B+ Acceptable';
  if (score >= 60) return 'B Needs improvement';
  if (score >= 50) return 'C+ Suboptimal';
  return 'F Reconsider meal';
}

function generateNicoRecommendations(mealData, score) {
  const recs = [];
  
  if (!hasIngredient(mealData, 'turmeric')) {
    recs.push("ADD: 1 tsp turmeric + black pepper for inflammation");
  }
  
  if (!hasOmega3Fish(mealData) && !hasIngredient(mealData, 'walnuts')) {
    recs.push("ADD: Sardines or walnuts for omega-3");
  }
  
  if (getColorfulVegCount(mealData) < 5) {
    recs.push("ADD: More colorful vegetables (red peppers, purple cabbage)");
  }
  
  const protein = mealData.total_nutrients?.protein || 0;
  if (protein < 43) {
    recs.push(`INCREASE: Protein to 43-54g (current: ${protein}g)`);
  }
  
  return recs;
}

// Helper functions
function hasIngredient(mealData, ingredient) {
  return mealData.ingredients.some(i => 
    i.name.toLowerCase().includes(ingredient.toLowerCase())
  );
}

function hasOmega3Fish(mealData) {
  const omega3Fish = ['salmon', 'sardine', 'mackerel', 'anchov', 'herring'];
  return mealData.ingredients.some(i => 
    omega3Fish.some(fish => i.name.toLowerCase().includes(fish))
  );
}

function hasProcessedMeat(mealData) {
  const processed = ['sausage', 'bacon', 'salami', 'hot dog', 'deli meat'];
  return mealData.ingredients.some(i => 
    processed.some(meat => i.name.toLowerCase().includes(meat))
  );
}

function hasVitaminDSource(mealData) {
  const vitDSources = ['salmon', 'sardine', 'mackerel', 'egg', 'fortified'];
  return mealData.ingredients.some(i => 
    vitDSources.some(source => i.name.toLowerCase().includes(source))
  );
}

function getColorfulVegCount(mealData) {
  const colors = new Set();
  const colorMap = {
    red: ['tomato', 'red pepper', 'red cabbage'],
    orange: ['carrot', 'orange pepper', 'sweet potato'],
    yellow: ['yellow pepper', 'corn', 'yellow squash'],
    green: ['spinach', 'broccoli', 'kale', 'green beans'],
    purple: ['purple cabbage', 'eggplant', 'purple onion']
  };
  
  mealData.ingredients.forEach(ing => {
    Object.entries(colorMap).forEach(([color, veggies]) => {
      if (veggies.some(veg => ing.name.toLowerCase().includes(veg))) {
        colors.add(color);
      }
    });
  });
  
  return colors.size;
}

export default CODEX_PRINCIPLES;