<script>
    import { onMount, createEventDispatcher } from 'svelte';
    import { excelExporter } from '../../../lib/services/ExcelExporter.js';
    import { transactions, accounts, totalBalance } from '../stores/financeStore.js';
    import { toastStore } from '../../../lib/toastStore.js';

    const dispatch = createEventDispatcher();

    // State management
    let isOpen = false;
    let isExporting = false;
    let exportProgress = 0;
    let currentModule = 'finance'; // Auto-detect module based on location

    // Export options
    let exportOptions = {
        includeCharts: true,
        includePivot: true,
        includeFormulas: true,
        format: 'detailed', // 'detailed', 'summary', 'advanced'
        period: 'custom',
        customPeriod: '',
        maxTransactions: 1000,
        sheetSelection: {
            summary: true,
            transactions: true,
            budgets: false,
            goals: false,
            analysis: true,
            cashflow: true
        }
    };

    // Available quick exports
    const quickExports = [
        {
            id: 'financial-excel',
            name: 'Raport Financiar Excel',
            description: 'Raport complet cu toate sheet-urile',
            icon: '📊',
            module: 'finance',
            sheets: ['Sumar', 'Tranzacții', 'Analiză', 'Cash Flow']
        },
        {
            id: 'transactions-only',
            name: 'Doar Tranzacții',
            description: 'Export simplu cu tranzacțiile curente',
            icon: '💳',
            module: 'finance',
            sheets: ['Tranzacții']
        },
        {
            id: 'analysis-advanced',
            name: 'Analiză Avansată',
            description: 'Pivot tables și grafice pentru analiză',
            icon: '📈',
            module: 'finance',
            sheets: ['Analiză', 'Trend Lunar', 'Categorii']
        },
        {
            id: 'pantry-excel',
            name: 'Inventar Pantry Excel',
            description: 'Export complet inventar și shopping list',
            icon: '🏪',
            module: 'pantry',
            sheets: ['Inventar', 'Shopping List', 'Expiră']
        },
        {
            id: 'nutrition-excel',
            name: 'Analiză Nutriție Excel',
            description: 'Rețete, plan săptămânal și mTOR',
            icon: '🥗',
            module: 'nutrition',
            sheets: ['Analiză', 'Rețete', 'Plan Săptămânal']
        }
    ];

    // Auto-detect current module
    onMount(() => {
        // Detect module based on current URL or context
        const path = window.location.pathname || window.location.hash;
        if (path.includes('pantry')) {
            currentModule = 'pantry';
        } else if (path.includes('nutrition')) {
            currentModule = 'nutrition';
        } else {
            currentModule = 'finance';
        }

        // Set default period
        const now = new Date();
        exportOptions.customPeriod = now.toLocaleDateString('ro-RO', {
            month: 'long',
            year: 'numeric'
        });
    });

    // Toggle panel
    function togglePanel() {
        isOpen = !isOpen;
        if (isOpen) {
            // Reset progress
            exportProgress = 0;
        }
    }

    // Close panel
    function closePanel() {
        isOpen = false;
        exportProgress = 0;
    }

    // Get data for export based on current module
    function getExportData() {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        // Calculate current statistics
        let monthlyIncome = 0;
        let monthlyExpenses = 0;

        if ($transactions && Array.isArray($transactions)) {
            $transactions.forEach(tx => {
                const txDate = new Date(tx.date);
                if (txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear) {
                    const amount = Math.abs(tx.amount || 0);
                    if (tx.type === 'income' || (tx.amount || 0) > 0) {
                        monthlyIncome += amount;
                    } else {
                        monthlyExpenses += amount;
                    }
                }
            });
        }

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
            transactions: ($transactions || []).slice(0, exportOptions.maxTransactions),
            budgets: [], // TODO: Get from budget store when available
            goals: [],   // TODO: Get from goals store when available
            // Pantry data (placeholder)
            inventory: [],
            shoppingList: [],
            priceHistory: [],
            expiring: [],
            // Nutrition data (placeholder)
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
            recipes: [],
            mealPlan: {},
            mTORCycle: {
                currentDay: 1,
                phase: 'High Protein'
            }
        };
    }

    // Progress simulation
    function updateProgress(target) {
        const interval = setInterval(() => {
            exportProgress += Math.random() * 12;
            if (exportProgress >= target) {
                exportProgress = target;
                clearInterval(interval);
            }
        }, 150);
    }

    // Quick export functions
    async function executeQuickExport(exportType) {
        isExporting = true;
        exportProgress = 0;

        try {
            const data = getExportData();
            updateProgress(100);

            toastStore.add({
                type: 'info',
                message: 'Generez Excel...',
                duration: 2000
            });

            let blob;
            let filename;

            switch (exportType.id) {
                case 'financial-excel':
                    blob = await excelExporter.generateFinanceExcel(data, {
                        includeCharts: exportOptions.includeCharts,
                        includePivot: exportOptions.includePivot,
                        includeFormulas: exportOptions.includeFormulas,
                        period: exportOptions.customPeriod || `Raport Financiar ${new Date().toLocaleDateString('ro-RO')}`
                    });
                    filename = `raport-financiar-complet-${new Date().toISOString().split('T')[0]}.xlsx`;
                    break;

                case 'transactions-only':
                    // Create a minimal workbook with just transactions
                    const tempExporter = new (await import('../../../lib/services/ExcelExporter.js')).ExcelExporter();
                    const tempWorkbook = await import('xlsx').then(XLSX => XLSX.utils.book_new());
                    tempExporter.workbook = tempWorkbook;
                    tempExporter.createTransactionsSheet(data.transactions, true);
                    blob = tempExporter.generateBlob();
                    filename = `tranzactii-${new Date().toISOString().split('T')[0]}.xlsx`;
                    break;

                case 'analysis-advanced':
                    blob = await excelExporter.generateFinanceExcel(data, {
                        includeCharts: true,
                        includePivot: true,
                        includeFormulas: true,
                        period: `Analiză Avansată ${exportOptions.customPeriod || new Date().toLocaleDateString('ro-RO')}`
                    });
                    filename = `analiza-avansata-${new Date().toISOString().split('T')[0]}.xlsx`;
                    break;

                case 'pantry-excel':
                    blob = await excelExporter.generatePantryExcel(data, {
                        period: `Inventar Pantry ${new Date().toLocaleDateString('ro-RO')}`
                    });
                    filename = `inventar-pantry-${new Date().toISOString().split('T')[0]}.xlsx`;
                    break;

                case 'nutrition-excel':
                    blob = await excelExporter.generateNutritionExcel(data, {
                        period: `Analiză Nutriție ${new Date().toLocaleDateString('ro-RO')}`
                    });
                    filename = `analiza-nutritie-${new Date().toISOString().split('T')[0]}.xlsx`;
                    break;

                default:
                    throw new Error('Tip export necunoscut');
            }

            // Download the file
            await excelExporter.download(blob, filename);

            toastStore.add({
                type: 'success',
                message: 'Excel generat cu succes!',
                duration: 3000
            });

            exportProgress = 100;
            setTimeout(() => {
                closePanel();
            }, 1000);

        } catch (error) {
            console.error('Excel export failed:', error);
            toastStore.add({
                type: 'error',
                message: `Eroare la export Excel: ${error.message}`,
                duration: 5000
            });
        } finally {
            isExporting = false;
        }
    }

    // Custom export with detailed options
    async function executeCustomExport() {
        isExporting = true;
        exportProgress = 0;

        try {
            const data = getExportData();
            updateProgress(100);

            toastStore.add({
                type: 'info',
                message: 'Generez Excel personalizat...',
                duration: 2000
            });

            let blob;
            let filename;

            if (currentModule === 'finance') {
                blob = await excelExporter.generateFinanceExcel(data, {
                    includeCharts: exportOptions.includeCharts,
                    includePivot: exportOptions.includePivot,
                    includeFormulas: exportOptions.includeFormulas,
                    period: exportOptions.customPeriod || `Raport Personalizat ${new Date().toLocaleDateString('ro-RO')}`
                });
                filename = `raport-financiar-personalizat-${new Date().toISOString().split('T')[0]}.xlsx`;
            } else if (currentModule === 'pantry') {
                blob = await excelExporter.generatePantryExcel(data);
                filename = `inventar-pantry-personalizat-${new Date().toISOString().split('T')[0]}.xlsx`;
            } else if (currentModule === 'nutrition') {
                blob = await excelExporter.generateNutritionExcel(data);
                filename = `analiza-nutritie-personalizata-${new Date().toISOString().split('T')[0]}.xlsx`;
            } else {
                throw new Error('Modul necunoscut pentru export');
            }

            await excelExporter.download(blob, filename);

            toastStore.add({
                type: 'success',
                message: 'Excel personalizat generat cu succes!',
                duration: 3000
            });

            exportProgress = 100;
            setTimeout(() => {
                closePanel();
            }, 1000);

        } catch (error) {
            console.error('Custom Excel export failed:', error);
            toastStore.add({
                type: 'error',
                message: `Eroare la export Excel personalizat: ${error.message}`,
                duration: 5000
            });
        } finally {
            isExporting = false;
        }
    }

    // Keyboard shortcuts
    function handleKeydown(event) {
        if (event.ctrlKey && event.shiftKey && event.code === 'KeyX') {
            event.preventDefault();
            togglePanel();
        } else if (event.code === 'Escape' && isOpen) {
            event.preventDefault();
            closePanel();
        } else if (event.ctrlKey && event.code === 'KeyR' && isOpen && !isExporting) {
            event.preventDefault();
            executeCustomExport();
        }
    }

    // Filter quick exports by current module
    $: filteredQuickExports = quickExports.filter(export_ =>
        export_.module === currentModule || export_.module === 'all'
    );
</script>

<svelte:window on:keydown={handleKeydown} />

<!-- Export Button -->
<div class="excel-export-trigger">
    <button
        class="excel-export-button"
        on:click={togglePanel}
        title="Export Excel (Ctrl+Shift+X)"
        disabled={isExporting}
    >
        {#if isExporting}
            <span class="loading-spinner"></span>
        {:else}
            📊
        {/if}
        Export Excel
    </button>
</div>

<!-- Export Panel -->
{#if isOpen}
    <div class="excel-export-overlay" on:click={closePanel}>
        <div class="excel-export-panel" on:click|stopPropagation>
            <!-- Header -->
            <div class="panel-header">
                <h3>📊 Export Excel Advanced</h3>
                <button class="close-button" on:click={closePanel}>×</button>
            </div>

            <!-- Module Indicator -->
            <div class="module-indicator">
                <span class="module-badge" class:finance={currentModule === 'finance'}
                      class:pantry={currentModule === 'pantry'}
                      class:nutrition={currentModule === 'nutrition'}>
                    {currentModule.charAt(0).toUpperCase() + currentModule.slice(1)} Module
                </span>
            </div>

            <!-- Progress Bar -->
            {#if isExporting}
                <div class="progress-container">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: {exportProgress}%"></div>
                    </div>
                    <div class="progress-text">Generez Excel... {Math.round(exportProgress)}%</div>
                </div>
            {/if}

            <!-- Quick Exports -->
            <div class="quick-exports">
                <h4>🚀 Export Rapid Excel</h4>
                <div class="quick-grid">
                    {#each filteredQuickExports as exportType}
                        <button
                            class="quick-export-card"
                            class:disabled={isExporting}
                            on:click={() => executeQuickExport(exportType)}
                            disabled={isExporting}
                        >
                            <div class="card-icon">{exportType.icon}</div>
                            <div class="card-title">{exportType.name}</div>
                            <div class="card-description">{exportType.description}</div>
                            <div class="card-sheets">
                                Sheets: {exportType.sheets.join(', ')}
                            </div>
                        </button>
                    {/each}
                </div>
            </div>

            <!-- Custom Export Options -->
            <div class="custom-export">
                <h4>⚙️ Export Personalizat Excel</h4>

                <div class="options-grid">
                    <!-- Period -->
                    <div class="option-group">
                        <label>Perioada:</label>
                        <input
                            type="text"
                            bind:value={exportOptions.customPeriod}
                            placeholder="ex: Decembrie 2024"
                            disabled={isExporting}
                        >
                    </div>

                    <!-- Format -->
                    <div class="option-group">
                        <label>Format:</label>
                        <select bind:value={exportOptions.format} disabled={isExporting}>
                            <option value="summary">Sumar</option>
                            <option value="detailed">Detaliat</option>
                            <option value="advanced">Avansat</option>
                        </select>
                    </div>

                    <!-- Max Transactions -->
                    <div class="option-group">
                        <label>Max tranzacții:</label>
                        <input
                            type="number"
                            bind:value={exportOptions.maxTransactions}
                            min="100"
                            max="10000"
                            step="100"
                            disabled={isExporting}
                        >
                    </div>
                </div>

                <!-- Advanced Options -->
                <div class="advanced-options">
                    <h5>🔧 Opțiuni Avansate</h5>
                    <div class="checkbox-grid">
                        <label class="checkbox-label">
                            <input
                                type="checkbox"
                                bind:checked={exportOptions.includeCharts}
                                disabled={isExporting}
                            >
                            Include grafice și diagrame
                        </label>

                        <label class="checkbox-label">
                            <input
                                type="checkbox"
                                bind:checked={exportOptions.includePivot}
                                disabled={isExporting}
                            >
                            Generează Pivot Tables
                        </label>

                        <label class="checkbox-label">
                            <input
                                type="checkbox"
                                bind:checked={exportOptions.includeFormulas}
                                disabled={isExporting}
                            >
                            Include formule Excel
                        </label>
                    </div>
                </div>

                <!-- Sheet Selection (pentru Finance) -->
                {#if currentModule === 'finance'}
                    <div class="sheet-selection">
                        <h5>📋 Selectare Sheet-uri</h5>
                        <div class="sheet-checkboxes">
                            <label class="checkbox-label">
                                <input
                                    type="checkbox"
                                    bind:checked={exportOptions.sheetSelection.summary}
                                    disabled={isExporting}
                                >
                                Sumar Executiv
                            </label>

                            <label class="checkbox-label">
                                <input
                                    type="checkbox"
                                    bind:checked={exportOptions.sheetSelection.transactions}
                                    disabled={isExporting}
                                >
                                Registru Tranzacții
                            </label>

                            <label class="checkbox-label">
                                <input
                                    type="checkbox"
                                    bind:checked={exportOptions.sheetSelection.budgets}
                                    disabled={isExporting}
                                >
                                Monitorizare Bugete
                            </label>

                            <label class="checkbox-label">
                                <input
                                    type="checkbox"
                                    bind:checked={exportOptions.sheetSelection.goals}
                                    disabled={isExporting}
                                >
                                Obiective Financiare
                            </label>

                            <label class="checkbox-label">
                                <input
                                    type="checkbox"
                                    bind:checked={exportOptions.sheetSelection.analysis}
                                    disabled={isExporting}
                                >
                                Analiză Avansată
                            </label>

                            <label class="checkbox-label">
                                <input
                                    type="checkbox"
                                    bind:checked={exportOptions.sheetSelection.cashflow}
                                    disabled={isExporting}
                                >
                                Cash Flow Statement
                            </label>
                        </div>
                    </div>
                {/if}

                <!-- Custom Export Button -->
                <button
                    class="custom-export-button"
                    on:click={executeCustomExport}
                    disabled={isExporting}
                    title="Export Excel Personalizat (Ctrl+R)"
                >
                    {#if isExporting}
                        <span class="loading-spinner"></span>
                    {:else}
                        🎯
                    {/if}
                    Generează Excel Personalizat
                </button>
            </div>

            <!-- Features Info -->
            <div class="features-info">
                <h4>✨ Funcționalități Excel Advanced</h4>
                <div class="features-grid">
                    <div class="feature-item">
                        <span class="feature-icon">📊</span>
                        <span class="feature-text">Formatare profesională</span>
                    </div>
                    <div class="feature-item">
                        <span class="feature-icon">📈</span>
                        <span class="feature-text">Grafice integrate</span>
                    </div>
                    <div class="feature-item">
                        <span class="feature-icon">🔢</span>
                        <span class="feature-text">Formule automate</span>
                    </div>
                    <div class="feature-item">
                        <span class="feature-icon">🏷️</span>
                        <span class="feature-text">Auto-filters</span>
                    </div>
                    <div class="feature-item">
                        <span class="feature-icon">🎨</span>
                        <span class="feature-text">Conditional formatting</span>
                    </div>
                    <div class="feature-item">
                        <span class="feature-icon">📋</span>
                        <span class="feature-text">Pivot tables</span>
                    </div>
                </div>
            </div>

            <!-- Keyboard Shortcuts -->
            <div class="shortcuts">
                <h4>⌨️ Scurtături Tastatură</h4>
                <div class="shortcuts-list">
                    <div class="shortcut">
                        <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>X</kbd>
                        <span>Toggle panou Excel</span>
                    </div>
                    <div class="shortcut">
                        <kbd>Ctrl</kbd> + <kbd>R</kbd>
                        <span>Export Excel personalizat</span>
                    </div>
                    <div class="shortcut">
                        <kbd>Escape</kbd>
                        <span>Închide panoul</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
{/if}

<style>
    /* Export Button */
    .excel-export-trigger {
        position: relative;
    }

    .excel-export-button {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.75rem 1rem;
        background: linear-gradient(135deg, #10b981, #059669);
        color: white;
        border: none;
        border-radius: 8px;
        font-size: 0.875rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        box-shadow: 0 2px 4px rgba(16, 185, 129, 0.2);
    }

    .excel-export-button:hover:not(:disabled) {
        background: linear-gradient(135deg, #059669, #047857);
        transform: translateY(-1px);
        box-shadow: 0 4px 8px rgba(16, 185, 129, 0.3);
    }

    .excel-export-button:disabled {
        opacity: 0.6;
        cursor: not-allowed;
        transform: none;
    }

    /* Loading Spinner */
    .loading-spinner {
        width: 14px;
        height: 14px;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-top: 2px solid white;
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }

    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }

    /* Export Panel */
    .excel-export-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        z-index: 1000;
        display: flex;
        align-items: center;
        justify-content: center;
        backdrop-filter: blur(2px);
    }

    .excel-export-panel {
        background: white;
        border-radius: 12px;
        padding: 2rem;
        max-width: 900px;
        width: 95%;
        max-height: 95vh;
        overflow-y: auto;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
        animation: slideIn 0.3s ease-out;
    }

    :global(.dark-mode) .excel-export-panel {
        background: #2d3748;
        color: white;
    }

    @keyframes slideIn {
        from {
            opacity: 0;
            transform: translateY(-20px) scale(0.95);
        }
        to {
            opacity: 1;
            transform: translateY(0) scale(1);
        }
    }

    /* Panel Header */
    .panel-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
        padding-bottom: 1rem;
        border-bottom: 1px solid #e5e7eb;
    }

    :global(.dark-mode) .panel-header {
        border-bottom-color: #4a5568;
    }

    .panel-header h3 {
        margin: 0;
        font-size: 1.25rem;
        font-weight: 700;
        color: #10b981;
    }

    .close-button {
        background: none;
        border: none;
        font-size: 1.5rem;
        cursor: pointer;
        color: #6b7280;
        padding: 0.25rem;
        border-radius: 4px;
        transition: all 0.2s ease;
    }

    .close-button:hover {
        background: #f3f4f6;
        color: #374151;
    }

    :global(.dark-mode) .close-button:hover {
        background: #4a5568;
        color: #e2e8f0;
    }

    /* Module Indicator */
    .module-indicator {
        margin-bottom: 1.5rem;
        text-align: center;
    }

    .module-badge {
        display: inline-block;
        padding: 0.5rem 1rem;
        border-radius: 20px;
        font-size: 0.875rem;
        font-weight: 600;
        color: white;
    }

    .module-badge.finance {
        background: linear-gradient(135deg, #1a73e8, #1557b0);
    }

    .module-badge.pantry {
        background: linear-gradient(135deg, #f59e0b, #d97706);
    }

    .module-badge.nutrition {
        background: linear-gradient(135deg, #10b981, #059669);
    }

    /* Progress Bar */
    .progress-container {
        margin-bottom: 1.5rem;
        padding: 1rem;
        background: #f8fafc;
        border-radius: 8px;
        border: 1px solid #e2e8f0;
    }

    :global(.dark-mode) .progress-container {
        background: #1a202c;
        border-color: #4a5568;
    }

    .progress-bar {
        width: 100%;
        height: 8px;
        background: #e5e7eb;
        border-radius: 4px;
        overflow: hidden;
        margin-bottom: 0.5rem;
    }

    .progress-fill {
        height: 100%;
        background: linear-gradient(90deg, #10b981, #059669);
        transition: width 0.3s ease;
        border-radius: 4px;
    }

    .progress-text {
        text-align: center;
        font-size: 0.875rem;
        color: #6b7280;
        font-weight: 500;
    }

    /* Quick Exports */
    .quick-exports {
        margin-bottom: 2rem;
    }

    .quick-exports h4 {
        margin: 0 0 1rem 0;
        font-size: 1rem;
        font-weight: 600;
        color: #374151;
    }

    :global(.dark-mode) .quick-exports h4 {
        color: #e2e8f0;
    }

    .quick-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 1rem;
    }

    .quick-export-card {
        background: white;
        border: 2px solid #e5e7eb;
        border-radius: 8px;
        padding: 1rem;
        text-align: center;
        cursor: pointer;
        transition: all 0.2s ease;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.5rem;
    }

    :global(.dark-mode) .quick-export-card {
        background: #1a202c;
        border-color: #4a5568;
    }

    .quick-export-card:hover:not(.disabled) {
        border-color: #10b981;
        background: #f0fdf4;
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(16, 185, 129, 0.15);
    }

    :global(.dark-mode) .quick-export-card:hover:not(.disabled) {
        background: #2d3748;
        border-color: #10b981;
    }

    .quick-export-card.disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .card-icon {
        font-size: 2rem;
        margin-bottom: 0.25rem;
    }

    .card-title {
        font-weight: 600;
        font-size: 0.875rem;
        color: #374151;
    }

    :global(.dark-mode) .card-title {
        color: #e2e8f0;
    }

    .card-description {
        font-size: 0.75rem;
        color: #6b7280;
        margin-bottom: 0.5rem;
    }

    :global(.dark-mode) .card-description {
        color: #a0aec0;
    }

    .card-sheets {
        font-size: 0.7rem;
        color: #10b981;
        font-weight: 500;
        font-style: italic;
    }

    /* Custom Export */
    .custom-export {
        margin-bottom: 2rem;
        padding-top: 1.5rem;
        border-top: 1px solid #e5e7eb;
    }

    :global(.dark-mode) .custom-export {
        border-top-color: #4a5568;
    }

    .custom-export h4,
    .custom-export h5 {
        margin: 0 0 1rem 0;
        font-weight: 600;
        color: #374151;
    }

    .custom-export h4 {
        font-size: 1rem;
    }

    .custom-export h5 {
        font-size: 0.875rem;
        margin-bottom: 0.75rem;
    }

    :global(.dark-mode) .custom-export h4,
    :global(.dark-mode) .custom-export h5 {
        color: #e2e8f0;
    }

    .options-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1rem;
        margin-bottom: 1.5rem;
    }

    .option-group {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .option-group label {
        font-size: 0.875rem;
        font-weight: 500;
        color: #374151;
    }

    :global(.dark-mode) .option-group label {
        color: #e2e8f0;
    }

    .option-group input,
    .option-group select {
        padding: 0.5rem;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        font-size: 0.875rem;
        background: white;
        color: #374151;
    }

    :global(.dark-mode) .option-group input,
    :global(.dark-mode) .option-group select {
        background: #1a202c;
        border-color: #4a5568;
        color: #e2e8f0;
    }

    .option-group input:focus,
    .option-group select:focus {
        outline: none;
        border-color: #10b981;
        box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
    }

    /* Advanced Options */
    .advanced-options {
        margin-bottom: 1.5rem;
    }

    .checkbox-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 0.75rem;
    }

    .checkbox-label {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        cursor: pointer;
        font-size: 0.875rem;
        color: #374151;
    }

    :global(.dark-mode) .checkbox-label {
        color: #e2e8f0;
    }

    .checkbox-label input[type="checkbox"] {
        margin: 0;
        width: 16px;
        height: 16px;
    }

    /* Sheet Selection */
    .sheet-selection {
        margin-bottom: 1.5rem;
    }

    .sheet-checkboxes {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 0.75rem;
    }

    .custom-export-button {
        width: 100%;
        padding: 0.75rem 1rem;
        background: linear-gradient(135deg, #10b981, #059669);
        color: white;
        border: none;
        border-radius: 8px;
        font-size: 0.875rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        margin-bottom: 1.5rem;
    }

    .custom-export-button:hover:not(:disabled) {
        background: linear-gradient(135deg, #059669, #047857);
        transform: translateY(-1px);
        box-shadow: 0 4px 8px rgba(16, 185, 129, 0.3);
    }

    .custom-export-button:disabled {
        opacity: 0.6;
        cursor: not-allowed;
        transform: none;
    }

    /* Features Info */
    .features-info {
        margin-bottom: 2rem;
        padding-top: 1.5rem;
        border-top: 1px solid #e5e7eb;
    }

    :global(.dark-mode) .features-info {
        border-top-color: #4a5568;
    }

    .features-info h4 {
        margin: 0 0 1rem 0;
        font-size: 1rem;
        font-weight: 600;
        color: #374151;
    }

    :global(.dark-mode) .features-info h4 {
        color: #e2e8f0;
    }

    .features-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 0.75rem;
    }

    .feature-item {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem;
        background: #f8fafc;
        border-radius: 6px;
        font-size: 0.875rem;
    }

    :global(.dark-mode) .feature-item {
        background: #1a202c;
    }

    .feature-icon {
        font-size: 1rem;
    }

    .feature-text {
        color: #374151;
        font-weight: 500;
    }

    :global(.dark-mode) .feature-text {
        color: #e2e8f0;
    }

    /* Keyboard Shortcuts */
    .shortcuts {
        border-top: 1px solid #e5e7eb;
        padding-top: 1.5rem;
    }

    :global(.dark-mode) .shortcuts {
        border-top-color: #4a5568;
    }

    .shortcuts h4 {
        margin: 0 0 1rem 0;
        font-size: 1rem;
        font-weight: 600;
        color: #374151;
    }

    :global(.dark-mode) .shortcuts h4 {
        color: #e2e8f0;
    }

    .shortcuts-list {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .shortcut {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        font-size: 0.75rem;
    }

    .shortcut kbd {
        background: #f3f4f6;
        border: 1px solid #d1d5db;
        border-radius: 4px;
        padding: 0.2rem 0.4rem;
        font-size: 0.7rem;
        font-family: monospace;
        color: #374151;
    }

    :global(.dark-mode) .shortcut kbd {
        background: #1a202c;
        border-color: #4a5568;
        color: #e2e8f0;
    }

    .shortcut span {
        color: #6b7280;
    }

    :global(.dark-mode) .shortcut span {
        color: #a0aec0;
    }

    /* Responsive */
    @media (max-width: 768px) {
        .excel-export-panel {
            width: 98%;
            padding: 1.5rem;
            max-height: 98vh;
        }

        .options-grid {
            grid-template-columns: 1fr;
        }

        .quick-grid {
            grid-template-columns: 1fr;
        }

        .checkbox-grid {
            grid-template-columns: 1fr;
        }

        .sheet-checkboxes {
            grid-template-columns: 1fr;
        }

        .features-grid {
            grid-template-columns: 1fr;
        }
    }
</style>