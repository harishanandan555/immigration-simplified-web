/**
 * Password Security Monitoring Service
 * Monitors and prevents password hashing issues across the application
 */

interface SecurityEvent {
  timestamp: Date;
  eventType: 'password_validation_failed' | 'likely_hashed_password_detected' | 'invalid_endpoint_used' | 'registration_success' | 'registration_failure';
  email?: string;
  endpoint?: string;
  errorMessage?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface SecurityMetrics {
  totalRegistrations: number;
  failedRegistrations: number;
  hashedPasswordDetections: number;
  invalidEndpointUsage: number;
  lastIncident?: SecurityEvent;
}

class PasswordSecurityMonitor {
  private static instance: PasswordSecurityMonitor;
  private events: SecurityEvent[] = [];
  private readonly maxEvents = 1000; // Keep last 1000 events
  private readonly storageKey = 'password_security_events';

  static getInstance(): PasswordSecurityMonitor {
    if (!PasswordSecurityMonitor.instance) {
      PasswordSecurityMonitor.instance = new PasswordSecurityMonitor();
    }
    return PasswordSecurityMonitor.instance;
  }

  constructor() {
    this.loadEventsFromStorage();
  }

  /**
   * Log a security event
   */
  logEvent(event: Omit<SecurityEvent, 'timestamp'>): void {
    const securityEvent: SecurityEvent = {
      ...event,
      timestamp: new Date()
    };

    this.events.push(securityEvent);

    // Keep only the latest events
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }

    // Save to localStorage for persistence
    this.saveEventsToStorage();

    // Log to console based on severity
    this.logToConsole(securityEvent);

    // Send critical events to monitoring service (if available)
    if (securityEvent.severity === 'critical') {
      this.sendToMonitoringService(securityEvent);
    }
  }

  /**
   * Get security metrics
   */
  getMetrics(): SecurityMetrics {
    const totalRegistrations = this.events.filter(e => 
      e.eventType === 'registration_success' || e.eventType === 'registration_failure'
    ).length;

    const failedRegistrations = this.events.filter(e => 
      e.eventType === 'registration_failure'
    ).length;

    const hashedPasswordDetections = this.events.filter(e => 
      e.eventType === 'likely_hashed_password_detected'
    ).length;

    const invalidEndpointUsage = this.events.filter(e => 
      e.eventType === 'invalid_endpoint_used'
    ).length;

    const criticalEvents = this.events.filter(e => e.severity === 'critical');
    const lastIncident = criticalEvents.length > 0 ? criticalEvents[criticalEvents.length - 1] : undefined;

    return {
      totalRegistrations,
      failedRegistrations,
      hashedPasswordDetections,
      invalidEndpointUsage,
      lastIncident
    };
  }

  /**
   * Get recent security events
   */
  getRecentEvents(limit: number = 50): SecurityEvent[] {
    return this.events.slice(-limit).reverse();
  }

  /**
   * Check if there are critical security issues
   */
  hasCriticalIssues(): boolean {
    const recentEvents = this.getRecentEvents(100);
    const criticalEvents = recentEvents.filter(e => e.severity === 'critical');
    
    // Check for multiple critical events in the last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentCriticalEvents = criticalEvents.filter(e => e.timestamp > oneHourAgo);
    
    return recentCriticalEvents.length > 2;
  }

  /**
   * Generate security report
   */
  generateReport(): string {
    const metrics = this.getMetrics();
    const recentEvents = this.getRecentEvents(20);
    
    let report = '🔒 PASSWORD SECURITY REPORT\n';
    report += '=' .repeat(40) + '\n\n';
    
    report += '📊 METRICS:\n';
    report += `- Total Registrations: ${metrics.totalRegistrations}\n`;
    report += `- Failed Registrations: ${metrics.failedRegistrations}\n`;
    report += `- Hashed Password Detections: ${metrics.hashedPasswordDetections}\n`;
    report += `- Invalid Endpoint Usage: ${metrics.invalidEndpointUsage}\n\n`;
    
    if (metrics.lastIncident) {
      report += '🚨 LAST CRITICAL INCIDENT:\n';
      report += `- Time: ${metrics.lastIncident.timestamp.toISOString()}\n`;
      report += `- Type: ${metrics.lastIncident.eventType}\n`;
      report += `- Message: ${metrics.lastIncident.errorMessage || 'N/A'}\n\n`;
    }
    
    report += '📋 RECENT EVENTS:\n';
    recentEvents.forEach((event, index) => {
      const severity = event.severity === 'critical' ? '🚨' : 
                      event.severity === 'high' ? '⚠️' : 
                      event.severity === 'medium' ? '⚡' : 'ℹ️';
      report += `${index + 1}. ${severity} ${event.timestamp.toLocaleString()} - ${event.eventType}\n`;
      if (event.errorMessage) {
        report += `   Error: ${event.errorMessage}\n`;
      }
    });
    
    return report;
  }

  /**
   * Clear old events (cleanup)
   */
  clearOldEvents(daysOld: number = 30): void {
    const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);
    this.events = this.events.filter(event => event.timestamp > cutoffDate);
    this.saveEventsToStorage();
  }

  private logToConsole(event: SecurityEvent): void {
    const emoji = event.severity === 'critical' ? '🚨' : 
                  event.severity === 'high' ? '⚠️' : 
                  event.severity === 'medium' ? '⚡' : 'ℹ️';
    
    const message = `${emoji} [SECURITY] ${event.eventType}: ${event.errorMessage || 'Event logged'}`;
    
    switch (event.severity) {
      case 'critical':
        console.error(message, event);
        break;
      case 'high':
        console.warn(message, event);
        break;
      case 'medium':
        console.warn(message, event);
        break;
      default:
        console.log(message, event);
    }
  }

  private async sendToMonitoringService(event: SecurityEvent): Promise<void> {
    try {
      // Try to send to monitoring endpoint if available
      await fetch('/api/v1/security/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(event)
      });
    } catch (error) {
      // Monitoring service not available, that's okay
      console.warn('Could not send security event to monitoring service:', error);
    }
  }

  private saveEventsToStorage(): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.events));
    } catch (error) {
      console.warn('Could not save security events to localStorage:', error);
    }
  }

  private loadEventsFromStorage(): void {
    try {
      const storedEvents = localStorage.getItem(this.storageKey);
      if (storedEvents) {
        this.events = JSON.parse(storedEvents).map((event: any) => ({
          ...event,
          timestamp: new Date(event.timestamp)
        }));
      }
    } catch (error) {
      console.warn('Could not load security events from localStorage:', error);
      this.events = [];
    }
  }
}

// Security monitoring hooks and utilities
export const useSecurityMonitoring = () => {
  const monitor = PasswordSecurityMonitor.getInstance();

  return {
    logSecurityEvent: monitor.logEvent.bind(monitor),
    getSecurityMetrics: monitor.getMetrics.bind(monitor),
    getRecentEvents: monitor.getRecentEvents.bind(monitor),
    hasCriticalIssues: monitor.hasCriticalIssues.bind(monitor),
    generateReport: monitor.generateReport.bind(monitor),
    clearOldEvents: monitor.clearOldEvents.bind(monitor)
  };
};

// Global security interceptor for API calls
export const setupSecurityInterceptor = (apiInstance: any) => {
  // Intercept requests to monitor registration endpoints
  apiInstance.interceptors.request.use((config: any) => {
    const monitor = PasswordSecurityMonitor.getInstance();
    
    // Check if this is a registration endpoint
    if (config.url?.includes('/register') || config.url?.includes('/auth/register')) {
      // Validate that we're using the correct endpoint
      const allowedEndpoints = ['/api/v1/auth/register/user', '/api/v1/auth/register'];
      const isValidEndpoint = allowedEndpoints.some(endpoint => config.url.includes(endpoint));
      
      if (!isValidEndpoint) {
        monitor.logEvent({
          eventType: 'invalid_endpoint_used',
          endpoint: config.url,
          errorMessage: `Invalid registration endpoint used: ${config.url}`,
          severity: 'high'
        });
      }

      // Check if password might be hashed (basic check)
      if (config.data?.password) {
        const password = config.data.password;
        if (password.length > 30 && /^[\$a-f0-9]+$/.test(password)) {
          monitor.logEvent({
            eventType: 'likely_hashed_password_detected',
            email: config.data.email,
            errorMessage: 'Password appears to be already hashed in request',
            severity: 'critical'
          });
        }
      }
    }
    
    return config;
  });

  // Intercept responses to monitor registration results
  apiInstance.interceptors.response.use(
    (response: any) => {
      const monitor = PasswordSecurityMonitor.getInstance();
      const config = response.config;
      
      if (config.url?.includes('/register')) {
        monitor.logEvent({
          eventType: 'registration_success',
          email: config.data?.email,
          endpoint: config.url,
          severity: 'low'
        });
      }
      
      return response;
    },
    (error: any) => {
      const monitor = PasswordSecurityMonitor.getInstance();
      const config = error.config;
      
      if (config?.url?.includes('/register')) {
        monitor.logEvent({
          eventType: 'registration_failure',
          email: config.data?.email,
          endpoint: config.url,
          errorMessage: error.message,
          severity: 'medium'
        });
      }
      
      return Promise.reject(error);
    }
  );
};

export default PasswordSecurityMonitor;
