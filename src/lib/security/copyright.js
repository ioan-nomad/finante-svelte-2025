/**
 * Copyright Protection Module
 * Protects against unauthorized usage
 */

export class CopyrightProtection {
  constructor() {
    this.owner = 'Ioan Nomad';
    this.year = 2024;
    this.status = 'PRIVATE_DEVELOPMENT';
    this.init();
  }
  
  init() {
    // Add copyright notice to console
    if (typeof window !== 'undefined') {
      this.addConsoleWarning();
      this.addContextMenuProtection();
      this.addSourceProtection();
      this.monitorDevTools();
    }
  }
  
  addConsoleWarning() {
    const styles = [
      'color: red',
      'font-size: 14px',
      'font-weight: bold',
      'background: yellow',
      'padding: 10px',
      'border: 2px solid red'
    ].join(';');
    
    console.log(
      '%c⚠️ STOP! PROPRIETARY SOFTWARE ⚠️',
      styles
    );
    
    console.log(
      '%cThis is proprietary software owned by Ioan Nomad.\n' +
      'Copyright © 2024. All Rights Reserved.\n' +
      'Unauthorized use, copying, or distribution is strictly prohibited.\n' +
      'This code is under active development and NOT licensed for public use.',
      'color: red; font-size: 12px;'
    );
    
    // Detect if someone tries to copy console content
    this.protectConsole();
  }
  
  addContextMenuProtection() {
    // Disable right-click in production
    if (!import.meta.env.DEV) {
      document.addEventListener('contextmenu', (e) => {
        if (!e.ctrlKey) { // Allow with Ctrl for development
          e.preventDefault();
          this.showCopyrightAlert();
          return false;
        }
      });
    }
  }
  
  addSourceProtection() {
    // Disable view-source keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      // Block Ctrl+U (view source)
      if (e.ctrlKey && e.keyCode === 85) {
        e.preventDefault();
        this.showCopyrightAlert();
        return false;
      }
      
      // Block F12 (DevTools) in production
      if (!import.meta.env.DEV && e.keyCode === 123) {
        e.preventDefault();
        this.showCopyrightAlert();
        return false;
      }
      
      // Block Ctrl+Shift+I (DevTools)
      if (e.ctrlKey && e.shiftKey && e.keyCode === 73) {
        e.preventDefault();
        this.showCopyrightAlert();
        return false;
      }
      
      // Block Ctrl+Shift+J (Console)
      if (e.ctrlKey && e.shiftKey && e.keyCode === 74) {
        e.preventDefault();
        this.showCopyrightAlert();
        return false;
      }
    });
  }
  
  monitorDevTools() {
    let devtools = { open: false, orientation: null };
    const threshold = 160;
    
    setInterval(() => {
      if (
        window.outerHeight - window.innerHeight > threshold ||
        window.outerWidth - window.innerWidth > threshold
      ) {
        if (!devtools.open) {
          devtools.open = true;
          this.onDevToolsOpen();
        }
      } else {
        devtools.open = false;
      }
    }, 500);
  }
  
  onDevToolsOpen() {
    console.clear();
    console.log(
      '%c🔒 DevTools Detected',
      'color: red; font-size: 20px; font-weight: bold;'
    );
    console.log(
      '%cThis software is protected by copyright law.\n' +
      'Reverse engineering, decompiling, or attempting to extract\n' +
      'source code is a violation of copyright law.',
      'color: red; font-size: 12px;'
    );
    
    // Log detection event
    this.logSecurityEvent('devtools_opened');
  }
  
  protectConsole() {
    // Override console methods to prevent easy copying
    const originalLog = console.log;
    console.log = function(...args) {
      // Filter sensitive data
      const filtered = args.map(arg => {
        if (typeof arg === 'object' && arg !== null) {
          return '[Protected Object]';
        }
        return arg;
      });
      originalLog.apply(console, filtered);
    };
  }
  
  showCopyrightAlert() {
    const message = `
⚠️ COPYRIGHT NOTICE ⚠️

This software is the proprietary property of Ioan Nomad.
Copyright © 2024. All Rights Reserved.

Unauthorized access, use, or copying is prohibited.
This includes but is not limited to:
- Copying source code
- Reverse engineering
- Commercial use
- Distribution

Legal action may be taken against violators.
    `;
    
    if (!this.alertShown) {
      this.alertShown = true;
      alert(message);
      setTimeout(() => { this.alertShown = false; }, 5000);
    }
    
    this.logSecurityEvent('copyright_warning_shown');
  }
  
  logSecurityEvent(event) {
    const eventData = {
      event,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };
    
    // Store locally for analysis
    const events = JSON.parse(localStorage.getItem('security_events') || '[]');
    events.push(eventData);
    
    // Keep only last 100 events
    if (events.length > 100) {
      events.shift();
    }
    
    localStorage.setItem('security_events', JSON.stringify(events));
  }
  
  // Obfuscate critical functions
  obfuscateCode(code) {
    // Simple obfuscation for critical parts
    return btoa(unescape(encodeURIComponent(code)));
  }
  
  deobfuscateCode(encoded) {
    try {
      return decodeURIComponent(escape(atob(encoded)));
    } catch {
      return null;
    }
  }
}

// Auto-initialize
export const copyrightProtection = new CopyrightProtection();