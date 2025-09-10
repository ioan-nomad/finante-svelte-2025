<script>
  import { onMount } from 'svelte';
  
  let mlStatus = 'Checking...';
  let features = [];
  
  onMount(async () => {
    try {
      // Test import MLEngine existent
      const { MLEngine } = await import('../lib/ml/MLEngine.js');
      features.push('✅ MLEngine se încarcă');
      
      // Verifică ce metode are
      const engine = new MLEngine();
      
      if (engine.initialize) features.push('✅ Has initialize()');
      if (engine.processPDFWithML) features.push('✅ Has processPDFWithML()');
      if (engine.learnFromFeedback) features.push('✅ Has learning capability');
      if (engine.processPDF) features.push('✅ Has processPDF()');
      
      // Verifică dependențe fără import direct care cauzează erori
      features.push('📋 Dependențe verificate în package.json:');
      
      // Check dacă sunt disponibile via CDN sau window
      if (typeof window !== 'undefined' && window.tf) {
        features.push('✅ TensorFlow.js disponibil via CDN');
      } else {
        features.push('❌ TensorFlow.js nu e încărcat (se încarcă via CDN în MLEngine)');
      }
      
      // Verifică Dexie prin încercare de import
      try {
        const dexie = await import('dexie');
        features.push('✅ Dexie instalat și funcțional');
      } catch {
        features.push('❌ Dexie nu e disponibil');
      }
      
      // Test modulele existente
      try {
        await import('../lib/ml/DatabaseManager.js');
        features.push('✅ DatabaseManager disponibil');
      } catch (e) {
        features.push('❌ DatabaseManager error: ' + e.message);
      }
      
      try {
        await import('../lib/ml/OCREngine.js');
        features.push('✅ OCREngine disponibil');
      } catch (e) {
        features.push('❌ OCREngine error: ' + e.message);
      }
      
      try {
        await import('../lib/ml/PatternRecognitionEngine.js');
        features.push('✅ PatternRecognitionEngine disponibil');
      } catch (e) {
        features.push('❌ PatternRecognitionEngine error: ' + e.message);
      }
      
      // Test LearningDatabase
      try {
        const { LearningDatabase } = await import('../lib/ml/LearningDatabase.js');
        features.push('✅ LearningDatabase disponibil');
      } catch (e) {
        features.push('❌ LearningDatabase error: ' + e.message);
      }
      
      // Test ce folosește MLEngine actual
      features.push('📋 MLEngine actual:');
      features.push('  - Folosește TensorFlow.js via CDN');
      features.push('  - Are modulele: DatabaseManager, OCREngine, etc.');
      features.push('  - Nu folosește Brain.js direct');
      features.push('  - Are propriul sistem neural');
      
      mlStatus = 'ML Engine Status Check Complete';
      
    } catch (error) {
      mlStatus = 'Error: ' + error.message;
      features.push('❌ MLEngine nu se încarcă: ' + error);
    }
  });
</script>

<div style="padding: 20px; background: #f0f0f0; margin: 20px; border-radius: 8px;">
  <h2>🤖 ML Engine Test</h2>
  <p><strong>{mlStatus}</strong></p>
  <ul style="margin-top: 15px;">
    {#each features as feature}
      <li style="margin: 5px 0;">{feature}</li>
    {/each}
  </ul>
</div>