// src/shared/config.js
export const APP_CONFIG = {
  // Module toggles
  modules: {
    finance: true,
    pantry: true,
    nutrition: true
  },
  
  // App metadata
  version: '0.2.2',
  appName: 'N-OMAD Suite',
  
  // Feature flags
  features: {
    mlEngine: true,
    ocrSupport: true,
    advancedCharts: true,
    pdfImport: true,
    darkMode: true,
    exportData: true,
    cloudSync: false, // Disabled for privacy
    analytics: false  // Disabled for privacy
  },
  
  // API endpoints (if needed in future)
  api: {
    baseUrl: null, // Local only for now
    timeout: 30000
  },
  
  // Storage keys
  storage: {
    finance: 'fs_data',
    pantry: 'groceryInventory',
    nutrition: 'nutritionProfile',
    settings: 'appSettings',
    darkMode: 'darkMode'
  },
  
  // Default settings
  defaults: {
    currency: 'RON',
    language: 'ro',
    dateFormat: 'DD.MM.YYYY',
    numberFormat: 'ro-RO',
    firstDayOfWeek: 1, // Monday
    theme: 'light'
  },
  
  // Performance settings
  performance: {
    debounceDelay: 300,
    throttleDelay: 100,
    maxTransactions: 10000,
    cacheTimeout: 300000, // 5 minutes
    lazyLoadDelay: 200
  },
  
  // Security settings
  security: {
    encryptLocalStorage: true,
    enforceCSP: true,
    blockDevTools: false, // Disabled in dev
    enableCopyrightProtection: true
  },

  // Navigation tabs (legacy support)
  tabs: {
    finance: [
      { id: 'dashboard', label: 'Dashboard', icon: '📊' },
      { id: 'conturi', label: 'Conturi', icon: '💳' },
      { id: 'tranzactii', label: 'Tranzacții', icon: '💸' },
      { id: 'budgeturi', label: 'Bugete', icon: '🎯' },
      { id: 'obiective', label: 'Obiective', icon: '🏆' },
      { id: 'reconciliere', label: 'Reconciliere', icon: '✅' },
      { id: 'recurring', label: 'Plăți Recurente', icon: '🔄' },
      { id: 'rapoarte', label: 'Rapoarte', icon: '📈' },
      { id: 'import', label: 'Import', icon: '📥' },
      { id: 'export', label: 'Export', icon: '📤' }
    ],
    pantry: [
      { id: 'grocery', label: 'Stoc Alimente', icon: '🛒' },
      { id: 'shopping', label: 'Lista de Cumpărături', icon: '📝' }
    ],
    nutrition: [
      { id: 'recipes', label: 'Recipe Suggester', icon: '👨‍🍳' },
      { id: 'meals', label: 'Meal Planner', icon: '🍽️' },
      { id: 'codex', label: 'CODEX Alimente', icon: '📚' },
      { id: 'biomarkers', label: 'Biomarker Tracking', icon: '🔬' },
      { id: 'tracking', label: 'Progress Tracking', icon: '📊' }
    ]
  }
};

// Export for quick access
export const MODULES = APP_CONFIG.modules;
export const FEATURES = APP_CONFIG.features;
export const STORAGE_KEYS = APP_CONFIG.storage;
export const DEFAULTS = APP_CONFIG.defaults;