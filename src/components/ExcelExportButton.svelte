<script>
    import { onMount, onDestroy } from 'svelte';
    import { excelExporter } from '../lib/services/ExcelExporter.js';
    import { transactions, accounts, totalBalance } from '../modules/finance/stores/financeStore.js';
    import { toastStore } from '../lib/stores/toastStore.js';

    // Props
    export let module = 'finance'; // finance, pantry, nutrition, all
    export let variant = 'button'; // button, dropdown, fab
    export let position = 'inline'; // inline, fixed-bottom-right, fixed-top-right

    // State
    let isExporting = false;
    let exportProgress = 0;
    let showDropdown = false;
    let showAdvancedOptions = false;

    // Export options
    let exportOptions = {
        includeCharts: true,
        includePivot: true,
        includeFormulas: true,
        period: 'current-month',
        format: 'detailed'
    };

    // Quick export templates
    const quickExports = {
        finance: {
            'monthly-report': {
                name: '📊 Raport Lunar',
                description: 'Toate tranzacțiile și analizele lunii',
                action: () => exportFinance('month')
            },
            'budget-analysis': {
                name: '💰 Analiză Bugete',
                description: 'Status bugete cu grafice',
                action: () => exportBudgets()
            },
            'cash-flow': {
                name: '💵 Cash Flow',
                description: 'Fluxuri financiare detaliate',
                action: () => exportCashFlow()
            },
            'year-summary': {
                name: '📈 Sumar Anual',
                description: 'Perspectivă completă an curent',
                action: () => exportFinance('year')
            }
        },
        pantry: {
            'inventory-full': {
                name: '📦 Inventar Complet',
                description: 'Tot inventarul cu valori',
                action: () => exportPantry('inventory')
            },
            'shopping-optimized': {
                name: '🛒 Listă Cumpărături',
                description: 'Organizat pe magazine',
                action: () => exportPantry('shopping')
            },
            'expiring-alert': {
                name: '⚠️ Produse Expiră',
                description: 'Urgent + următoarele 30 zile',
                action: () => exportPantry('expiring')
            },
            'price-trends': {
                name: '📉 Trend Prețuri',
                description: 'Evoluție prețuri cu grafice',
                action: () => exportPantry('prices')
            }
        },
        nutrition: {
            'weekly-plan': {
                name: '🍽️ Plan Săptămânal',
                description: 'Mese planificate + shopping',
                action: () => exportNutrition('mealplan')
            },
            'recipes-codex': {
                name: '📖 Rețete CODEX',
                description: 'Toate rețetele cu nutriție',
                action: () => exportNutrition('recipes')
            },
            'mtor-cycle': {
                name: '🔄 Ciclu mTOR',
                description: 'Program 14 zile detaliat',
                action: () => exportNutrition('mtor')
            },
            'nutrition-analysis': {
                name: '🧬 Analiză Nutrițională',
                description: 'Metrici și deficiențe',
                action: () => exportNutrition('analysis')
            }
        }
    };

    // Cleanup function
    let keyboardCleanup;

    // Initialize
    onMount(() => {
        // Keyboard shortcuts
        const handleKeyboard = (e) => {
            // Ctrl+Shift+E = Export Excel
            if (e.ctrlKey && e.shiftKey && e.key === 'E') {
                e.preventDefault();
                handleQuickExport();
            }
            // Escape = close dropdown
            if (e.key === 'Escape' && showDropdown) {
                showDropdown = false;
            }
        };

        window.addEventListener('keydown', handleKeyboard);
        keyboardCleanup = () => {
            window.removeEventListener('keydown', handleKeyboard);
        };
    });

    onDestroy(() => {
        if (keyboardCleanup) {
            keyboardCleanup();
        }
    });

    // Export functions
    async function exportFinance(period = 'month') {
        isExporting = true;
        exportProgress = 10;

        try {
            const data = prepareFinanceData(period);

            exportProgress = 30;

            toastStore.add({
                type: 'info',
                message: 'Generez Excel financiar...',
                duration: 2000
            });

            const blob = await excelExporter.generateFinanceExcel(data, exportOptions);

            exportProgress = 80;

            await downloadExcel(blob, `finance-${period}-${getDateString()}.xlsx`);

            exportProgress = 100;

            toastStore.add({
                type: 'success',
                message: 'Export Finance completat!',
                duration: 3000
            });

        } catch (error) {
            console.error('Export error:', error);
            toastStore.add({
                type: 'error',
                message: 'Eroare la export: ' + error.message,
                duration: 5000
            });
        } finally {
            setTimeout(() => {
                isExporting = false;
                exportProgress = 0;
                showDropdown = false;
            }, 2000);
        }
    }

    async function exportPantry(type = 'full') {
        isExporting = true;
        exportProgress = 10;

        try {
            const data = preparePantryData(type);

            exportProgress = 30;

            toastStore.add({
                type: 'info',
                message: 'Generez Excel pantry...',
                duration: 2000
            });

            const blob = await excelExporter.generatePantryExcel(data, exportOptions);

            exportProgress = 80;

            await downloadExcel(blob, `pantry-${type}-${getDateString()}.xlsx`);

            exportProgress = 100;

            toastStore.add({
                type: 'success',
                message: 'Export Pantry completat!',
                duration: 3000
            });

        } catch (error) {
            console.error('Export error:', error);
            toastStore.add({
                type: 'error',
                message: 'Eroare la export: ' + error.message,
                duration: 5000
            });
        } finally {
            setTimeout(() => {
                isExporting = false;
                exportProgress = 0;
                showDropdown = false;
            }, 2000);
        }
    }

    async function exportNutrition(type = 'full') {
        isExporting = true;
        exportProgress = 10;

        try {
            const data = prepareNutritionData(type);

            exportProgress = 30;

            toastStore.add({
                type: 'info',
                message: 'Generez Excel nutriție...',
                duration: 2000
            });

            const blob = await excelExporter.generateNutritionExcel(data, exportOptions);

            exportProgress = 80;

            await downloadExcel(blob, `nutrition-${type}-${getDateString()}.xlsx`);

            exportProgress = 100;

            toastStore.add({
                type: 'success',
                message: 'Export Nutrition completat!',
                duration: 3000
            });

        } catch (error) {
            console.error('Export error:', error);
            toastStore.add({
                type: 'error',
                message: 'Eroare la export: ' + error.message,
                duration: 5000
            });
        } finally {
            setTimeout(() => {
                isExporting = false;
                exportProgress = 0;
                showDropdown = false;
            }, 2000);
        }
    }

    async function exportBudgets() {
        await exportFinance('budgets');
    }

    async function exportCashFlow() {
        await exportFinance('cashflow');
    }

    async function exportAll() {
        isExporting = true;
        exportProgress = 5;

        try {
            // Collect all data
            const financeData = prepareFinanceData('all');
            exportProgress = 20;

            const pantryData = preparePantryData('full');
            exportProgress = 40;

            const nutritionData = prepareNutritionData('full');
            exportProgress = 60;

            toastStore.add({
                type: 'info',
                message: 'Generez Excel complet...',
                duration: 3000
            });

            // Create comprehensive Excel export
            const blob = await excelExporter.generateFinanceExcel(financeData, {
                ...exportOptions,
                includeAllModules: true
            });

            exportProgress = 90;

            await downloadExcel(blob, `nomad-complete-${getDateString()}.xlsx`);

            exportProgress = 100;

            toastStore.add({
                type: 'success',
                message: 'Export complet realizat!',
                duration: 3000
            });

        } catch (error) {
            console.error('Export error:', error);
            toastStore.add({
                type: 'error',
                message: 'Eroare la export: ' + error.message,
                duration: 5000
            });
        } finally {
            setTimeout(() => {
                isExporting = false;
                exportProgress = 0;
                showDropdown = false;
            }, 2000);
        }
    }

    // Data preparation functions
    function prepareFinanceData(period) {
        const now = new Date();
        let startDate, endDate;

        switch (period) {
            case 'month':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                break;
            case 'year':
                startDate = new Date(now.getFullYear(), 0, 1);
                endDate = new Date(now.getFullYear(), 11, 31);
                break;
            default:
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                endDate = now;
        }

        const filteredTransactions = ($transactions || []).filter(t => {
            const date = new Date(t.date);
            return date >= startDate && date <= endDate;
        });

        // Calculate statistics
        let monthlyIncome = 0;
        let monthlyExpenses = 0;

        filteredTransactions.forEach(tx => {
            const amount = Math.abs(tx.amount || 0);
            if (tx.type === 'income' || (tx.amount || 0) > 0) {
                monthlyIncome += amount;
            } else {
                monthlyExpenses += amount;
            }
        });

        const savings = monthlyIncome - monthlyExpenses;
        const percentSaved = monthlyIncome > 0 ? Math.round((savings / monthlyIncome) * 100) : 0;

        return {
            stats: {
                income: monthlyIncome,
                expenses: monthlyExpenses,
                savings: savings,
                percentSaved: percentSaved,
                totalBalance: $totalBalance || 0
            },
            accounts: $accounts || [],
            transactions: filteredTransactions,
            budgets: [], // TODO: Get from budget store when available
            goals: [],   // TODO: Get from goals store when available
            period: { startDate, endDate }
        };
    }

    function preparePantryData(type) {
        // Mock data for now - replace with actual pantry store
        const mockData = {
            inventory: [
                {
                    name: 'Mere Roșii',
                    category: 'Fructe',
                    quantity: 10,
                    unit: 'bucăți',
                    price: 0.5,
                    expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
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
                    store: 'Kaufland'
                }
            ],
            priceHistory: [],
            expiring: []
        };

        // Calculate expiring items
        if (type === 'expiring' || type === 'full') {
            const today = new Date();
            mockData.expiring = mockData.inventory.filter(item => {
                if (!item.expiryDate) return false;
                const daysLeft = Math.ceil((new Date(item.expiryDate) - today) / (24 * 60 * 60 * 1000));
                return daysLeft <= 30;
            });
        }

        return mockData;
    }

    function prepareNutritionData(type) {
        // Mock data for now - replace with actual nutrition store
        return {
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
                    ingredients: [
                        { name: 'Salmón', quantity: 200, unit: 'g' }
                    ]
                }
            ],
            mealPlan: {
                luni: {
                    meal: 'Salmón cu Spanac',
                    calories: 1900,
                    protein: 130
                }
            },
            mTORCycle: {
                currentDay: 3,
                phase: 'High Protein'
            },
            biomarkers: []
        };
    }

    // Utility functions
    async function downloadExcel(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    function getDateString() {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    }

    function handleQuickExport() {
        const templates = quickExports[module];
        if (templates) {
            const firstTemplate = Object.values(templates)[0];
            if (firstTemplate?.action) {
                firstTemplate.action();
            }
        }
    }

    // Click outside handler
    function handleClickOutside(event) {
        if (!event.target.closest('.excel-export-container')) {
            showDropdown = false;
            showAdvancedOptions = false;
        }
    }
</script>

<svelte:window on:click={handleClickOutside} />

<div class="excel-export-container {position === 'fixed-bottom-right' ? 'fixed-bottom-right' : ''} {position === 'fixed-top-right' ? 'fixed-top-right' : ''}">
    <!-- Keyboard hint -->
    <div class="keyboard-hint">Ctrl+Shift+E</div>

    <!-- Main Export Button -->
    {#if variant === 'fab'}
        <button
            class="export-btn fab"
            on:click={() => showDropdown = !showDropdown}
            disabled={isExporting}
            title="Export Excel (Ctrl+Shift+E)"
        >
            <span class="icon">📊</span>
        </button>
    {:else}
        <button
            class="export-btn"
            on:click={() => showDropdown = !showDropdown}
            disabled={isExporting}
            title="Export Excel (Ctrl+Shift+E)"
        >
            <span class="icon">
                <svg class="excel-icon" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M21.17 3.25Q21.5 3.25 21.76 3.51 22 3.74 22 4.08V19.92Q22 20.26 21.76 20.49 21.5 20.75 21.17 20.75H7.83Q7.5 20.75 7.24 20.49 7 20.26 7 19.92V17H2.83Q2.5 17 2.24 16.74 2 16.5 2 16.17V7.83Q2 7.5 2.24 7.24 2.5 7 2.83 7H7V4.08Q7 3.74 7.24 3.51 7.5 3.25 7.83 3.25M7 13.06L8.18 15.28H9.97L8 12.06L9.93 8.89H8.22L7.13 10.9L7.09 10.96L7.06 10.91Q6.8 10.39 6.5 9.82 6.25 9.25 6 8.89H4.16L6.05 12.08L4 15.28H5.78M13.88 19.5V17H8.25V19.5M13.88 15.75V12.63H12V15.75M13.88 11.38V8.25H12V11.38M13.88 7V4.5H8.25V7M20.75 19.5V17H15.13V19.5M20.75 15.75V12.63H15.13V15.75M20.75 11.38V8.25H15.13V11.38M20.75 7V4.5H15.13V7Z"/>
                </svg>
            </span>
            <span class="btn-text">
                {#if isExporting}
                    Exportare... {Math.round(exportProgress)}%
                {:else}
                    Export Excel
                {/if}
            </span>
        </button>
    {/if}

    <!-- Dropdown Menu -->
    {#if showDropdown && !isExporting}
    <div class="dropdown">
        <div class="dropdown-header">
            <h3 class="dropdown-title">Export Excel</h3>
            <div class="dropdown-subtitle">
                {module === 'finance' ? 'Rapoarte Financiare' :
                 module === 'pantry' ? 'Inventar și Liste' :
                 module === 'nutrition' ? 'Planuri Nutriție' :
                 'Export Complet'}
            </div>
        </div>

        <!-- Quick Export Templates -->
        <div class="quick-exports">
            {#if quickExports[module]}
                {#each Object.entries(quickExports[module]) as [key, template]}
                <div class="quick-export-item" on:click={template.action}>
                    <div class="quick-export-header">
                        <div class="quick-export-icon">
                            {template.name.split(' ')[0]}
                        </div>
                        <div class="quick-export-info">
                            <div class="quick-export-name">{template.name}</div>
                            <div class="quick-export-desc">{template.description}</div>
                        </div>
                    </div>
                </div>
                {/each}
            {/if}

            {#if module === 'all' || !module}
            <button class="export-all-btn" on:click={exportAll}>
                🎯 Export Complet (Toate Modulele)
            </button>
            {/if}
        </div>

        <!-- Advanced Options Toggle -->
        <div class="advanced-toggle" on:click={() => showAdvancedOptions = !showAdvancedOptions}>
            <span>⚙️ Opțiuni Avansate</span>
            <span>{showAdvancedOptions ? '▲' : '▼'}</span>
        </div>

        <!-- Advanced Options Panel -->
        {#if showAdvancedOptions}
        <div class="advanced-options">
            <div class="option-group">
                <label class="option-label">Include în export:</label>

                <div class="checkbox-option">
                    <input
                        type="checkbox"
                        id="include-charts"
                        bind:checked={exportOptions.includeCharts}
                    />
                    <label for="include-charts">Grafice și diagrame</label>
                </div>

                <div class="checkbox-option">
                    <input
                        type="checkbox"
                        id="include-formulas"
                        bind:checked={exportOptions.includeFormulas}
                    />
                    <label for="include-formulas">Formule Excel</label>
                </div>

                <div class="checkbox-option">
                    <input
                        type="checkbox"
                        id="include-pivot"
                        bind:checked={exportOptions.includePivot}
                    />
                    <label for="include-pivot">Pivot Tables</label>
                </div>
            </div>

            <div class="option-group">
                <label class="option-label" for="export-period">Perioadă:</label>
                <select id="export-period" bind:value={exportOptions.period}>
                    <option value="current-month">Luna curentă</option>
                    <option value="last-month">Luna trecută</option>
                    <option value="quarter">Trimestru</option>
                    <option value="year">An complet</option>
                    <option value="all">Toate datele</option>
                </select>
            </div>
        </div>
        {/if}
    </div>
    {/if}
</div>

<!-- Progress Modal -->
{#if isExporting}
<div class="progress-overlay">
    <div class="progress-modal">
        <div class="progress-title">
            <span>📊</span> Se generează Excel...
        </div>
        <div class="progress-bar">
            <div class="progress-fill" style="width: {exportProgress}%"></div>
        </div>
        <div class="progress-text">
            {#if exportProgress < 30}
                Pregătire date...
            {:else if exportProgress < 60}
                Generare sheet-uri...
            {:else if exportProgress < 90}
                Aplicare formatare...
            {:else}
                Finalizare export...
            {/if}
        </div>
    </div>
</div>
{/if}

<style>
    .excel-export-container {
        position: relative;
        display: inline-block;
    }

    .excel-export-container.fixed-bottom-right {
        position: fixed;
        bottom: 2rem;
        right: 2rem;
        z-index: 1000;
    }

    .excel-export-container.fixed-top-right {
        position: fixed;
        top: 5rem;
        right: 2rem;
        z-index: 1000;
    }

    /* Main Button Styles */
    .export-btn {
        background: #217346; /* Excel green */
        color: white;
        border: none;
        padding: 0.75rem 1.5rem;
        border-radius: 8px;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-weight: 600;
        transition: all 0.3s ease;
        box-shadow: 0 2px 4px rgba(33, 115, 70, 0.2);
    }

    .export-btn:hover:not(:disabled) {
        background: #1a5c38;
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(33, 115, 70, 0.3);
    }

    .export-btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
        transform: none;
    }

    .export-btn.fab {
        width: 56px;
        height: 56px;
        border-radius: 50%;
        padding: 0;
        justify-content: center;
        position: relative;
    }

    .export-btn.fab .btn-text {
        display: none;
    }

    .export-btn .icon {
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    /* Excel Icon SVG */
    .excel-icon {
        width: 20px;
        height: 20px;
    }

    /* Dropdown Styles */
    .dropdown {
        position: absolute;
        top: calc(100% + 0.5rem);
        right: 0;
        background: white;
        border-radius: 12px;
        box-shadow: 0 4px 24px rgba(0, 0, 0, 0.15);
        min-width: 320px;
        max-height: 80vh;
        overflow-y: auto;
        z-index: 1001;
        animation: slideDown 0.3s ease;
    }

    .dropdown.align-left {
        left: 0;
        right: auto;
    }

    @keyframes slideDown {
        from {
            opacity: 0;
            transform: translateY(-10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    .dropdown-header {
        padding: 1rem;
        border-bottom: 1px solid #e0e0e0;
        background: #f8f9fa;
        border-radius: 12px 12px 0 0;
    }

    .dropdown-title {
        font-size: 1.1rem;
        font-weight: 600;
        color: #202124;
        margin: 0 0 0.25rem 0;
    }

    .dropdown-subtitle {
        font-size: 0.875rem;
        color: #5f6368;
    }

    .quick-exports {
        padding: 0.5rem;
    }

    .quick-export-item {
        padding: 0.75rem 1rem;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s ease;
        margin-bottom: 0.25rem;
    }

    .quick-export-item:hover {
        background: #e8f5e9;
    }

    .quick-export-header {
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }

    .quick-export-icon {
        font-size: 1.25rem;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #f0f7f4;
        border-radius: 8px;
    }

    .quick-export-info {
        flex: 1;
    }

    .quick-export-name {
        font-weight: 600;
        color: #202124;
        font-size: 0.95rem;
    }

    .quick-export-desc {
        font-size: 0.8rem;
        color: #5f6368;
        margin-top: 0.125rem;
    }

    /* Advanced Options */
    .advanced-toggle {
        padding: 0.75rem 1rem;
        border-top: 1px solid #e0e0e0;
        display: flex;
        align-items: center;
        justify-content: space-between;
        cursor: pointer;
        background: #f8f9fa;
        transition: background 0.2s ease;
    }

    .advanced-toggle:hover {
        background: #e8eaed;
    }

    .advanced-options {
        padding: 1rem;
        border-top: 1px solid #e0e0e0;
        background: #fafafa;
    }

    .option-group {
        margin-bottom: 1rem;
    }

    .option-label {
        font-size: 0.875rem;
        font-weight: 500;
        color: #5f6368;
        margin-bottom: 0.5rem;
        display: block;
    }

    .checkbox-option {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.25rem 0;
        cursor: pointer;
    }

    .checkbox-option input[type="checkbox"] {
        width: 18px;
        height: 18px;
        cursor: pointer;
    }

    .checkbox-option label {
        cursor: pointer;
        font-size: 0.875rem;
        color: #202124;
        user-select: none;
    }

    select {
        width: 100%;
        padding: 0.5rem;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        font-size: 0.875rem;
        background: white;
        color: #374151;
    }

    select:focus {
        outline: none;
        border-color: #217346;
        box-shadow: 0 0 0 3px rgba(33, 115, 70, 0.1);
    }

    /* Progress Bar */
    .progress-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 2000;
        backdrop-filter: blur(2px);
    }

    .progress-modal {
        background: white;
        border-radius: 12px;
        padding: 2rem;
        min-width: 320px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
        animation: slideIn 0.3s ease;
    }

    @keyframes slideIn {
        from {
            opacity: 0;
            transform: scale(0.9);
        }
        to {
            opacity: 1;
            transform: scale(1);
        }
    }

    .progress-title {
        font-size: 1.1rem;
        font-weight: 600;
        margin-bottom: 1rem;
        text-align: center;
        color: #202124;
    }

    .progress-bar {
        width: 100%;
        height: 8px;
        background: #e0e0e0;
        border-radius: 4px;
        overflow: hidden;
    }

    .progress-fill {
        height: 100%;
        background: linear-gradient(90deg, #217346, #2e7d4e);
        transition: width 0.3s ease;
        border-radius: 4px;
    }

    .progress-text {
        text-align: center;
        margin-top: 0.75rem;
        font-size: 0.875rem;
        color: #5f6368;
    }

    /* All Exports Button */
    .export-all-btn {
        margin: 0.5rem;
        padding: 0.75rem 1rem;
        background: linear-gradient(135deg, #217346, #1a5c38);
        color: white;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-weight: 600;
        text-align: center;
        transition: all 0.3s ease;
        width: calc(100% - 1rem);
    }

    .export-all-btn:hover {
        background: linear-gradient(135deg, #1a5c38, #134d2e);
        transform: translateY(-1px);
        box-shadow: 0 4px 8px rgba(33, 115, 70, 0.3);
    }

    /* Keyboard Hint */
    .keyboard-hint {
        position: absolute;
        top: -1.5rem;
        right: 0;
        background: #333;
        color: white;
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        font-size: 0.7rem;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.2s ease;
        white-space: nowrap;
    }

    .excel-export-container:hover .keyboard-hint {
        opacity: 0.8;
    }

    /* Dark mode support */
    :global(.dark-mode) .dropdown {
        background: #2d3748;
        color: #e8eaed;
    }

    :global(.dark-mode) .dropdown-header {
        background: #1a202c;
        border-color: #4a5568;
    }

    :global(.dark-mode) .dropdown-title {
        color: #e8eaed;
    }

    :global(.dark-mode) .quick-export-item:hover {
        background: #4a5568;
    }

    :global(.dark-mode) .advanced-toggle {
        background: #1a202c;
        border-color: #4a5568;
        color: #e8eaed;
    }

    :global(.dark-mode) .advanced-options {
        background: #2d3748;
    }

    :global(.dark-mode) .progress-modal {
        background: #2d3748;
        color: #e8eaed;
    }

    :global(.dark-mode) .progress-title {
        color: #e8eaed;
    }

    /* Mobile responsive */
    @media (max-width: 768px) {
        .dropdown {
            position: fixed;
            top: auto;
            bottom: 0;
            left: 0;
            right: 0;
            max-height: 70vh;
            border-radius: 12px 12px 0 0;
            animation: slideUp 0.3s ease;
        }

        @keyframes slideUp {
            from {
                transform: translateY(100%);
            }
            to {
                transform: translateY(0);
            }
        }

        .excel-export-container.fixed-bottom-right {
            bottom: 1rem;
            right: 1rem;
        }

        .progress-modal {
            min-width: 280px;
            padding: 1.5rem;
        }
    }
</style>