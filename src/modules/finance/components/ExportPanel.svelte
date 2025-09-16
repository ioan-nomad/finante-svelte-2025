<script>
    import { onMount, createEventDispatcher } from 'svelte';
    import { pdfExporter } from '../../../lib/services/PDFExporter.js';
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
        includeTransactions: true,
        format: 'detailed', // 'detailed', 'summary', 'executive'
        period: 'custom',
        customPeriod: '',
        maxTransactions: 100
    };

    // Available quick exports
    const quickExports = [
        {
            id: 'financial-summary',
            name: 'Raport Financiar Rapid',
            description: 'Sumar cu statistici principale',
            icon: '📊',
            module: 'finance'
        },
        {
            id: 'monthly-detailed',
            name: 'Raport Lunar Complet',
            description: 'Raport detaliat cu grafice și tranzacții',
            icon: '📈',
            module: 'finance'
        },
        {
            id: 'shopping-list',
            name: 'Listă Cumpărături',
            description: 'Export pantry și shopping list',
            icon: '🛒',
            module: 'pantry'
        },
        {
            id: 'nutrition-plan',
            name: 'Plan Nutriție',
            description: 'Rețete și meal plan',
            icon: '🍽️',
            module: 'nutrition'
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

        $transactions.forEach(tx => {
            const txDate = new Date(tx.date);
            if (txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear) {
                if (tx.type === 'income') {
                    monthlyIncome += tx.amount;
                } else if (tx.type === 'expense') {
                    monthlyExpenses += tx.amount;
                }
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
                totalBalance: $totalBalance
            },
            accounts: $accounts,
            transactions: $transactions.slice(0, exportOptions.maxTransactions),
            budgets: [], // TODO: Get from budget store when available
            goals: []   // TODO: Get from goals store when available
        };
    }

    // Get available charts based on current page
    function getAvailableCharts() {
        const charts = [];

        // Check which charts exist on current page
        const chartIds = [
            'categoryChart',
            'trendChart',
            'topCategoriesChart',
            'accountChart',
            'expenseChart',
            'incomeChart',
            'balanceChart',
            'budgetChart'
        ];

        chartIds.forEach(id => {
            if (document.getElementById(id)) {
                charts.push(id);
            }
        });

        return charts;
    }

    // Progress simulation
    function updateProgress(target) {
        const interval = setInterval(() => {
            exportProgress += Math.random() * 15;
            if (exportProgress >= target) {
                exportProgress = target;
                clearInterval(interval);
            }
        }, 100);
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
                message: 'Generez PDF...',
                duration: 2000
            });

            let blob;
            let filename;

            switch (exportType.id) {
                case 'financial-summary':
                    blob = await pdfExporter.generateFinancialReport(data, {
                        period: exportOptions.customPeriod || `Raport Rapid ${new Date().toLocaleDateString('ro-RO')}`,
                        includeCharts: false,
                        includeTransactions: false,
                        format: 'summary'
                    });
                    filename = `raport-financiar-rapid-${new Date().toISOString().split('T')[0]}.pdf`;
                    break;

                case 'monthly-detailed':
                    const availableCharts = getAvailableCharts();
                    blob = await pdfExporter.generateFinancialReport(data, {
                        period: exportOptions.customPeriod || `Raport Lunar ${new Date().toLocaleDateString('ro-RO', { month: 'long', year: 'numeric' })}`,
                        includeCharts: true,
                        includeTransactions: true,
                        format: 'detailed',
                        charts: availableCharts
                    });
                    filename = `raport-lunar-${new Date().toISOString().split('T')[0]}.pdf`;
                    break;

                case 'shopping-list':
                    // TODO: Implement pantry data gathering
                    blob = await pdfExporter.generatePantryReport({
                        inventory: [],
                        shoppingList: []
                    }, {
                        period: `Listă Cumpărături ${new Date().toLocaleDateString('ro-RO')}`
                    });
                    filename = `lista-cumparaturi-${new Date().toISOString().split('T')[0]}.pdf`;
                    break;

                case 'nutrition-plan':
                    // TODO: Implement nutrition data gathering
                    blob = await pdfExporter.generateNutritionReport({
                        meals: [],
                        recipes: []
                    }, {
                        period: `Plan Nutriție ${new Date().toLocaleDateString('ro-RO')}`
                    });
                    filename = `plan-nutritie-${new Date().toISOString().split('T')[0]}.pdf`;
                    break;

                default:
                    throw new Error('Tip export necunoscut');
            }

            // Download the file
            await pdfExporter.download(blob, filename);

            toastStore.add({
                type: 'success',
                message: 'PDF generat cu succes!',
                duration: 3000
            });

            exportProgress = 100;
            setTimeout(() => {
                closePanel();
            }, 1000);

        } catch (error) {
            console.error('Export failed:', error);
            toastStore.add({
                type: 'error',
                message: `Eroare la export: ${error.message}`,
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
            const availableCharts = exportOptions.includeCharts ? getAvailableCharts() : [];

            updateProgress(100);

            toastStore.add({
                type: 'info',
                message: 'Generez raport personalizat...',
                duration: 2000
            });

            const blob = await pdfExporter.generateFinancialReport(data, {
                period: exportOptions.customPeriod || `Raport Personalizat ${new Date().toLocaleDateString('ro-RO')}`,
                includeCharts: exportOptions.includeCharts,
                includeTransactions: exportOptions.includeTransactions,
                format: exportOptions.format,
                charts: availableCharts
            });

            const filename = `raport-personalizat-${new Date().toISOString().split('T')[0]}.pdf`;
            await pdfExporter.download(blob, filename);

            toastStore.add({
                type: 'success',
                message: 'Raport personalizat generat cu succes!',
                duration: 3000
            });

            exportProgress = 100;
            setTimeout(() => {
                closePanel();
            }, 1000);

        } catch (error) {
            console.error('Custom export failed:', error);
            toastStore.add({
                type: 'error',
                message: `Eroare la export personalizat: ${error.message}`,
                duration: 5000
            });
        } finally {
            isExporting = false;
        }
    }

    // Keyboard shortcuts
    function handleKeydown(event) {
        if (event.ctrlKey && event.shiftKey && event.code === 'KeyP') {
            event.preventDefault();
            togglePanel();
        } else if (event.code === 'Escape' && isOpen) {
            event.preventDefault();
            closePanel();
        } else if (event.ctrlKey && event.code === 'KeyE' && isOpen && !isExporting) {
            event.preventDefault();
            executeCustomExport();
        }
    }
</script>

<svelte:window on:keydown={handleKeydown} />

<!-- Export Button -->
<div class="export-trigger">
    <button
        class="export-button"
        on:click={togglePanel}
        title="Export PDF (Ctrl+Shift+P)"
        disabled={isExporting}
    >
        {#if isExporting}
            <span class="loading-spinner"></span>
        {:else}
            📄
        {/if}
        Export PDF
    </button>
</div>

<!-- Export Panel -->
{#if isOpen}
    <div class="export-overlay" on:click={closePanel}>
        <div class="export-panel" on:click|stopPropagation>
            <!-- Header -->
            <div class="panel-header">
                <h3>📄 Export PDF Reports</h3>
                <button class="close-button" on:click={closePanel}>×</button>
            </div>

            <!-- Progress Bar -->
            {#if isExporting}
                <div class="progress-container">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: {exportProgress}%"></div>
                    </div>
                    <div class="progress-text">Generez PDF... {Math.round(exportProgress)}%</div>
                </div>
            {/if}

            <!-- Quick Exports -->
            <div class="quick-exports">
                <h4>🚀 Export Rapid</h4>
                <div class="quick-grid">
                    {#each quickExports as exportType}
                        <button
                            class="quick-export-card"
                            class:disabled={isExporting}
                            on:click={() => executeQuickExport(exportType)}
                            disabled={isExporting}
                        >
                            <div class="card-icon">{exportType.icon}</div>
                            <div class="card-title">{exportType.name}</div>
                            <div class="card-description">{exportType.description}</div>
                        </button>
                    {/each}
                </div>
            </div>

            <!-- Custom Export Options -->
            <div class="custom-export">
                <h4>⚙️ Export Personalizat</h4>

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
                            <option value="executive">Executiv</option>
                        </select>
                    </div>

                    <!-- Include Charts -->
                    <div class="option-group">
                        <label class="checkbox-label">
                            <input
                                type="checkbox"
                                bind:checked={exportOptions.includeCharts}
                                disabled={isExporting}
                            >
                            Include grafice
                        </label>
                    </div>

                    <!-- Include Transactions -->
                    <div class="option-group">
                        <label class="checkbox-label">
                            <input
                                type="checkbox"
                                bind:checked={exportOptions.includeTransactions}
                                disabled={isExporting}
                            >
                            Include tranzacții
                        </label>
                    </div>

                    <!-- Max Transactions -->
                    {#if exportOptions.includeTransactions}
                        <div class="option-group">
                            <label>Max tranzacții:</label>
                            <input
                                type="number"
                                bind:value={exportOptions.maxTransactions}
                                min="10"
                                max="500"
                                disabled={isExporting}
                            >
                        </div>
                    {/if}
                </div>

                <!-- Custom Export Button -->
                <button
                    class="custom-export-button"
                    on:click={executeCustomExport}
                    disabled={isExporting}
                    title="Export Personalizat (Ctrl+E)"
                >
                    {#if isExporting}
                        <span class="loading-spinner"></span>
                    {:else}
                        🎯
                    {/if}
                    Generează Raport Personalizat
                </button>
            </div>

            <!-- Keyboard Shortcuts -->
            <div class="shortcuts">
                <h4>⌨️ Scurtături Tastatură</h4>
                <div class="shortcuts-list">
                    <div class="shortcut">
                        <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>P</kbd>
                        <span>Toggle panou export</span>
                    </div>
                    <div class="shortcut">
                        <kbd>Ctrl</kbd> + <kbd>E</kbd>
                        <span>Export personalizat</span>
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
    .export-trigger {
        position: relative;
    }

    .export-button {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.75rem 1rem;
        background: linear-gradient(135deg, #1a73e8, #1557b0);
        color: white;
        border: none;
        border-radius: 8px;
        font-size: 0.875rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        box-shadow: 0 2px 4px rgba(26, 115, 232, 0.2);
    }

    .export-button:hover:not(:disabled) {
        background: linear-gradient(135deg, #1557b0, #1142a0);
        transform: translateY(-1px);
        box-shadow: 0 4px 8px rgba(26, 115, 232, 0.3);
    }

    .export-button:disabled {
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
    .export-overlay {
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

    .export-panel {
        background: white;
        border-radius: 12px;
        padding: 2rem;
        max-width: 800px;
        width: 90%;
        max-height: 90vh;
        overflow-y: auto;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
        animation: slideIn 0.3s ease-out;
    }

    :global(.dark-mode) .export-panel {
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
        margin-bottom: 1.5rem;
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
        color: #1a73e8;
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
        background: linear-gradient(90deg, #1a73e8, #10b981);
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
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
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
        border-color: #1a73e8;
        background: #f8fafc;
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(26, 115, 232, 0.15);
    }

    :global(.dark-mode) .quick-export-card:hover:not(.disabled) {
        background: #2d3748;
        border-color: #1a73e8;
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
    }

    :global(.dark-mode) .card-description {
        color: #a0aec0;
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

    .custom-export h4 {
        margin: 0 0 1rem 0;
        font-size: 1rem;
        font-weight: 600;
        color: #374151;
    }

    :global(.dark-mode) .custom-export h4 {
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

    .checkbox-label {
        display: flex !important;
        flex-direction: row !important;
        align-items: center;
        gap: 0.5rem;
        cursor: pointer;
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
        border-color: #1a73e8;
        box-shadow: 0 0 0 3px rgba(26, 115, 232, 0.1);
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
        .export-panel {
            width: 95%;
            padding: 1.5rem;
            max-height: 95vh;
        }

        .options-grid {
            grid-template-columns: 1fr;
        }

        .quick-grid {
            grid-template-columns: 1fr;
        }

        .shortcuts-list {
            font-size: 0.7rem;
        }
    }
</style>