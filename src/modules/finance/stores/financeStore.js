import { writable, derived, get } from 'svelte/store';

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

// Load data from localStorage
export function loadFromStorage() {
  try {
    const savedAccounts = localStorage.getItem('fs_accounts');
    const savedTransactions = localStorage.getItem('fs_transactions');
    
    if (savedAccounts) {
      accounts.set(JSON.parse(savedAccounts));
    }
    
    if (savedTransactions) {
      transactions.set(JSON.parse(savedTransactions));
    }
  } catch (error) {
    console.error('Error loading data:', error);
  }
}

// Save data to localStorage
export function saveToStorage() {
  try {
    localStorage.setItem('fs_accounts', JSON.stringify(get(accounts)));
    localStorage.setItem('fs_transactions', JSON.stringify(get(transactions)));
  } catch (error) {
    console.error('Error saving data:', error);
  }
}

// Auto-save on changes
accounts.subscribe(() => saveToStorage());
transactions.subscribe(() => saveToStorage());

// Initialize on load
if (typeof window !== 'undefined') {
  loadFromStorage();
}