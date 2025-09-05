/**
 * CODEX Module Export
 */

export { default as CODEX_PRINCIPLES } from './codexCore.js';
export { CODEX_SOURCES } from './codexSources.js';
export { CODEX_INGREDIENTS } from './codexDatabase.js';
export { CodexScorer } from './codexScoring.js';
export { CODEX_AUTHORITY, enforceAuthority } from './codexAuthority.js';
export { CodexRecipeGenerator } from './codexRecipeGenerator.js';

// Initialize CODEX system
export function initializeCodex() {
  console.log('🧬 CODEX v2.0 Initialized');
  console.log('📚 Evidence-based nutrition system active');
  return {
    version: '2.0',
    modules: ['Core', 'Sources', 'Database', 'Scoring'],
    status: 'Ready'
  };
}
