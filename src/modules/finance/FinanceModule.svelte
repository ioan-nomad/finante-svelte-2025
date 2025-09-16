<script>
    import { onMount } from 'svelte';
    import Dashboard from '../../components/Dashboard.svelte';
    import { financeStore } from './stores/financeStore.js';

    // Verifică dacă ai ExportPanel importat corect
    // import ExportPanel from './components/ExportPanel.svelte';

    let isLoading = true;

    onMount(() => {
        // Initialize finance store
        console.log('Finance Module loaded');
        isLoading = false;
    });
</script>

<style>
    .finance-container {
        width: 100%;
    }

    .loading {
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 400px;
        font-size: 1.2rem;
        color: var(--text-secondary);
    }
</style>

<div class="finance-container">
    {#if isLoading}
        <div class="loading">Se încarcă modulul Finance...</div>
    {:else}
        <Dashboard />
        <!-- Dacă vrei să adaugi Export Panel: -->
        <!-- <ExportPanel /> -->
    {/if}
</div>