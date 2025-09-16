// Test script pentru funcționalitatea Excel Export
// Rulează în browser console pentru testare rapidă

// Test Excel generation
export async function testBasicExcelExport() {
    console.log('🧪 Starting Excel Export Test...');

    try {
        // Import ExcelExporter
        const { excelExporter } = await import('./lib/services/ExcelExporter.js');

        // Test data
        const testData = {
            stats: {
                income: 5000,
                expenses: 3500,
                savings: 1500,
                percentSaved: 30,
                totalBalance: 12000
            },
            accounts: [
                { name: 'Cont Principal', type: 'Curent', balance: 8000 },
                { name: 'Cont Economii', type: 'Economii', balance: 4000 }
            ],
            transactions: [
                { date: new Date(), description: 'Salariu', amount: 3000, category: 'Venituri', type: 'income' },
                { date: new Date(), description: 'Chirie', amount: -1000, category: 'Locuință', type: 'expense' },
                { date: new Date(), description: 'Mâncare', amount: -500, category: 'Alimentație', type: 'expense' },
                { date: new Date(), description: 'Transport', amount: -200, category: 'Transport', type: 'expense' },
                { date: new Date(), description: 'Utilități', amount: -300, category: 'Utilități', type: 'expense' }
            ],
            budgets: [
                { name: 'Buget Alimentație', category: 'Alimentație', limit: 800, spent: 500 },
                { name: 'Buget Transport', category: 'Transport', limit: 400, spent: 200 },
                { name: 'Buget Divertisment', category: 'Divertisment', limit: 300, spent: 150 }
            ],
            goals: [
                { name: 'Vacanță Grecia', target: 5000, current: 2000, deadline: '2025-07-01' },
                { name: 'Fond Urgență', target: 10000, current: 4000, deadline: '2025-12-31' }
            ]
        };

        console.log('📊 Test data prepared:', testData);

        // Test 1: Basic Excel Export
        console.log('📋 Test 1: Basic Financial Excel Export');
        const basicBlob = await excelExporter.generateFinanceExcel(testData, {
            includeCharts: false,
            includePivot: false,
            includeFormulas: true,
            period: 'Test Basic Export'
        });

        if (basicBlob && basicBlob.size > 0) {
            console.log('✅ Basic Excel export generated successfully:', basicBlob.size, 'bytes');
            await excelExporter.download(basicBlob, 'test-basic-financial.xlsx');
        } else {
            throw new Error('Basic Excel export is empty');
        }

        // Wait a bit before next test
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Test 2: Advanced Excel Export
        console.log('📋 Test 2: Advanced Financial Excel Export');
        const advancedBlob = await excelExporter.generateFinanceExcel(testData, {
            includeCharts: true,
            includePivot: true,
            includeFormulas: true,
            period: 'Test Advanced Export'
        });

        if (advancedBlob && advancedBlob.size > 0) {
            console.log('✅ Advanced Excel export generated successfully:', advancedBlob.size, 'bytes');
            await excelExporter.download(advancedBlob, 'test-advanced-financial.xlsx');
        } else {
            throw new Error('Advanced Excel export is empty');
        }

        // Wait a bit before next test
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Test 3: Quick Financial Export
        console.log('📋 Test 3: Quick Financial Export');
        await excelExporter.quickFinancialExport(testData);
        console.log('✅ Quick financial Excel export completed');

        console.log('🎉 All Excel export tests passed successfully!');
        return true;

    } catch (error) {
        console.error('❌ Excel Export test failed:', error);
        console.error('Stack trace:', error.stack);
        return false;
    }
}

// Test Pantry Excel Export
export async function testPantryExcelExport() {
    console.log('🧪 Testing Pantry Excel Export...');

    try {
        const { excelExporter } = await import('./lib/services/ExcelExporter.js');

        // Pantry test data
        const pantryData = {
            inventory: [
                {
                    name: 'Mere Roșii',
                    category: 'Fructe',
                    quantity: 10,
                    unit: 'bucăți',
                    price: 0.5,
                    expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
                    location: 'Frigider'
                },
                {
                    name: 'Pâine Integrală',
                    category: 'Panificație',
                    quantity: 2,
                    unit: 'bucăți',
                    price: 3.5,
                    expiryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
                    location: 'Cămară'
                },
                {
                    name: 'Lapte',
                    category: 'Lactate',
                    quantity: 1,
                    unit: 'litru',
                    price: 4.2,
                    expiryDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
                    location: 'Frigider'
                }
            ],
            shoppingList: [
                {
                    name: 'Banane',
                    quantity: 6,
                    unit: 'bucăți',
                    estimatedPrice: 0.8,
                    priority: 'Normal',
                    store: 'Kaufland',
                    notes: 'Preferat bio'
                },
                {
                    name: 'Iaurt Grecesc',
                    quantity: 4,
                    unit: 'bucăți',
                    estimatedPrice: 2.5,
                    priority: 'Urgent',
                    store: 'Carrefour',
                    notes: '0% grăsime'
                }
            ],
            expiring: [
                {
                    name: 'Pâine Integrală',
                    quantity: 2,
                    unit: 'bucăți',
                    price: 3.5,
                    expiryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
                }
            ]
        };

        console.log('🏪 Pantry test data prepared:', pantryData);

        const blob = await excelExporter.generatePantryExcel(pantryData, {
            period: 'Test Pantry Export'
        });

        if (blob && blob.size > 0) {
            console.log('✅ Pantry Excel export generated successfully:', blob.size, 'bytes');
            await excelExporter.download(blob, 'test-pantry-export.xlsx');
        } else {
            throw new Error('Pantry Excel export is empty');
        }

        console.log('🎉 Pantry Excel export test passed successfully!');
        return true;

    } catch (error) {
        console.error('❌ Pantry Excel Export test failed:', error);
        return false;
    }
}

// Test Nutrition Excel Export
export async function testNutritionExcelExport() {
    console.log('🧪 Testing Nutrition Excel Export...');

    try {
        const { excelExporter } = await import('./lib/services/ExcelExporter.js');

        // Nutrition test data
        const nutritionData = {
            analysis: {
                avgCalories: 2100,
                avgProtein: 140,
                avgCarbs: 120,
                avgFat: 80,
                avgFiber: 25,
                plantsPerWeek: 28,
                antiInflammatoryScore: 75,
                omadAdherence: 85
            },
            recipes: [
                {
                    name: 'Salată OMAD Completă',
                    calories: 1800,
                    protein: 120,
                    carbs: 80,
                    fat: 90,
                    fiber: 35,
                    codexScore: 95,
                    ingredients: [
                        { name: 'Salmón', quantity: 200, unit: 'g', calories: 400, protein: 50 },
                        { name: 'Avocado', quantity: 1, unit: 'bucată', calories: 300, protein: 4 },
                        { name: 'Spanac', quantity: 100, unit: 'g', calories: 25, protein: 3 }
                    ],
                    instructions: [
                        'Gătește salmonul la grătar',
                        'Taie avocado în cuburi',
                        'Amestecă toate ingredientele'
                    ]
                }
            ],
            mealPlan: {
                luni: {
                    meal: 'Salmón cu Spanac',
                    calories: 1900,
                    protein: 130,
                    carbs: 70,
                    fat: 95,
                    fiber: 30,
                    window: '12:00-20:00'
                },
                marti: {
                    meal: 'Piept de Pui cu Broccoli',
                    calories: 1850,
                    protein: 125,
                    carbs: 60,
                    fat: 85,
                    fiber: 25,
                    window: '13:00-21:00'
                }
            },
            mTORCycle: {
                currentDay: 3,
                phase: 'High Protein'
            }
        };

        console.log('🥗 Nutrition test data prepared:', nutritionData);

        const blob = await excelExporter.generateNutritionExcel(nutritionData, {
            period: 'Test Nutrition Export'
        });

        if (blob && blob.size > 0) {
            console.log('✅ Nutrition Excel export generated successfully:', blob.size, 'bytes');
            await excelExporter.download(blob, 'test-nutrition-export.xlsx');
        } else {
            throw new Error('Nutrition Excel export is empty');
        }

        console.log('🎉 Nutrition Excel export test passed successfully!');
        return true;

    } catch (error) {
        console.error('❌ Nutrition Excel Export test failed:', error);
        return false;
    }
}

// Test Excel components individually
export async function testExcelComponents() {
    console.log('🧪 Testing Excel Components...');

    try {
        const { ExcelExporter } = await import('./lib/services/ExcelExporter.js');
        const exporter = new ExcelExporter();

        // Test workbook initialization
        console.log('📄 Testing workbook initialization...');
        const XLSX = await import('xlsx');
        exporter.workbook = XLSX.utils.book_new();
        if (!exporter.workbook) throw new Error('Workbook initialization failed');
        console.log('✅ Workbook initialized');

        // Test sheet creation
        console.log('📋 Testing sheet creation...');
        const testData = {
            accounts: [
                { name: 'Test Account', balance: 1000, type: 'Curent' }
            ],
            transactions: [
                { date: new Date(), amount: 500, description: 'Test Transaction', category: 'Test', type: 'income' }
            ]
        };

        exporter.createSummarySheet(testData, 'Test Period');
        console.log('✅ Summary sheet created');

        exporter.createTransactionsSheet(testData.transactions, true);
        console.log('✅ Transactions sheet created');

        // Generate blob
        const blob = exporter.generateBlob();
        if (!blob || blob.size === 0) throw new Error('Blob generation failed');

        await exporter.download(blob, 'component-test.xlsx');
        console.log('✅ Excel components test completed successfully!');
        return true;

    } catch (error) {
        console.error('❌ Excel component test failed:', error);
        return false;
    }
}

// Run all tests
export async function runAllExcelTests() {
    console.log('🚀 Starting comprehensive Excel export testing...');

    const results = {
        basic: await testBasicExcelExport(),
        pantry: await testPantryExcelExport(),
        nutrition: await testNutritionExcelExport(),
        components: await testExcelComponents()
    };

    console.log('📊 Excel Test Results Summary:');
    console.log('- Basic Finance Export:', results.basic ? '✅ PASS' : '❌ FAIL');
    console.log('- Pantry Export:', results.pantry ? '✅ PASS' : '❌ FAIL');
    console.log('- Nutrition Export:', results.nutrition ? '✅ PASS' : '❌ FAIL');
    console.log('- Excel Components:', results.components ? '✅ PASS' : '❌ FAIL');

    const allPassed = Object.values(results).every(result => result === true);

    if (allPassed) {
        console.log('🎉 ALL EXCEL TESTS PASSED! Export functionality is fully functional.');
    } else {
        console.log('⚠️ Some Excel tests failed. Check the logs above for details.');
    }

    return results;
}

// Quick test function for browser console
export async function quickExcelTest() {
    console.log('⚡ Quick Excel Export Test...');

    try {
        const { excelExporter } = await import('./lib/services/ExcelExporter.js');

        // Minimal test data
        const data = {
            accounts: [{ name: 'Test', balance: 1000 }],
            transactions: [
                { date: new Date(), amount: 500, description: 'Test Income', type: 'income' },
                { date: new Date(), amount: -200, description: 'Test Expense', type: 'expense' }
            ]
        };

        const blob = await excelExporter.generateFinanceExcel(data);
        await excelExporter.download(blob, 'quick-test.xlsx');

        console.log('✅ Quick Excel test completed successfully!');
        return true;

    } catch (error) {
        console.error('❌ Quick Excel test failed:', error);
        return false;
    }
}

// Instructions for manual testing
console.log(`
🧪 Excel Export Test Script Loaded!

Manual testing instructions:
1. Navigate to the Dashboard page
2. Open Developer Console (F12)
3. Run one of these commands:

   // Quick test (minimal data)
   import('./test-excel-export.js').then(m => m.quickExcelTest());

   // Basic financial test
   import('./test-excel-export.js').then(m => m.testBasicExcelExport());

   // Test pantry export
   import('./test-excel-export.js').then(m => m.testPantryExcelExport());

   // Test nutrition export
   import('./test-excel-export.js').then(m => m.testNutritionExcelExport());

   // Test Excel components
   import('./test-excel-export.js').then(m => m.testExcelComponents());

   // Run all tests
   import('./test-excel-export.js').then(m => m.runAllExcelTests());

4. Check downloads folder for generated Excel files
5. Open Excel files to verify content and formatting

Alternative UI testing:
- Click the "📊 Export Excel" button in the Dashboard header
- Try different quick exports and custom export options
- Verify downloads work properly and files open in Excel

Keyboard shortcuts:
- Ctrl+Shift+X: Toggle Excel export panel
- Ctrl+R: Quick custom Excel export (when panel is open)
- Escape: Close export panel

Expected Excel features:
✅ Multiple worksheets (Sumar, Tranzacții, Analiză, etc.)
✅ Professional formatting with colors and borders
✅ Formulas for automatic calculations
✅ Auto-filters for data exploration
✅ Conditional formatting for status indicators
✅ Proper number formatting (currency, percentages, dates)
✅ Column width optimization
✅ Merged cells for headers
✅ Charts metadata preparation
`);