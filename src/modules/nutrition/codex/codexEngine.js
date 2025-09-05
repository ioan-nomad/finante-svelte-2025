/**
 * CODEX ENGINE v4.0 - Sistem Complet de Decizie Nutrițională
 * Workflow logic impecabil pentru generare rețete
 */

import { CODEX_AUTHORITY } from './codexAuthority.js';
import { NUTRITIONAL_REQUIREMENTS } from './codexNutritionalRequirements.js';
import { CODEX_INGREDIENTS } from './codexDatabase.js';

export class CodexEngine {
  constructor() {
    this.version = '4.0';
    this.workflow = this.initializeWorkflow();
    this.gastronomicSources = this.loadGastronomicSources();
    this.cookingMethods = this.initializeCookingMethods();
  }
  
  // ═══════════════════════════════════════════
  // WORKFLOW PRINCIPAL - 9 PAȘI OBLIGATORII
  // ═══════════════════════════════════════════
  
  initializeWorkflow() {
    return {
      steps: [
        '1_PROFILE_LOAD',        // Încarcă profiluri Ioan & Nico
        '2_INVENTORY_CHECK',     // Verifică stocuri disponibile
        '3_REQUIREMENTS_CALC',   // Calculează nevoi nutriționale
        '4_SAFETY_VALIDATION',   // Validare alergii & restricții
        '5_RECIPE_GENERATION',   // Generare rețetă optimă
        '6_NUTRIENT_ANALYSIS',   // Analiză completă nutrienți
        '7_GASTRONOMY_ENHANCE',  // Optimizare gust & compatibilitate
        '8_COOKING_OPTIMIZE',    // Adaptare pentru metoda de gătit
        '9_OUTPUT_FORMAT'        // Formatare finală standardizată
      ],
      
      mandatoryChecks: {
        noMushrooms: true,       // Alergie Nico
        antiInflammatory: true,  // Prioritate #1
        completeNutrition: true, // Toate nutrienții
        ayurvedaCompat: true,    // Compatibilitate ingrediente
        instantPotFirst: true    // Metodă preferată
      }
    };
  }
  
  // ═══════════════════════════════════════════
  // STEP 1: PROFILE MANAGEMENT
  // ═══════════════════════════════════════════
  
  loadProfiles() {
    return {
      ioan: {
        name: "Ioan",
        age: 46,
        height: 171,
        weight: 75,
        tdee: 2245,
        omadWindow: "06:00-07:00",
        activityLevel: "moderate",
        preferences: {
          spiceLevel: "medium",
          textures: "varied",
          cuisines: ["mediterranean", "asian", "romanian"]
        }
      },
      
      nico: {
        name: "Nico",
        age: 44,
        height: 141,
        weight: 54,
        tdee: 1404,
        omadWindow: "06:00-07:00",
        mobility: "limited",
        allergens: ["mushrooms", "ciuperci"],
        textureNeeds: "soft_cooked",
        preferences: {
          spiceLevel: "mild",
          textures: "soft_uniform"
        }
      },
      
      combined: {
        totalCalories: 3649,
        mealSplit: {
          ioan: "60%",  // 2189 kcal
          nico: "40%"   // 1460 kcal
        },
        sharedIngredients: true,
        cookingMethod: "instant_pot"
      }
    };
  }
  
  // ═══════════════════════════════════════════
  // STEP 2: INVENTORY INTEGRATION
  // ═══════════════════════════════════════════
  
  async checkInventory() {
    try {
      // Try to access pantry if available
      if (typeof getPantryInventory === 'function') {
        const pantryItems = getPantryInventory();
        return {
          available: pantryItems.filter(item => item.quantity > 0),
          expiringSoon: pantryItems.filter(item => {
            const daysLeft = this.getDaysUntilExpiry(item.expiryDate);
            return daysLeft <= 3 && daysLeft > 0;
          }),
          categories: this.categorizeIngredients(pantryItems)
        };
      }
    } catch (error) {
      console.log('Pantry module not available, using defaults');
    }
    
    return this.getDefaultInventory();
  }
  
  getDefaultInventory() {
    return {
      available: [
        { id: 'salmon_wild', quantity: 500, unit: 'g' },
        { id: 'lentils', quantity: 1000, unit: 'g' },
        { id: 'chickpeas', quantity: 800, unit: 'g' },
        { id: 'turmeric', quantity: 100, unit: 'g' },
        { id: 'ginger', quantity: 200, unit: 'g' },
        { id: 'garlic', quantity: 150, unit: 'g' },
        { id: 'broccoli', quantity: 300, unit: 'g' },
        { id: 'spinach', quantity: 200, unit: 'g' },
        { id: 'sweet_potato', quantity: 1000, unit: 'g' },
        { id: 'olive_oil', quantity: 500, unit: 'ml' },
        { id: 'onion', quantity: 500, unit: 'g' },
        { id: 'kale', quantity: 200, unit: 'g' }
      ],
      expiringSoon: [],
      categories: {
        proteins: ['salmon_wild', 'lentils', 'chickpeas'],
        vegetables: ['broccoli', 'spinach', 'sweet_potato', 'onion', 'kale'],
        spices: ['turmeric', 'ginger', 'garlic'],
        fats: ['olive_oil']
      }
    };
  }
  
  getDaysUntilExpiry(expiryDate) {
    if (!expiryDate) return 30;
    const today = new Date();
    const expiry = new Date(expiryDate);
    return Math.floor((expiry - today) / (1000 * 60 * 60 * 24));
  }
  
  // ═══════════════════════════════════════════
  // STEP 3: REQUIREMENTS CALCULATION
  // ═══════════════════════════════════════════
  
  calculateDailyRequirements(date = new Date()) {
    const dayOfWeek = date.getDay();
    const mtorDay = this.getMtorCycleDay(date);
    
    return {
      macros: {
        calories: { ioan: 2245, nico: 1404, total: 3649 },
        protein: { ioan: mtorDay <= 3 ? 112 : 90, nico: 65, total: mtorDay <= 3 ? 177 : 155 },
        carbs: { ioan: 225, nico: 140, total: 365, fiber: { ioan: 38, nico: 25, total: 63 } },
        fats: { ioan: 87, nico: 54, total: 141, omega3: 3.8, omega6_limit: 15.2 }
      },
      
      criticalDaily: {
        vitamin_c: { ioan: 90, nico: 75 },
        magnesium: { ioan: 420, nico: 360 },
        potassium: { ioan: 3400, nico: 2600 },
        calcium: { ioan: 1000, nico: 1200 }
      },
      
      weeklyRotation: this.getWeeklyRotationFocus(dayOfWeek)
    };
  }
  
  getWeeklyRotationFocus(dayOfWeek) {
    const rotations = {
      0: { focus: "recovery", foods: ["berries", "nuts", "seeds"] },
      1: { focus: "high_omega3", foods: ["salmon", "sardines", "walnuts"] },
      2: { focus: "high_omega3", foods: ["salmon", "sardines", "flax"] },
      3: { focus: "iron_b12", foods: ["grass_fed_beef", "liver", "spinach"] },
      4: { focus: "iron_b12", foods: ["lentils", "pumpkin_seeds", "kale"] },
      5: { focus: "plant_diversity", foods: ["30_plants", "legumes", "herbs"] },
      6: { focus: "plant_diversity", foods: ["cruciferous", "colorful_veg"] }
    };
    
    return rotations[dayOfWeek] || rotations[0];
  }
  
  // ═══════════════════════════════════════════
  // STEP 4: SAFETY VALIDATION
  // ═══════════════════════════════════════════
  
  validateSafety(ingredients) {
    const validation = {
      passed: true,
      issues: [],
      warnings: []
    };
    
    // Check Nico allergens
    ingredients.forEach(ing => {
      const name = (ing.name || ing.id).toLowerCase();
      if (name.includes('mushroom') || name.includes('ciuperci')) {
        validation.passed = false;
        validation.issues.push(`ALLERGEN DETECTED: ${ing.name || ing.id} - Remove immediately!`);
      }
    });
    
    // Ayurveda compatibility check
    const incompatible = this.checkAyurvedaCompatibility(ingredients);
    if (incompatible.length > 0) {
      validation.warnings.push(`Ayurveda incompatibility: ${incompatible.join(', ')}`);
    }
    
    return validation;
  }
  
  // ═══════════════════════════════════════════
  // STEP 5: RECIPE GENERATION LOGIC
  // ═══════════════════════════════════════════
  
  async generateOptimalRecipe(options = {}) {
    const {
      cookingMethod = 'instant_pot',
      mealType = 'omad',
      servings = 2,
      useInventory = true
    } = options;
    
    const profiles = this.loadProfiles();
    const requirements = this.calculateDailyRequirements();
    const inventory = useInventory ? await this.checkInventory() : null;
    
    // Build recipe structure
    let recipe = {
      id: `codex_${new Date().toISOString().split('T')[0]}_${Math.random().toString(36).substr(2, 6)}`,
      name: '',
      date: new Date().toISOString(),
      cookingMethod: cookingMethod,
      servings: servings,
      ingredients: [],
      nutrition: {},
      dzr: { ioan: {}, nico: {} },
      instructions: { prep: [], cooking: [], timing: {} },
      safety: {}
    };
    
    // Execute workflow
    recipe.ingredients = this.selectOptimalIngredients(requirements, inventory, cookingMethod);
    recipe.ingredients = this.calculateExactPortions(recipe.ingredients, requirements);
    recipe.nutrition = this.analyzeNutrition(recipe.ingredients);
    recipe.dzr = this.calculateDZRForBoth(recipe.nutrition);
    recipe.safety = this.validateSafety(recipe.ingredients);
    recipe = this.enhanceWithGastronomy(recipe);
    recipe.instructions = this.optimizeCooking(recipe, cookingMethod);
    recipe.name = this.generateRecipeName(recipe);
    
    return recipe;
  }
  
  // ═══════════════════════════════════════════
  // INGREDIENT SELECTION ALGORITHM
  // ═══════════════════════════════════════════
  
  selectOptimalIngredients(requirements, inventory, method) {
    const selected = [];
    const mtorDay = this.getMtorCycleDay(new Date());
    
    // 1. PROTEIN BASE (varies by mTOR)
    if (mtorDay <= 3 || (mtorDay >= 8 && mtorDay <= 10)) {
      selected.push(
        { id: 'salmon_wild', amount: 150, role: 'protein_primary' },
        { id: 'lentils', amount: 60, role: 'protein_secondary' }
      );
    } else {
      selected.push(
        { id: 'lentils', amount: 100, role: 'protein_primary' },
        { id: 'chickpeas', amount: 80, role: 'protein_secondary' }
      );
    }
    
    // 2. ANTI-INFLAMMATORY BASE (mandatory)
    selected.push(
      { id: 'turmeric', amount: 5, role: 'anti_inflammatory' },
      { id: 'ginger', amount: 10, role: 'anti_inflammatory' },
      { id: 'garlic', amount: 12, role: 'anti_inflammatory' }
    );
    
    // 3. VEGETABLE DIVERSITY
    selected.push(
      { id: 'broccoli', amount: 80, role: 'vegetable', color: 'green' },
      { id: 'sweet_potato', amount: 200, role: 'complex_carb', color: 'orange' },
      { id: 'spinach', amount: 50, role: 'vegetable', color: 'dark_green' },
      { id: 'onion', amount: 50, role: 'vegetable', color: 'white' }
    );
    
    // 4. HEALTHY FATS
    selected.push({ id: 'olive_oil', amount: 30, role: 'healthy_fat' });
    
    // 5. CALCIUM for Nico
    selected.push({ id: 'kale', amount: 100, role: 'calcium_rich' });
    
    return selected;
  }
  
  calculateExactPortions(ingredients, requirements) {
    return ingredients.map(ing => ({
      ...ing,
      amountForIoan: Math.round(ing.amount * 0.6),
      amountForNico: Math.round(ing.amount * 0.4)
    }));
  }
  
  analyzeNutrition(ingredients) {
    const nutrition = {
      calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0,
      omega3: 0, omega6: 0, vitamins: {}, minerals: {}
    };
    
    ingredients.forEach(ing => {
      const data = CODEX_INGREDIENTS[ing.id];
      if (data && data.nutrition_per_100g) {
        const multiplier = ing.amount / 100;
        const nutri = data.nutrition_per_100g;
        
        nutrition.calories += (nutri.calories || 0) * multiplier;
        nutrition.protein += (nutri.protein || 0) * multiplier;
        nutrition.carbs += (nutri.carbs || 0) * multiplier;
        nutrition.fat += (nutri.fat || 0) * multiplier;
        nutrition.fiber += (nutri.fiber || 0) * multiplier;
        
        // Add vitamins and minerals
        Object.keys(nutri).forEach(key => {
          if (key.startsWith('vitamin_') || ['calcium', 'magnesium', 'iron'].includes(key)) {
            nutrition.vitamins[key] = (nutrition.vitamins[key] || 0) + (nutri[key] || 0) * multiplier;
          }
        });
      }
    });
    
    return nutrition;
  }
  
  calculateDZRForBoth(nutrition) {
    const ioanDZR = NUTRITIONAL_REQUIREMENTS.calculateDZR(nutrition, 'ioan');
    const nicoDZR = NUTRITIONAL_REQUIREMENTS.calculateDZR(nutrition, 'nico');
    
    return { ioan: ioanDZR, nico: nicoDZR };
  }
  
  enhanceWithGastronomy(recipe) {
    // Add flavor enhancers
    recipe.ingredients.push(
      { id: 'lemon_juice', amount: 15, role: 'brightness', timing: 'end' },
      { id: 'parsley_fresh', amount: 10, role: 'garnish', timing: 'end' }
    );
    
    return recipe;
  }
  
  // ═══════════════════════════════════════════
  // COOKING METHODS
  // ═══════════════════════════════════════════
  
  initializeCookingMethods() {
    return {
      instant_pot: {
        name: "Instant Pot Pressure Cooking",
        timings: {
          lentils_red: 6, lentils_green: 12, chickpeas_soaked: 12,
          salmon_fillet: 3, sweet_potato_cubed: 4,
          broccoli: 0, spinach: 0, kale: 2
        }
      }
    };
  }
  
  optimizeCooking(recipe, method) {
    const instructions = {
      prep: [
        "Tăiere legume în bucăți uniforme",
        "Preparare condimente și aromats",
        "Măsurare exactă cantități"
      ],
      cooking: [
        "1. Încălzire ulei în Instant Pot (SAUTÉ mode)",
        "2. Adăugare aromats (ceapă, usturoi, ghimbir) - 2-3 min",
        "3. Adăugare condimente (turmeric, piper) - 30 sec",
        "4. Adăugare proteină principală și lichid",
        "5. Adăugare legume în straturi",
        "6. PRESSURE COOK HIGH - timpul calculat",
        "7. Natural release 5-10 min, apoi quick release",
        "8. Adăugare verdețuri proaspete și zeamă de lămâie"
      ],
      timing: { prep: 15, cooking: 25, total: 40 }
    };
    
    return instructions;
  }
  
  // ═══════════════════════════════════════════
  // GASTRONOMY SOURCES
  // ═══════════════════════════════════════════
  
  loadGastronomicSources() {
    return {
      authorized: [
        {
          name: "Larousse Gastronomique",
          edition: 2024,
          isbn: "978-0-600-63587-1",
          focus: "French culinary techniques"
        },
        {
          name: "The Professional Chef (CIA)",
          edition: "10th",
          isbn: "978-1-119-70745-7", 
          focus: "Professional cooking methods"
        }
      ]
    };
  }
  
  // ═══════════════════════════════════════════
  // OUTPUT FORMATTING
  // ═══════════════════════════════════════════
  
  formatOutput(recipe) {
    return {
      header: {
        id: recipe.id,
        name: recipe.name,
        date: recipe.date,
        method: recipe.cookingMethod,
        totalTime: recipe.instructions.timing.total,
        servings: recipe.servings
      },
      
      ingredients: this.formatIngredientsTable(recipe.ingredients),
      instructions: recipe.instructions,
      nutrition: recipe.nutrition,
      
      dzr: {
        ioan: this.formatDZRTable(recipe.dzr.ioan, 'Ioan'),
        nico: this.formatDZRTable(recipe.dzr.nico, 'Nico')
      },
      
      analysis: {
        safety: recipe.safety,
        deficits: this.identifyDeficits(recipe.dzr),
        recommendations: this.generateRecommendations(recipe)
      }
    };
  }
  
  formatIngredientsTable(ingredients) {
    const table = {
      headers: ['Ingredient', 'Cantitate Totală', 'Pentru Ioan', 'Pentru Nico', 'Rol'],
      rows: []
    };
    
    ingredients.forEach(ing => {
      const data = CODEX_INGREDIENTS[ing.id];
      table.rows.push([
        data?.name || ing.id,
        `${ing.amount}g`,
        `${ing.amountForIoan || Math.round(ing.amount * 0.6)}g`,
        `${ing.amountForNico || Math.round(ing.amount * 0.4)}g`,
        this.translateRole(ing.role)
      ]);
    });
    
    return table;
  }
  
  formatDZRTable(dzrData, personName) {
    if (!dzrData || !dzrData.vitamins) return { rows: [] };
    
    const rows = [];
    
    // Add macros
    if (dzrData.macros?.protein) {
      rows.push({
        nutrient: 'Protein',
        actual: dzrData.macros.protein.actual?.toFixed(1) || '0',
        target: dzrData.macros.protein.target || '0',
        dzr: dzrData.macros.protein.dzr_percent?.toFixed(0) || '0',
        status: this.getDZRStatus(dzrData.macros.protein.dzr_percent || 0),
        emoji: this.getDZREmoji(dzrData.macros.protein.dzr_percent || 0)
      });
    }
    
    // Add vitamins
    Object.entries(dzrData.vitamins || {}).slice(0, 5).forEach(([vitamin, data]) => {
      rows.push({
        nutrient: this.formatNutrientName(vitamin),
        actual: data.actual?.toFixed(1) || '0',
        target: data.target || '0',
        dzr: data.dzr_percent?.toFixed(0) || '0',
        status: this.getDZRStatus(data.dzr_percent || 0),
        emoji: this.getDZREmoji(data.dzr_percent || 0)
      });
    });
    
    return { rows };
  }
  
  // ═══════════════════════════════════════════
  // HELPER FUNCTIONS
  // ═══════════════════════════════════════════
  
  getMtorCycleDay(date) {
    const startDate = new Date('2025-01-01');
    const daysDiff = Math.floor((date - startDate) / (1000 * 60 * 60 * 24));
    return (daysDiff % 14) + 1;
  }
  
  checkAyurvedaCompatibility(ingredients) {
    const incompatible = [];
    const hasMilk = ingredients.some(i => (i.id || '').includes('milk'));
    const hasFish = ingredients.some(i => (i.id || '').includes('salmon'));
    if (hasMilk && hasFish) {
      incompatible.push('Milk + Fish (Ayurveda incompatible)');
    }
    return incompatible;
  }
  
  generateRecipeName(recipe) {
    const mainProteins = recipe.ingredients
      .filter(ing => ing.role && ing.role.includes('protein'))
      .map(ing => CODEX_INGREDIENTS[ing.id]?.name || ing.id)
      .slice(0, 2);
      
    const method = recipe.cookingMethod === 'instant_pot' ? 'Instant Pot' : 'Gătit';
    
    if (mainProteins.length > 0) {
      return `${method} ${mainProteins.join(' & ')} Anti-Inflamator`;
    }
    
    return `${method} Bowl Anti-Inflamator OMAD`;
  }
  
  translateRole(role) {
    const translations = {
      'protein_primary': 'Proteină Principală',
      'protein_secondary': 'Proteină Secundară',
      'anti_inflammatory': 'Anti-Inflamator',
      'vegetable': 'Legumă',
      'healthy_fat': 'Grăsime Sănătoasă',
      'complex_carb': 'Carbohidrați Complecși',
      'calcium_rich': 'Bogat în Calciu',
      'garnish': 'Garnisire',
      'brightness': 'Prospețime'
    };
    return translations[role] || role;
  }
  
  getDZRStatus(percent) {
    if (percent < 50) return 'critical';
    if (percent < 70) return 'moderate';
    if (percent < 90) return 'slight';
    if (percent <= 110) return 'optimal';
    return 'excess';
  }
  
  getDZREmoji(percent) {
    if (percent < 50) return '🔴';
    if (percent < 70) return '🟠';
    if (percent < 90) return '🟡';
    if (percent <= 110) return '🟢';
    return '🔵';
  }
  
  formatNutrientName(name) {
    return name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }
  
  identifyDeficits(dzrData) {
    const deficits = [];
    ['ioan', 'nico'].forEach(person => {
      const data = dzrData[person];
      if (data?.alerts?.critical_deficits) {
        data.alerts.critical_deficits.forEach(deficit => {
          deficits.push({
            person: person,
            nutrient: deficit.nutrient,
            suggestion: `Add ${deficit.nutrient}-rich foods`
          });
        });
      }
    });
    return deficits;
  }
  
  generateRecommendations(recipe) {
    const recommendations = [];
    
    if (recipe.safety?.passed) {
      recommendations.push("✅ Rețeta este sigură pentru ambele persoane");
    }
    
    if (recipe.dzr) {
      const ioanDeficits = recipe.dzr.ioan?.alerts?.critical_deficits?.length || 0;
      const nicoDeficits = recipe.dzr.nico?.alerts?.critical_deficits?.length || 0;
      
      if (ioanDeficits > 0) {
        recommendations.push(`Ioan: ${ioanDeficits} nutrienți de completat în următoarele zile`);
      }
      
      if (nicoDeficits > 0) {
        recommendations.push(`Nico: ${nicoDeficits} nutrienți de completat în următoarele zile`);
      }
    }
    
    return recommendations;
  }
}

// Singleton instance
export const codexEngine = new CodexEngine();

// Public API
export default {
  generateRecipe: async (options) => codexEngine.generateOptimalRecipe(options),
  validateRecipe: (recipe) => codexEngine.validateSafety(recipe.ingredients),
  analyzeNutrition: (ingredients) => codexEngine.analyzeNutrition(ingredients),
  formatOutput: (recipe) => codexEngine.formatOutput(recipe)
};