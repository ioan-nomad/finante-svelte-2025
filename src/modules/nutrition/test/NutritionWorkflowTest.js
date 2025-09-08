/**
 * NUTRITION WORKFLOW TEST
 * Tests complete integration of Smart Recipe Generator + Nutrition Analyzer + Instant Pot
 */

import SmartRecipeGenerator from '../codex/SmartRecipeGenerator.js';
import NutritionAnalyzer from '../analysis/NutritionAnalyzer.js';
import { ROMANIAN_FOODS_DATABASE } from '../codex/database/nutrients.js';

export class NutritionWorkflowTest {
    constructor() {
        this.recipeGenerator = new SmartRecipeGenerator();
        this.nutritionAnalyzer = new NutritionAnalyzer();
        this.testResults = [];
    }

    /**
     * Run complete nutrition workflow test
     */
    async runCompleteTest() {
        console.log('🧪 Starting Complete Nutrition Workflow Test...');
        
        const results = {
            timestamp: new Date().toISOString(),
            tests: [],
            overallStatus: 'pending'
        };

        try {
            // Test 1: Database Connectivity
            const dbTest = await this.testDatabaseConnectivity();
            results.tests.push(dbTest);

            // Test 2: Nutrition Analysis
            const analysisTest = await this.testNutritionAnalysis();
            results.tests.push(analysisTest);

            // Test 3: Recipe Generation
            const recipeTest = await this.testRecipeGeneration();
            results.tests.push(recipeTest);

            // Test 4: Instant Pot Integration
            const instantPotTest = await this.testInstantPotIntegration();
            results.tests.push(instantPotTest);

            // Test 5: End-to-end Workflow
            const e2eTest = await this.testEndToEndWorkflow();
            results.tests.push(e2eTest);

            // Calculate overall status
            const passedTests = results.tests.filter(t => t.status === 'passed').length;
            const totalTests = results.tests.length;
            
            results.overallStatus = passedTests === totalTests ? 'passed' : 'partial';
            results.summary = {
                passed: passedTests,
                total: totalTests,
                percentage: Math.round((passedTests / totalTests) * 100)
            };

            console.log('✅ Test Suite Completed:', results.summary);
            return results;

        } catch (error) {
            results.overallStatus = 'failed';
            results.error = error.message;
            console.error('❌ Test Suite Failed:', error);
            return results;
        }
    }

    /**
     * Test database connectivity and data access
     */
    async testDatabaseConnectivity() {
        const test = {
            name: 'Database Connectivity',
            status: 'pending',
            details: {}
        };

        try {
            // Test nutrients database
            test.details.totalFoods = ROMANIAN_FOODS_DATABASE.length;
            test.details.sampleFood = ROMANIAN_FOODS_DATABASE[0];
            
            // Verify data structure
            const sampleFood = ROMANIAN_FOODS_DATABASE[0];
            const requiredFields = ['id', 'name', 'category', 'nutrition'];
            const hasAllFields = requiredFields.every(field => sampleFood[field]);
            
            if (hasAllFields && test.details.totalFoods > 50) {
                test.status = 'passed';
                test.details.message = `✅ Database loaded with ${test.details.totalFoods} foods`;
            } else {
                test.status = 'failed';
                test.details.message = '❌ Database structure incomplete';
            }

        } catch (error) {
            test.status = 'failed';
            test.details.error = error.message;
        }

        return test;
    }

    /**
     * Test nutrition analysis functionality
     */
    async testNutritionAnalysis() {
        const test = {
            name: 'Nutrition Analysis',
            status: 'pending',
            details: {}
        };

        try {
            // Mock meal history with known nutritional gaps
            const mockMeals = [
                {
                    id: 'meal1',
                    nutrition: {
                        protein: 20,
                        vitamin_c: 10, // Low
                        iron: 3,       // Low
                        fiber: 8,
                        calcium: 100   // Low
                    }
                },
                {
                    id: 'meal2',
                    nutrition: {
                        protein: 25,
                        vitamin_c: 15,
                        iron: 4,
                        fiber: 12,
                        calcium: 120
                    }
                }
            ];

            const analysis = this.nutritionAnalyzer.analyzeNutritionalStatus(
                { mealHistory: mockMeals },
                mockMeals,
                {}
            );

            test.details.deficienciesFound = analysis.deficiencies.length;
            test.details.topDeficiencies = analysis.deficiencies.slice(0, 3).map(d => d.nutrient);
            test.details.overallScore = analysis.overallScore;

            if (analysis.deficiencies.length > 0) {
                test.status = 'passed';
                test.details.message = `✅ Found ${analysis.deficiencies.length} nutritional deficiencies`;
            } else {
                test.status = 'failed';
                test.details.message = '❌ Deficiency detection not working';
            }

        } catch (error) {
            test.status = 'failed';
            test.details.error = error.message;
        }

        return test;
    }

    /**
     * Test recipe generation
     */
    async testRecipeGeneration() {
        const test = {
            name: 'Recipe Generation',
            status: 'pending',
            details: {}
        };

        try {
            // Mock pantry items
            const mockPantry = [
                { id: 1, name: 'Broccoli', quantity: 300, category: 'Legume' },
                { id: 2, name: 'Somon', quantity: 200, category: 'Pește' },
                { id: 3, name: 'Spanac', quantity: 150, category: 'Legume' },
                { id: 4, name: 'Quinoa', quantity: 100, category: 'Cereale' }
            ];

            // Mock nutritional deficiencies
            const mockDeficiencies = {
                vitamin_c: 0.6,  // 60% deficit
                iron: 0.4,       // 40% deficit
                fiber: 0.3       // 30% deficit
            };

            const recipe = this.recipeGenerator.generateTargetedRecipe(
                mockPantry,
                mockDeficiencies,
                { cookingMethod: 'instant_pot' }
            );

            test.details.recipeName = recipe.name;
            test.details.ingredientCount = recipe.ingredients.length;
            test.details.targetedDeficiencies = recipe.targetedDeficiencies.length;
            test.details.cookingTime = recipe.instantPot.cookingTime;

            if (recipe.ingredients.length > 3 && recipe.targetedDeficiencies.length > 0) {
                test.status = 'passed';
                test.details.message = `✅ Generated recipe with ${recipe.ingredients.length} ingredients`;
            } else {
                test.status = 'failed';
                test.details.message = '❌ Recipe generation incomplete';
            }

        } catch (error) {
            test.status = 'failed';
            test.details.error = error.message;
        }

        return test;
    }

    /**
     * Test Instant Pot integration
     */
    async testInstantPotIntegration() {
        const test = {
            name: 'Instant Pot Integration',
            status: 'pending',
            details: {}
        };

        try {
            // Mock ingredients for layering
            const mockIngredients = [
                { name: 'Ceapă', amount: 100, category: 'vegetables' },
                { name: 'Somon', amount: 200, category: 'meat' },
                { name: 'Broccoli', amount: 150, category: 'vegetables' },
                { name: 'Spanac', amount: 100, category: 'vegetables' }
            ];

            const layers = this.recipeGenerator.instantPotLayers.getOptimalLayers(mockIngredients);

            test.details.layerCount = Object.keys(layers.layers || {}).length;
            test.details.instructionSteps = layers.instructions?.length || 0;
            test.details.cookingTime = layers.totalCookingTime;
            test.details.hasLiquidReqs = !!layers.liquidRequirements;

            if (layers.instructions && layers.instructions.length >= 4) {
                test.status = 'passed';
                test.details.message = `✅ Generated ${layers.instructions.length} layering steps`;
            } else {
                test.status = 'failed';
                test.details.message = '❌ Instant Pot layering incomplete';
            }

        } catch (error) {
            test.status = 'failed';
            test.details.error = error.message;
        }

        return test;
    }

    /**
     * Test complete end-to-end workflow
     */
    async testEndToEndWorkflow() {
        const test = {
            name: 'End-to-End Workflow',
            status: 'pending',
            details: {}
        };

        try {
            // Simulate complete user workflow
            const mockProfile = {
                mealHistory: [
                    {
                        id: 'meal1',
                        nutrition: { protein: 30, vitamin_c: 20, iron: 5, fiber: 10, calcium: 150 }
                    }
                ]
            };

            const mockPantry = [
                { id: 1, name: 'Varză de Bruxelles', quantity: 200, category: 'Legume' },
                { id: 2, name: 'Somon', quantity: 180, category: 'Pește' }
            ];

            // Step 1: Analyze nutrition
            const analysis = this.nutritionAnalyzer.analyzeNutritionalStatus(
                mockProfile,
                mockProfile.mealHistory,
                {}
            );

            // Step 2: Extract deficiencies
            const deficiencies = {};
            analysis.deficiencies.forEach(def => {
                deficiencies[def.nutrient] = def.deficitPercent;
            });

            // Step 3: Generate targeted recipe
            const recipe = this.recipeGenerator.generateTargetedRecipe(
                mockPantry,
                deficiencies,
                {}
            );

            // Verify complete workflow
            test.details.analysisComplete = !!analysis.deficiencies;
            test.details.recipeGenerated = !!recipe.ingredients;
            test.details.instantPotReady = !!recipe.instantPot;
            test.details.nutritionImpact = !!recipe.nutrition;

            const workflowSteps = [
                test.details.analysisComplete,
                test.details.recipeGenerated,
                test.details.instantPotReady,
                test.details.nutritionImpact
            ];

            const completedSteps = workflowSteps.filter(Boolean).length;

            if (completedSteps === 4) {
                test.status = 'passed';
                test.details.message = `✅ Complete workflow: ${completedSteps}/4 steps`;
            } else {
                test.status = 'partial';
                test.details.message = `⚠️ Partial workflow: ${completedSteps}/4 steps`;
            }

        } catch (error) {
            test.status = 'failed';
            test.details.error = error.message;
        }

        return test;
    }

    /**
     * Generate test report for display
     */
    generateTestReport(results) {
        return {
            title: '🧪 Nutrition Module Test Report',
            timestamp: results.timestamp,
            summary: results.summary,
            status: results.overallStatus,
            tests: results.tests.map(test => ({
                name: test.name,
                status: test.status,
                emoji: this.getStatusEmoji(test.status),
                message: test.details.message || 'Test completed',
                details: test.details
            })),
            recommendations: this.generateRecommendations(results)
        };
    }

    /**
     * Get status emoji
     */
    getStatusEmoji(status) {
        const emojis = {
            passed: '✅',
            failed: '❌',
            partial: '⚠️',
            pending: '⏳'
        };
        return emojis[status] || '❓';
    }

    /**
     * Generate recommendations based on test results
     */
    generateRecommendations(results) {
        const recommendations = [];
        
        results.tests.forEach(test => {
            if (test.status === 'failed') {
                recommendations.push({
                    priority: 'high',
                    message: `Fix ${test.name}: ${test.details.message}`,
                    action: `Review ${test.name.toLowerCase()} implementation`
                });
            } else if (test.status === 'partial') {
                recommendations.push({
                    priority: 'medium',
                    message: `Improve ${test.name}: ${test.details.message}`,
                    action: `Enhance ${test.name.toLowerCase()} functionality`
                });
            }
        });

        if (recommendations.length === 0) {
            recommendations.push({
                priority: 'info',
                message: '🎉 All tests passed! Nutrition module is ready.',
                action: 'Consider adding more advanced features'
            });
        }

        return recommendations;
    }
}

// Export test runner function for easy use
export async function runNutritionTests() {
    const testRunner = new NutritionWorkflowTest();
    const results = await testRunner.runCompleteTest();
    return testRunner.generateTestReport(results);
}

export default NutritionWorkflowTest;