<!-- components/Toast.svelte -->
<script>
  import { writable } from 'svelte/store';
  import { onDestroy } from 'svelte';
  
  // Store pentru notificări
  function createToastStore() {
    const { subscribe, update } = writable([]);
    
    return {
      subscribe,
      show(message, type = 'info', duration = 3000) {
        const id = Math.random().toString(36).substr(2, 9);
        const toast = { id, message, type, duration };
        
        update(toasts => [...toasts, toast]);
        
        if (duration > 0) {
          setTimeout(() => {
            this.remove(id);
          }, duration);
        }
        
        return id;
      },
      remove(id) {
        update(toasts => toasts.filter(t => t.id !== id));
      },
      success(message, duration = 3000) {
        return this.show(message, 'success', duration);
      },
      error(message, duration = 4000) {
        return this.show(message, 'error', duration);
      },
      warning(message, duration = 3500) {
        return this.show(message, 'warning', duration);
      },
      info(message, duration = 3000) {
        return this.show(message, 'info', duration);
      }
    };
  }
  
  export const toast = createToastStore();
  
  // Animații
  function flyIn(node, { delay = 0, duration = 400 }) {
    return {
      delay,
      duration,
      css: (t) => {
        const eased = elasticOut(t);
        return `
          transform: translateX(${(1 - eased) * 100}%);
          opacity: ${t};
        `;
      }
    };
  }
  
  function flyOut(node, { delay = 0, duration = 200 }) {
    return {
      delay,
      duration,
      css: (t) => `
        transform: translateX(${(1 - t) * 100}%);
        opacity: ${t};
      `
    };
  }
  
  // Elastic easing pentru animație mai plăcută
  function elasticOut(t) {
    return Math.sin((-13.0 * (t + 1.0) * Math.PI) / 2) * Math.pow(2.0, -10.0 * t) + 1.0;
  }
  
  // Icons pentru fiecare tip
  const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️'
  };
  
  // Culori pentru fiecare tip
  const colors = {
    success: '#10b981',
    error: '#ef4444',
    warning: '#f59e0b',
    info: '#3b82f6'
  };
</script>

<div class="toast-container">
  {#each $toast as item (item.id)}
    <div 
      class="toast toast-{item.type}"
      style="--toast-color: {colors[item.type]}"
      in:flyIn
      out:flyOut
    >
      <span class="toast-icon">{icons[item.type]}</span>
      <span class="toast-message">{item.message}</span>
      <button 
        class="toast-close"
        on:click={() => toast.remove(item.id)}
      >
        ×
      </button>
    </div>
  {/each}
</div>

<style>
  .toast-container {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 9999;
    pointer-events: none;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  
  .toast {
    display: flex;
    align-items: center;
    gap: 12px;
    background: var(--panel);
    border: 1px solid var(--toast-color);
    border-radius: 12px;
    padding: 14px 16px;
    min-width: 300px;
    max-width: 500px;
    box-shadow: 
      0 10px 25px rgba(0, 0, 0, 0.3),
      0 0 20px rgba(var(--toast-color), 0.1),
      inset 0 1px 0 rgba(255, 255, 255, 0.05);
    pointer-events: all;
    backdrop-filter: blur(10px);
    animation: glow 2s ease-in-out infinite alternate;
  }
  
  @keyframes glow {
    from {
      box-shadow: 
        0 10px 25px rgba(0, 0, 0, 0.3),
        0 0 20px rgba(128, 184, 255, 0.1),
        inset 0 1px 0 rgba(255, 255, 255, 0.05);
    }
    to {
      box-shadow: 
        0 10px 25px rgba(0, 0, 0, 0.3),
        0 0 30px rgba(128, 184, 255, 0.2),
        inset 0 1px 0 rgba(255, 255, 255, 0.05);
    }
  }
  
  .toast-icon {
    font-size: 1.2rem;
    filter: drop-shadow(0 0 4px rgba(0, 0, 0, 0.3));
  }
  
  .toast-message {
    flex: 1;
    color: var(--ink);
    font-weight: 500;
    line-height: 1.4;
  }
  
  .toast-close {
    background: transparent;
    border: none;
    color: var(--muted);
    font-size: 1.5rem;
    cursor: pointer;
    padding: 0;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 6px;
    transition: all 0.2s;
  }
  
  .toast-close:hover {
    background: rgba(255, 255, 255, 0.1);
    color: var(--ink);
    transform: scale(1.1);
  }
  
  .toast-success {
    background: linear-gradient(135deg, #0f1220 0%, #0a1810 100%);
    border-color: var(--ok);
  }
  
  .toast-error {
    background: linear-gradient(135deg, #0f1220 0%, #1a0a0a 100%);
    border-color: var(--err);
  }
  
  .toast-warning {
    background: linear-gradient(135deg, #0f1220 0%, #1a1510 100%);
    border-color: var(--warn);
  }
  
  .toast-info {
    background: linear-gradient(135deg, #0f1220 0%, #0a0a1a 100%);
    border-color: var(--acc);
  }
  
  @media (max-width: 600px) {
    .toast-container {
      top: 10px;
      right: 10px;
      left: 10px;
    }
    
    .toast {
      min-width: auto;
      max-width: 100%;
    }
  }
</style>