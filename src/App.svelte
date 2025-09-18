<script>
    import { onMount } from 'svelte';
    import FinanceModule from './modules/finance/FinanceModule.svelte';
    import PantryModule from './modules/pantry/PantryModule.svelte';
    import NutritionModule from './modules/nutrition/NutritionModule.svelte';

    // Import Toast Component
    import Toast from './components/Toast.svelte';

    // Theme handling
    let darkMode = localStorage.getItem('theme') === 'dark';
    let activeModule = localStorage.getItem('activeModule') || 'finance';

    const modules = [
        { id: 'finance', name: 'Finance', icon: '💰', component: FinanceModule },
        { id: 'pantry', name: 'Pantry', icon: '🛒', component: PantryModule },
        { id: 'nutrition', name: 'Nutrition', icon: '🍽️', component: NutritionModule }
    ];

    onMount(() => {
        // Apply theme
        document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');

        // Remove loading screen
        const loader = document.getElementById('app-loader');
        if (loader) {
            setTimeout(() => {
                loader.style.opacity = '0';
                setTimeout(() => loader.remove(), 300);
            }, 500);
        }
    });

    function toggleTheme() {
        darkMode = !darkMode;
        document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
        localStorage.setItem('theme', darkMode ? 'dark' : 'light');
    }

    function switchModule(moduleId) {
        activeModule = moduleId;
        localStorage.setItem('activeModule', moduleId);
    }

    $: currentModule = modules.find(m => m.id === activeModule) || modules[0];
</script>

<style>
    :global(body) {
        margin: 0;
        padding: 0;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        background: var(--bg-primary, #ffffff);
        color: var(--text-primary, #202124);
    }

    :global([data-theme="dark"]) {
        --bg-primary: #1e1e1e;
        --bg-secondary: #2a2a2a;
        --text-primary: #e8eaed;
        --text-secondary: #9aa0a6;
        --border-color: #5f6368;
        --card-bg: #292929;
    }

    :global([data-theme="light"]) {
        --bg-primary: #ffffff;
        --bg-secondary: #f8f9fa;
        --text-primary: #202124;
        --text-secondary: #5f6368;
        --border-color: #dadce0;
        --card-bg: #ffffff;
    }

    .app-container {
        min-height: 100vh;
        display: flex;
        flex-direction: column;
    }

    .app-header {
        background: var(--bg-secondary);
        border-bottom: 1px solid var(--border-color);
        padding: 1rem 2rem;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .app-title {
        font-size: 1.5rem;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .theme-toggle {
        background: none;
        border: 1px solid var(--border-color);
        color: var(--text-primary);
        padding: 0.5rem 1rem;
        border-radius: 8px;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        transition: all 0.3s ease;
    }

    .theme-toggle:hover {
        background: var(--border-color);
    }

    .navigation {
        background: var(--bg-secondary);
        border-bottom: 1px solid var(--border-color);
        padding: 0 2rem;
        display: flex;
        gap: 0;
        overflow-x: auto;
    }

    .nav-tab {
        background: none;
        border: none;
        padding: 1rem 1.5rem;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-weight: 600;
        color: var(--text-secondary);
        border-bottom: 3px solid transparent;
        transition: all 0.3s ease;
        white-space: nowrap;
        min-width: max-content;
    }

    .nav-tab:hover {
        color: var(--text-primary);
        background: rgba(0, 0, 0, 0.05);
    }

    .nav-tab.active {
        color: #3b82f6;
        border-bottom-color: #3b82f6;
        background: rgba(59, 130, 246, 0.1);
    }

    .nav-icon {
        font-size: 1.2rem;
    }

    .app-content {
        flex: 1;
        max-width: 1400px;
        width: 100%;
        margin: 0 auto;
        box-sizing: border-box;
        min-height: 0;
    }

    @media (max-width: 768px) {
        .app-header {
            padding: 1rem;
            flex-direction: column;
            gap: 1rem;
        }

        .navigation {
            padding: 0 1rem;
        }

        .nav-tab {
            padding: 0.75rem 1rem;
            font-size: 0.875rem;
        }

        .app-title {
            font-size: 1.25rem;
        }
    }
</style>

<div class="app-container">
    <header class="app-header">
        <div class="app-title">
            <span>💰</span>
            <span>N-OMAD Suite</span>
        </div>
        <button class="theme-toggle" on:click={toggleTheme}>
            {#if darkMode}
                <span>☀️</span>
                <span>Light Mode</span>
            {:else}
                <span>🌙</span>
                <span>Dark Mode</span>
            {/if}
        </button>
    </header>

    <!-- Navigation Tabs -->
    <nav class="navigation">
        {#each modules as module}
            <button
                class="nav-tab"
                class:active={activeModule === module.id}
                on:click={() => switchModule(module.id)}
            >
                <span class="nav-icon">{module.icon}</span>
                <span>{module.name}</span>
            </button>
        {/each}
    </nav>

    <main class="app-content">
        <svelte:component this={currentModule.component} />
    </main>

    <!-- Toast Notifications -->
    <Toast />
</div>