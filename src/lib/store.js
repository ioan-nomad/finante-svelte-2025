// lib/store.js
import { writable, derived } from 'svelte/store';

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

// ===== Helper functions exact ca în HTML =====
export function nid() { 
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
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

// Pentru a accesa valoarea unui store în funcții
import { get } from 'svelte/store';

// ===== Business logic functions exact ca în HTML =====
export function computeAccountBalance(acc, transactionsList = null) {
  const txs = transactionsList || get(transactions);
  let bal = +acc.opening || 0;
  
  for (const t of txs) {
    if (t.fromAccount === acc.id) bal -= +t.amount;
    if (t.toAccount === acc.id) bal += +t.amount;
  }
  
  return bal;
}

export function addTransaction(tx) {
  tx.id = nid();
  transactions.update(txs => {
    txs.unshift(tx);
    return txs;
  });
}

export function deleteTransaction(id) {
  transactions.update(txs => txs.filter(t => t.id !== id));
}

export function addAccount(acc) {
  acc.id = acc.id || nid();
  accounts.update(accs => {
    const existingIndex = accs.findIndex(a => a.id === acc.id);
    if (existingIndex >= 0) {
      accs[existingIndex] = acc;
    } else {
      accs.push(acc);
    }
    return accs;
  });
}

export function deleteAccount(id) {
  const txs = get(transactions);
  if (txs.some(t => t.fromAccount === id || t.toAccount === id)) {
    alert('Nu poți șterge un cont cu tranzacții!');
    return false;
  }
  
  accounts.update(accs => accs.filter(a => a.id !== id));
  return true;
}

// ===== Computed values =====
export const totalBalance = derived(
  [accounts, transactions], 
  ([$accounts, $transactions]) => {
    const balances = {};
    const cashBalances = {};
    const bankBalances = {};
    const ownerBalances = {};
    
    for (const acc of $accounts) {
      const bal = computeAccountBalance(acc, $transactions);
      
      // Total per currency
      balances[acc.currency] = (balances[acc.currency] || 0) + bal;
      
      // Cash vs bank
      if (acc.type === 'cash') {
        cashBalances[acc.currency] = (cashBalances[acc.currency] || 0) + bal;
      } else if (acc.type === 'bank') {
        bankBalances[acc.currency] = (bankBalances[acc.currency] || 0) + bal;
      }
      
      // Owner totals
      ownerBalances[acc.owner] = (ownerBalances[acc.owner] || 0) + bal;
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