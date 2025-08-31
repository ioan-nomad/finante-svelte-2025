// src/lib/utils.js
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

export function throttle(func, limit) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  }
}

// Additional utility functions for performance optimization
export function memoize(fn) {
  const cache = new Map();
  return function(...args) {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key);
    }
    const result = fn.apply(this, args);
    cache.set(key, result);
    return result;
  };
}

// Format currency with memoization for better performance
export const formatCurrency = memoize((amount, currency = 'RON') => {
  return new Intl.NumberFormat('ro-RO', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
});

// Format date with memoization
export const formatDate = memoize((dateString) => {
  const date = new Date(dateString);
  if (isNaN(date)) return dateString;
  
  return new Intl.DateTimeFormat('ro-RO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(date);
});

// Optimized search function with debouncing
export function createSearchHandler(searchFunction, delay = 300) {
  return debounce(searchFunction, delay);
}

// Virtual scrolling helper
export function getVisibleRange(containerHeight, itemHeight, scrollTop, bufferSize = 5) {
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - bufferSize);
  const endIndex = Math.min(
    Math.floor((scrollTop + containerHeight) / itemHeight) + bufferSize
  );
  return { startIndex, endIndex };
}

// Performance monitoring
export function measurePerformance(name, fn) {
  return async function(...args) {
    const start = performance.now();
    const result = await fn.apply(this, args);
    const end = performance.now();
    return result;
  };
}

// Format amount utility function
export function formatAmount(amount) {
  return new Intl.NumberFormat('ro-RO', {
    style: 'currency',
    currency: 'RON'
  }).format(amount);
}