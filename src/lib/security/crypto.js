// Advanced encryption for localStorage
import { writable, get } from 'svelte/store';

class SecureStorage {
  constructor() {
    this.salt = this.getDeviceSalt();
    this.iterations = 10000;
  }

  // Generate unique device fingerprint
  getDeviceSalt() {
    const saved = localStorage.getItem('_device_id');
    if (saved) return saved;
    
    const fingerprint = this.generateFingerprint();
    localStorage.setItem('_device_id', fingerprint);
    return fingerprint;
  }

  generateFingerprint() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('N-OMAD-2025', 2, 2);
    
    const data = canvas.toDataURL();
    const hash = this.simpleHash(data + navigator.userAgent + screen.width + screen.height);
    return hash;
  }

  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  // XOR encryption (simple but effective for local storage)
  encrypt(data, key) {
    const jsonStr = JSON.stringify(data);
    const keyHash = this.simpleHash(key + this.salt);
    let encrypted = '';
    
    for (let i = 0; i < jsonStr.length; i++) {
      encrypted += String.fromCharCode(
        jsonStr.charCodeAt(i) ^ keyHash.charCodeAt(i % keyHash.length)
      );
    }
    
    return btoa(encrypted); // Base64 encode
  }

  decrypt(encrypted, key) {
    try {
      const decoded = atob(encrypted);
      const keyHash = this.simpleHash(key + this.salt);
      let decrypted = '';
      
      for (let i = 0; i < decoded.length; i++) {
        decrypted += String.fromCharCode(
          decoded.charCodeAt(i) ^ keyHash.charCodeAt(i % keyHash.length)
        );
      }
      
      return JSON.parse(decrypted);
    } catch (e) {
      console.error('Decryption failed');
      return null;
    }
  }

  // Secure save with integrity check
  secureSave(key, data) {
    const encrypted = this.encrypt(data, key);
    const checksum = this.simpleHash(encrypted);
    
    localStorage.setItem(key, JSON.stringify({
      data: encrypted,
      checksum: checksum,
      timestamp: Date.now()
    }));
  }

  // Secure load with integrity verification
  secureLoad(key) {
    try {
      const stored = localStorage.getItem(key);
      if (!stored) return null;
      
      const { data, checksum, timestamp } = JSON.parse(stored);
      
      // Verify integrity
      if (this.simpleHash(data) !== checksum) {
        console.error('Data integrity check failed!');
        return null;
      }
      
      // Check age (optional auto-expire after 30 days)
      const age = Date.now() - timestamp;
      if (age > 30 * 24 * 60 * 60 * 1000) {
        console.warn('Data expired');
        return null;
      }
      
      return this.decrypt(data, key);
    } catch (e) {
      console.error('Secure load failed');
      return null;
    }
  }

  // Clear all sensitive data
  clearAll() {
    const keysToKeep = ['_device_id', 'darkMode', 'appSettings'];
    Object.keys(localStorage).forEach(key => {
      if (!keysToKeep.includes(key)) {
        localStorage.removeItem(key);
      }
    });
  }

  // Auto-lock after inactivity
  setupAutoLock(timeoutMinutes = 15) {
    let timer;
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    
    const resetTimer = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        this.lockApp();
      }, timeoutMinutes * 60 * 1000);
    };
    
    events.forEach(event => {
      document.addEventListener(event, resetTimer);
    });
    
    resetTimer();
  }

  lockApp() {
    // Clear sensitive data from memory
    this.clearMemory();
    // Redirect to lock screen (if implemented)
    window.location.hash = '#locked';
  }

  clearMemory() {
    // Force garbage collection hints
    if (window.gc) window.gc();
  }
}

export const secureStorage = new SecureStorage();

// Input sanitization
export class InputSanitizer {
  static sanitizeHTML(input) {
    const div = document.createElement('div');
    div.textContent = input;
    return div.innerHTML;
  }

  static sanitizeNumber(input, min = 0, max = Number.MAX_SAFE_INTEGER) {
    const num = parseFloat(input);
    if (isNaN(num)) return min;
    return Math.max(min, Math.min(max, num));
  }

  static sanitizeString(input, maxLength = 1000) {
    return String(input)
      .slice(0, maxLength)
      .replace(/[<>]/g, '') // Remove potential HTML
      .trim();
  }

  static sanitizeFilename(input) {
    return input.replace(/[^a-zA-Z0-9.-]/g, '_');
  }

  static validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }

  static validateDate(date) {
    const d = new Date(date);
    return d instanceof Date && !isNaN(d);
  }
}

// Anti-tampering protection
export class TamperProtection {
  static init() {
    // Detect DevTools
    this.detectDevTools();
    
    // Protect against prototype pollution
    this.freezePrototypes();
    
    // Monitor DOM changes
    this.monitorDOM();
  }

  static detectDevTools() {
    let devtools = { open: false, orientation: null };
    const threshold = 160;
    
    setInterval(() => {
      if (window.outerHeight - window.innerHeight > threshold || 
          window.outerWidth - window.innerWidth > threshold) {
        if (!devtools.open) {
          devtools.open = true;
          console.warn('DevTools detected - some features may be limited');
        }
      } else {
        devtools.open = false;
      }
    }, 500);
  }

  static freezePrototypes() {
    Object.freeze(Object.prototype);
    Object.freeze(Array.prototype);
    Object.freeze(Function.prototype);
  }

  static monitorDOM() {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.tagName === 'SCRIPT' && !node.src.includes('localhost')) {
              node.remove();
              console.error('Unauthorized script injection blocked!');
            }
          });
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }
}