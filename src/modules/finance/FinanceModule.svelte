<script>
    import { onMount } from 'svelte';
    import Dashboard from './components/Dashboard.svelte';
    import { financeStore } from './stores/financeStore.js';

    let isLoading = false;

    onMount(() => {
        console.log('Finance Module loaded');
    });
</script>

<div class="finance-container">
    {#if isLoading}
        <div>Se încarcă...</div>
    {:else}
        <Dashboard />
    {/if}
</div>

<style>
    .finance-container {
        width: 100%;
    }
</style>