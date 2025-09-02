// Content Security Policy Manager
export class CSPManager {
  static getPolicy() {
    return {
      'default-src': ["'self'"],
      'script-src': ["'self'", "'unsafe-inline'"],
      'style-src': ["'self'", "'unsafe-inline'"],
      'img-src': ["'self'", "data:", "blob:"],
      'font-src': ["'self'", "data:"],
      'connect-src': ["'self'"],
      'media-src': ["'self'"],
      'object-src': ["'none'"],
      'frame-src': ["'none'"],
      'base-uri': ["'self'"],
      'form-action': ["'self'"],
      'frame-ancestors': ["'none'"],
      'upgrade-insecure-requests': []
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
    document.head.appendChild(meta);
  }

  static reportViolation(violation) {
    console.error('CSP Violation:', violation);
    // Could send to logging service if needed
  }
}

// Initialize CSP
if (typeof window !== 'undefined') {
  window.addEventListener('securitypolicyviolation', (e) => {
    CSPManager.reportViolation({
      blockedURI: e.blockedURI,
      violatedDirective: e.violatedDirective,
      originalPolicy: e.originalPolicy
    });
  });
}