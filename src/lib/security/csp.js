// Content Security Policy Manager - FIXED for Tesseract.js and ML frameworks
export class CSPManager {
  static getPolicy() {
    return {
      'default-src': ["'self'"],
      'script-src': [
        "'self'", 
        "'unsafe-inline'", 
        "'unsafe-eval'", // Required for TensorFlow.js and ML frameworks
        "blob:",         // Required for Web Workers (Tesseract, ML)
        "data:",         // Required for data URIs (Tesseract WASM)
        "*.tensorflow.org", // TensorFlow CDN
        "cdn.jsdelivr.net", // Brain.js CDN
        "unpkg.com"      // Alternative ML libraries CDN
      ],
      'style-src': ["'self'", "'unsafe-inline'"],
      'img-src': [
        "'self'", 
        "data:", 
        "blob:",
        "*"              // Allow all image sources for OCR and ML processing
      ],
      'font-src': ["'self'", "data:"],
      'connect-src': [
        "'self'", 
        "data:",         // CRITICAL: Allow data: connections for Tesseract WASM
        "blob:",         // Allow blob connections for Workers
        "https:",        // Allow HTTPS connections for CDN resources
        "wss:",          // WebSocket support
        "*.tensorflow.org", // TensorFlow model downloads
        "cdn.jsdelivr.net", // CDN resources
        "unpkg.com"      // Alternative CDN
      ],
      'media-src': ["'self'", "data:", "blob:"],
      'object-src': ["'none'"],
      'frame-src': ["'none'"],
      'base-uri': ["'self'"],
      'form-action': ["'self'"],
      'frame-ancestors': ["'none'"],
      'upgrade-insecure-requests': [],
      'worker-src': [   // CRITICAL: Web Workers for ML processing
        "'self'",
        "blob:",         // Blob URLs for dynamic workers
        "data:",         // Data URLs for inline workers
        "*.tensorflow.org", // TensorFlow workers
        "cdn.jsdelivr.net"  // CDN workers
      ],
      'child-src': [    // CRITICAL: Child contexts for WebAssembly
        "'self'",
        "blob:",         // Blob contexts
        "data:",         // Data contexts for WASM
        "*.tensorflow.org"
      ],
      'manifest-src': ["'self'"],
      'prefetch-src': ["'self'", "https:", "blob:", "data:"],
      'font-src': ["'self'", "data:", "https:"]
    };
  }

  static apply() {
    const policy = this.getPolicy();
    const policyString = Object.entries(policy)
      .map(([key, values]) => `${key} ${values.join(' ')}`)
      .join('; ');

    // Create meta tag for CSP
    const meta = document.createElement('meta');
    meta.httpEquiv = 'Content-Security-Policy';
    meta.content = policyString;
    
    // Remove existing CSP meta tag if present
    const existing = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    if (existing) {
      existing.remove();
    }
    
    document.head.appendChild(meta);

    console.log('🛡️ CSP Applied with ML/Tesseract support:', policyString);
  }

  static reportViolation(violation) {
    console.group('🚨 CSP Violation Report');
    console.error('Blocked URI:', violation.blockedURI);
    console.error('Violated Directive:', violation.violatedDirective);
    console.error('Original Policy:', violation.originalPolicy);
    
    // Special handling for common ML/Tesseract violations
    if (violation.blockedURI && violation.blockedURI.startsWith('data:')) {
      console.warn('⚠️ Data URI blocked - this might affect Tesseract.js WASM loading');
      console.info('💡 Consider using development mode with relaxed CSP');
    }
    
    if (violation.blockedURI && violation.blockedURI.includes('blob:')) {
      console.warn('⚠️ Blob URI blocked - this might affect Web Workers');
      console.info('💡 Web Workers are required for ML processing');
    }

    if (violation.violatedDirective && violation.violatedDirective.includes('worker-src')) {
      console.warn('⚠️ Worker source blocked - ML processing will fail');
      console.info('💡 Workers are essential for Tesseract and TensorFlow');
    }
    
    console.groupEnd();
    
    // Could send to logging service if needed
    this.sendViolationReport(violation);
  }

  static sendViolationReport(violation) {
    // Optional: Send violation reports to monitoring service
    try {
      const report = {
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        violation: violation,
        context: 'ML_Engine_Application'
      };
      
      // Example: send to monitoring service
      // fetch('/api/csp-violations', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(report)
      // });
      
      console.log('📊 CSP violation logged:', report);
    } catch (error) {
      console.error('❌ Failed to send violation report:', error);
    }
  }

  // DEVELOPMENT MODE - Relaxed CSP for testing ML frameworks
  static getDevPolicy() {
    return {
      'default-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'", "data:", "blob:", "https:", "*"],
      'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'", "data:", "blob:", "https:", "*"],
      'style-src': ["'self'", "'unsafe-inline'", "data:", "blob:", "https:", "*"],
      'img-src': ["'self'", "data:", "blob:", "https:", "*"],
      'font-src': ["'self'", "data:", "blob:", "https:", "*"],
      'connect-src': ["'self'", "data:", "blob:", "https:", "wss:", "*"],
      'media-src': ["'self'", "data:", "blob:", "https:", "*"],
      'worker-src': ["'self'", "blob:", "data:", "https:", "*"],
      'child-src': ["'self'", "blob:", "data:", "https:", "*"],
      'manifest-src': ["'self'", "data:", "blob:", "https:", "*"],
      'prefetch-src': ["'self'", "data:", "blob:", "https:", "*"]
    };
  }

  static applyDev() {
    console.log('🚧 DEV MODE: Using relaxed CSP for ML development');
    const policy = this.getDevPolicy();
    const policyString = Object.entries(policy)
      .map(([key, values]) => `${key} ${values.join(' ')}`)
      .join('; ');

    // Remove existing CSP meta tag
    const existing = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    if (existing) {
      existing.remove();
    }

    const meta = document.createElement('meta');
    meta.httpEquiv = 'Content-Security-Policy';
    meta.content = policyString;
    document.head.appendChild(meta);

    console.log('🛡️ DEV CSP Applied (relaxed for ML):', policyString);
  }

  // PRODUCTION MODE - Strict CSP with ML support
  static applyProduction() {
    console.log('🔒 PRODUCTION MODE: Using strict CSP with ML support');
    this.apply();
  }

  // TEST MODE - Ultra-permissive for testing
  static applyTest() {
    console.log('🧪 TEST MODE: Ultra-permissive CSP for testing');
    const testPolicy = {
      'default-src': ["*", "data:", "blob:", "'unsafe-inline'", "'unsafe-eval'"]
    };
    
    const policyString = Object.entries(testPolicy)
      .map(([key, values]) => `${key} ${values.join(' ')}`)
      .join('; ');

    const existing = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    if (existing) {
      existing.remove();
    }

    const meta = document.createElement('meta');
    meta.httpEquiv = 'Content-Security-Policy';
    meta.content = policyString;
    document.head.appendChild(meta);

    console.log('🛡️ TEST CSP Applied (ultra-permissive):', policyString);
  }

  // Check if current environment supports ML frameworks
  static checkMLSupport() {
    const support = {
      webAssembly: typeof WebAssembly === 'object',
      webWorkers: typeof Worker !== 'undefined',
      blob: typeof Blob !== 'undefined',
      dataURLs: true,
      tensorFlow: false,
      tesseract: false
    };

    // Check if TensorFlow can be loaded
    try {
      support.tensorFlow = typeof window.tf !== 'undefined' || 
                           document.querySelector('script[src*="tensorflow"]') !== null;
    } catch (e) {
      support.tensorFlow = false;
    }

    // Check if Tesseract resources are accessible
    try {
      support.tesseract = typeof window.Tesseract !== 'undefined';
    } catch (e) {
      support.tesseract = false;
    }

    return support;
  }

  // Dynamic CSP adjustment based on detected environment
  static applyDynamic() {
    const environment = this.detectEnvironment();
    const mlSupport = this.checkMLSupport();
    
    console.log('🔍 Environment detected:', environment);
    console.log('🤖 ML Support:', mlSupport);

    switch (environment) {
      case 'development':
        this.applyDev();
        break;
      case 'test':
        this.applyTest();
        break;
      case 'production':
        this.applyProduction();
        break;
      default:
        console.warn('⚠️ Unknown environment, using development CSP');
        this.applyDev();
    }
  }

  // Detect current environment
  static detectEnvironment() {
    if (typeof window === 'undefined') return 'server';
    
    const hostname = window.location.hostname;
    const port = window.location.port;
    
    // Development indicators
    if (hostname === 'localhost' || 
        hostname === '127.0.0.1' || 
        hostname.includes('dev') ||
        port === '5173' || 
        port === '3000' ||
        process.env.NODE_ENV === 'development') {
      return 'development';
    }
    
    // Test indicators
    if (hostname.includes('test') || 
        hostname.includes('staging') ||
        process.env.NODE_ENV === 'test') {
      return 'test';
    }
    
    // Production
    return 'production';
  }

  // Initialize CSP with automatic environment detection
  static init() {
    console.log('🚀 Initializing CSP Manager...');
    
    // Apply CSP based on environment
    this.applyDynamic();
    
    // Set up violation reporting
    this.setupViolationReporting();
    
    // Log final status
    const support = this.checkMLSupport();
    console.log('✅ CSP Manager initialized');
    console.log('🤖 ML Framework Support:', support);
  }

  // Set up CSP violation event listener
  static setupViolationReporting() {
    if (typeof window !== 'undefined') {
      window.addEventListener('securitypolicyviolation', (e) => {
        this.reportViolation({
          blockedURI: e.blockedURI,
          violatedDirective: e.violatedDirective,
          originalPolicy: e.originalPolicy,
          sourceFile: e.sourceFile,
          lineNumber: e.lineNumber,
          columnNumber: e.columnNumber
        });
      });
      
      console.log('👂 CSP violation reporting enabled');
    }
  }
}

// Auto-initialize CSP when module loads
if (typeof window !== 'undefined') {
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      CSPManager.init();
    });
  } else {
    CSPManager.init();
  }
}

export default CSPManager;