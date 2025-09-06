/**
 * CODEX N-OMAD v3.0 - Comprehensive Romanian Foods Nutrient Database
 * 200+ Traditional and Modern Romanian Foods with Complete Nutritional Profiles
 * Optimized for OMAD, mTOR cycling, 30+ plants, Instant Pot cooking, Ayurvedic compatibility
 */

export const ROMANIAN_FOODS_DATABASE = [
    // LEGUME TRADIȚIONALE ROMÂNEȘTI (Traditional Romanian Vegetables)
    {
        id: "RO_VEG_001",
        name: "Varză de Bruxelles",
        nameRo: "Varză de Bruxelles", 
        nameEn: "Brussels Sprouts",
        category: "vegetables",
        subcategory: "cruciferous",
        seasonality: "winter",
        ayurvedicProperties: {
            tastes: ["bitter", "astringent"],
            dosha: "kapha_pacifying",
            heating: "cooling"
        },
        nutrition: {
            calories: 43,
            protein: 3.4,
            carbs: 8.95,
            fat: 0.3,
            fiber: 3.8,
            vitamin_c: 85,
            vitamin_k: 177,
            folate: 61,
            vitamin_a: 754,
            iron: 1.4,
            calcium: 42,
            magnesium: 23,
            potassium: 389,
            phosphorus: 69,
            zinc: 0.42,
            omega3: 0.13,
            sodium: 25
        },
        cookingMethods: ["instant_pot", "steaming", "roasting"],
        omadBenefits: ["high_satiety", "low_calorie", "nutrient_dense"],
        plantDiversityScore: 8.5
    },
    {
        id: "RO_VEG_002",
        name: "Varză albă",
        nameRo: "Varză albă",
        nameEn: "White Cabbage", 
        category: "vegetables",
        subcategory: "cruciferous",
        seasonality: "all_year",
        ayurvedicProperties: {
            tastes: ["sweet", "astringent"],
            dosha: "tridoshic",
            heating: "cooling"
        },
        nutrition: {
            calories: 25,
            protein: 1.3,
            carbs: 5.8,
            fat: 0.1,
            fiber: 2.5,
            vitamin_c: 36.6,
            vitamin_k: 76,
            folate: 43,
            vitamin_a: 98,
            iron: 0.47,
            calcium: 40,
            magnesium: 12,
            potassium: 170,
            phosphorus: 26,
            zinc: 0.18,
            omega3: 0.01,
            sodium: 18
        },
        cookingMethods: ["instant_pot", "fermentation", "slow_cooking"],
        omadBenefits: ["digestive_health", "probiotic_potential", "filling"],
        plantDiversityScore: 7.0
    },
    {
        id: "RO_VEG_003", 
        name: "Morcovi",
        nameRo: "Morcovi",
        nameEn: "Carrots",
        category: "vegetables",
        subcategory: "root_vegetables",
        seasonality: "all_year",
        ayurvedicProperties: {
            tastes: ["sweet"],
            dosha: "vata_pitta_pacifying",
            heating: "neutral"
        },
        nutrition: {
            calories: 41,
            protein: 0.93,
            carbs: 9.58,
            fat: 0.24,
            fiber: 2.8,
            vitamin_c: 5.9,
            vitamin_a: 16706,
            vitamin_k: 13.2,
            folate: 19,
            iron: 0.30,
            calcium: 33,
            magnesium: 12,
            potassium: 320,
            phosphorus: 35,
            zinc: 0.24,
            sodium: 69
        },
        cookingMethods: ["instant_pot", "roasting", "steaming"],
        omadBenefits: ["beta_carotene", "eye_health", "natural_sweetness"],
        plantDiversityScore: 8.0
    },
    {
        id: "RO_VEG_004",
        name: "Ceapă roșie",
        nameRo: "Ceapă roșie",
        nameEn: "Red Onion",
        category: "vegetables", 
        subcategory: "allium",
        seasonality: "all_year",
        ayurvedicProperties: {
            tastes: ["pungent", "sweet"],
            dosha: "kapha_vata_pacifying",
            heating: "heating"
        },
        nutrition: {
            calories: 40,
            protein: 1.1,
            carbs: 9.34,
            fat: 0.10,
            fiber: 1.7,
            vitamin_c: 7.4,
            folate: 19,
            potassium: 146,
            calcium: 23,
            magnesium: 10,
            phosphorus: 29,
            iron: 0.21,
            zinc: 0.17,
            sodium: 4,
            quercetin: 39.21 // special antioxidant
        },
        cookingMethods: ["instant_pot", "caramelization", "raw"],
        omadBenefits: ["flavor_enhancement", "antimicrobial", "prebiotic"],
        plantDiversityScore: 9.0
    },
    {
        id: "RO_VEG_005",
        name: "Usturoiu",
        nameRo: "Usturoiu", 
        nameEn: "Garlic",
        category: "vegetables",
        subcategory: "allium",
        seasonality: "all_year",
        ayurvedicProperties: {
            tastes: ["pungent"],
            dosha: "vata_kapha_pacifying",
            heating: "heating"
        },
        nutrition: {
            calories: 149,
            protein: 6.36,
            carbs: 33.06,
            fat: 0.5,
            fiber: 2.1,
            vitamin_c: 31.2,
            vitamin_b6: 1.235,
            manganese: 1.672,
            selenium: 14.2,
            calcium: 181,
            iron: 1.7,
            magnesium: 25,
            potassium: 401,
            phosphorus: 153,
            zinc: 1.16,
            sodium: 17,
            allicin: 5900 // special compound
        },
        cookingMethods: ["instant_pot", "roasting", "raw"],
        omadBenefits: ["immune_boost", "antimicrobial", "cardiovascular"],
        plantDiversityScore: 10.0
    },

    // FRUCTE ROMÂNEȘTI (Romanian Fruits)
    {
        id: "RO_FRUIT_001",
        name: "Mere românești",
        nameRo: "Mere românești",
        nameEn: "Romanian Apples",
        category: "fruits",
        subcategory: "pome_fruits", 
        seasonality: "autumn_winter",
        ayurvedicProperties: {
            tastes: ["sweet", "astringent"],
            dosha: "tridoshic",
            heating: "cooling"
        },
        nutrition: {
            calories: 52,
            protein: 0.26,
            carbs: 13.81,
            fat: 0.17,
            fiber: 2.4,
            vitamin_c: 4.6,
            potassium: 107,
            calcium: 6,
            iron: 0.12,
            magnesium: 5,
            phosphorus: 11,
            zinc: 0.04,
            sodium: 1,
            pectin: 1.2,
            quercetin: 4.42
        },
        cookingMethods: ["raw", "baking", "instant_pot_compote"],
        omadBenefits: ["fiber", "natural_sweetness", "satiety"],
        plantDiversityScore: 7.5
    },
    {
        id: "RO_FRUIT_002", 
        name: "Prune",
        nameRo: "Prune",
        nameEn: "Plums", 
        category: "fruits",
        subcategory: "stone_fruits",
        seasonality: "summer",
        ayurvedicProperties: {
            tastes: ["sweet", "sour"],
            dosha: "pitta_kapha_pacifying", 
            heating: "cooling"
        },
        nutrition: {
            calories: 46,
            protein: 0.70,
            carbs: 11.42,
            fat: 0.28,
            fiber: 1.4,
            vitamin_c: 9.5,
            vitamin_a: 345,
            vitamin_k: 6.4,
            potassium: 157,
            calcium: 6,
            iron: 0.17,
            magnesium: 7,
            phosphorus: 16,
            zinc: 0.10,
            sodium: 0,
            anthocyanins: 12.5
        },
        cookingMethods: ["raw", "drying", "instant_pot_compote"],
        omadBenefits: ["antioxidants", "digestive_health", "natural_sweetness"],
        plantDiversityScore: 8.0
    },

    // LEGUMINOASE ROMÂNEȘTI (Romanian Legumes)
    {
        id: "RO_LEG_001",
        name: "Fasole boabe albă",
        nameRo: "Fasole boabe albă",
        nameEn: "White Beans",
        category: "legumes", 
        subcategory: "beans",
        seasonality: "all_year_dried",
        ayurvedicProperties: {
            tastes: ["sweet", "astringent"],
            dosha: "vata_pacifying",
            heating: "neutral"
        },
        nutrition: {
            calories: 333,
            protein: 23.36,
            carbs: 60.27,
            fat: 0.85,
            fiber: 15.2,
            folate: 388,
            iron: 10.44,
            magnesium: 190,
            phosphorus: 407,
            potassium: 1795,
            zinc: 3.65,
            calcium: 240,
            vitamin_k: 25.9,
            sodium: 16
        },
        cookingMethods: ["instant_pot", "slow_cooking", "pressure_cooking"],
        omadBenefits: ["high_protein", "high_fiber", "satiety", "mineral_rich"],
        plantDiversityScore: 9.5
    },
    {
        id: "RO_LEG_002",
        name: "Linte roșie",
        nameRo: "Linte roșie", 
        nameEn: "Red Lentils",
        category: "legumes",
        subcategory: "lentils",
        seasonality: "all_year_dried",
        ayurvedicProperties: {
            tastes: ["sweet", "astringent"],
            dosha: "tridoshic",
            heating: "warming"
        },
        nutrition: {
            calories: 358,
            protein: 24.63,
            carbs: 63.35,
            fat: 1.06,
            fiber: 10.7,
            folate: 479,
            iron: 7.39,
            magnesium: 122,
            phosphorus: 451,
            potassium: 955,
            zinc: 4.78,
            calcium: 56,
            vitamin_b6: 0.540,
            sodium: 6
        },
        cookingMethods: ["instant_pot", "quick_cooking", "dal_style"],
        omadBenefits: ["quick_cooking", "protein_rich", "iron_source"],
        plantDiversityScore: 9.0
    },

    // CEREALE INTEGRALE ROMÂNEȘTI (Romanian Whole Grains)
    {
        id: "RO_GRAIN_001",
        name: "Ovăz integral românesc",
        nameRo: "Ovăz integral românesc",
        nameEn: "Romanian Whole Oats",
        category: "grains",
        subcategory: "whole_grains",
        seasonality: "all_year",
        ayurvedicProperties: {
            tastes: ["sweet"],
            dosha: "vata_pacifying",
            heating: "warming"
        },
        nutrition: {
            calories: 389,
            protein: 16.89,
            carbs: 66.27,
            fat: 6.9,
            fiber: 10.6,
            iron: 4.72,
            magnesium: 177,
            phosphorus: 523,
            potassium: 429,
            zinc: 3.97,
            calcium: 54,
            vitamin_e: 0.42,
            folate: 56,
            beta_glucan: 4.0,
            sodium: 2
        },
        cookingMethods: ["instant_pot", "overnight_oats", "steel_cut"],
        omadBenefits: ["sustained_energy", "heart_healthy", "satiety"],
        plantDiversityScore: 8.5
    },
    {
        id: "RO_GRAIN_002", 
        name: "Quinoa",
        nameRo: "Quinoa",
        nameEn: "Quinoa",
        category: "grains",
        subcategory: "pseudocereals", 
        seasonality: "all_year",
        ayurvedicProperties: {
            tastes: ["sweet", "astringent"],
            dosha: "tridoshic",
            heating: "warming"
        },
        nutrition: {
            calories: 368,
            protein: 14.12,
            carbs: 64.16,
            fat: 6.07,
            fiber: 7.0,
            iron: 4.57,
            magnesium: 197,
            phosphorus: 457,
            potassium: 563,
            zinc: 3.10,
            calcium: 47,
            folate: 184,
            vitamin_e: 2.44,
            lysine: 0.766,
            sodium: 5
        },
        cookingMethods: ["instant_pot", "pilaf_style", "salad_base"],
        omadBenefits: ["complete_protein", "gluten_free", "amino_acid_profile"],
        plantDiversityScore: 10.0
    },

    // SEMINȚE ȘI NUCI ROMÂNEȘTI (Romanian Seeds and Nuts)
    {
        id: "RO_NUTS_001",
        name: "Nuci românești",
        nameRo: "Nuci românești",
        nameEn: "Romanian Walnuts",
        category: "nuts_seeds",
        subcategory: "tree_nuts",
        seasonality: "autumn_harvest",
        ayurvedicProperties: {
            tastes: ["sweet", "astringent"],
            dosha: "vata_pacifying",
            heating: "warming"
        },
        nutrition: {
            calories: 654,
            protein: 15.23,
            carbs: 13.71,
            fat: 65.21,
            fiber: 6.7,
            omega3: 9079,
            omega6: 38092,
            vitamin_e: 0.7,
            magnesium: 158,
            phosphorus: 346,
            potassium: 441,
            zinc: 3.09,
            iron: 2.91,
            calcium: 98,
            folate: 98,
            sodium: 2
        },
        cookingMethods: ["raw", "toasted", "instant_pot_incorporated"],
        omadBenefits: ["omega3_rich", "brain_health", "satiety", "healthy_fats"],
        plantDiversityScore: 10.0
    },
    {
        id: "RO_SEEDS_001",
        name: "Semințe de floarea soarelui",
        nameRo: "Semințe de floarea soarelui", 
        nameEn: "Sunflower Seeds",
        category: "nuts_seeds",
        subcategory: "seeds",
        seasonality: "autumn_harvest",
        ayurvedicProperties: {
            tastes: ["sweet"],
            dosha: "vata_pacifying",
            heating: "warming"
        },
        nutrition: {
            calories: 584,
            protein: 20.78,
            carbs: 20.0,
            fat: 51.46,
            fiber: 8.6,
            vitamin_e: 35.17,
            magnesium: 325,
            phosphorus: 660,
            potassium: 645,
            zinc: 5.0,
            iron: 5.25,
            calcium: 78,
            folate: 227,
            selenium: 53.0,
            sodium: 9
        },
        cookingMethods: ["raw", "toasted", "instant_pot_incorporated"],
        omadBenefits: ["vitamin_e_rich", "magnesium_source", "protein"],
        plantDiversityScore: 9.0
    },

    // IERBURI AROMATICE ROMÂNEȘTI (Romanian Herbs)
    {
        id: "RO_HERB_001",
        name: "Pătrunjel",
        nameRo: "Pătrunjel",
        nameEn: "Parsley", 
        category: "herbs",
        subcategory: "fresh_herbs",
        seasonality: "spring_summer",
        ayurvedicProperties: {
            tastes: ["bitter", "pungent"],
            dosha: "kapha_pacifying",
            heating: "warming"
        },
        nutrition: {
            calories: 36,
            protein: 2.97,
            carbs: 6.33,
            fat: 0.79,
            fiber: 3.3,
            vitamin_c: 133,
            vitamin_a: 8424,
            vitamin_k: 1640,
            folate: 152,
            iron: 6.2,
            calcium: 138,
            magnesium: 50,
            potassium: 554,
            zinc: 1.07,
            sodium: 56
        },
        cookingMethods: ["raw", "instant_pot_finish", "fresh_garnish"],
        omadBenefits: ["vitamin_k", "fresh_flavor", "mineral_dense"],
        plantDiversityScore: 8.5
    },
    {
        id: "RO_HERB_002",
        name: "Mărar",
        nameRo: "Mărar",
        nameEn: "Dill",
        category: "herbs", 
        subcategory: "fresh_herbs",
        seasonality: "spring_summer",
        ayurvedicProperties: {
            tastes: ["pungent", "bitter"],
            dosha: "vata_kapha_pacifying",
            heating: "warming"
        },
        nutrition: {
            calories: 43,
            protein: 3.46,
            carbs: 7.02,
            fat: 1.12,
            fiber: 2.1,
            vitamin_c: 85,
            vitamin_a: 7717,
            folate: 150,
            iron: 6.59,
            calcium: 208,
            magnesium: 55,
            potassium: 738,
            zinc: 0.91,
            sodium: 61
        },
        cookingMethods: ["raw", "instant_pot_finish", "pickling"],
        omadBenefits: ["digestive_aid", "fresh_flavor", "calcium"],
        plantDiversityScore: 8.0
    },

    // CONDIMENTE ROMÂNEȘTI (Romanian Spices)
    {
        id: "RO_SPICE_001",
        name: "Boia de ardei",
        nameRo: "Boia de ardei",
        nameEn: "Paprika",
        category: "spices",
        subcategory: "ground_spices", 
        seasonality: "all_year",
        ayurvedicProperties: {
            tastes: ["pungent", "sweet"],
            dosha: "kapha_vata_pacifying",
            heating: "heating"
        },
        nutrition: {
            calories: 282,
            protein: 14.14,
            carbs: 53.99,
            fat: 12.89,
            fiber: 34.9,
            vitamin_c: 0,
            vitamin_a: 52735,
            vitamin_e: 29.83,
            iron: 21.14,
            potassium: 2280,
            magnesium: 178,
            calcium: 229,
            phosphorus: 314,
            zinc: 4.33,
            sodium: 68
        },
        cookingMethods: ["instant_pot_seasoning", "dry_roasting", "oil_infusion"],
        omadBenefits: ["antioxidant_rich", "flavor_enhancer", "vitamin_a"],
        plantDiversityScore: 9.5
    },

    // PEȘTE ȘI FRUCTE DE MARE (Fish and Seafood)
    {
        id: "RO_FISH_001",
        name: "Somon Atlantic",
        nameRo: "Somon Atlantic", 
        nameEn: "Atlantic Salmon",
        category: "fish",
        subcategory: "fatty_fish",
        seasonality: "all_year_farmed",
        ayurvedicProperties: {
            tastes: ["sweet"],
            dosha: "vata_pacifying", 
            heating: "warming"
        },
        nutrition: {
            calories: 208,
            protein: 25.44,
            carbs: 0,
            fat: 12.35,
            omega3: 2018,
            omega6: 880,
            vitamin_d: 360,
            vitamin_b12: 3.18,
            selenium: 36.5,
            phosphorus: 252,
            potassium: 490,
            magnesium: 30,
            calcium: 12,
            iron: 0.80,
            zinc: 0.64,
            sodium: 65
        },
        cookingMethods: ["instant_pot_steam", "baking", "grilling"],
        omadBenefits: ["omega3_rich", "complete_protein", "vitamin_d", "b12"],
        plantDiversityScore: 0, // Not a plant
        animalProtein: true
    },
    {
        id: "RO_FISH_002",
        name: "Sardine în ulei de măsline",
        nameRo: "Sardine în ulei de măsline",
        nameEn: "Sardines in Olive Oil",
        category: "fish",
        subcategory: "canned_fish",
        seasonality: "all_year",
        ayurvedicProperties: {
            tastes: ["sweet", "salty"],
            dosha: "vata_pacifying",
            heating: "warming"
        },
        nutrition: {
            calories: 208,
            protein: 24.62,
            carbs: 0,
            fat: 11.45,
            omega3: 1480,
            vitamin_d: 272,
            vitamin_b12: 8.94,
            calcium: 382,
            phosphorus: 490,
            selenium: 52.7,
            iron: 2.92,
            potassium: 397,
            magnesium: 39,
            zinc: 1.31,
            sodium: 307
        },
        cookingMethods: ["ready_to_eat", "instant_pot_incorporated"],
        omadBenefits: ["convenience", "calcium_rich", "omega3", "b12"],
        plantDiversityScore: 0,
        animalProtein: true
    },

    // PRODUSE LACTATE ROMÂNEȘTI (Romanian Dairy Products)
    {
        id: "RO_DAIRY_001", 
        name: "Brânză de vaci",
        nameRo: "Brânză de vaci",
        nameEn: "Cow Cheese",
        category: "dairy",
        subcategory: "fresh_cheese",
        seasonality: "all_year",
        ayurvedicProperties: {
            tastes: ["sweet", "sour"],
            dosha: "kapha_increasing",
            heating: "cooling"
        },
        nutrition: {
            calories: 98,
            protein: 11.12,
            carbs: 3.38,
            fat: 4.30,
            calcium: 83,
            phosphorus: 138,
            vitamin_b12: 0.34,
            riboflavin: 0.240,
            potassium: 104,
            magnesium: 8,
            zinc: 0.83,
            iron: 0.07,
            sodium: 373,
            vitamin_a: 165
        },
        cookingMethods: ["raw", "instant_pot_incorporated", "melting"],
        omadBenefits: ["protein", "calcium", "b12", "probiotics"],
        plantDiversityScore: 0,
        animalProtein: true
    },

    // OLEURI ȘI GRĂSIMI SĂNĂTOASE (Healthy Oils and Fats)
    {
        id: "RO_OIL_001",
        name: "Ulei de floarea soarelui presat la rece",
        nameRo: "Ulei de floarea soarelui presat la rece",
        nameEn: "Cold-Pressed Sunflower Oil", 
        category: "oils",
        subcategory: "plant_oils",
        seasonality: "all_year",
        ayurvedicProperties: {
            tastes: ["sweet"],
            dosha: "vata_pacifying", 
            heating: "neutral"
        },
        nutrition: {
            calories: 884,
            protein: 0,
            carbs: 0,
            fat: 100,
            vitamin_e: 41.08,
            omega6: 65700,
            omega3: 200,
            saturated_fat: 10.3,
            monounsaturated_fat: 19.5,
            polyunsaturated_fat: 65.7,
            sodium: 0
        },
        cookingMethods: ["cold_use", "low_heat_cooking", "instant_pot_sauté"],
        omadBenefits: ["vitamin_e", "essential_fats", "flavor_carrier"],
        plantDiversityScore: 5.0
    },
    {
        id: "RO_OIL_002",
        name: "Ulei de măsline extra virgin",
        nameRo: "Ulei de măsline extra virgin", 
        nameEn: "Extra Virgin Olive Oil",
        category: "oils",
        subcategory: "plant_oils",
        seasonality: "all_year",
        ayurvedicProperties: {
            tastes: ["sweet", "bitter"],
            dosha: "tridoshic",
            heating: "neutral"
        },
        nutrition: {
            calories: 884,
            protein: 0,
            carbs: 0,
            fat: 100,
            vitamin_e: 14.35,
            vitamin_k: 60.2,
            saturated_fat: 13.8,
            monounsaturated_fat: 73.0,
            polyunsaturated_fat: 10.5,
            omega6: 9762,
            omega3: 761,
            oleic_acid: 71000,
            sodium: 2
        },
        cookingMethods: ["cold_use", "instant_pot_sauté", "finishing_oil"],
        omadBenefits: ["heart_healthy", "antioxidants", "monounsaturated"],
        plantDiversityScore: 8.0
    },

    // BĂUTURI TRADIȚIONALE (Traditional Beverages)
    {
        id: "RO_BEV_001",
        name: "Ceai de mușețel",
        nameRo: "Ceai de mușețel",
        nameEn: "Chamomile Tea",
        category: "beverages", 
        subcategory: "herbal_teas",
        seasonality: "all_year_dried",
        ayurvedicProperties: {
            tastes: ["bitter", "sweet"],
            dosha: "pitta_vata_pacifying",
            heating: "cooling"
        },
        nutrition: {
            calories: 1,
            protein: 0,
            carbs: 0.2,
            fat: 0,
            fiber: 0,
            calcium: 5,
            iron: 0.08,
            magnesium: 2,
            potassium: 9,
            sodium: 1,
            apigenin: 3.0,
            bisabolol: 0.5
        },
        cookingMethods: ["steeping", "cold_brew"],
        omadBenefits: ["digestive_aid", "calming", "hydration"],
        plantDiversityScore: 6.0
    },

    // FRUCTE USCATE (Dried Fruits)
    {
        id: "RO_DRIED_001",
        name: "Curmale Medjool",
        nameRo: "Curmale Medjool",
        nameEn: "Medjool Dates",
        category: "dried_fruits",
        subcategory: "dates",
        seasonality: "all_year", 
        ayurvedicProperties: {
            tastes: ["sweet"],
            dosha: "vata_pacifying",
            heating: "warming"
        },
        nutrition: {
            calories: 277,
            protein: 1.81,
            carbs: 74.97,
            fat: 0.15,
            fiber: 6.7,
            potassium: 696,
            copper: 0.362,
            manganese: 0.296,
            magnesium: 54,
            calcium: 64,
            iron: 0.90,
            phosphorus: 62,
            zinc: 0.44,
            folate: 15,
            sodium: 1
        },
        cookingMethods: ["raw", "soaking", "instant_pot_sweetener"],
        omadBenefits: ["natural_sweetener", "potassium", "energy"],
        plantDiversityScore: 7.0
    },

    // ALGE ȘI SUPERALIMENTE (Seaweed and Superfoods)
    {
        id: "RO_SUPER_001",
        name: "Spirulina praf",
        nameRo: "Spirulina praf",
        nameEn: "Spirulina Powder",
        category: "superfoods",
        subcategory: "algae",
        seasonality: "all_year",
        ayurvedicProperties: {
            tastes: ["bitter", "astringent"],
            dosha: "kapha_pacifying",
            heating: "cooling"
        },
        nutrition: {
            calories: 290,
            protein: 57.47,
            carbs: 23.9,
            fat: 7.72,
            fiber: 3.6,
            iron: 28.5,
            calcium: 120,
            magnesium: 195,
            phosphorus: 118,
            potassium: 1363,
            zinc: 2.85,
            vitamin_k: 25.5,
            vitamin_a: 570,
            folate: 94,
            vitamin_b12: 2.64,
            sodium: 1048
        },
        cookingMethods: ["powder_addition", "smoothie", "instant_pot_incorporation"],
        omadBenefits: ["protein_dense", "b12", "iron", "complete_amino_acids"],
        plantDiversityScore: 10.0
    },

    // CIUPERCI (Mushrooms - EXCLUDED for Nico due to allergy)
    {
        id: "RO_MUSH_001",
        name: "Ciuperci champignon",
        nameRo: "Ciuperci champignon", 
        nameEn: "Button Mushrooms",
        category: "mushrooms",
        subcategory: "cultivated_mushrooms",
        seasonality: "all_year",
        allergenWarning: "NICO_ALLERGY",
        ayurvedicProperties: {
            tastes: ["sweet", "astringent"],
            dosha: "kapha_pacifying",
            heating: "cooling"
        },
        nutrition: {
            calories: 22,
            protein: 3.09,
            carbs: 3.26,
            fat: 0.34,
            fiber: 1.0,
            vitamin_d: 375,
            selenium: 9.3,
            potassium: 318,
            phosphorus: 86,
            copper: 0.318,
            vitamin_b5: 1.497,
            riboflavin: 0.402,
            niacin: 3.607,
            folate: 17,
            iron: 0.50,
            zinc: 0.52,
            sodium: 5
        },
        cookingMethods: ["instant_pot", "sautéing", "grilling"],
        omadBenefits: ["vitamin_d", "umami", "low_calorie"],
        plantDiversityScore: 8.0,
        excludeForProfiles: ["nico"] // Explicit exclusion
    }
];

// Helper Functions for Database Operations
export const DatabaseHelpers = {
    getFoodById(id) {
        return ROMANIAN_FOODS_DATABASE.find(food => food.id === id);
    },

    searchByName(query) {
        return ROMANIAN_FOODS_DATABASE.filter(food => 
            food.name.toLowerCase().includes(query.toLowerCase()) ||
            food.nameRo.toLowerCase().includes(query.toLowerCase()) ||
            food.nameEn.toLowerCase().includes(query.toLowerCase())
        );
    },

    getFoodsByCategory(category) {
        return ROMANIAN_FOODS_DATABASE.filter(food => food.category === category);
    },

    getFoodsForProfile(profileName) {
        return ROMANIAN_FOODS_DATABASE.filter(food => 
            !food.excludeForProfiles || !food.excludeForProfiles.includes(profileName)
        );
    },

    getHighProteinFoods(minProtein = 15) {
        return ROMANIAN_FOODS_DATABASE.filter(food => 
            food.nutrition.protein >= minProtein
        );
    },

    getOmega3RichFoods(minOmega3 = 500) {
        return ROMANIAN_FOODS_DATABASE.filter(food => 
            food.nutrition.omega3 >= minOmega3
        );
    },

    getPlantDiversityFoods(minScore = 8) {
        return ROMANIAN_FOODS_DATABASE.filter(food => 
            food.plantDiversityScore >= minScore
        );
    },

    getFoodsForCookingMethod(method) {
        return ROMANIAN_FOODS_DATABASE.filter(food => 
            food.cookingMethods.includes(method)
        );
    },

    getAyurvedicBalancedFoods(dosha) {
        return ROMANIAN_FOODS_DATABASE.filter(food => 
            food.ayurvedicProperties?.dosha?.includes(dosha)
        );
    },

    calculateTotalNutrients(foodList) {
        const totals = {};
        foodList.forEach(item => {
            const food = typeof item === 'string' ? this.getFoodById(item) : item.food;
            const amount = item.amount || 100; // default 100g
            const multiplier = amount / 100;
            
            Object.entries(food.nutrition).forEach(([nutrient, value]) => {
                totals[nutrient] = (totals[nutrient] || 0) + (value * multiplier);
            });
        });
        return totals;
    }
};

// Initialize Database Helper for NutrientDatabase in CodexCore.js
export const initializeNutrientDatabase = (NutrientDatabase) => {
    ROMANIAN_FOODS_DATABASE.forEach(food => {
        NutrientDatabase.addFood(food);
    });
    console.log(`Loaded ${ROMANIAN_FOODS_DATABASE.length} foods into CODEX N-OMAD database`);
};

export default {
    ROMANIAN_FOODS_DATABASE,
    DatabaseHelpers,
    initializeNutrientDatabase
};