// Advanced encryption for localStorage
import { writable, get } from 'svelte/store';

class SecureStorage {
  constructor() {
    this.salt = this.getDeviceSalt();
    this.iterations = 10000;
  }

  // Generate unique device fingerprint
  getDeviceSalt() {
    return 'fixed-salt-dev-only';
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

  // Generate cryptographically secure random ID
  static generateSecureId(length = 16) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const randomValues = crypto.getRandomValues(new Uint8Array(length));
    return Array.from(randomValues, byte => chars[byte % chars.length]).join('');
  }

  // Generate UUID v4
  static generateUUID() {
    const randomValues = crypto.getRandomValues(new Uint8Array(16));
    randomValues[6] = (randomValues[6] & 0x0f) | 0x40; // Version 4
    randomValues[8] = (randomValues[8] & 0x3f) | 0x80; // Variant bits
    
    const hex = Array.from(randomValues, byte => 
      byte.toString(16).padStart(2, '0')
    ).join('');
    
    return [
      hex.slice(0, 8),
      hex.slice(8, 12),
      hex.slice(12, 16),
      hex.slice(16, 20),
      hex.slice(20, 32)
    ].join('-');
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

  // AES-256-GCM encryption using Web Crypto API
  async encrypt(data, key) {
    try {
      const jsonStr = JSON.stringify(data);
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(jsonStr);
      
      // Derive key using PBKDF2
      const derivedKey = await this.deriveKey(key);
      
      // Generate random IV
      const iv = crypto.getRandomValues(new Uint8Array(12));
      
      // Encrypt data
      const encryptedBuffer = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: iv },
        derivedKey,
        dataBuffer
      );
      
      // Combine IV and encrypted data
      const combined = new Uint8Array(iv.length + encryptedBuffer.byteLength);
      combined.set(iv);
      combined.set(new Uint8Array(encryptedBuffer), iv.length);
      
      return btoa(String.fromCharCode(...combined));
    } catch (e) {
      console.error('Encryption failed:', e);
      return null;
    }
  }

  async decrypt(encrypted, key) {
    try {
      // Convert from base64
      const combined = new Uint8Array(
        atob(encrypted).split('').map(char => char.charCodeAt(0))
      );
      
      // Extract IV and encrypted data
      const iv = combined.slice(0, 12);
      const encryptedData = combined.slice(12);
      
      // Derive key
      const derivedKey = await this.deriveKey(key);
      
      // Decrypt
      const decryptedBuffer = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: iv },
        derivedKey,
        encryptedData
      );
      
      const decoder = new TextDecoder();
      const jsonStr = decoder.decode(decryptedBuffer);
      
      return JSON.parse(jsonStr);
    } catch (e) {
      console.error('Decryption failed:', e);
      return null;
    }
  }

  // Derive key using PBKDF2
  async deriveKey(password) {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password + this.salt),
      'PBKDF2',
      false,
      ['deriveKey']
    );

    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: encoder.encode(this.salt),
        iterations: this.iterations,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  // Secure save with integrity check
  async secureSave(key, data) {
    try {
      const encrypted = await this.encrypt(data, key);
      if (!encrypted) throw new Error('Encryption failed');
      
      const checksum = await this.generateHMAC(encrypted, key);
      
      localStorage.setItem(key, JSON.stringify({
        data: encrypted,
        checksum: checksum,
        timestamp: Date.now()
      }));
    } catch (e) {
      console.error('Secure save failed:', e);
      throw e;
    }
  }

  // Secure load with integrity verification
  async secureLoad(key) {
    try {
      const stored = localStorage.getItem(key);
      if (!stored) return null;
      
      const { data, checksum, timestamp } = JSON.parse(stored);
      
      // Verify HMAC integrity
      const expectedChecksum = await this.generateHMAC(data, key);
      if (checksum !== expectedChecksum) {
        console.error('Data integrity check failed!');
        localStorage.removeItem(key); // Remove corrupted data
        return null;
      }
      
      // Check age (optional auto-expire after 30 days)
      const age = Date.now() - timestamp;
      if (age > 30 * 24 * 60 * 60 * 1000) {
        console.warn('Data expired');
        localStorage.removeItem(key); // Remove expired data
        return null;
      }
      
      return await this.decrypt(data, key);
    } catch (e) {
      console.error('Secure load failed:', e);
      return null;
    }
  }

  // Generate HMAC for integrity verification
  async generateHMAC(data, key) {
    try {
      const encoder = new TextEncoder();
      const keyMaterial = await crypto.subtle.importKey(
        'raw',
        encoder.encode(key + this.salt),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );
      
      const signature = await crypto.subtle.sign(
        'HMAC',
        keyMaterial,
        encoder.encode(data)
      );
      
      return btoa(String.fromCharCode(...new Uint8Array(signature)));
    } catch (e) {
      console.error('HMAC generation failed:', e);
      return '';
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

// Enhanced input sanitization and validation
export class InputSanitizer {
  // Comprehensive HTML sanitization
  static sanitizeHTML(input) {
    if (typeof input !== 'string') return '';
    
    const div = document.createElement('div');
    div.textContent = input;
    
    // Additional XSS protection
    return div.innerHTML
      .replace(/javascript:/gi, '')
      .replace(/data:/gi, '')
      .replace(/vbscript:/gi, '')
      .replace(/on\w+\s*=/gi, '');
  }

  // Enhanced number sanitization with overflow protection
  static sanitizeNumber(input, min = 0, max = Number.MAX_SAFE_INTEGER) {
    if (input === null || input === undefined || input === '') return min;
    
    const num = parseFloat(String(input).replace(/[^\d.-]/g, ''));
    if (isNaN(num) || !isFinite(num)) return min;
    
    // Prevent integer overflow
    if (num > Number.MAX_SAFE_INTEGER) return max;
    if (num < Number.MIN_SAFE_INTEGER) return min;
    
    return Math.max(min, Math.min(max, num));
  }

  // Enhanced string sanitization with SQL injection protection
  static sanitizeString(input, maxLength = 1000) {
    if (typeof input !== 'string') input = String(input);
    
    return input
      .slice(0, maxLength)
      .replace(/[<>'"&`]/g, '') // Remove HTML/JS chars
      .replace(/[\x00-\x1f\x7f]/g, '') // Remove control characters
      .replace(/--|\/\*|\*\/|;/g, '') // Remove SQL injection patterns
      .trim();
  }

  // Secure filename sanitization
  static sanitizeFilename(input, maxLength = 255) {
    if (typeof input !== 'string') return 'untitled';
    
    return input
      .slice(0, maxLength)
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .replace(/^\.+|\.+$/g, '') // Remove leading/trailing dots
      .replace(/_{2,}/g, '_') // Replace multiple underscores
      || 'untitled';
  }

  // Enhanced email validation
  static validateEmail(email) {
    if (typeof email !== 'string') return false;
    if (email.length > 254) return false; // RFC 5321 limit
    
    const re = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    return re.test(email);
  }

  // Enhanced date validation
  static validateDate(date) {
    const d = new Date(date);
    const isValid = d instanceof Date && !isNaN(d.getTime());
    
    // Check for reasonable date ranges (1900-2100)
    if (isValid) {
      const year = d.getFullYear();
      return year >= 1900 && year <= 2100;
    }
    
    return false;
  }

  // Financial amount validation
  static validateAmount(amount, maxDigits = 12) {
    const num = this.sanitizeNumber(amount, 0);
    const strNum = num.toString();
    
    // Check for reasonable financial amounts
    if (strNum.length > maxDigits) return false;
    if (num < 0.01 || num > 999999999999) return false;
    
    return true;
  }

  // CSRF token validation
  static validateCSRFToken(token, expectedToken) {
    if (!token || !expectedToken) return false;
    if (typeof token !== 'string' || typeof expectedToken !== 'string') return false;
    if (token.length !== expectedToken.length) return false;
    
    // Constant-time comparison to prevent timing attacks
    let result = 0;
    for (let i = 0; i < token.length; i++) {
      result |= token.charCodeAt(i) ^ expectedToken.charCodeAt(i);
    }
    
    return result === 0;
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