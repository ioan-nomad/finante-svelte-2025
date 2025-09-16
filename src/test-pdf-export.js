// Test script pentru funcționalitatea PDF Export
// Rulează în browser console pentru testare rapidă

// Test basic PDF generation
export async function testBasicPDFExport() {
    console.log('🧪 Starting PDF Export Test...');

    try {
        // Import PDFExporter
        const { pdfExporter } = await import('./lib/services/PDFExporter.js');

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
                { name: 'Cont Principal', type: 'Curent', balance: 8000, description: 'Cont principal pentru venituri' },
                { name: 'Cont Economii', type: 'Economii', balance: 4000, description: 'Cont pentru economii și investiții' }
            ],
            transactions: [
                { date: new Date(), description: 'Salariu', amount: 3000, category: 'Venituri', type: 'income' },
                { date: new Date(), description: 'Chirie', amount: 1000, category: 'Locuință', type: 'expense' },
                { date: new Date(), description: 'Mâncare', amount: 500, category: 'Alimentație', type: 'expense' },
                { date: new Date(), description: 'Transport', amount: 200, category: 'Transport', type: 'expense' },
                { date: new Date(), description: 'Utilități', amount: 300, category: 'Utilități', type: 'expense' }
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

        // Test 1: Summary Report
        console.log('📋 Test 1: Summary Report');
        const summaryBlob = await pdfExporter.generateFinancialReport(testData, {
            period: 'Test Summary Report',
            includeCharts: false,
            includeTransactions: false,
            format: 'summary'
        });

        if (summaryBlob && summaryBlob.size > 0) {
            console.log('✅ Summary report generated successfully:', summaryBlob.size, 'bytes');
            await pdfExporter.download(summaryBlob, 'test-summary-report.pdf');
        } else {
            throw new Error('Summary report is empty');
        }

        // Wait a bit before next test
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Test 2: Detailed Report
        console.log('📋 Test 2: Detailed Report');
        const detailedBlob = await pdfExporter.generateFinancialReport(testData, {
            period: 'Test Detailed Report',
            includeCharts: false, // No charts available in test environment
            includeTransactions: true,
            format: 'detailed'
        });

        if (detailedBlob && detailedBlob.size > 0) {
            console.log('✅ Detailed report generated successfully:', detailedBlob.size, 'bytes');
            await pdfExporter.download(detailedBlob, 'test-detailed-report.pdf');
        } else {
            throw new Error('Detailed report is empty');
        }

        // Wait a bit before next test
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Test 3: Quick Financial Export
        console.log('📋 Test 3: Quick Financial Export');
        await pdfExporter.quickFinancialExport(testData);
        console.log('✅ Quick financial export completed');

        console.log('🎉 All PDF export tests passed successfully!');
        return true;

    } catch (error) {
        console.error('❌ PDF Export test failed:', error);
        console.error('Stack trace:', error.stack);
        return false;
    }
}

// Test PDF components separately
export async function testPDFComponents() {
    console.log('🧪 Testing PDF Components...');

    try {
        const { PDFExporter } = await import('./lib/services/PDFExporter.js');
        const exporter = new PDFExporter();

        // Test document initialization
        console.log('📄 Testing document initialization...');
        const doc = exporter.initDocument();
        if (!doc) throw new Error('Document initialization failed');
        console.log('✅ Document initialized');

        // Test header
        console.log('📋 Testing header...');
        exporter.addHeader('Test Report', 'Component Test');
        console.log('✅ Header added');

        // Test section
        console.log('📋 Testing section...');
        exporter.addSectionHeader('Test Section');
        console.log('✅ Section added');

        // Test text
        console.log('📋 Testing text...');
        exporter.addText('This is a test text to verify that the PDF generation works correctly.');
        console.log('✅ Text added');

        // Test table
        console.log('📋 Testing table...');
        exporter.addTable(
            ['Column 1', 'Column 2', 'Column 3'],
            [
                ['Row 1, Cell 1', 'Row 1, Cell 2', 'Row 1, Cell 3'],
                ['Row 2, Cell 1', 'Row 2, Cell 2', 'Row 2, Cell 3']
            ]
        );
        console.log('✅ Table added');

        // Test footer
        console.log('📋 Testing footer...');
        exporter.addFooter();
        console.log('✅ Footer added');

        // Generate and download
        const blob = doc.output('blob');
        await exporter.download(blob, 'component-test.pdf');

        console.log('🎉 PDF component test completed successfully!');
        return true;

    } catch (error) {
        console.error('❌ PDF component test failed:', error);
        return false;
    }
}

// Test charts capture (requires charts to be present on page)
export async function testChartsCapture() {
    console.log('🧪 Testing Charts Capture...');

    const chartIds = ['categoryChart', 'trendChart', 'topCategoriesChart', 'accountChart'];
    const availableCharts = [];

    chartIds.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            availableCharts.push(id);
            console.log(`✅ Chart found: ${id}`);
        } else {
            console.log(`⚠️ Chart not found: ${id}`);
        }
    });

    if (availableCharts.length === 0) {
        console.log('⚠️ No charts available for testing. Please navigate to the Dashboard first.');
        return false;
    }

    try {
        const { pdfExporter } = await import('./lib/services/PDFExporter.js');

        // Create a test document with charts
        pdfExporter.initDocument();
        pdfExporter.addHeader('Charts Test Report', 'Testing Chart Capture');

        // Capture each available chart
        for (const chartId of availableCharts) {
            console.log(`📊 Capturing chart: ${chartId}`);
            await pdfExporter.addChart(chartId, `Test Chart: ${chartId}`);
            console.log(`✅ Chart captured: ${chartId}`);
        }

        pdfExporter.addFooter();
        const blob = pdfExporter.doc.output('blob');
        await pdfExporter.download(blob, 'charts-test.pdf');

        console.log('🎉 Charts capture test completed successfully!');
        return true;

    } catch (error) {
        console.error('❌ Charts capture test failed:', error);
        return false;
    }
}

// Run all tests
export async function runAllTests() {
    console.log('🚀 Starting comprehensive PDF export testing...');

    const results = {
        basic: await testBasicPDFExport(),
        components: await testPDFComponents(),
        charts: await testChartsCapture()
    };

    console.log('📊 Test Results Summary:');
    console.log('- Basic PDF Export:', results.basic ? '✅ PASS' : '❌ FAIL');
    console.log('- PDF Components:', results.components ? '✅ PASS' : '❌ FAIL');
    console.log('- Charts Capture:', results.charts ? '✅ PASS' : '❌ FAIL');

    const allPassed = Object.values(results).every(result => result === true);

    if (allPassed) {
        console.log('🎉 ALL TESTS PASSED! PDF Export is fully functional.');
    } else {
        console.log('⚠️ Some tests failed. Check the logs above for details.');
    }

    return results;
}

// Instructions for manual testing
console.log(`
🧪 PDF Export Test Script Loaded!

Manual testing instructions:
1. Navigate to the Dashboard page
2. Open Developer Console (F12)
3. Run one of these commands:

   // Basic test (no charts needed)
   import('./test-pdf-export.js').then(m => m.testBasicPDFExport());

   // Test PDF components
   import('./test-pdf-export.js').then(m => m.testPDFComponents());

   // Test charts (requires Dashboard page)
   import('./test-pdf-export.js').then(m => m.testChartsCapture());

   // Run all tests
   import('./test-pdf-export.js').then(m => m.runAllTests());

4. Check downloads folder for generated PDF files
5. Verify that PDFs open correctly and contain expected content

Alternative quick test:
- Click the "Export PDF" button in the Dashboard header
- Try both quick exports and custom export options
- Verify downloads work properly

Keyboard shortcuts:
- Ctrl+Shift+P: Toggle export panel
- Ctrl+E: Quick custom export (when panel is open)
- Escape: Close export panel
`);