<script>
    import { fade, fly } from 'svelte/transition';
    import { toastStore } from '../lib/stores/toastStore.js';

    $: toasts = $toastStore;
</script>

<style>
    .toast-container {
        position: fixed;
        top: 1rem;
        right: 1rem;
        z-index: 9999;
        pointer-events: none;
    }

    .toast {
        background: white;
        border-radius: 8px;
        padding: 1rem 1.5rem;
        margin-bottom: 0.5rem;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        display: flex;
        align-items: center;
        gap: 0.75rem;
        min-width: 250px;
        max-width: 400px;
        pointer-events: auto;
        cursor: pointer;
    }

    .toast.success {
        background: #d4f4dd;
        border-left: 4px solid #34a853;
    }

    .toast.error {
        background: #f8d7da;
        border-left: 4px solid #ea4335;
    }

    .toast.warning {
        background: #fff3cd;
        border-left: 4px solid #fbbc04;
    }

    .toast.info {
        background: #d1ecf1;
        border-left: 4px solid #1a73e8;
    }

    .toast-icon {
        font-size: 1.25rem;
        flex-shrink: 0;
    }

    .toast-message {
        flex: 1;
        color: #202124;
        font-size: 0.95rem;
    }

    .toast-close {
        background: none;
        border: none;
        color: #5f6368;
        cursor: pointer;
        padding: 0;
        font-size: 1.25rem;
        line-height: 1;
        opacity: 0.5;
        transition: opacity 0.2s;
    }

    .toast-close:hover {
        opacity: 1;
    }
</style>

<div class="toast-container">
    {#each toasts as toast (toast.id)}
        <div
            class="toast {toast.type}"
            transition:fly={{ x: 100, duration: 300 }}
            on:click={() => toastStore.remove(toast.id)}
        >
            <span class="toast-icon">
                {#if toast.type === 'success'}
                    ✓
                {:else if toast.type === 'error'}
                    ✗
                {:else if toast.type === 'warning'}
                    !
                {:else}
                    ℹ
                {/if}
            </span>
            <span class="toast-message">{toast.message}</span>
            <button
                class="toast-close"
                on:click|stopPropagation={() => toastStore.remove(toast.id)}
            >
                ×
            </button>
        </div>
    {/each}
</div>