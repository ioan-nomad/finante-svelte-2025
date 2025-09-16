import jsPDF from 'jspdf';
import 'jspdf-autotable';
import html2canvas from 'html2canvas';

export class PDFExporter {
    constructor() {
        this.doc = null;
        this.pageHeight = 297; // A4 height in mm
        this.pageWidth = 210;  // A4 width in mm
        this.margin = 20;
        this.currentY = this.margin;

        // N-OMAD Suite Colors
        this.colors = {
            primary: [26, 115, 232],   // Albastru N-OMAD
            secondary: [95, 99, 104],   // Gri închis
            success: [52, 168, 83],     // Verde
            danger: [234, 67, 53],      // Roșu
            warning: [251, 188, 4],     // Galben
            dark: [32, 33, 36],         // Negru
            light: [248, 249, 250]      // Alb
        };
    }

    // Initialize new document
    initDocument(orientation = 'portrait') {
        this.doc = new jsPDF(orientation, 'mm', 'a4');
        this.currentY = this.margin;
        return this.doc;
    }

    // Add header with N-OMAD branding
    addHeader(title, subtitle = null) {
        this.doc.setFillColor(...this.colors.primary);
        this.doc.rect(0, 0, this.pageWidth, 30, 'F');

        // Logo/Title
        this.doc.setTextColor(255, 255, 255);
        this.doc.setFontSize(20);
        this.doc.setFont('helvetica', 'bold');
        this.doc.text('N-OMAD SUITE', this.margin, 15);

        // Subtitle
        if (subtitle) {
            this.doc.setFontSize(12);
            this.doc.setFont('helvetica', 'normal');
            this.doc.text(subtitle, this.margin, 22);
        }

        // Date
        const now = new Date();
        const dateStr = now.toLocaleDateString('ro-RO', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        this.doc.setFontSize(10);
        this.doc.text(dateStr, this.pageWidth - this.margin - 40, 22);

        this.currentY = 40;

        // Title
        this.doc.setTextColor(...this.colors.dark);
        this.doc.setFontSize(16);
        this.doc.setFont('helvetica', 'bold');
        this.doc.text(title, this.margin, this.currentY);
        this.currentY += 10;
    }

    // Add section header
    addSectionHeader(text) {
        this.checkPageBreak(15);
        this.doc.setFillColor(...this.colors.light);
        this.doc.rect(this.margin, this.currentY - 5, this.pageWidth - 2 * this.margin, 10, 'F');

        this.doc.setTextColor(...this.colors.primary);
        this.doc.setFontSize(12);
        this.doc.setFont('helvetica', 'bold');
        this.doc.text(text, this.margin + 2, this.currentY);
        this.currentY += 12;
    }

    // Check if we need a page break
    checkPageBreak(requiredSpace) {
        if (this.currentY + requiredSpace > this.pageHeight - this.margin) {
            this.doc.addPage();
            this.currentY = this.margin;
        }
    }

    // Add text with automatic wrapping
    addText(text, fontSize = 10, fontStyle = 'normal') {
        this.doc.setFontSize(fontSize);
        this.doc.setFont('helvetica', fontStyle);
        this.doc.setTextColor(...this.colors.dark);

        const lines = this.doc.splitTextToSize(text, this.pageWidth - 2 * this.margin);
        this.checkPageBreak(lines.length * 5);

        this.doc.text(lines, this.margin, this.currentY);
        this.currentY += lines.length * 5 + 3;
    }

    // Add a table
    addTable(headers, data, options = {}) {
        this.checkPageBreak(20);

        const tableOptions = {
            startY: this.currentY,
            head: [headers],
            body: data,
            theme: 'grid',
            headStyles: {
                fillColor: this.colors.primary,
                textColor: [255, 255, 255],
                fontSize: 10,
                fontStyle: 'bold'
            },
            bodyStyles: {
                fontSize: 9,
                textColor: this.colors.dark
            },
            alternateRowStyles: {
                fillColor: this.colors.light
            },
            margin: { left: this.margin, right: this.margin },
            ...options
        };

        this.doc.autoTable(tableOptions);
        this.currentY = this.doc.lastAutoTable.finalY + 10;
    }

    // Capture and add chart from canvas
    async addChart(canvasId, title = null, width = null, height = null) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) {
            console.warn(`Canvas with ID ${canvasId} not found`);
            return;
        }

        try {
            // Create a high-quality canvas capture
            const chartCanvas = await html2canvas(canvas, {
                backgroundColor: '#ffffff',
                scale: 2,
                logging: false,
                useCORS: true
            });

            const imgData = chartCanvas.toDataURL('image/png');

            // Calculate dimensions
            const maxWidth = this.pageWidth - 2 * this.margin;
            const maxHeight = 80;

            let imgWidth = width || maxWidth;
            let imgHeight = height || (chartCanvas.height * imgWidth) / chartCanvas.width;

            if (imgHeight > maxHeight) {
                imgHeight = maxHeight;
                imgWidth = (chartCanvas.width * imgHeight) / chartCanvas.height;
            }

            this.checkPageBreak(imgHeight + 15);

            if (title) {
                this.doc.setFontSize(11);
                this.doc.setFont('helvetica', 'bold');
                this.doc.setTextColor(...this.colors.dark);
                this.doc.text(title, this.margin, this.currentY);
                this.currentY += 8;
            }

            // Center the image
            const xPosition = (this.pageWidth - imgWidth) / 2;
            this.doc.addImage(imgData, 'PNG', xPosition, this.currentY, imgWidth, imgHeight);
            this.currentY += imgHeight + 10;

        } catch (error) {
            console.error(`Error capturing chart ${canvasId}:`, error);
            this.addText(`[Grafic ${canvasId} nu a putut fi capturat]`, 9, 'italic');
        }
    }

    // Add summary statistics
    addStatsSummary(stats) {
        this.addSectionHeader('📊 SUMAR STATISTICI');

        const statsData = [
            ['Venituri Totale', `${stats.income?.toFixed(2) || '0.00'} RON`],
            ['Cheltuieli Totale', `${stats.expenses?.toFixed(2) || '0.00'} RON`],
            ['Economii', `${stats.savings?.toFixed(2) || '0.00'} RON`],
            ['Procent Economisit', `${stats.percentSaved || 0}%`],
            ['Sold Total Conturi', `${stats.totalBalance?.toFixed(2) || '0.00'} RON`]
        ];

        this.addTable(['Indicator', 'Valoare'], statsData, {
            columnStyles: {
                0: { fontStyle: 'bold', cellWidth: 70 },
                1: { cellWidth: 50, halign: 'right' }
            }
        });
    }

    // Add transactions table
    addTransactionsTable(transactions, maxRows = 50) {
        if (!transactions || transactions.length === 0) {
            this.addText('Nu există tranzacții de afișat.');
            return;
        }

        this.addSectionHeader('💳 TRANZACȚII RECENTE');

        const limitedTransactions = transactions
            .slice(0, maxRows)
            .map(tx => [
                new Date(tx.date).toLocaleDateString('ro-RO'),
                tx.description || 'N/A',
                tx.category || 'Necategorizat',
                tx.type === 'income' ? '+' : '-',
                `${Math.abs(tx.amount).toFixed(2)} RON`
            ]);

        this.addTable(
            ['Data', 'Descriere', 'Categorie', 'Tip', 'Sumă'],
            limitedTransactions,
            {
                columnStyles: {
                    0: { cellWidth: 25 },
                    1: { cellWidth: 60 },
                    2: { cellWidth: 35 },
                    3: { cellWidth: 15, halign: 'center' },
                    4: { cellWidth: 30, halign: 'right' }
                }
            }
        );

        if (transactions.length > maxRows) {
            this.addText(`... și încă ${transactions.length - maxRows} tranzacții`, 9, 'italic');
        }
    }

    // Add accounts summary
    addAccountsSummary(accounts) {
        if (!accounts || accounts.length === 0) {
            this.addText('Nu există conturi de afișat.');
            return;
        }

        this.addSectionHeader('🏦 CONTURI BANCARE');

        const accountsData = accounts.map(acc => [
            acc.name || 'Cont Nenumit',
            acc.type || 'Necunoscut',
            `${acc.balance?.toFixed(2) || '0.00'} RON`,
            acc.description || 'Fără descriere'
        ]);

        this.addTable(
            ['Nume Cont', 'Tip', 'Sold', 'Descriere'],
            accountsData,
            {
                columnStyles: {
                    0: { cellWidth: 40, fontStyle: 'bold' },
                    1: { cellWidth: 30 },
                    2: { cellWidth: 30, halign: 'right' },
                    3: { cellWidth: 65 }
                }
            }
        );
    }

    // Add budgets summary
    addBudgetsSummary(budgets) {
        if (!budgets || budgets.length === 0) {
            this.addText('Nu există bugete de afișat.');
            return;
        }

        this.addSectionHeader('📋 BUGETE');

        const budgetsData = budgets.map(budget => {
            const spent = budget.spent || 0;
            const limit = budget.limit || 0;
            const percentage = limit > 0 ? Math.round((spent / limit) * 100) : 0;

            return [
                budget.name || 'Buget Nenumit',
                budget.category || 'Necategorizat',
                `${limit.toFixed(2)} RON`,
                `${spent.toFixed(2)} RON`,
                `${percentage}%`
            ];
        });

        this.addTable(
            ['Nume', 'Categorie', 'Limită', 'Cheltuit', '%'],
            budgetsData,
            {
                columnStyles: {
                    0: { cellWidth: 40, fontStyle: 'bold' },
                    1: { cellWidth: 35 },
                    2: { cellWidth: 25, halign: 'right' },
                    3: { cellWidth: 25, halign: 'right' },
                    4: { cellWidth: 20, halign: 'center' }
                }
            }
        );
    }

    // Add goals summary
    addGoalsSummary(goals) {
        if (!goals || goals.length === 0) {
            this.addText('Nu există obiective de afișat.');
            return;
        }

        this.addSectionHeader('🎯 OBIECTIVE FINANCIARE');

        const goalsData = goals.map(goal => {
            const current = goal.current || 0;
            const target = goal.target || 0;
            const percentage = target > 0 ? Math.round((current / target) * 100) : 0;

            return [
                goal.name || 'Obiectiv Nenumit',
                `${target.toFixed(2)} RON`,
                `${current.toFixed(2)} RON`,
                `${percentage}%`,
                goal.deadline ? new Date(goal.deadline).toLocaleDateString('ro-RO') : 'N/A'
            ];
        });

        this.addTable(
            ['Nume', 'Țintă', 'Progres', '%', 'Deadline'],
            goalsData,
            {
                columnStyles: {
                    0: { cellWidth: 45, fontStyle: 'bold' },
                    1: { cellWidth: 30, halign: 'right' },
                    2: { cellWidth: 30, halign: 'right' },
                    3: { cellWidth: 20, halign: 'center' },
                    4: { cellWidth: 30, halign: 'center' }
                }
            }
        );
    }

    // Add footer
    addFooter() {
        const pageCount = this.doc.internal.getNumberOfPages();

        for (let i = 1; i <= pageCount; i++) {
            this.doc.setPage(i);

            // Footer line
            this.doc.setDrawColor(...this.colors.secondary);
            this.doc.line(this.margin, this.pageHeight - 15, this.pageWidth - this.margin, this.pageHeight - 15);

            // Footer text
            this.doc.setFontSize(8);
            this.doc.setTextColor(...this.colors.secondary);
            this.doc.text(
                'Generat cu N-OMAD Suite | Confidențial',
                this.margin,
                this.pageHeight - 10
            );

            // Page number
            this.doc.text(
                `Pagina ${i} din ${pageCount}`,
                this.pageWidth - this.margin - 20,
                this.pageHeight - 10
            );
        }
    }

    // Main export function for financial reports
    async generateFinancialReport(data, options = {}) {
        const {
            period = 'Raport Financiar',
            includeCharts = true,
            includeTransactions = true,
            format = 'detailed', // 'detailed', 'summary', 'executive'
            charts = []
        } = options;

        this.initDocument();

        // Header
        this.addHeader(`Raport Financiar - ${period}`, 'N-OMAD Suite Financial Analytics');

        // Executive Summary (for all formats)
        if (data.stats) {
            this.addStatsSummary(data.stats);
        }

        // Charts (if enabled and available)
        if (includeCharts && charts.length > 0) {
            this.addSectionHeader('📈 GRAFICE ȘI ANALIZE');
            for (const chartId of charts) {
                const chartTitle = this.getChartTitle(chartId);
                await this.addChart(chartId, chartTitle);
            }
        }

        // Detailed content based on format
        if (format === 'detailed' || format === 'summary') {
            // Accounts
            if (data.accounts) {
                this.addAccountsSummary(data.accounts);
            }

            // Budgets
            if (data.budgets) {
                this.addBudgetsSummary(data.budgets);
            }

            // Goals
            if (data.goals) {
                this.addGoalsSummary(data.goals);
            }

            // Transactions (only for detailed)
            if (format === 'detailed' && includeTransactions && data.transactions) {
                this.addTransactionsTable(data.transactions);
            }
        }

        // Footer
        this.addFooter();

        return this.doc.output('blob');
    }

    // Generate pantry report
    async generatePantryReport(data, options = {}) {
        const { period = 'Raport Pantry' } = options;

        this.initDocument();
        this.addHeader(`${period}`, 'N-OMAD Suite Pantry Management');

        if (data.inventory) {
            this.addSectionHeader('📦 INVENTAR PANTRY');

            const inventoryData = data.inventory.map(item => [
                item.name || 'Produs Nenumit',
                `${item.quantity || 0} ${item.unit || 'bucăți'}`,
                item.category || 'Necategorizat',
                item.expiryDate ? new Date(item.expiryDate).toLocaleDateString('ro-RO') : 'N/A',
                item.location || 'N/A'
            ]);

            this.addTable(
                ['Produs', 'Cantitate', 'Categorie', 'Expirare', 'Locație'],
                inventoryData
            );
        }

        if (data.shoppingList) {
            this.addSectionHeader('🛒 LISTĂ CUMPĂRĂTURI');

            const shoppingData = data.shoppingList.map(item => [
                item.name || 'Produs',
                `${item.quantity || 1} ${item.unit || 'bucăți'}`,
                item.priority || 'Normal',
                item.estimated_cost ? `${item.estimated_cost.toFixed(2)} RON` : 'N/A'
            ]);

            this.addTable(
                ['Produs', 'Cantitate', 'Prioritate', 'Cost Estimat'],
                shoppingData
            );
        }

        this.addFooter();
        return this.doc.output('blob');
    }

    // Generate nutrition report
    async generateNutritionReport(data, options = {}) {
        const { period = 'Raport Nutriție' } = options;

        this.initDocument();
        this.addHeader(`${period}`, 'N-OMAD Suite Nutrition Tracker');

        if (data.meals) {
            this.addSectionHeader('🍽️ PLANUL DE MESE');

            const mealsData = data.meals.map(meal => [
                new Date(meal.date).toLocaleDateString('ro-RO'),
                meal.type || 'N/A',
                meal.recipe || 'Rețetă personalizată',
                `${meal.calories || 0} kcal`,
                `${meal.protein || 0}g proteină`
            ]);

            this.addTable(
                ['Data', 'Tip Masă', 'Rețetă', 'Calorii', 'Proteină'],
                mealsData
            );
        }

        if (data.recipes) {
            this.addSectionHeader('📝 REȚETE FAVORITE');

            data.recipes.slice(0, 10).forEach(recipe => {
                this.addText(`🍳 ${recipe.name}`, 11, 'bold');
                this.addText(`Timp preparare: ${recipe.prep_time || 'N/A'} min`);
                this.addText(`Ingrediente: ${recipe.ingredients?.length || 0} bucăți`);
                this.addText(`Calorii: ${recipe.calories || 'N/A'} kcal`);
                this.currentY += 3;
            });
        }

        this.addFooter();
        return this.doc.output('blob');
    }

    // Helper function to get chart titles
    getChartTitle(chartId) {
        const titles = {
            'categoryChart': 'Cheltuieli pe Categorii',
            'trendChart': 'Trend Lunar',
            'topCategoriesChart': 'Top Categorii Cheltuieli',
            'accountChart': 'Distribuție Conturi',
            'expenseChart': 'Grafic Cheltuieli',
            'incomeChart': 'Grafic Venituri',
            'balanceChart': 'Evoluție Sold',
            'budgetChart': 'Status Bugete'
        };
        return titles[chartId] || `Grafic ${chartId}`;
    }

    // Download the PDF
    async download(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // Quick export functions
    async quickFinancialExport(data) {
        const blob = await this.generateFinancialReport(data, {
            period: `Raport Rapid ${new Date().toLocaleDateString('ro-RO')}`,
            includeCharts: false,
            includeTransactions: false,
            format: 'summary'
        });

        await this.download(blob, `raport-financiar-rapid-${new Date().toISOString().split('T')[0]}.pdf`);
    }

    async quickMonthlyExport(data) {
        const month = new Date().toLocaleDateString('ro-RO', { month: 'long', year: 'numeric' });
        const blob = await this.generateFinancialReport(data, {
            period: `Raport Lunar ${month}`,
            includeCharts: true,
            includeTransactions: true,
            format: 'detailed',
            charts: ['categoryChart', 'trendChart', 'accountChart']
        });

        await this.download(blob, `raport-lunar-${new Date().toISOString().split('T')[0]}.pdf`);
    }
}

// Export singleton instance
export const pdfExporter = new PDFExporter();