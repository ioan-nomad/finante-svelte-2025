/**
 * NUTRITION ANALYZER v2.0
 * Advanced nutritional deficiency analysis and tracking
 * Integrates with meal history, biomarkers, and OMAD optimization
 */

export class NutritionAnalyzer {
    constructor() {
        // OMAD optimized daily targets (higher than standard RDA for single-meal intake)
        this.dailyTargets = {
            // Macronutrients
            protein: 100,      // g - Higher for OMAD protein synthesis
            carbs: 150,        // g - Controlled for metabolic health
            fat: 80,           // g - Essential fatty acids
            fiber: 35,         // g - Gut health and satiety
            
            // Critical vitamins
            vitamin_c: 200,    // mg - Antioxidant protection
            vitamin_k: 150,    // mcg - Bone and cardiovascular health
            vitamin_d: 50,     // mcg - Immune and bone health
            folate: 500,       // mcg - Cellular function
            vitamin_b12: 6,    // mcg - Nervous system
            vitamin_e: 20,     // mg - Antioxidant
            
            // Essential minerals
            iron: 20,          // mg - Oxygen transport
            calcium: 1200,     // mg - Bone health
            magnesium: 450,    // mg - Muscle and nerve function
            zinc: 15,          // mg - Immune function
            potassium: 4000,   // mg - Heart and muscle function
            selenium: 70,      // mcg - Antioxidant enzyme function
            
            // Specialized compounds
            omega3: 2.0,       // g - Anti-inflammatory
            antioxidants: 150, // ORAC units - Cellular protection
            polyphenols: 100   // mg - Anti-aging compounds
        };

        // Deficiency severity thresholds
        this.severityLevels = {
            critical: 0.5,    // <50% of target
            moderate: 0.25,   // 50-75% of target
            mild: 0.1,        // 75-90% of target
            adequate: 0       // >90% of target
        };

        // Biomarker targets for optimal health
        this.biomarkerTargets = {
            'IGF-1': { min: 80, max: 120, unit: 'ng/mL', category: 'longevity' },
            'hs-CRP': { min: 0, max: 1.0, unit: 'mg/L', category: 'inflammation' },
            'HbA1c': { min: 4.5, max: 5.5, unit: '%', category: 'metabolic' },
            'HDL': { min: 60, max: 100, unit: 'mg/dL', category: 'cardiovascular' },
            'LDL': { min: 70, max: 100, unit: 'mg/dL', category: 'cardiovascular' },
            'triglycerides': { min: 50, max: 100, unit: 'mg/dL', category: 'metabolic' },
            'vitamin_d_blood': { min: 40, max: 60, unit: 'ng/mL', category: 'hormonal' },
            'b12_blood': { min: 400, max: 900, unit: 'pg/mL', category: 'neurological' }
        };
    }

    /**
     * Comprehensive nutritional analysis
     * @param {Object} nutritionProfile - Current nutrition tracking data
     * @param {Array} recentMeals - Recent meal history (7-14 days)
     * @param {Object} biomarkers - Current biomarker values
     * @returns {Object} Complete nutritional analysis
     */
    analyzeNutritionalStatus(nutritionProfile, recentMeals = [], biomarkers = {}) {
        const analysis = {
            timestamp: new Date().toISOString(),
            period: '7_day_average',
            
            // Core analysis
            macronutrients: this.analyzeMacronutrients(recentMeals),
            micronutrients: this.analyzeMicronutrients(recentMeals),
            deficiencies: this.identifyDeficiencies(recentMeals),
            
            // Advanced analysis
            biomarkerAnalysis: this.analyzeBiomarkers(biomarkers),
            inflammatoryStatus: this.assessInflammatoryStatus(recentMeals, biomarkers),
            longevityFactors: this.assessLongevityFactors(recentMeals, biomarkers),
            
            // Recommendations
            priorityActions: this.generatePriorityActions(recentMeals, biomarkers),
            recipeTargeting: this.generateRecipeTargeting(recentMeals),
            supplementRecommendations: this.generateSupplementRecommendations(recentMeals, biomarkers),
            
            // Scores
            overallScore: 0,
            categoryScores: {},
            
            // Trends
            trends: this.analyzeTrends(nutritionProfile.mealHistory || [])
        };

        // Calculate overall score
        analysis.overallScore = this.calculateOverallScore(analysis);
        
        return analysis;
    }

    /**
     * Analyze macronutrient intake
     */
    analyzeMacronutrients(recentMeals) {
        const totals = this.calculateNutrientTotals(recentMeals);
        const dailyAverage = this.calculateDailyAverage(totals, recentMeals.length);

        return {
            protein: {
                current: dailyAverage.protein || 0,
                target: this.dailyTargets.protein,
                percentage: ((dailyAverage.protein || 0) / this.dailyTargets.protein) * 100,
                status: this.getStatus(dailyAverage.protein || 0, this.dailyTargets.protein),
                recommendation: this.getProteinRecommendation(dailyAverage.protein || 0)
            },
            carbs: {
                current: dailyAverage.carbs || 0,
                target: this.dailyTargets.carbs,
                percentage: ((dailyAverage.carbs || 0) / this.dailyTargets.carbs) * 100,
                status: this.getStatus(dailyAverage.carbs || 0, this.dailyTargets.carbs),
                recommendation: this.getCarbRecommendation(dailyAverage.carbs || 0)
            },
            fat: {
                current: dailyAverage.fat || 0,
                target: this.dailyTargets.fat,
                percentage: ((dailyAverage.fat || 0) / this.dailyTargets.fat) * 100,
                status: this.getStatus(dailyAverage.fat || 0, this.dailyTargets.fat),
                recommendation: this.getFatRecommendation(dailyAverage.fat || 0)
            },
            fiber: {
                current: dailyAverage.fiber || 0,
                target: this.dailyTargets.fiber,
                percentage: ((dailyAverage.fiber || 0) / this.dailyTargets.fiber) * 100,
                status: this.getStatus(dailyAverage.fiber || 0, this.dailyTargets.fiber),
                recommendation: this.getFiberRecommendation(dailyAverage.fiber || 0)
            }
        };
    }

    /**
     * Analyze micronutrient intake
     */
    analyzeMicronutrients(recentMeals) {
        const totals = this.calculateNutrientTotals(recentMeals);
        const dailyAverage = this.calculateDailyAverage(totals, recentMeals.length);
        const micronutrients = {};

        const microKeys = [
            'vitamin_c', 'vitamin_k', 'vitamin_d', 'folate', 'vitamin_b12', 'vitamin_e',
            'iron', 'calcium', 'magnesium', 'zinc', 'potassium', 'selenium'
        ];

        microKeys.forEach(nutrient => {
            const current = dailyAverage[nutrient] || 0;
            const target = this.dailyTargets[nutrient];
            
            micronutrients[nutrient] = {
                current: Math.round(current * 100) / 100,
                target: target,
                percentage: Math.round((current / target) * 100),
                status: this.getStatus(current, target),
                deficitAmount: Math.max(0, target - current),
                priority: this.getDeficiencyPriority(current, target)
            };
        });

        return micronutrients;
    }

    /**
     * Identify nutritional deficiencies with priorities
     */
    identifyDeficiencies(recentMeals) {
        const micronutrients = this.analyzeMicronutrients(recentMeals);
        const deficiencies = [];

        Object.entries(micronutrients).forEach(([nutrient, data]) => {
            if (data.status === 'critical' || data.status === 'moderate') {
                deficiencies.push({
                    nutrient: nutrient,
                    severity: data.status,
                    deficitPercent: (data.target - data.current) / data.target,
                    deficitAmount: data.deficitAmount,
                    priority: data.priority,
                    healthImpact: this.getHealthImpact(nutrient, data.severity),
                    foodSources: this.getTopFoodSources(nutrient),
                    biomarkerConnection: this.getBiomarkerConnection(nutrient)
                });
            }
        });

        return deficiencies.sort((a, b) => {
            // Sort by priority (critical first), then by deficit percentage
            if (a.priority !== b.priority) {
                return a.priority === 'high' ? -1 : 1;
            }
            return b.deficitPercent - a.deficitPercent;
        });
    }

    /**
     * Generate recipe targeting recommendations
     */
    generateRecipeTargeting(recentMeals) {
        const deficiencies = this.identifyDeficiencies(recentMeals);
        const targeting = {
            primaryTargets: [],
            secondaryTargets: [],
            avoidanceFactors: [],
            cookingMethods: [],
            ingredientPriorities: {}
        };

        // Primary targets (critical deficiencies)
        const criticalDeficiencies = deficiencies.filter(d => d.severity === 'critical').slice(0, 3);
        targeting.primaryTargets = criticalDeficiencies.map(d => ({
            nutrient: d.nutrient,
            targetIncrease: Math.round(d.deficitAmount),
            topSources: d.foodSources.slice(0, 5),
            cookingTips: this.getCookingTips(d.nutrient)
        }));

        // Secondary targets (moderate deficiencies)
        const moderateDeficiencies = deficiencies.filter(d => d.severity === 'moderate').slice(0, 2);
        targeting.secondaryTargets = moderateDeficiencies.map(d => ({
            nutrient: d.nutrient,
            targetIncrease: Math.round(d.deficitAmount),
            topSources: d.foodSources.slice(0, 3)
        }));

        // Cooking method recommendations
        targeting.cookingMethods = this.recommendCookingMethods(deficiencies);

        return targeting;
    }

    /**
     * Calculate nutrient totals from recent meals
     */
    calculateNutrientTotals(recentMeals) {
        const totals = {};
        
        recentMeals.forEach(meal => {
            if (meal.nutrition) {
                Object.entries(meal.nutrition).forEach(([nutrient, value]) => {
                    totals[nutrient] = (totals[nutrient] || 0) + (value || 0);
                });
            }
        });

        return totals;
    }

    /**
     * Calculate daily average from totals
     */
    calculateDailyAverage(totals, mealCount) {
        const dailyAverage = {};
        const days = Math.max(1, Math.ceil(mealCount / 1)); // OMAD = 1 meal per day

        Object.entries(totals).forEach(([nutrient, total]) => {
            dailyAverage[nutrient] = total / days;
        });

        return dailyAverage;
    }

    /**
     * Get status based on current vs target
     */
    getStatus(current, target) {
        const percentage = current / target;
        
        if (percentage < this.severityLevels.critical) return 'critical';
        if (percentage < this.severityLevels.moderate) return 'moderate';
        if (percentage < this.severityLevels.mild) return 'mild';
        return 'adequate';
    }

    /**
     * Get deficiency priority
     */
    getDeficiencyPriority(current, target) {
        const ratio = current / target;
        if (ratio < 0.3) return 'high';
        if (ratio < 0.6) return 'medium';
        return 'low';
    }

    /**
     * Get health impact description
     */
    getHealthImpact(nutrient, severity) {
        const impacts = {
            vitamin_c: 'Immune system, collagen synthesis, antioxidant protection',
            vitamin_k: 'Bone health, cardiovascular health, blood clotting',
            iron: 'Oxygen transport, energy production, cognitive function',
            folate: 'DNA synthesis, red blood cell formation, neural development',
            magnesium: 'Muscle function, nerve transmission, bone health',
            calcium: 'Bone strength, muscle contraction, nerve signaling',
            potassium: 'Heart rhythm, muscle function, blood pressure regulation',
            fiber: 'Gut health, cholesterol management, blood sugar control'
        };

        return impacts[nutrient] || 'General metabolic function';
    }

    /**
     * Get top food sources for nutrient
     */
    getTopFoodSources(nutrient) {
        const sources = {
            vitamin_c: ['Ardei roșu', 'Broccoli', 'Kiwi', 'Portocale', 'Căpșuni'],
            vitamin_k: ['Spanac', 'Kale', 'Broccoli', 'Varză de Bruxelles', 'Pătrunjel'],
            iron: ['Ficatul', 'Spanac', 'Linte', 'Carne roșie', 'Semințe de dovleac'],
            folate: ['Spanac', 'Sparanghel', 'Linte', 'Avocado', 'Broccoli'],
            magnesium: ['Migdale', 'Spanac', 'Quinoa', 'Ciocolată neagră', 'Avocado'],
            calcium: ['Brânză', 'Iaurt', 'Sardine', 'Migdale', 'Broccoli'],
            potassium: ['Banane', 'Cartofi dulci', 'Spanac', 'Avocado', 'Somon'],
            fiber: ['Linte', 'Mere cu coaja', 'Quinoa', 'Broccoli', 'Ovăz']
        };

        return sources[nutrient] || ['Alimente variate și echilibrate'];
    }

    /**
     * Get biomarker connection for nutrient
     */
    getBiomarkerConnection(nutrient) {
        const connections = {
            vitamin_d: 'vitamin_d_blood',
            vitamin_b12: 'b12_blood',
            iron: 'Ferritină, Hemoglobină',
            calcium: 'PTH, Vitamina D',
            magnesium: 'Magneziu seric',
            omega3: 'hs-CRP, Trigliceride'
        };

        return connections[nutrient] || null;
    }

    /**
     * Get cooking tips for nutrient retention
     */
    getCookingTips(nutrient) {
        const tips = {
            vitamin_c: 'Gătire minimă, abur, consumare crudă când e posibil',
            vitamin_k: 'Gătire ușoară cu grăsimi pentru absorbție',
            iron: 'Combină cu vitamina C, evită ceaiul/cafeaua la masă',
            folate: 'Abur scurt, evită fierberea prelungită',
            magnesium: 'Păstrează apa de gătit, gătire în Instant Pot'
        };

        return tips[nutrient] || 'Gătire blândă pentru păstrarea nutrienților';
    }

    /**
     * Recommend cooking methods based on deficiencies
     */
    recommendCookingMethods(deficiencies) {
        const methods = [];
        
        if (deficiencies.some(d => d.nutrient === 'vitamin_c')) {
            methods.push('🥗 Salate crude pentru vitamina C maximă');
        }
        
        if (deficiencies.some(d => ['vitamin_k', 'iron'].includes(d.nutrient))) {
            methods.push('⚡ Instant Pot - păstrează nutrienții în vapori');
        }
        
        if (deficiencies.some(d => d.nutrient === 'magnesium')) {
            methods.push('🍲 Fiertură scurtă - păstrează mineralele');
        }

        methods.push('🧄 Condimente proaspete - antioxidanți suplimentari');
        
        return methods;
    }

    /**
     * Calculate overall nutrition score
     */
    calculateOverallScore(analysis) {
        let score = 100;
        
        // Deduct points for deficiencies
        analysis.deficiencies.forEach(def => {
            if (def.severity === 'critical') score -= 15;
            else if (def.severity === 'moderate') score -= 8;
            else if (def.severity === 'mild') score -= 3;
        });

        return Math.max(0, Math.round(score));
    }

    /**
     * Generate priority actions
     */
    generatePriorityActions(recentMeals, biomarkers) {
        const deficiencies = this.identifyDeficiencies(recentMeals);
        const actions = [];

        // Top 3 nutritional priorities
        deficiencies.slice(0, 3).forEach((def, index) => {
            actions.push({
                priority: index + 1,
                action: `Crește ${this.getNutrientDisplayName(def.nutrient)}`,
                target: `+${Math.round(def.deficitAmount)}${this.getNutrientUnit(def.nutrient)}`,
                foods: def.foodSources.slice(0, 3),
                cookingTip: this.getCookingTips(def.nutrient)
            });
        });

        return actions;
    }

    /**
     * Get nutrient display name in Romanian
     */
    getNutrientDisplayName(nutrient) {
        const names = {
            vitamin_c: 'Vitamina C',
            vitamin_k: 'Vitamina K',
            iron: 'Fierul',
            folate: 'Folatul',
            magnesium: 'Magneziul',
            calcium: 'Calciul',
            potassium: 'Potasiul',
            fiber: 'Fibra'
        };
        return names[nutrient] || nutrient;
    }

    /**
     * Get nutrient unit
     */
    getNutrientUnit(nutrient) {
        const units = {
            protein: 'g', carbs: 'g', fat: 'g', fiber: 'g',
            vitamin_c: 'mg', vitamin_k: 'mcg', folate: 'mcg',
            iron: 'mg', calcium: 'mg', magnesium: 'mg', 
            potassium: 'mg', zinc: 'mg'
        };
        return units[nutrient] || 'mg';
    }

    /**
     * Analyze trends in nutrition data
     */
    analyzeTrends(mealHistory) {
        if (mealHistory.length < 7) {
            return { insufficient_data: true };
        }

        // Analyze last 7 vs previous 7 days
        const recent = mealHistory.slice(-7);
        const previous = mealHistory.slice(-14, -7);

        const recentAvg = this.calculateDailyAverage(this.calculateNutrientTotals(recent), 7);
        const previousAvg = this.calculateDailyAverage(this.calculateNutrientTotals(previous), 7);

        const trends = {};
        Object.keys(this.dailyTargets).forEach(nutrient => {
            const recentVal = recentAvg[nutrient] || 0;
            const previousVal = previousAvg[nutrient] || 0;
            
            if (previousVal > 0) {
                const change = ((recentVal - previousVal) / previousVal) * 100;
                trends[nutrient] = {
                    change: Math.round(change),
                    direction: change > 5 ? 'improving' : change < -5 ? 'declining' : 'stable',
                    recent: Math.round(recentVal),
                    previous: Math.round(previousVal)
                };
            }
        });

        return trends;
    }
}

export default NutritionAnalyzer;