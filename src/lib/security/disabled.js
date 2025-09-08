// Securitate DEZACTIVATĂ pentru development
export const secureStorage = {
  secureSave: (key, data) => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch(e) {
      // Ignoră erorile
    }
  },
  secureLoad: (key) => {
    try {
      return JSON.parse(localStorage.getItem(key) || 'null');
    } catch(e) {
      return null;
    }
  },
  generateSecureId: (length = 16) => Math.random().toString(36).substr(2, length),
  generateUUID: () => Math.random().toString(36).substr(2, 9),
  setupAutoLock: () => {},
  init: () => {}
};

export const InputSanitizer = {
  sanitizeHTML: (input) => input,
  sanitizeString: (input, maxLength) => input
};

export const TamperProtection = {
  init: () => {}
};

export const CSPManager = {
  apply: () => {}
};

export const copyrightProtection = {};