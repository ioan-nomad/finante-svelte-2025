import { writable, derived, get } from 'svelte/store';
// import { secureStorage } from '../../../lib/security/crypto.js';
const secureStorage = {
  secureSave: (key, data) => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch(e) {
      console.log('Save skipped in dev');
    }
  },
  secureLoad: (key) => {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch(e) {
      return null;
    }
  }
};

// Accounts store
export const accounts = writable([
  { id: '1', name: 'Cont Principal', type: 'bank', balance: 5000, currency: 'RON' },
  { id: '2', name: 'Cash', type: 'cash', balance: 500, currency: 'RON' },
  { id: '3', name: 'Economii', type: 'savings', balance: 10000, currency: 'RON' }
]);

// Transactions store
export const transactions = writable([]);

// Helper function to calculate total balance
export function calculateTotalBalance(accountsList) {
  return accountsList.reduce((total, account) => {
    if (account.currency === 'RON') {
      return total + (account.balance || 0);
    }
    // Convert other currencies if needed
    return total + (account.balance || 0);
  }, 0);
}

// Secure save data
export function saveToStorage() {
  try {
    secureStorage.secureSave('fs_accounts', get(accounts));
    secureStorage.secureSave('fs_transactions', get(transactions));
  } catch (error) {
    console.error('Error saving data:', error);
  }
}

// Secure load data
export function loadFromStorage() {
  try {
    const savedAccounts = secureStorage.secureLoad('fs_accounts');
    const savedTransactions = secureStorage.secureLoad('fs_transactions');
    
    if (savedAccounts) {
      accounts.set(savedAccounts);
    }
    
    if (savedTransactions) {
      transactions.set(savedTransactions);
    }
  } catch (error) {
    console.error('Error loading data:', error);
  }
}

// Auto-save on changes
accounts.subscribe(() => saveToStorage());
transactions.subscribe(() => saveToStorage());

// Initialize on load
if (typeof window !== 'undefined') {
  loadFromStorage();
}