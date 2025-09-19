<script>
    import { onMount } from 'svelte';
    // Import all Finance components
    import Dashboard from './components/Dashboard.svelte';
    import Conturi from '../../components/Conturi.svelte';
    import Tranzactii from '../../components/Tranzactii.svelte';
    import Budgeturi from '../../components/Budgeturi.svelte';
    import Obiective from '../../components/Obiective.svelte';
    import Reconciliere from '../../components/Reconciliere.svelte';
    import RecurringPayments from '../../components/RecurringPayments.svelte';
    import RapoarteAvansate from '../../components/RapoarteAvansate.svelte';
    import PDFImporter from '../../components/PDFImporter.svelte';
    import EditModal from '../../components/EditModal.svelte';
    import ExportPanel from './components/ExportPanel.svelte';
    import ExcelExportButton from '../../components/ExcelExportButton.svelte';
    import { accounts, transactions, totalBalance } from './stores/financeStore.js';
    import { populateDemoData } from '../../lib/demo-data.js';

    let activeTab = 'dashboard';
    let isLoading = false;

    const tabs = [
        { id: 'dashboard', label: 'Dashboard', icon: '📊' },
        { id: 'conturi', label: 'Conturi', icon: '💳' },
        { id: 'tranzactii', label: 'Tranzacții', icon: '💸' },
        { id: 'budgete', label: 'Bugete', icon: '🎯' },
        { id: 'obiective', label: 'Obiective', icon: '🏆' },
        { id: 'reconciliere', label: 'Reconciliere', icon: '✅' },
        { id: 'recurring', label: 'Plăți Recurente', icon: '🔄' },
        { id: 'rapoarte', label: 'Rapoarte', icon: '📈' },
        { id: 'import', label: 'Import PDF', icon: '📥' },
        { id: 'export', label: 'Export', icon: '📤' }
    ];

    onMount(() => {
        console.log('🔷 Finance Module loaded');
        // Load saved tab preference
        const savedTab = localStorage.getItem('financeActiveTab');
        if (savedTab) {
            activeTab = savedTab;
        }
    });

    function switchTab(tabId) {
        activeTab = tabId;
        localStorage.setItem('financeActiveTab', tabId);
    }

    function loadDemoData() {
        populateDemoData();
        alert('Demo data loaded successfully!');
        window.location.reload();
    }
</script>

<div class="finance-container">
    {#if isLoading}
        <div class="loading-state">
            <div class="loading-spinner"></div>
            <div>Se încarcă...</div>
        </div>
    {:else}
        <!-- Module Header -->
        <div class="module-header">
            <h1 class="module-title">
                <span>💰</span>
                Finance Management
            </h1>
            <button class="demo-data-button" on:click={loadDemoData}>
                <span>🎲</span>
                Load Demo Data
            </button>
        </div>

        <!-- Tab Navigation -->
        <div class="tab-navigation">
            {#each tabs as tab}
                <button
                    class="tab-button"
                    class:active={activeTab === tab.id}
                    on:click={() => switchTab(tab.id)}
                >
                    <span class="tab-icon">{tab.icon}</span>
                    <span class="tab-name">{tab.label}</span>
                </button>
            {/each}
        </div>

        <!-- Tab Content -->
        <div class="tab-content">
            {#if activeTab === 'dashboard'}
                <Dashboard />
            {:else if activeTab === 'conturi'}
                <Conturi />
            {:else if activeTab === 'tranzactii'}
                <Tranzactii />
            {:else if activeTab === 'budgete'}
                <Budgeturi />
            {:else if activeTab === 'obiective'}
                <Obiective />
            {:else if activeTab === 'reconciliere'}
                <Reconciliere />
            {:else if activeTab === 'recurring'}
                <RecurringPayments />
            {:else if activeTab === 'rapoarte'}
                <RapoarteAvansate />
            {:else if activeTab === 'import'}
                <div class="import-section">
                    <h3>📥 Import PDF Extrase</h3>
                    <PDFImporter />
                </div>
            {:else if activeTab === 'export'}
                <div class="export-section">
                    <h3>📤 Export & Backup</h3>
                    <div class="export-options">
                        <ExportPanel />
                        <ExcelExportButton module="finance" variant="card" />
                    </div>
                </div>
            {/if}
        </div>

        <!-- EditModal - Global component for editing transactions -->
        <EditModal />
    {/if}
</div>

<style>
    .finance-container {
        width: 100%;
        max-width: 1400px;
        margin: 0 auto;
        padding: 1rem;
    }

    .loading-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 3rem;
        gap: 1rem;
    }

    .loading-spinner {
        width: 2rem;
        height: 2rem;
        border: 3px solid #f3f3f3;
        border-top: 3px solid #3b82f6;
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }

    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }

    .module-header {
        margin-bottom: 2rem;
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 1rem;
    }

    .module-title {
        font-size: 2rem;
        font-weight: 700;
        margin: 0;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        color: var(--text-primary, #333);
    }

    .tab-navigation {
        display: flex;
        gap: 0.5rem;
        margin-bottom: 2rem;
        border-bottom: 1px solid var(--border-color, #e0e0e0);
        padding-bottom: 0;
        overflow-x: auto;
    }

    .tab-button {
        background: none;
        border: none;
        padding: 1rem 1.5rem;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-weight: 600;
        color: var(--text-secondary, #666);
        border-bottom: 3px solid transparent;
        transition: all 0.3s ease;
        white-space: nowrap;
        min-width: max-content;
    }

    .tab-button:hover {
        color: var(--text-primary, #333);
        background: rgba(0, 0, 0, 0.05);
    }

    .tab-button.active {
        color: #3b82f6;
        border-bottom-color: #3b82f6;
        background: rgba(59, 130, 246, 0.1);
    }

    .tab-icon {
        font-size: 1.1rem;
    }

    .tab-content {
        min-height: 400px;
    }

    .coming-soon {
        text-align: center;
        padding: 3rem;
        background: var(--card-bg, white);
        border-radius: 12px;
        border: 1px solid var(--border-color, #e0e0e0);
    }

    .coming-soon h3 {
        font-size: 1.5rem;
        margin-bottom: 1rem;
        color: var(--text-primary, #333);
    }

    .coming-soon p {
        color: var(--text-secondary, #666);
        margin-bottom: 0.5rem;
    }

    .export-section, .import-section {
        background: var(--card-bg, white);
        border-radius: 12px;
        padding: 2rem;
        border: 1px solid var(--border-color, #e0e0e0);
    }

    .export-section h3, .import-section h3 {
        font-size: 1.5rem;
        margin-bottom: 1.5rem;
        color: var(--text-primary, #333);
    }

    .export-options {
        display: grid;
        gap: 2rem;
    }

    /* Dark mode support */
    :global(.dark-mode) .finance-container {
        background: var(--bg-dark, #1a1f2e);
        color: var(--text-dark, #e5e7eb);
    }

    :global(.dark-mode) .module-title {
        color: var(--text-dark, #e5e7eb);
    }

    :global(.dark-mode) .tab-navigation {
        border-bottom-color: var(--border-dark, #374151);
    }

    :global(.dark-mode) .tab-button {
        color: var(--text-secondary-dark, #9ca3af);
    }

    :global(.dark-mode) .tab-button:hover {
        color: var(--text-dark, #e5e7eb);
        background: rgba(255, 255, 255, 0.05);
    }

    :global(.dark-mode) .tab-button.active {
        color: #60a5fa;
        background: rgba(96, 165, 250, 0.1);
        border-bottom-color: #60a5fa;
    }

    :global(.dark-mode) .export-section,
    :global(.dark-mode) .import-section,
    :global(.dark-mode) .coming-soon {
        background: var(--card-bg-dark, #252a3a);
        border-color: var(--border-dark, #374151);
    }

    :global(.dark-mode) .export-section h3,
    :global(.dark-mode) .import-section h3,
    :global(.dark-mode) .coming-soon h3 {
        color: var(--text-dark, #e5e7eb);
    }

    :global(.dark-mode) .coming-soon p {
        color: var(--text-secondary-dark, #9ca3af);
    }

    .demo-data-button {
        background: linear-gradient(135deg, #3b82f6, #1d4ed8);
        color: white;
        border: none;
        padding: 0.75rem 1.5rem;
        border-radius: 8px;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-weight: 600;
        font-size: 0.875rem;
        transition: all 0.3s ease;
        box-shadow: 0 2px 4px rgba(59, 130, 246, 0.2);
    }

    .demo-data-button:hover {
        background: linear-gradient(135deg, #2563eb, #1e40af);
        transform: translateY(-1px);
        box-shadow: 0 4px 8px rgba(59, 130, 246, 0.3);
    }

    .demo-data-button:active {
        transform: translateY(0);
        box-shadow: 0 2px 4px rgba(59, 130, 246, 0.2);
    }

    :global(.dark-mode) .demo-data-button {
        background: linear-gradient(135deg, #60a5fa, #3b82f6);
        box-shadow: 0 2px 4px rgba(96, 165, 250, 0.2);
    }

    :global(.dark-mode) .demo-data-button:hover {
        background: linear-gradient(135deg, #3b82f6, #2563eb);
        box-shadow: 0 4px 8px rgba(96, 165, 250, 0.3);
    }

    @media (max-width: 768px) {
        .finance-container {
            padding: 0.5rem;
        }

        .module-title {
            font-size: 1.5rem;
        }

        .tab-button {
            padding: 0.75rem 1rem;
            font-size: 0.875rem;
        }

        .tab-navigation {
            gap: 0.25rem;
        }

        .module-header {
            flex-direction: column;
            align-items: flex-start;
        }

        .demo-data-button {
            align-self: stretch;
            justify-content: center;
        }
    }
</style>