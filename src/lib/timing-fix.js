// Fix pentru timing negativ în dezvoltare
if (typeof window !== 'undefined') {
  const originalNow = Date.now;
  let startTime = originalNow();
  
  // Override Date.now pentru a preveni valori negative
  Date.now = function() {
    const now = originalNow();
    if (now < startTime) {
      startTime = now;
    }
    return now;
  };
  
  // Fix performance.now
  if (window.performance && window.performance.now) {
    const originalPerfNow = window.performance.now.bind(window.performance);
    window.performance.now = function() {
      const value = originalPerfNow();
      return Math.max(0, value);
    };
  }
  
  // Fix pentru requestAnimationFrame timing
  if (window.requestAnimationFrame) {
    const originalRAF = window.requestAnimationFrame;
    window.requestAnimationFrame = function(callback) {
      return originalRAF(function(timestamp) {
        // Asigură-te că timestamp-ul nu este negativ
        const safeTimestamp = Math.max(0, timestamp);
        callback(safeTimestamp);
      });
    };
  }
  
  // Fix pentru setTimeout/setInterval cu delay negativ
  const originalSetTimeout = window.setTimeout;
  const originalSetInterval = window.setInterval;
  
  window.setTimeout = function(callback, delay, ...args) {
    const safeDelay = Math.max(0, delay || 0);
    return originalSetTimeout(callback, safeDelay, ...args);
  };
  
  window.setInterval = function(callback, delay, ...args) {
    const safeDelay = Math.max(1, delay || 1);
    return originalSetInterval(callback, safeDelay, ...args);
  };
  
  console.log('⏱️ Timing fix applied successfully');
}

export default {};