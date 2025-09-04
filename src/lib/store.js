// lib/store.js
import { writable, derived, get } from 'svelte/store';
import { InputSanitizer, secureStorage } from './security/crypto.js';

// ===== Advanced Data Cache System =====
class DataCache {
  constructor(ttl = 5 * 60 * 1000) { // 5 minute TTL
    this.cache = new Map();
    this.ttl = ttl;
  }
  
  set(key, value) {
    this.cache.set(key, {
      value,
      timestamp: Date.now()
    });
  }
  
  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value;
  }
  
  clear() {
    this.cache.clear();
  }
  
  invalidate(pattern) {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }
  
  // Get cache stats for debugging
  getStats() {
    const now = Date.now();
    let expired = 0;
    let active = 0;
    
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > this.ttl) {
        expired++;
      } else {
        active++;
      }
    }
    
    return { active, expired, total: this.cache.size };
  }
}

export const dataCache = new DataCache();

// ===== Optimized Account Balance Calculation =====
export function computeAccountBalanceOptimized(accountId) {
  const cacheKey = `balance-${accountId}-${get(transactions).length}`;
  const cached = dataCache.get(cacheKey);
  if (cached !== null) return cached;
  
  const txs = get(transactions);
  const account = get(accounts).find(a => a.id === accountId);
  if (!account) return 0;
  
  let balance = account.opening || 0;
  
  // Optimized transaction processing
  for (const t of txs) {
    if (t.type === 'income' && t.toAccount === accountId) {
      balance += parseFloat(t.amount) || 0;
    } else if (t.type === 'expense' && t.fromAccount === accountId) {
      balance -= parseFloat(t.amount) || 0;
    } else if (t.type === 'transfer') {
      if (t.fromAccount === accountId) balance -= parseFloat(t.amount) || 0;
      if (t.toAccount === accountId) balance += parseFloat(t.amount) || 0;
    }
  }
  
  dataCache.set(cacheKey, balance);
  return balance;
}

// ===== Optimized Transaction Filtering =====
export function getFilteredTransactions(filters) {
  const cacheKey = `filtered-${JSON.stringify(filters)}-${get(transactions).length}`;
  const cached = dataCache.get(cacheKey);
  if (cached !== null) return cached;
  
  const txs = get(transactions);
  let filtered = txs;
  
  // Apply filters efficiently
  if (filters.type && filters.type !== 'all') {
    filtered = filtered.filter(t => t.type === filters.type);
  }
  
  if (filters.account && filters.account !== 'all') {
    filtered = filtered.filter(t => 
      t.fromAccount === filters.account || t.toAccount === filters.account
    );
  }
  
  if (filters.person && filters.person !== 'all') {
    filtered = filtered.filter(t => t.person === filters.person);
  }
  
  if (filters.category && filters.category !== 'all') {
    filtered = filtered.filter(t => t.category === filters.category);
  }
  
  if (filters.dateRange) {
    const { start, end } = filters.dateRange;
    filtered = filtered.filter(t => {
      const date = new Date(t.date);
      return date >= start && date <= end;
    });
  }
  
  if (filters.amountRange) {
    const { min, max } = filters.amountRange;
    filtered = filtered.filter(t => {
      const amount = parseFloat(t.amount) || 0;
      return amount >= min && amount <= max;
    });
  }
  
  dataCache.set(cacheKey, filtered);
  return filtered;
}

// ===== Cache Management Functions =====
export function clearDataCache() {
  dataCache.clear();
}

export function invalidateBalanceCache() {
  dataCache.invalidate('balance-');
}

export function invalidateFilterCache() {
  dataCache.invalidate('filtered-');
}

export function getCacheStats() {
  return dataCache.getStats();
}

// ===== Categorii exacte din HTML =====
export const CATEGORIES = {
  income: ["Salariu", "Freelance", "Investiții", "Rambursări", "Zile Naștere", "Transfer de la Nico", "Transfer intern", "Altele"],
  expense: [
    "Alimente", "Restaurant/Comenzi", "Transport", "Consumabile Casă", 
    "Facturi", "Abonamente", "Achiziții Diverse", "Concediu/Vacanță",
    "Investiții", "Economii", "Zile Naștere", "Asigurări", "Revizii Mașină",
    "Reparații Casă", "Telefon/Gadgets", "Electrocasnice", "Firmă Nico",
    "Donații", "Nunți", "Mobilier", "Sănătate", "Scule", "ATM Cash", "Altele"
  ],
  transfer: ["Transfer intern", "ATM Cash"]
};

export const CATEGORY_COLORS = {
  "Alimente": "#4ade80",
  "Restaurant/Comenzi": "#f97316",
  "Transport": "#3b82f6",
  "Consumabile Casă": "#8b5cf6",
  "Facturi": "#ef4444",
  "Abonamente": "#ec4899",
  "Achiziții Diverse": "#06b6d4",
  "Concediu/Vacanță": "#fbbf24",
  "Investiții": "#10b981",
  "Economii": "#22c55e",
  "Zile Naștere": "#f472b6",
  "Asigurări": "#7c3aed",
  "Revizii Mașină": "#f59e0b",
  "Reparații Casă": "#dc2626",
  "Telefon/Gadgets": "#0ea5e9",
  "Electrocasnice": "#6366f1",
  "Firmă Nico": "#84cc16",
  "Donații": "#a855f7",
  "Nunți": "#fb923c",
  "Mobilier": "#8b4513",
  "Sănătate": "#ef4444",
  "Scule": "#64748b",
  "Salariu": "#10b981",
  "Freelance": "#06b6d4",
  "Rambursări": "#fbbf24",
  "Transfer de la Nico": "#22d3ee",
  "Transfer intern": "#94a3b8",
  "ATM Cash": "#facc15",
  "Altele": "#9ca3af"
};

// ===== DB Management exact ca în HTML =====
const DB = {
  version: '5.0-advanced',
  
  load() {
    const raw = JSON.parse(localStorage.getItem('fs_data') || '{}');
    let {accounts = [], transactions = [], legend = {}} = raw;
    
    if (!accounts.length) {
      accounts = [
        // Conturi Ioan
        {id: nid(), name: 'BT Ioan', type: 'bank', owner: 'Ioan', currency: 'RON', opening: 0},
        {id: nid(), name: 'Revolut Ioan', type: 'bank', owner: 'Ioan', currency: 'RON', opening: 0},
        {id: nid(), name: 'Wise Ioan', type: 'bank', owner: 'Ioan', currency: 'EUR', opening: 0},
        
        // Conturi Nico RON
        {id: nid(), name: 'BT Cont Curent Nico', type: 'bank', owner: 'Nico', currency: 'RON', opening: 0},
        {id: nid(), name: 'BT Cont ANPH Nico', type: 'bank', owner: 'Nico', currency: 'RON', opening: 0},
        {id: nid(), name: 'BT Cont Economii Nico', type: 'bank', owner: 'Nico', currency: 'RON', opening: 0},
        
        // Conturi Nico EUR
        {id: nid(), name: 'BT Cont Curent Euro Nico', type: 'bank', owner: 'Nico', currency: 'EUR', opening: 0},
        {id: nid(), name: 'BT Cont Economii Euro Nico', type: 'bank', owner: 'Nico', currency: 'EUR', opening: 0},
        
        // Cont Firmă
        {id: nid(), name: 'Cont Firma Nico', type: 'bank', owner: 'Firmă Nico', currency: 'RON', opening: 0},
        
        // Cash
        {id: nid(), name: 'Cash Ioan', type: 'cash', owner: 'Ioan', currency: 'RON', opening: 0},
        {id: nid(), name: 'Cash Nico', type: 'cash', owner: 'Nico', currency: 'RON', opening: 0},
        {id: nid(), name: 'Cash Comun', type: 'cash', owner: 'Comun', currency: 'RON', opening: 0}
      ];
    }
    return {accounts, transactions, legend};
  },
  
  save(accounts, transactions, legend) {
    localStorage.setItem('fs_data', JSON.stringify({
      accounts, 
      transactions, 
      legend, 
      exported: new Date().toISOString(), 
      version: this.version
    }));
  }
};

// ===== Secure Helper functions =====
export function nid() { 
  // Use cryptographically secure random instead of Math.random()
  return secureStorage.generateSecureId(16);
}

export function generateTransactionId() {
  // Use UUID for transaction IDs to ensure uniqueness
  return secureStorage.generateUUID();
}

export function fmt(n) { 
  return new Intl.NumberFormat('ro-RO', {
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2
  }).format(n);
}

export function formatDate(s) {
  const d = new Date(s);
  if (isNaN(d)) return s;
  const m = ['Ian','Feb','Mar','Apr','Mai','Iun','Iul','Aug','Sep','Oct','Nov','Dec'];
  return `${d.getDate()} ${m[d.getMonth()]} ${d.getFullYear()}`;
}

export function today() { 
  return new Date().toISOString().slice(0, 10);
}

export function currentMonth() { 
  return new Date().toISOString().slice(0, 7);
}

export function lastMonth() {
  const d = new Date();
  d.setMonth(d.getMonth() - 1);
  return d.toISOString().slice(0, 7);
}

// ===== Initialize data =====
const initialData = DB.load();

// ===== Svelte stores =====
export const accounts = writable(initialData.accounts);
export const transactions = writable(initialData.transactions);
export const legend = writable(initialData.legend);

// ===== Subscribe to changes and save =====
accounts.subscribe(value => {
  if (value.length) {
    const currentTransactions = get(transactions);
    const currentLegend = get(legend);
    DB.save(value, currentTransactions, currentLegend);
  }
});

transactions.subscribe(value => {
  const currentAccounts = get(accounts);
  const currentLegend = get(legend);
  DB.save(currentAccounts, value, currentLegend);
});

legend.subscribe(value => {
  const currentAccounts = get(accounts);
  const currentTransactions = get(transactions);
  DB.save(currentAccounts, currentTransactions, value);
});

// Performance optimization - memoized computations
const balanceCache = new Map();
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes

function getCacheKey(accountId, transactionsHash) {
  return `${accountId}-${transactionsHash}`;
}

function getTransactionsHash(transactions) {
  // Simple hash based on length and last modification
  if (!transactions.length) return '0';
  const lastTx = transactions[0];
  return `${transactions.length}-${lastTx?.id || '0'}-${lastTx?.amount || '0'}`;
}

// ===== Business logic functions with performance optimizations =====
export function computeAccountBalance(acc, transactionsList = null) {
  const txs = transactionsList || get(transactions);
  
  // Use cache for better performance
  const txHash = getTransactionsHash(txs);
  const cacheKey = getCacheKey(acc.id, txHash);
  const cached = balanceCache.get(cacheKey);
  
  if (cached && (Date.now() - cached.timestamp < CACHE_EXPIRY)) {
    return cached.balance;
  }
  
  let bal = +acc.opening || 0;
  
  // Optimized loop - only check relevant transactions
  for (const t of txs) {
    if (t.fromAccount === acc.id) bal -= +t.amount;
    else if (t.toAccount === acc.id) bal += +t.amount;
  }
  
  // Cache the result
  balanceCache.set(cacheKey, {
    balance: bal,
    timestamp: Date.now()
  });
  
  return bal;
}

export function addTransaction(tx) {
  // Validate and sanitize transaction data
  if (!tx || typeof tx !== 'object') {
    throw new Error('Invalid transaction data');
  }
  
  // Sanitize and validate required fields
  const sanitized = {
    id: generateTransactionId(), // Use secure UUID
    type: InputSanitizer.sanitizeString(tx.type, 20),
    amount: InputSanitizer.sanitizeNumber(tx.amount, 0.01, 999999999),
    description: InputSanitizer.sanitizeString(tx.description || '', 500),
    category: InputSanitizer.sanitizeString(tx.category || '', 100),
    date: tx.date && InputSanitizer.validateDate(tx.date) ? tx.date : new Date().toISOString().split('T')[0],
    fromAccount: InputSanitizer.sanitizeString(tx.fromAccount || '', 50),
    toAccount: InputSanitizer.sanitizeString(tx.toAccount || '', 50),
    person: InputSanitizer.sanitizeString(tx.person || '', 100)
  };
  
  // Validate business rules
  if (!sanitized.type || !['income', 'expense', 'transfer'].includes(sanitized.type)) {
    throw new Error('Invalid transaction type');
  }
  
  if (!InputSanitizer.validateAmount(sanitized.amount)) {
    throw new Error('Invalid transaction amount');
  }
  
  // Clear both cache systems when adding transaction
  balanceCache.clear();
  dataCache.clear();
  
  transactions.update(txs => {
    txs.unshift(sanitized);
    return txs;
  });
}

export function deleteTransaction(id) {
  // Clear both cache systems when deleting transaction
  balanceCache.clear();
  dataCache.clear(); // Clear new cache system too
  transactions.update(txs => txs.filter(t => t.id !== id));
}

export function addAccount(acc) {
  // Validate and sanitize account data
  if (!acc || typeof acc !== 'object') {
    throw new Error('Invalid account data');
  }
  
  const sanitized = {
    id: acc.id || nid(),
    name: InputSanitizer.sanitizeString(acc.name || '', 100),
    type: InputSanitizer.sanitizeString(acc.type, 20),
    owner: InputSanitizer.sanitizeString(acc.owner || '', 100),
    currency: InputSanitizer.sanitizeString(acc.currency, 10),
    opening: InputSanitizer.sanitizeNumber(acc.opening || 0, -999999999, 999999999)
  };
  
  // Validate required fields
  if (!sanitized.name.trim()) {
    throw new Error('Account name is required');
  }
  
  if (!['bank', 'cash', 'investment'].includes(sanitized.type)) {
    throw new Error('Invalid account type');
  }
  
  if (!['RON', 'EUR', 'USD'].includes(sanitized.currency)) {
    throw new Error('Invalid currency');
  }
  
  // Clear caches when account changes
  balanceCache.clear();
  dataCache.clear();
  
  accounts.update(accs => {
    const existingIndex = accs.findIndex(a => a.id === sanitized.id);
    if (existingIndex >= 0) {
      accs[existingIndex] = sanitized;
    } else {
      accs.push(sanitized);
    }
    return accs;
  });
}

export function deleteAccount(id) {
  const txs = get(transactions);
  if (txs.some(t => t.fromAccount === id || t.toAccount === id)) {
    return false;
  }
  
  accounts.update(accs => accs.filter(a => a.id !== id));
  return true;
}

// ===== Computed values =====
// Optimized balance calculation - O(n) instead of O(n²)
export const totalBalance = derived(
  [accounts, transactions], 
  ([$accounts, $transactions]) => {
    const balances = {};
    const cashBalances = {};
    const bankBalances = {};
    const ownerBalances = {};
    
    // Create account lookup map for O(1) access
    const accountMap = new Map($accounts.map(acc => [acc.id, acc]));
    
    // Initialize balances with opening amounts
    for (const acc of $accounts) {
      const opening = +acc.opening || 0;
      balances[acc.currency] = (balances[acc.currency] || 0) + opening;
      
      if (acc.type === 'cash') {
        cashBalances[acc.currency] = (cashBalances[acc.currency] || 0) + opening;
      } else if (acc.type === 'bank') {
        bankBalances[acc.currency] = (bankBalances[acc.currency] || 0) + opening;
      }
      
      ownerBalances[acc.owner] = (ownerBalances[acc.owner] || 0) + opening;
    }
    
    // Single pass through transactions - O(n) complexity
    for (const t of $transactions) {
      const amount = +t.amount || 0;
      
      if (t.fromAccount) {
        const fromAcc = accountMap.get(t.fromAccount);
        if (fromAcc) {
          balances[fromAcc.currency] = (balances[fromAcc.currency] || 0) - amount;
          
          if (fromAcc.type === 'cash') {
            cashBalances[fromAcc.currency] = (cashBalances[fromAcc.currency] || 0) - amount;
          } else if (fromAcc.type === 'bank') {
            bankBalances[fromAcc.currency] = (bankBalances[fromAcc.currency] || 0) - amount;
          }
          
          ownerBalances[fromAcc.owner] = (ownerBalances[fromAcc.owner] || 0) - amount;
        }
      }
      
      if (t.toAccount) {
        const toAcc = accountMap.get(t.toAccount);
        if (toAcc) {
          balances[toAcc.currency] = (balances[toAcc.currency] || 0) + amount;
          
          if (toAcc.type === 'cash') {
            cashBalances[toAcc.currency] = (cashBalances[toAcc.currency] || 0) + amount;
          } else if (toAcc.type === 'bank') {
            bankBalances[toAcc.currency] = (bankBalances[toAcc.currency] || 0) + amount;
          }
          
          ownerBalances[toAcc.owner] = (ownerBalances[toAcc.owner] || 0) + amount;
        }
      }
    }
    
    return {
      balances,
      cashBalances,
      bankBalances,
      ownerBalances,
      mainBalance: balances['RON'] || 0
    };
  }
);

// ===== Month statistics =====
export const monthStats = derived(
  transactions,
  $transactions => {
    const current = currentMonth();
    const last = lastMonth();
    
    const currentTx = $transactions.filter(t => t.date && t.date.startsWith(current));
    const lastTx = $transactions.filter(t => t.date && t.date.startsWith(last));
    
    const currentIncome = currentTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const currentExpense = currentTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const currentSavings = currentIncome - currentExpense;
    
    const lastIncome = lastTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const lastExpense = lastTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    
    return {
      currentIncome,
      currentExpense,
      currentSavings,
      lastIncome,
      lastExpense,
      incomeChange: lastIncome ? ((currentIncome - lastIncome) / lastIncome * 100).toFixed(1) : 0,
      expenseChange: lastExpense ? ((currentExpense - lastExpense) / lastExpense * 100).toFixed(1) : 0,
      savingsPercent: currentIncome ? (currentSavings / currentIncome * 100).toFixed(1) : 0
    };
  }
);

// ===== Cache management =====
export function clearBalanceCache() {
  balanceCache.clear();
}

// Cleanup old cache entries
export function cleanupCache() {
  const now = Date.now();
  for (const [key, value] of balanceCache.entries()) {
    if (now - value.timestamp > CACHE_EXPIRY) {
      balanceCache.delete(key);
    }
  }
}

// Run cleanup every 10 minutes - with proper cleanup management
let cleanupInterval = null;

export function startCacheCleanup() {
  if (cleanupInterval) clearInterval(cleanupInterval);
  cleanupInterval = setInterval(cleanupCache, 10 * 60 * 1000);
}

export function stopCacheCleanup() {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
  }
}

// Start cleanup automatically
startCacheCleanup();

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', stopCacheCleanup);
}

// ===== Export helper pentru PDF parsing (va fi folosit în ImportPDF.svelte) =====
export function suggestCategory(desc, type) {
  const d = desc.toLowerCase();
  
  if (type === 'income') {
    if (/salar|salary/i.test(d)) return 'Salariu';
    if (/freelance|proiect/i.test(d)) return 'Freelance';
    if (/transfer.*nico|nico.*transfer/i.test(d)) return 'Transfer de la Nico';
    return 'Altele';
  }
  
  // Pentru expense și transfer
  if (/atm|cash|retragere|numerar/i.test(d)) return 'ATM Cash';
  if (/lidl|kaufland|carrefour|mega|profi|penny|auchan/i.test(d)) return 'Alimente';
  if (/glovo|tazz|bolt food|pizza|kfc|mc|restaurant/i.test(d)) return 'Restaurant/Comenzi';
  if (/uber|bolt|taxi|benzin|motorin|omv|petrom|rompetrol/i.test(d)) return 'Transport';
  if (/netflix|spotify|hbo|disney/i.test(d)) return 'Abonamente';
  if (/enel|eon|electrica|gaz|apa/i.test(d)) return 'Facturi';
  if (/emag|altex|flanco|amazon/i.test(d)) return 'Achiziții Diverse';
  if (/farmacie|catena|helpnet|doctor/i.test(d)) return 'Sănătate';
  
  return 'Altele';
}

export function normalizeDate(d) {
  let m = d.match(/(\d{2})[.\/\-](\d{2})[.\/\-](\d{4})/);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;
  m = d.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (m) return d;
  return d;
}