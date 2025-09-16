import { writable } from 'svelte/store';

function createToastStore() {
    const { subscribe, update } = writable([]);

    let nextId = 1;

    return {
        subscribe,

        // Metodă principală compatibilă cu codul existent
        add(toast) {
            const id = nextId++;
            const newToast = {
                id,
                type: toast.type || 'info',
                message: toast.message || '',
                duration: toast.duration || 3000
            };

            update(toasts => [...toasts, newToast]);

            // Auto-remove după duration
            if (newToast.duration > 0) {
                setTimeout(() => {
                    this.remove(id);
                }, newToast.duration);
            }

            return id;
        },

        remove(id) {
            update(toasts => toasts.filter(t => t.id !== id));
        },

        clear() {
            update(() => []);
        },

        // Metode helper pentru compatibilitate
        success(message, duration = 3000) {
            return this.add({ type: 'success', message, duration });
        },

        error(message, duration = 4000) {
            return this.add({ type: 'error', message, duration });
        },

        info(message, duration = 3000) {
            return this.add({ type: 'info', message, duration });
        },

        warning(message, duration = 3500) {
            return this.add({ type: 'warning', message, duration });
        }
    };
}

export const toastStore = createToastStore();
export default toastStore;