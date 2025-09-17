import { writable } from 'svelte/store';

function createToastStore() {
    const { subscribe, update } = writable([]);
    let nextId = 1;

    return {
        subscribe,
        add(toastData) {
            const id = nextId++;
            const toast = {
                id,
                type: toastData.type || 'info',
                message: toastData.message || '',
                duration: toastData.duration || 3000
            };
            update(toasts => [...toasts, toast]);
            if (toast.duration > 0) {
                setTimeout(() => this.remove(id), toast.duration);
            }
            return id;
        },
        remove(id) {
            update(toasts => toasts.filter(t => t.id !== id));
        },
        clear() {
            update(() => []);
        }
    };
}

export const toastStore = createToastStore();
export default toastStore;