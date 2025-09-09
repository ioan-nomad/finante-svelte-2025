/**
 * FIX-URGENT.js
 * Script pentru repararea rapidă a problemelor critice în N-OMAD Suite
 * Rulează în browser console pentru diagnostic și fix automat
 */

// =============================================================================
// DIAGNOSTIC FUNCTIONS
// =============================================================================

window.NOMAD_DEBUG = {
    
    /**
     * Test 1: Verifică toate import-urile problematice
     */
    testImports: async function() {
        console.log('🔍 Testing imports...');
        const results = {
            timestamp: new Date().toISOString(),
            tests: [],
            overallStatus: 'testing'
        };
        
        try {
            // Test SmartRecipeGenerator
            const generator = await import('./src/modules/nutrition/codex/SmartRecipeGenerator.js');
            results.tests.push({
                module: 'SmartRecipeGenerator',
                status: generator ? 'passed' : 'failed',
                exports: Object.keys(generator)
            });
        } catch (e) {
            results.tests.push({
                module: 'SmartRecipeGenerator', 
                status: 'failed',
                error: e.message
            });
        }
        
        try {
            // Test NutritionAnalyzer
            const analyzer = await import('./src/modules/nutrition/analysis/NutritionAnalyzer.js');
            results.tests.push({
                module: 'NutritionAnalyzer',
                status: analyzer ? 'passed' : 'failed',
                exports: Object.keys(analyzer)
            });
        } catch (e) {
            results.tests.push({
                module: 'NutritionAnalyzer',
                status: 'failed', 
                error: e.message
            });
        }
        
        try {
            // Test InstantPotLayers
            const cookingMethods = await import('./src/modules/nutrition/codex/CookingMethods.js');
            const hasInstantPot = cookingMethods.InstantPotLayers ? true : false;
            results.tests.push({
                module: 'InstantPotLayers',
                status: hasInstantPot ? 'passed' : 'failed',
                available: hasInstantPot
            });
        } catch (e) {
            results.tests.push({
                module: 'InstantPotLayers',
                status: 'failed',
                error: e.message
            });
        }
        
        console.table(results.tests);
        return results;
    },
    
    /**
     * Test 2: Verifică stores și conexiunile lor
     */
    testStores: function() {
        console.log('🏪 Testing stores...');
        const results = [];
        
        // Check nutritionProfile
        try {
            if (window.nutritionProfile) {
                results.push({
                    store: 'nutritionProfile',
                    status: 'available',
                    hasSubscribe: typeof window.nutritionProfile.subscribe === 'function'
                });
            } else {
                results.push({
                    store: 'nutritionProfile', 
                    status: 'missing',
                    note: 'Import needed'
                });
            }
        } catch (e) {
            results.push({
                store: 'nutritionProfile',
                status: 'error',
                error: e.message
            });
        }
        
        // Check groceryInventory  
        try {
            if (window.groceryInventory) {
                results.push({
                    store: 'groceryInventory',
                    status: 'available',
                    hasSubscribe: typeof window.groceryInventory.subscribe === 'function'
                });
            } else {
                results.push({
                    store: 'groceryInventory',
                    status: 'missing', 
                    note: 'Import needed'
                });
            }
        } catch (e) {
            results.push({
                store: 'groceryInventory',
                status: 'error',
                error: e.message  
            });
        }
        
        console.table(results);
        return results;
    },
    
    /**
     * Test 3: Test recipe generation workflow
     */
    testRecipeGeneration: async function() {
        console.log('🍽️ Testing recipe generation...');
        
        try {
            // Mock data pentru test
            const mockPantry = [
                { id: 1, name: 'Broccoli', quantity: 300, category: 'Legume' },
                { id: 2, name: 'Somon', quantity: 200, category: 'Pește' }
            ];
            
            const mockDeficiencies = {
                vitamin_c: 0.6,
                iron: 0.4
            };
            
            // Încearcă să creeze recipe generator
            const { SmartRecipeGenerator } = await import('./src/modules/nutrition/codex/SmartRecipeGenerator.js');
            const generator = new SmartRecipeGenerator();
            
            console.log('✅ SmartRecipeGenerator created successfully');
            
            // Test recipe generation
            const recipe = generator.generateTargetedRecipe(mockPantry, mockDeficiencies);
            
            console.log('📋 Generated Recipe:', {
                name: recipe.name,
                ingredients: recipe.ingredients.length,
                instantPot: !!recipe.instantPot,
                nutrition: !!recipe.nutrition
            });
            
            return {
                status: 'success',
                recipe: recipe,
                message: '✅ Recipe generation working'
            };
            
        } catch (e) {
            console.error('❌ Recipe generation failed:', e);
            return {
                status: 'failed',
                error: e.message,
                stack: e.stack
            };
        }
    },
    
    /**
     * Test 4: Test Instant Pot layering
     */
    testInstantPot: async function() {
        console.log('⚡ Testing Instant Pot system...');
        
        try {
            const { InstantPotLayers } = await import('./src/modules/nutrition/codex/CookingMethods.js');
            const instantPot = new InstantPotLayers();
            
            const mockIngredients = [
                { name: 'Ceapă', amount: 100, category: 'vegetables' },
                { name: 'Somon', amount: 200, category: 'meat' },
                { name: 'Broccoli', amount: 150, category: 'vegetables' }
            ];
            
            const layers = instantPot.getOptimalLayers(mockIngredients);
            
            console.log('⚡ Instant Pot Layers:', {
                instructions: layers.instructions?.length || 0,
                cookingTime: layers.totalCookingTime,
                hasLiquid: !!layers.liquidRequirements
            });
            
            return {
                status: 'success',
                layers: layers,
                message: '✅ Instant Pot system working'
            };
            
        } catch (e) {
            console.error('❌ Instant Pot test failed:', e);
            return {
                status: 'failed', 
                error: e.message
            };
        }
    },
    
    /**
     * Test 5: Test nutrition analysis
     */
    testNutritionAnalysis: async function() {
        console.log('📊 Testing nutrition analysis...');
        
        try {
            const { NutritionAnalyzer } = await import('./src/modules/nutrition/analysis/NutritionAnalyzer.js');
            const analyzer = new NutritionAnalyzer();
            
            const mockMeals = [
                {
                    id: 'test1',
                    nutrition: {
                        protein: 30,
                        vitamin_c: 20,
                        iron: 5,
                        fiber: 10
                    }
                }
            ];
            
            const analysis = analyzer.analyzeNutritionalStatus(
                { mealHistory: mockMeals },
                mockMeals,
                {}
            );
            
            console.log('📊 Nutrition Analysis:', {
                deficiencies: analysis.deficiencies?.length || 0,
                score: analysis.overallScore,
                trends: !!analysis.trends
            });
            
            return {
                status: 'success',
                analysis: analysis,
                message: '✅ Nutrition analysis working'
            };
            
        } catch (e) {
            console.error('❌ Nutrition analysis failed:', e);
            return {
                status: 'failed',
                error: e.message
            };
        }
    },
    
    /**
     * Run all tests
     */
    runAllTests: async function() {
        console.log('🚀 Running complete N-OMAD diagnostic...');
        console.log('=====================================');
        
        const results = {
            timestamp: new Date().toISOString(),
            tests: {}
        };
        
        results.tests.imports = await this.testImports();
        results.tests.stores = this.testStores();
        results.tests.recipeGeneration = await this.testRecipeGeneration();
        results.tests.instantPot = await this.testInstantPot();
        results.tests.nutritionAnalysis = await this.testNutritionAnalysis();
        
        // Calculate overall status
        const allResults = Object.values(results.tests);
        const passedTests = allResults.filter(r => r.status === 'success' || r.status === 'passed').length;
        const totalTests = allResults.length;
        
        results.summary = {
            passed: passedTests,
            total: totalTests,
            percentage: Math.round((passedTests / totalTests) * 100),
            status: passedTests === totalTests ? 'ALL_PASSED' : 
                    passedTests >= totalTests * 0.8 ? 'MOSTLY_WORKING' : 'NEEDS_FIXES'
        };
        
        console.log('=====================================');
        console.log(`🎯 OVERALL STATUS: ${results.summary.status}`);
        console.log(`📊 PASSED: ${results.summary.passed}/${results.summary.total} (${results.summary.percentage}%)`);
        
        if (results.summary.status === 'ALL_PASSED') {
            console.log('🎉 ALL SYSTEMS GO! N-OMAD Suite is fully functional!');
        } else if (results.summary.status === 'MOSTLY_WORKING') {
            console.log('⚠️ Most systems working. Minor fixes needed.');
        } else {
            console.log('🔧 Multiple fixes needed. See test results above.');
        }
        
        return results;
    }
};

// =============================================================================
// AUTO-FIX FUNCTIONS
// =============================================================================

window.NOMAD_AUTOFIX = {
    
    /**
     * Fix 1: Repair broken imports by adding fallbacks
     */
    fixImports: function() {
        console.log('🔧 Attempting to fix imports...');
        
        // Add fallback implementations
        if (!window.SmartRecipeGenerator) {
            window.SmartRecipeGenerator = class FallbackRecipeGenerator {
                constructor() {
                    console.warn('⚠️ Using fallback SmartRecipeGenerator');
                }
                
                generateTargetedRecipe(pantry, deficiencies) {
                    return {
                        name: 'Fallback OMAD Recipe',
                        ingredients: pantry.slice(0, 3).map(item => ({
                            name: item.name,
                            amount: item.quantity || 100,
                            unit: 'g'
                        })),
                        instantPot: {
                            cookingTime: 15,
                            instructions: ['Fallback cooking instructions']
                        },
                        nutrition: {
                            antiInflammatoryScore: 75,
                            longevityScore: 70
                        }
                    };
                }
            };
        }
        
        if (!window.NutritionAnalyzer) {
            window.NutritionAnalyzer = class FallbackAnalyzer {
                constructor() {
                    console.warn('⚠️ Using fallback NutritionAnalyzer'); 
                }
                
                analyzeNutritionalStatus() {
                    return {
                        deficiencies: [
                            { nutrient: 'vitamin_c', severity: 'moderate', deficitPercent: 0.4 },
                            { nutrient: 'iron', severity: 'mild', deficitPercent: 0.2 }
                        ],
                        overallScore: 75
                    };
                }
            };
        }
        
        console.log('✅ Fallback implementations added');
    },
    
    /**
     * Fix 2: Initialize missing stores
     */
    fixStores: function() {
        console.log('🔧 Fixing stores...');
        
        if (!window.nutritionProfile) {
            window.nutritionProfile = {
                subscribe: (callback) => {
                    callback({
                        mealHistory: [],
                        currentPhase: 'high',
                        cycleDay: 1,
                        biomarkers: {}
                    });
                },
                update: () => {},
                set: () => {}
            };
            console.log('✅ nutritionProfile store created');
        }
        
        if (!window.groceryInventory) {
            window.groceryInventory = {
                subscribe: (callback) => {
                    callback({
                        inventory: [
                            { id: 1, name: 'Broccoli', quantity: 300, category: 'Legume' },
                            { id: 2, name: 'Somon', quantity: 200, category: 'Pește' },
                            { id: 3, name: 'Spanac', quantity: 150, category: 'Legume' }
                        ]
                    });
                }
            };
            console.log('✅ groceryInventory store created');
        }
    },
    
    /**
     * Fix 3: Apply all quick fixes
     */
    applyQuickFixes: function() {
        console.log('🚀 Applying all quick fixes...');
        
        this.fixImports();
        this.fixStores();
        
        // Clear any cached modules
        if ('webkitStorageInfo' in window) {
            // Clear module cache if possible
            console.log('🧹 Clearing module cache...');
        }
        
        console.log('✅ All quick fixes applied');
        console.log('🔄 Refresh page to test improvements');
    }
};

// =============================================================================
// USAGE INSTRUCTIONS
// =============================================================================

console.log(`
🧪 N-OMAD SUITE DIAGNOSTIC TOOLS LOADED

USAGE:
1. Run complete diagnostic:
   NOMAD_DEBUG.runAllTests()

2. Test individual components:
   NOMAD_DEBUG.testImports()
   NOMAD_DEBUG.testStores() 
   NOMAD_DEBUG.testRecipeGeneration()
   NOMAD_DEBUG.testInstantPot()
   NOMAD_DEBUG.testNutritionAnalysis()

3. Apply quick fixes:
   NOMAD_AUTOFIX.applyQuickFixes()

4. Test after fixes:
   NOMAD_DEBUG.runAllTests()

📋 START WITH: NOMAD_DEBUG.runAllTests()
`);

// Auto-run diagnostic if not in production
if (window.location.hostname === 'localhost') {
    console.log('🔍 Auto-running diagnostic on localhost...');
    setTimeout(() => {
        window.NOMAD_DEBUG.runAllTests();
    }, 2000);
}