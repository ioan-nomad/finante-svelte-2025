/**
 * CODEX N-OMAD v3.0 - Advanced Cooking Methods
 * Optimized for Nutrient Retention, OMAD Satiety, and Ayurvedic Principles
 * Primary Focus: Instant Pot, Induction, Oven Methods
 */

export const COOKING_METHODS = {
    instant_pot: {
        name: "Instant Pot",
        nameRo: "Instant Pot",
        priority: 1, // Highest priority for nutrient retention
        nutrientRetention: 85, // Percentage
        evidence: "PMID_31813824", // Pressure cooking research
        
        profiles: {
            optimal: ["vegetables", "legumes", "grains", "fish", "soups"],
            good: ["meat", "poultry", "dairy_dishes"],
            avoid: ["leafy_greens_long_cooking", "delicate_herbs"]
        },

        ayurvedicBenefits: {
            vata: "Excellent - creates warm, moist, easily digestible food",
            pitta: "Good - moderate heat, no burning",
            kapha: "Good - warm food aids digestion"
        },

        omadBenefits: [
            "Nutrient density preservation",
            "Enhanced bioavailability", 
            "Optimal texture for satiety",
            "Time efficiency for meal prep"
        ],

        methods: {
            pressure_steam: {
                description: "Steam vegetables and fish for maximum nutrition",
                technique: "Use trivet, minimal water, natural pressure release",
                timeRange: "2-8 minutes",
                bestFor: ["broccoli", "carrots", "fish_fillets", "potatoes"],
                nutrientBenefit: "Preserves water-soluble vitamins",
                instructions: [
                    "Add 1 cup water to pot",
                    "Place trivet inside",
                    "Arrange food in steam basket", 
                    "Seal and cook under pressure",
                    "Natural pressure release for delicate foods"
                ]
            },
            
            pressure_sauté_steam: {
                description: "Sauté then pressure cook for complex dishes", 
                technique: "Brown ingredients, add liquid, pressure cook",
                timeRange: "5-45 minutes total",
                bestFor: ["bean_dishes", "grain_pilafs", "stews", "mixed_vegetables"],
                nutrientBenefit: "Enhanced flavor + retained nutrition",
                instructions: [
                    "Use sauté function with oil",
                    "Brown aromatics (onions, garlic)", 
                    "Add main ingredients and liquid",
                    "Pressure cook according to ingredient needs",
                    "Quick or natural release based on contents"
                ]
            },

            pressure_dal_style: {
                description: "Perfect for lentils and split legumes",
                technique: "1:3 ratio legumes to liquid, turmeric addition",
                timeRange: "8-15 minutes",
                bestFor: ["red_lentils", "split_peas", "moong_dal", "masoor_dal"],
                nutrientBenefit: "Complete protein activation, enhanced absorption",
                instructions: [
                    "Rinse legumes until water runs clear",
                    "Add 3 cups liquid per 1 cup legumes",
                    "Add turmeric and minimal salt",
                    "Pressure cook 8-15 min based on legume type",
                    "Natural release, stir, season after cooking"
                ]
            },

            pressure_bone_broth: {
                description: "Extract maximum nutrients from bones", 
                technique: "Long pressure cooking with acid addition",
                timeRange: "90-180 minutes",
                bestFor: ["beef_bones", "chicken_bones", "fish_bones"],
                nutrientBenefit: "Collagen, minerals, amino acids",
                instructions: [
                    "Roast bones first (optional)",
                    "Add bones, water, 2 tbsp apple cider vinegar",
                    "Pressure cook 90-180 minutes", 
                    "Natural release, strain, cool rapidly"
                ]
            }
        },

        troubleshooting: {
            mushy_vegetables: "Reduce cooking time, use quick release",
            tough_legumes: "Soak longer, check altitude adjustments",
            bland_flavor: "Sauté aromatics first, season after cooking",
            burnt_bottom: "Use enough liquid, avoid dairy until end"
        },

        timeChart: {
            // Vegetables (minutes under pressure)
            "broccoli": 2,
            "carrots_whole": 4,
            "carrots_chopped": 2,
            "potatoes_whole": 12,
            "potatoes_cubed": 4,
            "beets_whole": 15,
            "sweet_potatoes": 8,
            "cabbage_wedges": 3,
            
            // Legumes (soaked overnight)
            "chickpeas": 15,
            "white_beans": 8,
            "red_lentils": 2,
            "green_lentils": 8,
            
            // Grains  
            "brown_rice": 12,
            "quinoa": 1,
            "steel_cut_oats": 4,
            
            // Proteins
            "salmon_fillet": 3,
            "chicken_breast": 8,
            "beef_stew": 35
        }
    },

    induction: {
        name: "Induction Cooking",
        nameRo: "Gătit pe Inducție", 
        priority: 2,
        nutrientRetention: 75,
        evidence: "Precise temperature control preserves vitamins",

        profiles: {
            optimal: ["stir_fries", "quick_sears", "precise_sauces"],
            good: ["soups", "sautéed_vegetables", "grains"],
            avoid: ["long_slow_cooking", "uneven_heat_needs"]
        },

        ayurvedicBenefits: {
            vata: "Good - quick cooking maintains prana",
            pitta: "Excellent - precise temperature control",
            kapha: "Good - can create light, easy-to-digest food"
        },

        omadBenefits: [
            "Precise temperature control",
            "Energy efficient", 
            "Quick cooking preserves nutrients",
            "Easy cleanup"
        ],

        methods: {
            high_heat_sear: {
                description: "Quick sear for proteins and vegetables",
                technique: "High heat, minimal oil, quick cooking", 
                temperatureRange: "200-240°C",
                bestFor: ["fish", "chicken", "bell_peppers", "zucchini"],
                nutrientBenefit: "Minimal cooking time preserves vitamins",
                instructions: [
                    "Preheat pan to medium-high",
                    "Add minimal oil",
                    "Sear protein/vegetables quickly",
                    "Don't overcrowd pan",
                    "Rest before serving"
                ]
            },

            gentle_sauté: {
                description: "Low-medium heat for aromatics and tender vegetables",
                technique: "Controlled heat, frequent stirring",
                temperatureRange: "120-160°C", 
                bestFor: ["onions", "garlic", "mushrooms", "leafy_greens"],
                nutrientBenefit: "Preserves delicate compounds",
                instructions: [
                    "Heat pan to medium-low",
                    "Add oil when pan is warm",
                    "Add ingredients in order of cooking time",
                    "Stir frequently",
                    "Adjust temperature as needed"
                ]
            },

            precise_grain_cooking: {
                description: "Perfect absorption method for grains",
                technique: "Exact ratios, temperature stepping",
                temperatureRange: "Start high, reduce to low",
                bestFor: ["rice", "quinoa", "millet", "buckwheat"],
                nutrientBenefit: "Complete starch gelatinization",
                instructions: [
                    "Rinse grains until water runs clear",
                    "Use exact grain:water ratios",
                    "Bring to boil on high heat",
                    "Reduce to lowest setting",
                    "Cover and time precisely"
                ]
            },

            sauce_reduction: {
                description: "Concentrated flavors without burning",
                technique: "Controlled evaporation",
                temperatureRange: "80-100°C",
                bestFor: ["tomato_sauce", "wine_reduction", "herb_oils"],
                nutrientBenefit: "Concentrates nutrients without destruction",
                instructions: [
                    "Start with medium heat",
                    "Reduce to low when bubbling starts",
                    "Stir occasionally",
                    "Control evaporation rate",
                    "Taste and adjust seasoning"
                ]
            }
        },

        temperatureGuide: {
            "gentle_warming": "60-80°C",
            "simmering": "85-95°C", 
            "soft_boiling": "95-100°C",
            "sautéing": "120-160°C",
            "searing": "180-220°C",
            "stir_frying": "200-240°C"
        },

        tips: {
            efficiency: "Use flat-bottom, induction-compatible cookware",
            control: "Adjust temperature gradually for best results", 
            safety: "Pan must be centered on cooking zone",
            maintenance: "Clean cooktop after each use for optimal performance"
        }
    },

    oven: {
        name: "Oven Cooking",
        nameRo: "Gătit la Cuptor",
        priority: 3,
        nutrientRetention: 70,
        evidence: "Even heat distribution, controlled environment",

        profiles: {
            optimal: ["roasted_vegetables", "baked_fish", "whole_grains", "casseroles"],
            good: ["meat", "poultry", "bread", "dried_goods"],
            avoid: ["quick_cooking_vegetables", "delicate_herbs"]
        },

        ayurvedicBenefits: {
            vata: "Excellent - warm, cooked, grounding",
            pitta: "Moderate - can create too much heat if overused", 
            kapha: "Good - dry heat aids digestion"
        },

        omadBenefits: [
            "Hands-off cooking method",
            "Even heat distribution",
            "Large batch capability", 
            "Enhanced flavors through caramelization"
        ],

        methods: {
            low_slow_roast: {
                description: "Gentle roasting for maximum tenderness",
                technique: "Low temperature, longer time",
                temperatureRange: "150-180°C",
                bestFor: ["root_vegetables", "tough_cuts", "whole_fish"],
                nutrientBenefit: "Minimal nutrient loss, enhanced flavors",
                instructions: [
                    "Preheat oven to target temperature",
                    "Season ingredients appropriately", 
                    "Use minimal liquid",
                    "Cover if needed to prevent drying",
                    "Check doneness with thermometer"
                ]
            },

            high_heat_roast: {
                description: "Caramelization and quick cooking",
                technique: "High heat, shorter time",
                temperatureRange: "200-230°C", 
                bestFor: ["brussels_sprouts", "cauliflower", "chicken_pieces"],
                nutrientBenefit: "Quick cooking preserves water-soluble vitamins",
                instructions: [
                    "Preheat oven to high temperature",
                    "Cut ingredients uniformly",
                    "Toss with oil and seasoning",
                    "Don't overcrowd pan", 
                    "Turn once if needed"
                ]
            },

            steam_baking: {
                description: "Moist heat baking with steam addition",
                technique: "Pan of water in oven for humidity",
                temperatureRange: "160-190°C",
                bestFor: ["fish_en_papillote", "vegetables_in_foil", "whole_grains"],
                nutrientBenefit: "Prevents nutrient leaching, maintains moisture",
                instructions: [
                    "Place water pan on oven bottom",
                    "Wrap or cover food to trap steam",
                    "Cook at moderate temperature",
                    "Check for doneness carefully",
                    "Rest before unwrapping"
                ]
            },

            convection_roast: {
                description: "Fan-assisted cooking for even results",
                technique: "Reduced temperature, circulating air",
                temperatureRange: "15-25°C lower than conventional",
                bestFor: ["multiple_pans", "even_browning", "dehydrating"],
                nutrientBenefit: "Even cooking prevents hot spots",
                instructions: [
                    "Reduce conventional temperature by 20°C",
                    "Reduce cooking time by 10-15%",
                    "Don't cover pans (defeats air circulation)",
                    "Rotate pans if using multiple racks",
                    "Monitor closely as cooking is faster"
                ]
            }
        },

        temperatureGuide: {
            "gentle_warming": "80-120°C",
            "slow_cooking": "150-180°C",
            "moderate_baking": "180-200°C", 
            "roasting": "200-220°C",
            "high_heat_sear": "230-250°C",
            "broiling": "260°C+"
        },

        timing: {
            // Vegetables (per kg, approximate)
            "root_vegetables": "45-60 minutes at 190°C",
            "cruciferous_vegetables": "25-35 minutes at 200°C", 
            "soft_vegetables": "15-25 minutes at 200°C",
            
            // Proteins
            "fish_fillet": "12-15 minutes per inch thickness at 190°C",
            "whole_chicken": "20 minutes per kg at 180°C",
            
            // Grains/Casseroles
            "grain_bake": "45-60 minutes at 180°C covered"
        }
    },

    // Specialized Methods for Specific OMAD Needs
    raw_preparation: {
        name: "Raw Preparation",
        nameRo: "Preparare Crudă",
        priority: 4,
        nutrientRetention: 100,
        
        profiles: {
            optimal: ["salads", "fresh_herbs", "sprouts", "fermented_foods"],
            good: ["fruits", "nuts", "seeds"],
            avoid: ["legumes", "potatoes", "tough_vegetables"]
        },

        ayurvedicBenefits: {
            vata: "Moderate - can be too cooling",
            pitta: "Excellent - cooling and fresh",
            kapha: "Poor - too cooling and heavy"
        },

        methods: {
            enzyme_activation: {
                description: "Soaking and sprouting for digestibility",
                technique: "Controlled hydration and germination",
                timeRange: "4-72 hours",
                bestFor: ["nuts", "seeds", "legumes", "grains"],
                instructions: [
                    "Rinse raw material thoroughly",
                    "Soak in filtered water 4-12 hours",
                    "Drain and rinse every 8-12 hours",
                    "Continue until sprouting begins",
                    "Rinse and store in refrigerator"
                ]
            }
        }
    }
};

// Integration Functions for CODEX Core
export const CookingMethodIntegration = {
    selectOptimalMethod(ingredients, profile, constraints = {}) {
        const { timeAvailable = 60, equipmentAvailable = ["instant_pot", "induction", "oven"] } = constraints;
        
        // Score each method based on ingredients and constraints
        const scores = {};
        
        equipmentAvailable.forEach(method => {
            const methodData = COOKING_METHODS[method];
            if (!methodData) return;
            
            let score = methodData.priority * 10; // Base priority score
            score += methodData.nutrientRetention * 0.5; // Nutrient retention bonus
            
            // Ayurvedic compatibility
            const profileDosha = profile.dosha || "vata"; // default
            const ayurvedicMatch = methodData.ayurvedicBenefits[profileDosha];
            if (ayurvedicMatch?.includes("Excellent")) score += 15;
            else if (ayurvedicMatch?.includes("Good")) score += 10;
            
            // Ingredient compatibility  
            ingredients.forEach(ingredient => {
                if (methodData.profiles.optimal.some(cat => ingredient.category === cat)) {
                    score += 5;
                } else if (methodData.profiles.avoid.some(cat => ingredient.category === cat)) {
                    score -= 10;
                }
            });
            
            scores[method] = score;
        });
        
        return Object.keys(scores).reduce((a, b) => scores[a] > scores[b] ? a : b);
    },

    generateCookingInstructions(method, ingredients, servings = 2) {
        const methodData = COOKING_METHODS[method];
        if (!methodData) return null;
        
        const instructions = {
            method: method,
            equipmentNeeded: [method],
            prepTime: this.estimatePrepTime(ingredients),
            cookTime: this.estimateCookTime(method, ingredients),
            difficulty: this.assessDifficulty(method, ingredients),
            steps: this.generateSteps(method, ingredients, servings),
            tips: methodData.troubleshooting || {},
            nutritionalBenefits: this.calculateNutritionalBenefits(method, ingredients)
        };
        
        return instructions;
    },

    estimatePrepTime(ingredients) {
        const baseTime = 10; // minutes
        const additionalTime = ingredients.length * 2;
        return Math.min(baseTime + additionalTime, 30);
    },

    estimateCookTime(method, ingredients) {
        const methodData = COOKING_METHODS[method];
        if (!methodData?.timeChart) return 30; // default
        
        let maxTime = 0;
        ingredients.forEach(ingredient => {
            const time = methodData.timeChart[ingredient.name] || methodData.timeChart[ingredient.category] || 20;
            maxTime = Math.max(maxTime, time);
        });
        
        return maxTime;
    },

    assessDifficulty(method, ingredients) {
        let difficulty = 1; // base difficulty
        
        if (method === "instant_pot") difficulty += 1;
        if (method === "induction") difficulty += 0.5;  
        if (method === "oven") difficulty += 0.5;
        
        if (ingredients.length > 8) difficulty += 1;
        if (ingredients.some(ing => ing.category === "proteins")) difficulty += 0.5;
        
        return Math.min(Math.ceil(difficulty), 5);
    },

    generateSteps(method, ingredients, servings) {
        // This would generate specific cooking steps based on method and ingredients
        // Simplified version:
        const methodData = COOKING_METHODS[method];
        const primaryMethod = Object.values(methodData.methods)[0];
        
        return primaryMethod.instructions || [
            "Prep all ingredients",
            "Follow method-specific technique", 
            "Cook according to time guidelines",
            "Check for doneness",
            "Rest and serve"
        ];
    },

    calculateNutritionalBenefits(method, ingredients) {
        const methodData = COOKING_METHODS[method];
        const retentionRate = methodData.nutrientRetention / 100;
        
        return {
            retentionRate: methodData.nutrientRetention,
            preservedNutrients: methodData.omadBenefits || [],
            ayurvedicBenefits: methodData.ayurvedicBenefits
        };
    }
};

export default {
    COOKING_METHODS,
    CookingMethodIntegration
};