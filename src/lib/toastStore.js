// lib/toastStore.js
import { writable } from 'svelte/store';

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