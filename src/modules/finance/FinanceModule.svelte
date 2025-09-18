<script>
    import { onMount } from 'svelte';
    import Dashboard from '../../components/Dashboard.svelte';
    import ExportPanel from './components/ExportPanel.svelte';
    import ExcelExportButton from '../../components/ExcelExportButton.svelte';
    import { accounts, transactions, totalBalance } from './stores/financeStore.js';

    let activeTab = 'dashboard';
    let isLoading = false;

    const tabs = [
        { id: 'dashboard', name: 'Dashboard', icon: '📊' },
        { id: 'transactions', name: 'Transactions', icon: '💸' },
        { id: 'accounts', name: 'Accounts', icon: '🏦' },
        { id: 'export', name: 'Export', icon: '📤' }
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
                    <span class="tab-name">{tab.name}</span>
                </button>
            {/each}
        </div>

        <!-- Tab Content -->
        <div class="tab-content">
            {#if activeTab === 'dashboard'}
                <Dashboard />
            {:else if activeTab === 'transactions'}
                <div class="coming-soon">
                    <h3>💸 Transactions Management</h3>
                    <p>Advanced transaction management coming soon...</p>
                    <p>For now, use the Dashboard to manage transactions.</p>
                </div>
            {:else if activeTab === 'accounts'}
                <div class="coming-soon">
                    <h3>🏦 Account Management</h3>
                    <p>Advanced account management coming soon...</p>
                    <p>For now, use the Dashboard to manage accounts.</p>
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

    .export-section {
        background: var(--card-bg, white);
        border-radius: 12px;
        padding: 2rem;
        border: 1px solid var(--border-color, #e0e0e0);
    }

    .export-section h3 {
        font-size: 1.5rem;
        margin-bottom: 1.5rem;
        color: var(--text-primary, #333);
    }

    .export-options {
        display: grid;
        gap: 2rem;
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
    }
</style>