// shared/stores/sharedStore.js
import { writable, derived } from 'svelte/store';

// Generate unique ID
export function nid() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Get today's date in YYYY-MM-DD format
export function today() {
  return new Date().toISOString().split('T')[0];
}

// Format currency
export function fmt(amount, currency = 'RON') {
  return new Intl.NumberFormat('ro-RO', {
    style: 'currency',
    currency: currency
  }).format(amount);
}

// Shared app state
export const appState = writable({
  currentUser: null,
  theme: 'light',
  lastSync: null
});

// Shared notifications
export const notifications = writable([]);

// Add notification helper
export function addNotification(message, type = 'info', duration = 3000) {
  const id = nid();
  const notification = { id, message, type, timestamp: Date.now() };
  
  notifications.update(items => [...items, notification]);
  
  if (duration > 0) {
    setTimeout(() => {
      notifications.update(items => items.filter(item => item.id !== id));
    }, duration);
  }
  
  return id;
}