/**
 * Healthcare Integration Base Framework
 *
 * Core infrastructure for HIPAA-compliant healthcare system integrations
 * Provides foundational services for EHR, insurance, and billing integrations
 */

import { z } from 'zod'
import crypto from 'crypto'

// ============================================================================
// HEALTHCARE INTEGRATION TYPES
// ============================================================================

export interface HealthcareIntegrationConfig {
  name: string
  type: HealthcareSystemType
  baseUrl: string
  apiVersion: string
  authentication: AuthenticationConfig
  encryption: EncryptionConfig
  compliance: ComplianceConfig
  rateLimiting: RateLimitConfig
  monitoring: MonitoringConfig
}

export interface AuthenticationConfig {
  type: 'oauth2' | 'api-key' | 'client-certificate'
  oauth2?: OAuth2Config
  apiKey?: string
  certificate?: CertificateConfig
  tokenStorage: 'encrypted-database' | 'secure-vault'
  refreshStrategy: 'automatic' | 'manual'
  sessionTimeout: number // seconds
}

export interface OAuth2Config {
  authUrl: string
  tokenUrl: string
  clientId: string
  clientSecret: string
  scopes: string[]
  redirectUri: string
  pkce: boolean
  smartOnFhir?: boolean
}

export interface EncryptionConfig {
  algorithm: 'AES-256-GCM' | 'AES-256-CBC'
  keyDerivation: 'PBKDF2' | 'Argon2'
  keyRotationDays: number
  encryptAtRest: boolean
  encryptInTransit: boolean
  certificatePinning: boolean
}

export interface ComplianceConfig {
  hipaaCompliant: boolean
  auditLogging: boolean
  dataMinimization: boolean
  consentManagement: boolean
  retentionPeriodDays: number
  encryptionRequired: boolean
  accessControls: AccessControlConfig
}

export interface AccessControlConfig {
  rbac: boolean
  abac: boolean
  minimumPermissions: boolean
  sessionTracking: boolean
  ipWhitelisting: boolean
  geoRestrictions: boolean
}

export interface RateLimitConfig {
  requestsPerMinute: number
  burstLimit: number
  backoffStrategy: 'exponential' | 'linear'
  circuitBreaker: boolean
  fallbackService: boolean
}

export interface MonitoringConfig {
  healthChecks: boolean
  performanceMetrics: boolean
  errorTracking: boolean
  auditLogging: boolean
  alerting: AlertingConfig
}

export interface AlertingConfig {
  enableSlack: boolean
  enableEmail: boolean
  enableSms: boolean
  criticalLatency: number // milliseconds
  errorThreshold: number // percentage
  downtimeThreshold: number // seconds
}

export enum HealthcareSystemType {
  EHR = 'ehr',
  BILLING = 'billing',
  INSURANCE = 'insurance',
  TELEHEALTH = 'telehealth',
  PHARMACY = 'pharmacy',
  LABORATORY = 'laboratory',
  RADIOLOGY = 'radiology',
  SCHEDULING = 'scheduling'
}

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

export const HealthcareIntegrationSchema = z.object({
  name: z.string().min(1),
  type: z.nativeEnum(HealthcareSystemType),
  baseUrl: z.string().url(),
  apiVersion: z.string(),
  authentication: z.object({
    type: z.enum(['oauth2', 'api-key', 'client-certificate']),
    tokenStorage: z.enum(['encrypted-database', 'secure-vault']),
    refreshStrategy: z.enum(['automatic', 'manual']),
    sessionTimeout: z.number().positive()
  }),
  encryption: z.object({
    algorithm: z.enum(['AES-256-GCM', 'AES-256-CBC']),
    keyDerivation: z.enum(['PBKDF2', 'Argon2']),
    keyRotationDays: z.number().positive(),
    encryptAtRest: z.boolean(),
    encryptInTransit: z.boolean(),
    certificatePinning: z.boolean()
  }),
  compliance: z.object({
    hipaaCompliant: z.boolean(),
    auditLogging: z.boolean(),
    dataMinimization: z.boolean(),
    consentManagement: z.boolean(),
    retentionPeriodDays: z.number().positive(),
    encryptionRequired: z.boolean()
  })
})

// ============================================================================
// BASE HEALTHCARE INTEGRATION CLASS
// ============================================================================

export abstract class BaseHealthcareIntegration {
  protected config: HealthcareIntegrationConfig
  protected logger: HealthcareLogger
  protected encryption: HealthcareEncryption
  protected auditTrail: AuditTrail

  constructor(config: HealthcareIntegrationConfig) {
    // Validate configuration
    const validation = HealthcareIntegrationSchema.safeParse(config)
    if (!validation.success) {
      throw new Error(`Invalid healthcare integration config: ${validation.error.message}`)
    }

    this.config = config
    this.logger = new HealthcareLogger(config.name, config.monitoring)
    this.encryption = new HealthcareEncryption(config.encryption)
    this.auditTrail = new AuditTrail(config.compliance)

    // Initialize compliance checks
    this.validateHIPAACompliance()
  }

  // Abstract methods that must be implemented by specific integrations
  abstract authenticate(): Promise<AuthenticationResult>
  abstract testConnection(): Promise<ConnectionResult>
  abstract getHealthStatus(): Promise<HealthStatus>

  // Common functionality for all healthcare integrations
  protected async makeSecureRequest<T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    data?: any,
    headers?: Record<string, string>
  ): Promise<SecureResponse<T>> {
    const startTime = Date.now()
    const requestId = crypto.randomUUID()

    try {
      // Log request start
      await this.auditTrail.logAccess({
        requestId,
        endpoint,
        method,
        timestamp: new Date(),
        userId: headers?.['X-User-ID'],
        ipAddress: headers?.['X-Client-IP']
      })

      // Apply rate limiting
      await this.checkRateLimit()

      // Encrypt sensitive data
      const encryptedData = data ? await this.encryption.encrypt(JSON.stringify(data)) : undefined

      // Make the actual request
      const response = await this.executeRequest(endpoint, method, encryptedData, headers)

      // Decrypt response if needed
      const decryptedResponse = response.encrypted
        ? await this.encryption.decrypt(response.data)
        : response.data

      const endTime = Date.now()
      const duration = endTime - startTime

      // Log successful request
      await this.auditTrail.logSuccess({
        requestId,
        duration,
        responseSize: JSON.stringify(decryptedResponse).length,
        timestamp: new Date()
      })

      // Monitor performance
      await this.logger.logPerformance({
        endpoint,
        method,
        duration,
        status: 'success'
      })

      return {
        success: true,
        data: decryptedResponse,
        metadata: {
          requestId,
          duration,
          timestamp: new Date(),
          endpoint
        }
      }

    } catch (error) {
      const endTime = Date.now()
      const duration = endTime - startTime

      // Log error
      await this.auditTrail.logError({
        requestId,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration,
        timestamp: new Date()
      })

      // Monitor error
      await this.logger.logError({
        endpoint,
        method,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration
      })

      throw new HealthcareIntegrationError(
        `Request failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        requestId,
        endpoint
      )
    }
  }

  protected async executeRequest(
    endpoint: string,
    method: string,
    data?: string,
    headers?: Record<string, string>
  ): Promise<any> {
    // This would be implemented with actual HTTP client
    // For now, this is a placeholder
    throw new Error('executeRequest must be implemented by concrete integration class')
  }

  protected async checkRateLimit(): Promise<void> {
    // Implement rate limiting logic
    // This could use Redis or in-memory cache
    // For now, this is a placeholder
  }

  protected validateHIPAACompliance(): void {
    if (!this.config.compliance.hipaaCompliant) {
      throw new Error('Integration must be HIPAA compliant for healthcare use')
    }

    if (!this.config.encryption.encryptAtRest || !this.config.encryption.encryptInTransit) {
      throw new Error('Encryption at rest and in transit is required for HIPAA compliance')
    }

    if (!this.config.compliance.auditLogging) {
      throw new Error('Audit logging is required for HIPAA compliance')
    }

    if (!this.config.compliance.accessControls.rbac) {
      throw new Error('Role-based access control is required for HIPAA compliance')
    }
  }

  // Utility methods
  public async isHealthy(): Promise<boolean> {
    try {
      const status = await this.getHealthStatus()
      return status.healthy
    } catch {
      return false
    }
  }

  public getConfig(): HealthcareIntegrationConfig {
    // Return config without sensitive data
    return {
      ...this.config,
      authentication: {
        ...this.config.authentication,
        oauth2: this.config.authentication.oauth2 ? {
          ...this.config.authentication.oauth2,
          clientSecret: '[REDACTED]'
        } : undefined,
        apiKey: this.config.authentication.apiKey ? '[REDACTED]' : undefined
      }
    }
  }
}

// ============================================================================
// SUPPORTING CLASSES
// ============================================================================

export class HealthcareLogger {
  private serviceName: string
  private config: MonitoringConfig

  constructor(serviceName: string, config: MonitoringConfig) {
    this.serviceName = serviceName
    this.config = config
  }

  async logPerformance(metrics: PerformanceMetrics): Promise<void> {
    if (!this.config.performanceMetrics) return

    // Log to monitoring system
    console.log(`[${this.serviceName}] Performance:`, metrics)

    // Check if alerting is needed
    if (metrics.duration > this.config.alerting.criticalLatency) {
      await this.sendAlert('High latency detected', metrics)
    }
  }

  async logError(error: ErrorMetrics): Promise<void> {
    if (!this.config.errorTracking) return

    console.error(`[${this.serviceName}] Error:`, error)
    await this.sendAlert('Error occurred', error)
  }

  private async sendAlert(message: string, data: any): Promise<void> {
    // Implement alerting logic (Slack, email, SMS)
    console.log(`ALERT [${this.serviceName}]: ${message}`, data)
  }
}

export class HealthcareEncryption {
  private config: EncryptionConfig
  private algorithm: string

  constructor(config: EncryptionConfig) {
    this.config = config
    this.algorithm = config.algorithm
  }

  async encrypt(data: string): Promise<string> {
    if (!this.config.encryptAtRest && !this.config.encryptInTransit) {
      return data
    }

    const key = await this.getEncryptionKey()
    const iv = crypto.randomBytes(16)
    const cipher = crypto.createCipher(this.algorithm, key)

    let encrypted = cipher.update(data, 'utf8', 'hex')
    encrypted += cipher.final('hex')

    return `${iv.toString('hex')}:${encrypted}`
  }

  async decrypt(encryptedData: string): Promise<string> {
    if (!this.config.encryptAtRest && !this.config.encryptInTransit) {
      return encryptedData
    }

    const [ivHex, encrypted] = encryptedData.split(':')
    const key = await this.getEncryptionKey()
    const decipher = crypto.createDecipher(this.algorithm, key)

    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')

    return decrypted
  }

  private async getEncryptionKey(): Promise<string> {
    // In production, this would retrieve from secure key management
    return process.env.HEALTHCARE_ENCRYPTION_KEY || 'default-key'
  }
}

export class AuditTrail {
  private config: ComplianceConfig

  constructor(config: ComplianceConfig) {
    this.config = config
  }

  async logAccess(event: AccessEvent): Promise<void> {
    if (!this.config.auditLogging) return

    const auditEntry = {
      type: 'ACCESS',
      timestamp: event.timestamp,
      requestId: event.requestId,
      userId: event.userId,
      ipAddress: event.ipAddress,
      endpoint: event.endpoint,
      method: event.method,
      hipaaRelevant: true
    }

    // Store in immutable audit log
    await this.storeAuditEntry(auditEntry)
  }

  async logSuccess(event: SuccessEvent): Promise<void> {
    if (!this.config.auditLogging) return

    const auditEntry = {
      type: 'SUCCESS',
      timestamp: event.timestamp,
      requestId: event.requestId,
      duration: event.duration,
      responseSize: event.responseSize
    }

    await this.storeAuditEntry(auditEntry)
  }

  async logError(event: ErrorEvent): Promise<void> {
    if (!this.config.auditLogging) return

    const auditEntry = {
      type: 'ERROR',
      timestamp: event.timestamp,
      requestId: event.requestId,
      error: event.error,
      duration: event.duration
    }

    await this.storeAuditEntry(auditEntry)
  }

  private async storeAuditEntry(entry: any): Promise<void> {
    // In production, this would store in immutable audit database
    console.log('AUDIT:', entry)
  }
}

// ============================================================================
// INTERFACES AND TYPES
// ============================================================================

export interface AuthenticationResult {
  success: boolean
  token?: string
  expiresAt?: Date
  refreshToken?: string
  error?: string
}

export interface ConnectionResult {
  connected: boolean
  latency?: number
  error?: string
  serverVersion?: string
}

export interface HealthStatus {
  healthy: boolean
  lastChecked: Date
  responseTime: number
  errorRate: number
  uptime: number
}

export interface SecureResponse<T> {
  success: boolean
  data: T
  metadata: {
    requestId: string
    duration: number
    timestamp: Date
    endpoint: string
  }
}

export interface PerformanceMetrics {
  endpoint: string
  method: string
  duration: number
  status: 'success' | 'error'
}

export interface ErrorMetrics {
  endpoint: string
  method: string
  error: string
  duration: number
}

export interface AccessEvent {
  requestId: string
  endpoint: string
  method: string
  timestamp: Date
  userId?: string
  ipAddress?: string
}

export interface SuccessEvent {
  requestId: string
  duration: number
  responseSize: number
  timestamp: Date
}

export interface ErrorEvent {
  requestId: string
  error: string
  duration: number
  timestamp: Date
}

export interface CertificateConfig {
  certPath: string
  keyPath: string
  passphrase?: string
}

// ============================================================================
// CUSTOM ERRORS
// ============================================================================

export class HealthcareIntegrationError extends Error {
  public readonly requestId: string
  public readonly endpoint: string
  public readonly timestamp: Date

  constructor(message: string, requestId: string, endpoint: string) {
    super(message)
    this.name = 'HealthcareIntegrationError'
    this.requestId = requestId
    this.endpoint = endpoint
    this.timestamp = new Date()
  }
}

export class HIPAAComplianceError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'HIPAAComplianceError'
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export function validateHIPAACompliance(config: HealthcareIntegrationConfig): boolean {
  const issues: string[] = []

  if (!config.compliance.hipaaCompliant) {
    issues.push('Must be explicitly marked as HIPAA compliant')
  }

  if (!config.encryption.encryptAtRest) {
    issues.push('Data encryption at rest is required')
  }

  if (!config.encryption.encryptInTransit) {
    issues.push('Data encryption in transit is required')
  }

  if (!config.compliance.auditLogging) {
    issues.push('Comprehensive audit logging is required')
  }

  if (!config.compliance.accessControls.rbac) {
    issues.push('Role-based access control is required')
  }

  if (config.compliance.retentionPeriodDays < 2555) { // 7 years
    issues.push('Data retention period must be at least 7 years')
  }

  if (issues.length > 0) {
    throw new HIPAAComplianceError(`HIPAA compliance issues: ${issues.join(', ')}`)
  }

  return true
}

export function createDefaultHealthcareConfig(
  name: string,
  type: HealthcareSystemType,
  baseUrl: string
): HealthcareIntegrationConfig {
  return {
    name,
    type,
    baseUrl,
    apiVersion: '1.0',
    authentication: {
      type: 'oauth2',
      tokenStorage: 'encrypted-database',
      refreshStrategy: 'automatic',
      sessionTimeout: 900 // 15 minutes
    },
    encryption: {
      algorithm: 'AES-256-GCM',
      keyDerivation: 'Argon2',
      keyRotationDays: 90,
      encryptAtRest: true,
      encryptInTransit: true,
      certificatePinning: true
    },
    compliance: {
      hipaaCompliant: true,
      auditLogging: true,
      dataMinimization: true,
      consentManagement: true,
      retentionPeriodDays: 2555, // 7 years
      encryptionRequired: true,
      accessControls: {
        rbac: true,
        abac: true,
        minimumPermissions: true,
        sessionTracking: true,
        ipWhitelisting: false,
        geoRestrictions: false
      }
    },
    rateLimiting: {
      requestsPerMinute: 100,
      burstLimit: 200,
      backoffStrategy: 'exponential',
      circuitBreaker: true,
      fallbackService: true
    },
    monitoring: {
      healthChecks: true,
      performanceMetrics: true,
      errorTracking: true,
      auditLogging: true,
      alerting: {
        enableSlack: true,
        enableEmail: true,
        enableSms: false,
        criticalLatency: 5000, // 5 seconds
        errorThreshold: 5, // 5%
        downtimeThreshold: 30 // 30 seconds
      }
    }
  }
}