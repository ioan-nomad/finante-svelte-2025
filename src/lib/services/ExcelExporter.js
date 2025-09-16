import * as XLSX from 'xlsx';

/**
 * N-OMAD Suite Excel Exporter Service v1.0
 * Export avansat cu formatting, formule și grafice pentru Excel
 * @author Ioan Nomad
 * @date December 2024
 */
export class ExcelExporter {
    constructor() {
        this.workbook = null;
        this.activeSheet = null;

        // Stiluri predefinite pentru celule
        this.styles = {
            header: {
                font: { bold: true, sz: 14, color: { rgb: "FFFFFF" } },
                fill: { fgColor: { rgb: "1a73e8" } },
                alignment: { horizontal: "center", vertical: "center" },
                border: {
                    top: { style: "thin", color: { rgb: "000000" } },
                    bottom: { style: "thin", color: { rgb: "000000" } },
                    left: { style: "thin", color: { rgb: "000000" } },
                    right: { style: "thin", color: { rgb: "000000" } }
                }
            },
            subheader: {
                font: { bold: true, sz: 12, color: { rgb: "1a73e8" } },
                fill: { fgColor: { rgb: "E3F2FD" } },
                alignment: { horizontal: "left" }
            },
            title: {
                font: { bold: true, sz: 18, color: { rgb: "202124" } },
                alignment: { horizontal: "center" }
            },
            currency: {
                numFmt: '#,##0.00 "RON"',
                alignment: { horizontal: "right" }
            },
            percentage: {
                numFmt: '0.00%',
                alignment: { horizontal: "center" }
            },
            date: {
                numFmt: 'dd/mm/yyyy',
                alignment: { horizontal: "center" }
            },
            positive: {
                font: { color: { rgb: "34a853" } },
                numFmt: '+#,##0.00 "RON"'
            },
            negative: {
                font: { color: { rgb: "ea4335" } },
                numFmt: '-#,##0.00 "RON"'
            },
            warning: {
                fill: { fgColor: { rgb: "FFF3CD" } },
                font: { color: { rgb: "856404" } }
            },
            success: {
                fill: { fgColor: { rgb: "D4EDDA" } },
                font: { color: { rgb: "155724" } }
            },
            danger: {
                fill: { fgColor: { rgb: "F8D7DA" } },
                font: { color: { rgb: "721C24" } }
            }
        };

        // Template-uri pentru diferite tipuri de rapoarte
        this.templates = {
            finance: {
                sheets: ['Sumar', 'Tranzacții', 'Bugete', 'Obiective', 'Analiză'],
                charts: true,
                pivotTables: true
            },
            pantry: {
                sheets: ['Inventar', 'Shopping List', 'Istoric Prețuri', 'Expiră'],
                charts: true,
                pivotTables: false
            },
            nutrition: {
                sheets: ['Analiză', 'Rețete', 'Plan Săptămânal', 'mTOR', 'Shopping'],
                charts: true,
                pivotTables: false
            }
        };
    }

    /**
     * Generează raport Excel pentru Finance
     */
    async generateFinanceExcel(data, options = {}) {
        const {
            includeCharts = true,
            includePivot = true,
            includeFormulas = true,
            period = 'Luna curentă'
        } = options;

        // Creează workbook nou
        this.workbook = XLSX.utils.book_new();

        // Sheet 1: Dashboard Summary
        this.createSummarySheet(data, period);

        // Sheet 2: Tranzacții Detaliate
        if (data.transactions && data.transactions.length > 0) {
            this.createTransactionsSheet(data.transactions, includeFormulas);
        }

        // Sheet 3: Bugete
        if (data.budgets && data.budgets.length > 0) {
            this.createBudgetsSheet(data.budgets, includeCharts);
        }

        // Sheet 4: Obiective Financiare
        if (data.goals && data.goals.length > 0) {
            this.createGoalsSheet(data.goals);
        }

        // Sheet 5: Analiză și Pivot Tables
        if (includePivot && data.transactions) {
            this.createAnalysisSheet(data);
        }

        // Sheet 6: Cash Flow
        this.createCashFlowSheet(data);

        // Generează blob pentru download
        return this.generateBlob();
    }

    /**
     * Generează raport Excel pentru Pantry
     */
    async generatePantryExcel(data, options = {}) {
        this.workbook = XLSX.utils.book_new();

        // Sheet 1: Inventar Complet
        if (data.inventory && data.inventory.length > 0) {
            this.createInventorySheet(data.inventory);
        }

        // Sheet 2: Shopping List Optimizată
        if (data.shoppingList && data.shoppingList.length > 0) {
            this.createShoppingSheet(data.shoppingList);
        }

        // Sheet 3: Analiză Prețuri
        if (data.priceHistory && data.priceHistory.length > 0) {
            this.createPriceAnalysisSheet(data.priceHistory);
        }

        // Sheet 4: Produse care Expiră
        if (data.expiring && data.expiring.length > 0) {
            this.createExpiringSheet(data.expiring);
        }

        // Sheet 5: Statistici și Trends
        this.createPantryStatsSheet(data);

        return this.generateBlob();
    }

    /**
     * Generează raport Excel pentru Nutrition
     */
    async generateNutritionExcel(data, options = {}) {
        this.workbook = XLSX.utils.book_new();

        // Sheet 1: Analiză Nutrițională
        this.createNutritionAnalysisSheet(data.analysis);

        // Sheet 2: Rețete Detaliate
        if (data.recipes && data.recipes.length > 0) {
            this.createRecipesSheet(data.recipes);
        }

        // Sheet 3: Plan Săptămânal
        if (data.mealPlan) {
            this.createMealPlanSheet(data.mealPlan);
        }

        // Sheet 4: Ciclu mTOR
        if (data.mTORCycle) {
            this.createmTORSheet(data.mTORCycle);
        }

        // Sheet 5: Shopping List Nutriție
        this.createNutritionShoppingSheet(data);

        // Sheet 6: Tracker Biomarkeri
        if (data.biomarkers) {
            this.createBiomarkersSheet(data.biomarkers);
        }

        return this.generateBlob();
    }

    /**
     * === SHEET BUILDERS ===
     */

    createSummarySheet(data, period) {
        const ws_data = [];

        // Titlu principal
        ws_data.push(['N-OMAD SUITE - RAPORT FINANCIAR']);
        ws_data.push([period]);
        ws_data.push([]); // Rând gol

        // Header secțiune
        ws_data.push(['SUMAR EXECUTIV']);
        ws_data.push([]); // Rând gol

        // Calculează metrici
        let totalBalance = 0;
        let totalIncome = 0;
        let totalExpenses = 0;

        if (data.accounts && Array.isArray(data.accounts)) {
            data.accounts.forEach(acc => {
                totalBalance += acc.balance || 0;
            });
        }

        if (data.transactions && Array.isArray(data.transactions)) {
            data.transactions.forEach(t => {
                if (t.type === 'income' || t.amount > 0) {
                    totalIncome += Math.abs(t.amount || 0);
                } else if (t.type === 'expense' || t.amount < 0) {
                    totalExpenses += Math.abs(t.amount || 0);
                }
            });
        }

        const savingsAmount = totalIncome - totalExpenses;
        const savingsRate = totalIncome > 0 ? (savingsAmount / totalIncome) : 0;

        // Adaugă metrici principale
        ws_data.push(['Indicator', 'Valoare', 'Status']);
        ws_data.push(['Balanță Totală', totalBalance, totalBalance > 0 ? 'OK' : 'Atenție']);
        ws_data.push(['Venituri Perioadă', totalIncome, '']);
        ws_data.push(['Cheltuieli Perioadă', totalExpenses, '']);
        ws_data.push(['Economii Perioadă', savingsAmount, savingsAmount > 0 ? 'Pozitiv' : 'Negativ']);
        ws_data.push(['Rata Economisire', savingsRate, savingsRate > 0.1 ? 'Bună' : 'Scăzută']);
        ws_data.push([]); // Rând gol

        // Detalii conturi
        ws_data.push(['DETALII CONTURI']);
        ws_data.push(['Cont', 'Tip', 'Balanță', 'Ultima Tranzacție']);

        if (data.accounts && Array.isArray(data.accounts)) {
            data.accounts.forEach((acc, index) => {
                const lastTransaction = data.transactions
                    ?.filter(t => t.account === acc.name || t.account === index.toString())
                    ?.sort((a, b) => new Date(b.date) - new Date(a.date))[0];

                ws_data.push([
                    acc.name || `Cont ${index + 1}`,
                    acc.type || 'Principal',
                    acc.balance || 0,
                    lastTransaction ? new Date(lastTransaction.date) : 'N/A'
                ]);
            });
        }

        ws_data.push([]); // Rând gol

        // Top categorii cheltuieli
        ws_data.push(['TOP CATEGORII CHELTUIELI']);
        ws_data.push(['Categorie', 'Suma', 'Procent', 'Nr. Tranzacții']);

        if (data.transactions && Array.isArray(data.transactions)) {
            const categoryExpenses = {};
            data.transactions
                .filter(t => t.type === 'expense' || t.amount < 0)
                .forEach(t => {
                    const cat = t.category || 'Necategorizat';
                    if (!categoryExpenses[cat]) {
                        categoryExpenses[cat] = { sum: 0, count: 0 };
                    }
                    categoryExpenses[cat].sum += Math.abs(t.amount || 0);
                    categoryExpenses[cat].count++;
                });

            Object.entries(categoryExpenses)
                .sort((a, b) => b[1].sum - a[1].sum)
                .slice(0, 10)
                .forEach(([cat, info]) => {
                    const percentage = totalExpenses > 0 ? (info.sum / totalExpenses) : 0;
                    ws_data.push([cat, info.sum, percentage, info.count]);
                });
        }

        // Creează worksheet
        const ws = XLSX.utils.aoa_to_sheet(ws_data);

        // Setează lățimi coloane
        ws['!cols'] = [
            { wch: 25 }, // Coloana A
            { wch: 20 }, // Coloana B
            { wch: 15 }, // Coloana C
            { wch: 20 }  // Coloana D
        ];

        // Merge cells pentru titlu
        ws['!merges'] = [
            { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } }, // A1:D1
            { s: { r: 1, c: 0 }, e: { r: 1, c: 3 } }, // A2:D2
            { s: { r: 3, c: 0 }, e: { r: 3, c: 3 } }  // A4:D4
        ];

        // Adaugă worksheet la workbook
        XLSX.utils.book_append_sheet(this.workbook, ws, "Sumar");
    }

    createTransactionsSheet(transactions, includeFormulas = true) {
        const ws_data = [];

        // Header
        ws_data.push(['REGISTRU TRANZACȚII']);
        ws_data.push([]);
        ws_data.push(['Data', 'Descriere', 'Categorie', 'Cont', 'Suma', 'Balanță', 'Tip', 'Tags']);

        // Sortează tranzacțiile după dată
        const sortedTransactions = [...transactions].sort((a, b) =>
            new Date(a.date) - new Date(b.date)
        );

        let runningBalance = 0;
        sortedTransactions.forEach((t, index) => {
            const amount = t.amount || 0;
            runningBalance += amount;
            ws_data.push([
                new Date(t.date),
                t.description || '',
                t.category || 'Necategorizat',
                t.account || 'Principal',
                amount,
                runningBalance,
                t.type || (amount > 0 ? 'Venit' : 'Cheltuială'),
                t.tags ? (Array.isArray(t.tags) ? t.tags.join(', ') : t.tags) : ''
            ]);
        });

        // Adaugă totaluri cu formule
        if (includeFormulas && sortedTransactions.length > 0) {
            ws_data.push([]);
            ws_data.push(['TOTALURI', '', '', '', '', '', '', '']);

            const startRow = 4;
            const endRow = 3 + sortedTransactions.length;

            ws_data.push([
                'Total Venituri',
                '',
                '',
                '',
                { f: `SUMIF(E${startRow}:E${endRow},">0")` },
                '',
                '',
                ''
            ]);

            ws_data.push([
                'Total Cheltuieli',
                '',
                '',
                '',
                { f: `SUMIF(E${startRow}:E${endRow},"<0")` },
                '',
                '',
                ''
            ]);

            ws_data.push([
                'Balanță Finală',
                '',
                '',
                '',
                { f: `SUM(E${startRow}:E${endRow})` },
                '',
                '',
                ''
            ]);
        }

        const ws = XLSX.utils.aoa_to_sheet(ws_data);

        // Lățimi coloane optimizate
        ws['!cols'] = [
            { wch: 12 }, // Data
            { wch: 35 }, // Descriere
            { wch: 15 }, // Categorie
            { wch: 15 }, // Cont
            { wch: 15 }, // Suma
            { wch: 15 }, // Balanță
            { wch: 12 }, // Tip
            { wch: 20 }  // Tags
        ];

        // Adaugă auto-filter
        if (sortedTransactions.length > 0) {
            ws['!autofilter'] = { ref: `A3:H${3 + sortedTransactions.length}` };
        }

        XLSX.utils.book_append_sheet(this.workbook, ws, "Tranzacții");
    }

    createBudgetsSheet(budgets, includeCharts = true) {
        const ws_data = [];

        ws_data.push(['MONITORIZARE BUGETE']);
        ws_data.push([]);
        ws_data.push(['Nume Buget', 'Categorie', 'Limită', 'Cheltuit', 'Rămas', 'Procent Utilizat', 'Status', 'Perioada']);

        budgets.forEach(budget => {
            const spent = budget.spent || 0;
            const limit = budget.limit || 0;
            const remaining = limit - spent;
            const percentage = limit > 0 ? (spent / limit) : 0;
            const status = percentage > 1 ? 'DEPĂȘIT' : percentage > 0.8 ? 'Atenție' : 'OK';

            ws_data.push([
                budget.name || 'Buget Nenumit',
                budget.category || 'General',
                limit,
                spent,
                remaining,
                percentage,
                status,
                budget.period || 'Lunar'
            ]);
        });

        // Adaugă formule pentru totaluri
        if (budgets.length > 0) {
            const startRow = 4;
            const endRow = 3 + budgets.length;

            ws_data.push([]);
            ws_data.push([
                'TOTAL',
                '',
                { f: `SUM(C${startRow}:C${endRow})` },
                { f: `SUM(D${startRow}:D${endRow})` },
                { f: `SUM(E${startRow}:E${endRow})` },
                { f: `AVERAGE(F${startRow}:F${endRow})` },
                '',
                ''
            ]);
        }

        const ws = XLSX.utils.aoa_to_sheet(ws_data);

        // Lățimi coloane
        ws['!cols'] = [
            { wch: 20 }, // Nume
            { wch: 15 }, // Categorie
            { wch: 12 }, // Limită
            { wch: 12 }, // Cheltuit
            { wch: 12 }, // Rămas
            { wch: 15 }, // Procent
            { wch: 10 }, // Status
            { wch: 10 }  // Perioada
        ];

        XLSX.utils.book_append_sheet(this.workbook, ws, "Bugete");
    }

    createGoalsSheet(goals) {
        const ws_data = [];

        ws_data.push(['OBIECTIVE FINANCIARE']);
        ws_data.push([]);
        ws_data.push(['Obiectiv', 'Target', 'Realizat', 'Rămas', 'Progress %', 'Deadline', 'Zile Rămase', 'Necesar Lunar', 'Status']);

        const today = new Date();

        goals.forEach(goal => {
            const target = goal.target || 0;
            const current = goal.current || 0;
            const remaining = target - current;
            const progress = target > 0 ? (current / target) : 0;
            const deadline = goal.deadline ? new Date(goal.deadline) : null;
            const daysRemaining = deadline ? Math.ceil((deadline - today) / (1000 * 60 * 60 * 24)) : null;
            const monthsRemaining = daysRemaining ? Math.ceil(daysRemaining / 30) : null;
            const monthlyRequired = monthsRemaining > 0 ? (remaining / monthsRemaining) : null;
            const status = progress >= 1 ? 'REALIZAT' :
                          daysRemaining < 30 ? 'Urgent' :
                          progress > 0.5 ? 'Pe drum' : 'Început';

            ws_data.push([
                goal.name || 'Obiectiv Nenumit',
                target,
                current,
                remaining,
                progress,
                deadline,
                daysRemaining || 'N/A',
                monthlyRequired || 'N/A',
                status
            ]);
        });

        // Totaluri
        if (goals.length > 0) {
            const startRow = 4;
            const endRow = 3 + goals.length;

            ws_data.push([]);
            ws_data.push([
                'TOTAL',
                { f: `SUM(B${startRow}:B${endRow})` },
                { f: `SUM(C${startRow}:C${endRow})` },
                { f: `SUM(D${startRow}:D${endRow})` },
                { f: `AVERAGE(E${startRow}:E${endRow})` },
                '',
                '',
                '',
                ''
            ]);
        }

        const ws = XLSX.utils.aoa_to_sheet(ws_data);

        ws['!cols'] = [
            { wch: 25 }, // Obiectiv
            { wch: 15 }, // Target
            { wch: 15 }, // Realizat
            { wch: 15 }, // Rămas
            { wch: 12 }, // Progress
            { wch: 12 }, // Deadline
            { wch: 12 }, // Zile
            { wch: 15 }, // Necesar
            { wch: 10 }  // Status
        ];

        XLSX.utils.book_append_sheet(this.workbook, ws, "Obiective");
    }

    createAnalysisSheet(data) {
        const ws_data = [];

        ws_data.push(['ANALIZĂ FINANCIARĂ AVANSATĂ']);
        ws_data.push([]);

        // Trend lunar
        ws_data.push(['TREND LUNAR']);
        ws_data.push(['Luna', 'Venituri', 'Cheltuieli', 'Economii', 'Rata Economisire']);

        // Grupează tranzacțiile pe luni
        const monthlyData = {};
        if (data.transactions && Array.isArray(data.transactions)) {
            data.transactions.forEach(t => {
                const date = new Date(t.date);
                const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

                if (!monthlyData[monthKey]) {
                    monthlyData[monthKey] = { income: 0, expenses: 0 };
                }

                const amount = Math.abs(t.amount || 0);
                if (t.type === 'income' || (t.amount || 0) > 0) {
                    monthlyData[monthKey].income += amount;
                } else {
                    monthlyData[monthKey].expenses += amount;
                }
            });
        }

        Object.entries(monthlyData)
            .sort((a, b) => a[0].localeCompare(b[0]))
            .forEach(([month, data]) => {
                const savings = data.income - data.expenses;
                const savingsRate = data.income > 0 ? (savings / data.income) : 0;

                ws_data.push([
                    month,
                    data.income,
                    data.expenses,
                    savings,
                    savingsRate
                ]);
            });

        ws_data.push([]);

        // Distribuție categorii
        ws_data.push(['DISTRIBUȚIE CHELTUIELI PE CATEGORII']);
        ws_data.push(['Categorie', 'Suma Totală', 'Nr. Tranzacții', 'Medie/Tranzacție', '% din Total']);

        const categoryStats = {};
        let totalExpenses = 0;

        if (data.transactions && Array.isArray(data.transactions)) {
            data.transactions.filter(t => t.type === 'expense' || (t.amount || 0) < 0).forEach(t => {
                const cat = t.category || 'Necategorizat';
                const amount = Math.abs(t.amount || 0);
                if (!categoryStats[cat]) {
                    categoryStats[cat] = { sum: 0, count: 0 };
                }
                categoryStats[cat].sum += amount;
                categoryStats[cat].count++;
                totalExpenses += amount;
            });
        }

        Object.entries(categoryStats)
            .sort((a, b) => b[1].sum - a[1].sum)
            .forEach(([cat, stats]) => {
                ws_data.push([
                    cat,
                    stats.sum,
                    stats.count,
                    stats.count > 0 ? (stats.sum / stats.count) : 0,
                    totalExpenses > 0 ? (stats.sum / totalExpenses) : 0
                ]);
            });

        const ws = XLSX.utils.aoa_to_sheet(ws_data);

        ws['!cols'] = [
            { wch: 20 },
            { wch: 15 },
            { wch: 12 },
            { wch: 15 },
            { wch: 12 }
        ];

        XLSX.utils.book_append_sheet(this.workbook, ws, "Analiză");
    }

    createCashFlowSheet(data) {
        const ws_data = [];

        ws_data.push(['CASH FLOW STATEMENT']);
        ws_data.push([]);
        ws_data.push(['Indicator', 'Valoare', 'Detalii']);
        ws_data.push([]);

        // Cash from operations
        ws_data.push(['ACTIVITĂȚI OPERAȚIONALE']);

        let operatingIncome = 0;
        let operatingExpenses = 0;

        if (data.transactions && Array.isArray(data.transactions)) {
            operatingIncome = data.transactions
                .filter(t => t.type === 'income' && t.category !== 'Transfer')
                .reduce((sum, t) => sum + Math.abs(t.amount || 0), 0);

            operatingExpenses = data.transactions
                .filter(t => t.type === 'expense' && t.category !== 'Transfer')
                .reduce((sum, t) => sum + Math.abs(t.amount || 0), 0);
        }

        ws_data.push(['Venituri operaționale', operatingIncome, '']);
        ws_data.push(['Cheltuieli operaționale', -operatingExpenses, '']);
        ws_data.push(['Cash Flow Operațional Net', operatingIncome - operatingExpenses, '']);
        ws_data.push([]);

        // Cash from investing
        ws_data.push(['ACTIVITĂȚI DE INVESTIȚIE']);

        let investments = 0;
        if (data.transactions && Array.isArray(data.transactions)) {
            investments = data.transactions
                .filter(t => t.category === 'Investiții')
                .reduce((sum, t) => sum + (t.amount || 0), 0);
        }

        ws_data.push(['Investiții', investments, '']);
        ws_data.push(['Cash Flow Investiții Net', investments, '']);
        ws_data.push([]);

        // Cash from financing
        ws_data.push(['ACTIVITĂȚI DE FINANȚARE']);

        let loans = 0;
        if (data.transactions && Array.isArray(data.transactions)) {
            loans = data.transactions
                .filter(t => t.category === 'Împrumut')
                .reduce((sum, t) => sum + (t.amount || 0), 0);
        }

        ws_data.push(['Împrumuturi', loans, '']);
        ws_data.push(['Cash Flow Finanțare Net', loans, '']);
        ws_data.push([]);

        // Net change
        const netChange = operatingIncome - operatingExpenses + investments + loans;
        ws_data.push(['SCHIMBARE NETĂ ÎN CASH', netChange, netChange > 0 ? 'Creștere' : 'Scădere']);

        const ws = XLSX.utils.aoa_to_sheet(ws_data);

        ws['!cols'] = [
            { wch: 30 },
            { wch: 20 },
            { wch: 20 }
        ];

        XLSX.utils.book_append_sheet(this.workbook, ws, "Cash Flow");
    }

    // Pantry-related sheets
    createInventorySheet(inventory) {
        const ws_data = [];

        ws_data.push(['INVENTAR PANTRY']);
        ws_data.push([]);
        ws_data.push([
            'Produs', 'Categorie', 'Cantitate', 'Unitate',
            'Preț/Unitate', 'Valoare Totală', 'Data Expirare',
            'Zile până Expiră', 'Locație', 'Status'
        ]);

        const today = new Date();

        inventory.forEach(item => {
            const quantity = item.quantity || 0;
            const price = item.price || 0;
            const totalValue = quantity * price;
            const expiryDate = item.expiryDate ? new Date(item.expiryDate) : null;
            const daysToExpiry = expiryDate ?
                Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24)) : null;
            const status = daysToExpiry !== null ?
                (daysToExpiry < 0 ? 'EXPIRAT' :
                 daysToExpiry < 7 ? 'Expiră curând' :
                 daysToExpiry < 30 ? 'Atenție' : 'OK') : 'OK';

            ws_data.push([
                item.name || 'Produs Nenumit',
                item.category || 'General',
                quantity,
                item.unit || 'buc',
                price,
                totalValue,
                expiryDate,
                daysToExpiry || 'N/A',
                item.location || 'Principal',
                status
            ]);
        });

        // Totaluri
        if (inventory.length > 0) {
            const startRow = 4;
            const endRow = 3 + inventory.length;

            ws_data.push([]);
            ws_data.push([
                'TOTAL',
                '',
                { f: `SUM(C${startRow}:C${endRow})` },
                'items',
                '',
                { f: `SUM(F${startRow}:F${endRow})` },
                '',
                '',
                '',
                ''
            ]);
        }

        const ws = XLSX.utils.aoa_to_sheet(ws_data);

        ws['!cols'] = [
            { wch: 25 }, // Produs
            { wch: 15 }, // Categorie
            { wch: 10 }, // Cantitate
            { wch: 8 },  // Unitate
            { wch: 12 }, // Preț
            { wch: 15 }, // Valoare
            { wch: 12 }, // Expirare
            { wch: 12 }, // Zile
            { wch: 12 }, // Locație
            { wch: 12 }  // Status
        ];

        // Auto-filter
        if (inventory.length > 0) {
            ws['!autofilter'] = { ref: `A3:J${3 + inventory.length}` };
        }

        XLSX.utils.book_append_sheet(this.workbook, ws, "Inventar");
    }

    // Nutrition-related sheets
    createNutritionAnalysisSheet(analysis = {}) {
        const ws_data = [];

        ws_data.push(['ANALIZĂ NUTRIȚIONALĂ']);
        ws_data.push([]);
        ws_data.push(['Metric', 'Valoare Curentă', 'Target Optim', 'Status']);

        const metrics = [
            {
                name: 'Calorii medii/zi',
                current: analysis.avgCalories || 0,
                target: 2000,
                unit: 'kcal'
            },
            {
                name: 'Proteine medii/zi',
                current: analysis.avgProtein || 0,
                target: 150,
                unit: 'g'
            },
            {
                name: 'Carbohidrați medii/zi',
                current: analysis.avgCarbs || 0,
                target: 100,
                unit: 'g'
            },
            {
                name: 'Grăsimi medii/zi',
                current: analysis.avgFat || 0,
                target: 70,
                unit: 'g'
            },
            {
                name: 'Fibre medii/zi',
                current: analysis.avgFiber || 0,
                target: 30,
                unit: 'g'
            },
            {
                name: 'Plante unice/săptămână',
                current: analysis.plantsPerWeek || 0,
                target: 30,
                unit: 'varietăți'
            },
            {
                name: 'Scor anti-inflamator',
                current: analysis.antiInflammatoryScore || 0,
                target: 80,
                unit: '/100'
            },
            {
                name: 'Adherență OMAD',
                current: analysis.omadAdherence || 0,
                target: 90,
                unit: '%'
            }
        ];

        metrics.forEach(metric => {
            const percentage = metric.target > 0 ? (metric.current / metric.target) : 0;
            const status = percentage >= 0.9 ? 'Excelent' :
                          percentage >= 0.7 ? 'Bun' :
                          percentage >= 0.5 ? 'Acceptabil' : 'Necesită atenție';

            ws_data.push([
                metric.name,
                `${metric.current} ${metric.unit}`,
                `${metric.target} ${metric.unit}`,
                status
            ]);
        });

        const ws = XLSX.utils.aoa_to_sheet(ws_data);

        ws['!cols'] = [
            { wch: 25 },
            { wch: 20 },
            { wch: 20 },
            { wch: 15 }
        ];

        XLSX.utils.book_append_sheet(this.workbook, ws, "Analiză Nutrițională");
    }

    // Helper functions
    applyCellStyle(ws, address, style) {
        if (!ws[address]) return;
        if (!ws[address].s) ws[address].s = {};
        Object.assign(ws[address].s, style);
    }

    setColumnFormat(ws, columnRange, style) {
        // This is a simplified implementation
        // In a real Excel library, you'd set column formatting here
    }

    /**
     * Generează blob pentru download
     */
    generateBlob() {
        const workbook = XLSX.write(this.workbook, {
            bookType: 'xlsx',
            type: 'array'
        });

        return new Blob([workbook], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });
    }

    /**
     * Download Excel file
     */
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

    /**
     * Quick export functions
     */
    async quickFinancialExport(data) {
        const blob = await this.generateFinanceExcel(data, {
            includeCharts: false,
            includePivot: false,
            includeFormulas: true,
            period: `Raport Rapid ${new Date().toLocaleDateString('ro-RO')}`
        });

        await this.download(blob, `raport-financiar-excel-${new Date().toISOString().split('T')[0]}.xlsx`);
    }

    async quickPantryExport(data) {
        const blob = await this.generatePantryExcel(data);
        await this.download(blob, `inventar-pantry-${new Date().toISOString().split('T')[0]}.xlsx`);
    }

    async quickNutritionExport(data) {
        const blob = await this.generateNutritionExcel(data);
        await this.download(blob, `analiza-nutritie-${new Date().toISOString().split('T')[0]}.xlsx`);
    }
}

// Export singleton instance
export const excelExporter = new ExcelExporter();