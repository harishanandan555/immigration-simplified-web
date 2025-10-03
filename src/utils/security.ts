// Comprehensive Security System for Immigration Case Management
import CryptoJS from 'crypto-js';

// Security Configuration
export interface SecurityConfig {
  encryption: {
    algorithm: 'AES-256-GCM' | 'AES-256-CBC';
    keyRotationDays: number;
    saltRounds: number;
  };
  dataProtection: {
    retentionDays: number;
    autoDelete: boolean;
    backupEncryption: boolean;
    auditLogging: boolean;
  };
  accessControl: {
    sessionTimeout: number;
    maxLoginAttempts: number;
    lockoutDuration: number;
    requireMFA: boolean;
    ipWhitelist: string[];
  };
  compliance: {
    gdprCompliant: boolean;
    hipaaCompliant: boolean;
    soxCompliant: boolean;
    dataResidency: string;
  };
}

// Default security configuration
export const DEFAULT_SECURITY_CONFIG: SecurityConfig = {
  encryption: {
    algorithm: 'AES-256-GCM',
    keyRotationDays: 90,
    saltRounds: 12
  },
  dataProtection: {
    retentionDays: 2555, // 7 years for immigration records
    autoDelete: true,
    backupEncryption: true,
    auditLogging: true
  },
  accessControl: {
    sessionTimeout: 30 * 60 * 1000, // 30 minutes
    maxLoginAttempts: 5,
    lockoutDuration: 15 * 60 * 1000, // 15 minutes
    requireMFA: true,
    ipWhitelist: []
  },
  compliance: {
    gdprCompliant: true,
    hipaaCompliant: false,
    soxCompliant: false,
    dataResidency: 'US'
  }
};

// Encryption Service
export class EncryptionService {
  private static instance: EncryptionService;
  private encryptionKey: string;
  private algorithm: string;

  private constructor() {
    this.encryptionKey = import.meta.env.VITE_REACT_APP_ENCRYPTION_KEY || 'default-key-change-in-production';
    this.algorithm = DEFAULT_SECURITY_CONFIG.encryption.algorithm;
  }

  static getInstance(): EncryptionService {
    if (!EncryptionService.instance) {
      EncryptionService.instance = new EncryptionService();
    }
    return EncryptionService.instance;
  }

  // Encrypt sensitive data
  encrypt(data: string): string {
    try {
      const encrypted = CryptoJS.AES.encrypt(data, this.encryptionKey).toString();
      return encrypted;
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  // Decrypt sensitive data
  decrypt(encryptedData: string): string {
    try {
      const decrypted = CryptoJS.AES.decrypt(encryptedData, this.encryptionKey);
      return decrypted.toString(CryptoJS.enc.Utf8);
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  // Encrypt object
  encryptObject(obj: any): string {
    return this.encrypt(JSON.stringify(obj));
  }

  // Decrypt object
  decryptObject(encryptedData: string): any {
    const decrypted = this.decrypt(encryptedData);
    return JSON.parse(decrypted);
  }

  // Hash password
  hashPassword(password: string): string {
    return CryptoJS.SHA256(password).toString();
  }

  // Verify password
  verifyPassword(password: string, hash: string): boolean {
    return this.hashPassword(password) === hash;
  }

  // Generate secure random string
  generateSecureToken(length: number = 32): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
}

// Data Protection Service
export class DataProtectionService {
  private static instance: DataProtectionService;
  private config: SecurityConfig;

  private constructor() {
    this.config = DEFAULT_SECURITY_CONFIG;
  }

  static getInstance(): DataProtectionService {
    if (!DataProtectionService.instance) {
      DataProtectionService.instance = new DataProtectionService();
    }
    return DataProtectionService.instance;
  }

  // Sanitize sensitive data for display
  sanitizeForDisplay(data: any, sensitiveFields: string[]): any {
    const sanitized = { ...data };
    
    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        const value = sanitized[field].toString();
        if (value.length > 4) {
          sanitized[field] = value.substring(0, 2) + '*'.repeat(value.length - 4) + value.substring(value.length - 2);
        } else {
          sanitized[field] = '*'.repeat(value.length);
        }
      }
    });

    return sanitized;
  }

  // Mask sensitive data
  maskSensitiveData(data: string, type: 'ssn' | 'alien_number' | 'passport' | 'phone' | 'email'): string {
    switch (type) {
      case 'ssn':
        return data.replace(/(\d{3})-(\d{2})-(\d{4})/, '***-**-$3');
      case 'alien_number':
        return data.replace(/^A(\d{3})(\d{3})(\d{3})$/, 'A***$2***');
      case 'passport':
        return data.replace(/(.{2})(.+)(.{2})/, '$1***$3');
      case 'phone':
        return data.replace(/(\d{3})-(\d{3})-(\d{4})/, '($1) ***-$3');
      case 'email':
        const [local, domain] = data.split('@');
        return `${local.substring(0, 2)}***@${domain}`;
      default:
        return data;
    }
  }

  // Check data retention compliance
  checkRetentionCompliance(creationDate: Date): boolean {
    const retentionDate = new Date(creationDate);
    retentionDate.setDate(retentionDate.getDate() + this.config.dataProtection.retentionDays);
    return new Date() <= retentionDate;
  }


  // Anonymize data for compliance
  anonymizeData(data: any): any {
    const anonymized = { ...data };
    
    // Remove or hash personally identifiable information
    const piiFields = ['firstName', 'lastName', 'email', 'phone', 'ssn', 'alienNumber', 'passportNumber'];
    
    piiFields.forEach(field => {
      if (anonymized[field]) {
        anonymized[field] = this.hashField(anonymized[field]);
      }
    });

    return anonymized;
  }

  private hashField(value: string): string {
    return CryptoJS.SHA256(value).toString().substring(0, 8);
  }
}

// Access Control Service
export class AccessControlService {
  private static instance: AccessControlService;
  private config: SecurityConfig;
  private loginAttempts: Map<string, { count: number; lastAttempt: Date }> = new Map();
  private activeSessions: Map<string, { userId: string; lastActivity: Date }> = new Map();

  private constructor() {
    this.config = DEFAULT_SECURITY_CONFIG;
  }

  static getInstance(): AccessControlService {
    if (!AccessControlService.instance) {
      AccessControlService.instance = new AccessControlService();
    }
    return AccessControlService.instance;
  }

  // Check if user is locked out
  isUserLockedOut(userId: string): boolean {
    const attempts = this.loginAttempts.get(userId);
    if (!attempts) return false;

    const timeSinceLastAttempt = Date.now() - attempts.lastAttempt.getTime();
    return attempts.count >= this.config.accessControl.maxLoginAttempts && 
           timeSinceLastAttempt < this.config.accessControl.lockoutDuration;
  }

  // Record login attempt
  recordLoginAttempt(userId: string, success: boolean): void {
    if (success) {
      this.loginAttempts.delete(userId);
    } else {
      const attempts = this.loginAttempts.get(userId) || { count: 0, lastAttempt: new Date() };
      attempts.count++;
      attempts.lastAttempt = new Date();
      this.loginAttempts.set(userId, attempts);
    }
  }

  // Create session
  createSession(sessionId: string, userId: string): void {
    this.activeSessions.set(sessionId, {
      userId,
      lastActivity: new Date()
    });
  }

  // Validate session
  validateSession(sessionId: string): boolean {
    const session = this.activeSessions.get(sessionId);
    if (!session) return false;

    const timeSinceLastActivity = Date.now() - session.lastActivity.getTime();
    if (timeSinceLastActivity > this.config.accessControl.sessionTimeout) {
      this.activeSessions.delete(sessionId);
      return false;
    }

    // Update last activity
    session.lastActivity = new Date();
    return true;
  }

  // End session
  endSession(sessionId: string): void {
    this.activeSessions.delete(sessionId);
  }

  // Check IP whitelist
  isIpAllowed(ip: string): boolean {
    if (this.config.accessControl.ipWhitelist.length === 0) return true;
    return this.config.accessControl.ipWhitelist.includes(ip);
  }

  // Get session info
  getSessionInfo(sessionId: string): { userId: string; lastActivity: Date } | null {
    return this.activeSessions.get(sessionId) || null;
  }
}

// Audit Logging Service
export class AuditLogService {
  private static instance: AuditLogService;
  private logs: Array<{
    timestamp: Date;
    userId: string;
    action: string;
    resource: string;
    details: any;
    ipAddress: string;
    userAgent: string;
  }> = [];

  private constructor() {}

  static getInstance(): AuditLogService {
    if (!AuditLogService.instance) {
      AuditLogService.instance = new AuditLogService();
    }
    return AuditLogService.instance;
  }

  // Log user action
  logAction(userId: string, action: string, resource: string, details: any, ipAddress: string, userAgent: string): void {
    const logEntry = {
      timestamp: new Date(),
      userId,
      action,
      resource,
      details,
      ipAddress,
      userAgent
    };

    this.logs.push(logEntry);
  }

  // Get logs for user
  getUserLogs(userId: string, startDate?: Date, endDate?: Date): any[] {
    let filteredLogs = this.logs.filter(log => log.userId === userId);
    
    if (startDate) {
      filteredLogs = filteredLogs.filter(log => log.timestamp >= startDate);
    }
    
    if (endDate) {
      filteredLogs = filteredLogs.filter(log => log.timestamp <= endDate);
    }

    return filteredLogs;
  }

  // Get logs for resource
  getResourceLogs(resource: string): any[] {
    return this.logs.filter(log => log.resource === resource);
  }

  // Export audit logs
  exportLogs(format: 'json' | 'csv' = 'json'): string {
    if (format === 'csv') {
      const headers = ['timestamp', 'userId', 'action', 'resource', 'details', 'ipAddress', 'userAgent'];
      const csvContent = [
        headers.join(','),
        ...this.logs.map(log => [
          log.timestamp.toISOString(),
          log.userId,
          log.action,
          log.resource,
          JSON.stringify(log.details),
          log.ipAddress,
          log.userAgent
        ].join(','))
      ].join('\n');
      return csvContent;
    } else {
      return JSON.stringify(this.logs, null, 2);
    }
  }
}

// Consistency Checking Service
export class ConsistencyCheckService {
  private static instance: ConsistencyCheckService;

  private constructor() {}

  static getInstance(): ConsistencyCheckService {
    if (!ConsistencyCheckService.instance) {
      ConsistencyCheckService.instance = new ConsistencyCheckService();
    }
    return ConsistencyCheckService.instance;
  }

  // Check data consistency across forms
  checkFormConsistency(formData: Record<string, any>): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    suggestions: string[];
  } {
    const result = {
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: []
    };

    // Check name consistency
    this.checkNameConsistency(formData, result);
    
    // Check date consistency
    this.checkDateConsistency(formData, result);
    
    // Check address consistency
    this.checkAddressConsistency(formData, result);
    
    // Check immigration status consistency
    this.checkImmigrationStatusConsistency(formData, result);

    return result;
  }

  private checkNameConsistency(formData: Record<string, any>, result: any): void {
    const nameFields = ['firstName', 'lastName', 'middleName'];
    const names = nameFields.map(field => formData[field]).filter(Boolean);
    
    // Check for duplicate names
    const uniqueNames = new Set(names.map(name => name.toLowerCase().trim()));
    if (uniqueNames.size !== names.length) {
      result.warnings.push('Duplicate names detected. Please verify all name entries.');
    }

    // Check name format consistency
    names.forEach(name => {
      if (name && !/^[A-Za-z\s\-'\.]+$/.test(name)) {
        result.errors.push(`Invalid characters in name: ${name}`);
        result.isValid = false;
      }
    });
  }

  private checkDateConsistency(formData: Record<string, any>, result: any): void {
    const dateOfBirth = formData.dateOfBirth;
    const entryDate = formData.entryDate;
    const currentDate = new Date();

    if (dateOfBirth && entryDate) {
      const dob = new Date(dateOfBirth);
      const entry = new Date(entryDate);

      if (entry < dob) {
        result.errors.push('Entry date cannot be before date of birth');
        result.isValid = false;
      }

      if (entry > currentDate) {
        result.errors.push('Entry date cannot be in the future');
        result.isValid = false;
      }

      // Check age at entry
      const ageAtEntry = entry.getFullYear() - dob.getFullYear();
      if (ageAtEntry < 0) {
        result.errors.push('Invalid age calculation');
        result.isValid = false;
      }
    }
  }

  private checkAddressConsistency(formData: Record<string, any>, result: any): void {
    const address = formData.address;
    if (address) {
      // Check ZIP code format
      if (address.zipCode && !/^\d{5}(-\d{4})?$/.test(address.zipCode)) {
        result.warnings.push('ZIP code format may be incorrect');
      }

      // Check state consistency
      if (address.state && address.state.length !== 2) {
        result.warnings.push('State should be abbreviated (e.g., CA, NY)');
      }
    }
  }

  private checkImmigrationStatusConsistency(formData: Record<string, any>, result: any): void {
    const alienNumber = formData.alienNumber;
    const currentStatus = formData.currentStatus;

    // Check A-Number format
    if (alienNumber && !/^A\d{9}$/.test(alienNumber)) {
      result.errors.push('Alien number must be in format A123456789');
      result.isValid = false;
    }

    // Check status consistency with other fields
    if (currentStatus === 'Permanent Resident' && !alienNumber) {
      result.warnings.push('Permanent residents typically have an A-Number');
    }
  }

  // Cross-reference data between forms
  crossReferenceForms(forms: Record<string, any>): {
    isValid: boolean;
    discrepancies: string[];
    suggestions: string[];
  } {
    const result = {
      isValid: true,
      discrepancies: [],
      suggestions: []
    };

    const formIds = Object.keys(forms);
    
    for (let i = 0; i < formIds.length; i++) {
      for (let j = i + 1; j < formIds.length; j++) {
        const form1 = forms[formIds[i]];
        const form2 = forms[formIds[j]];
        
        this.compareFormData(form1, form2, formIds[i], formIds[j], result);
      }
    }

    return result;
  }

  private compareFormData(form1: any, form2: any, form1Name: string, form2Name: string, result: any): void {
    const commonFields = ['firstName', 'lastName', 'dateOfBirth', 'alienNumber', 'email'];
    
    commonFields.forEach(field => {
      const value1 = form1[field];
      const value2 = form2[field];
      
      if (value1 && value2 && value1 !== value2) {
        result.discrepancies.push(
          `${field} differs between ${form1Name} and ${form2Name}: "${value1}" vs "${value2}"`
        );
        result.isValid = false;
      }
    });
  }
}

// Security Manager - Main interface for security operations
export class SecurityManager {
  private static instance: SecurityManager;
  private encryptionService: EncryptionService;
  private dataProtectionService: DataProtectionService;
  private accessControlService: AccessControlService;
  private auditLogService: AuditLogService;
  private consistencyCheckService: ConsistencyCheckService;

  private constructor() {
    this.encryptionService = EncryptionService.getInstance();
    this.dataProtectionService = DataProtectionService.getInstance();
    this.accessControlService = AccessControlService.getInstance();
    this.auditLogService = AuditLogService.getInstance();
    this.consistencyCheckService = ConsistencyCheckService.getInstance();
  }

  static getInstance(): SecurityManager {
    if (!SecurityManager.instance) {
      SecurityManager.instance = new SecurityManager();
    }
    return SecurityManager.instance;
  }

  // Encrypt sensitive data
  encryptData(data: string): string {
    return this.encryptionService.encrypt(data);
  }

  // Decrypt sensitive data
  decryptData(encryptedData: string): string {
    return this.encryptionService.decrypt(encryptedData);
  }

  // Sanitize data for display
  sanitizeData(data: any, sensitiveFields: string[]): any {
    return this.dataProtectionService.sanitizeForDisplay(data, sensitiveFields);
  }

  // Check form consistency
  checkConsistency(formData: Record<string, any>): any {
    return this.consistencyCheckService.checkFormConsistency(formData);
  }

  // Log security event
  logSecurityEvent(userId: string, action: string, resource: string, details: any, ipAddress: string, userAgent: string): void {
    this.auditLogService.logAction(userId, action, resource, details, ipAddress, userAgent);
  }

  // Validate session
  validateSession(sessionId: string): boolean {
    return this.accessControlService.validateSession(sessionId);
  }

  // Get all services
  getServices() {
    return {
      encryption: this.encryptionService,
      dataProtection: this.dataProtectionService,
      accessControl: this.accessControlService,
      auditLog: this.auditLogService,
      consistencyCheck: this.consistencyCheckService
    };
  }
}

// Export singleton instance
export const securityManager = SecurityManager.getInstance(); 