export const APP_CONFIG = {
  modules: {
    finance: true,
    pantry: true,
    nutrition: true  // ← ACTIVAT pentru Recipe Suggester
  },
  appName: 'N-OMAD Suite',
  version: '1.0.0',
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