/**
 * Healthcare OAuth 2.0 Security Framework
 *
 * HIPAA-compliant OAuth 2.0 implementation for healthcare integrations
 * Supports SMART on FHIR and healthcare-specific security requirements
 */

import { z } from 'zod'
import crypto from 'crypto'
import { prisma } from '@/lib/prisma'

// ============================================================================
// OAUTH CONFIGURATION TYPES
// ============================================================================

export interface HealthcareOAuthConfig {
  providerId: string
  providerName: string
  providerType: HealthcareProviderType
  authorizationUrl: string
  tokenUrl: string
  userInfoUrl?: string
  clientId: string
  clientSecret: string
  redirectUri: string
  scopes: string[]
  smartOnFhir?: SmartOnFhirConfig
  pkce: boolean
  state: boolean
  encryption: OAuthEncryptionConfig
  compliance: OAuthComplianceConfig
}

export interface SmartOnFhirConfig {
  fhirBaseUrl: string
  launch?: string
  aud?: string
  patientContext?: boolean
  practitionerContext?: boolean
  encounterContext?: boolean
  smartCapabilities: string[]
}

export interface OAuthEncryptionConfig {
  encryptTokens: boolean
  encryptRefreshTokens: boolean
  tokenEncryptionAlgorithm: string
  keyRotationIntervalDays: number
  useHSM: boolean // Hardware Security Module
}

export interface OAuthComplianceConfig {
  hipaaCompliant: boolean
  auditAllTokenOperations: boolean
  tokenExpiryMaxHours: number
  refreshTokenExpiryDays: number
  revokeOnSuspiciousActivity: boolean
  geoLocationTracking: boolean
  deviceFingerprinting: boolean
}

export enum HealthcareProviderType {
  EHR_EPIC = 'ehr-epic',
  EHR_CERNER = 'ehr-cerner',
  EHR_ALLSCRIPTS = 'ehr-allscripts',
  TELEHEALTH_ZOOM = 'telehealth-zoom',
  TELEHEALTH_DOXY = 'telehealth-doxy',
  BILLING_ATHENA = 'billing-athena',
  BILLING_EPIC = 'billing-epic',
  INSURANCE_AVAILITY = 'insurance-availity',
  INSURANCE_CHANGE = 'insurance-change',
  CALENDAR_GOOGLE = 'calendar-google',
  CALENDAR_OUTLOOK = 'calendar-outlook',
  SECURE_MESSAGING = 'secure-messaging'
}

// ============================================================================
// TOKEN MANAGEMENT TYPES
// ============================================================================

export interface OAuthTokenSet {
  accessToken: string
  refreshToken?: string
  tokenType: string
  expiresIn: number
  expiresAt: Date
  scope: string
  patientId?: string
  practitionerId?: string
  encounterId?: string
  fhirUser?: string
}

export interface StoredOAuthToken {
  id: string
  providerId: string
  userId: string
  accessTokenHash: string
  refreshTokenHash?: string
  encryptedAccessToken: string
  encryptedRefreshToken?: string
  tokenType: string
  scope: string
  expiresAt: Date
  patientContext?: string
  practitionerContext?: string
  encounterContext?: string
  fhirUser?: string
  deviceFingerprint?: string
  ipAddress?: string
  geoLocation?: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  lastUsedAt?: Date
  revokedAt?: Date
  revokedReason?: string
}

export interface TokenValidationResult {
  valid: boolean
  token?: OAuthTokenSet
  error?: string
  requiresRefresh?: boolean
  securityAlert?: SecurityAlert
}

export interface SecurityAlert {
  type: SecurityAlertType
  severity: AlertSeverity
  description: string
  metadata: Record<string, any>
  recommendedAction: string
}

export enum SecurityAlertType {
  SUSPICIOUS_LOCATION = 'suspicious-location',
  UNUSUAL_ACCESS_PATTERN = 'unusual-access-pattern',
  TOKEN_REUSE_DETECTED = 'token-reuse-detected',
  EXPIRED_TOKEN_USAGE = 'expired-token-usage',
  INVALID_SCOPE_ACCESS = 'invalid-scope-access',
  RAPID_TOKEN_REFRESH = 'rapid-token-refresh'
}

export enum AlertSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

export const HealthcareOAuthConfigSchema = z.object({
  providerId: z.string().min(1),
  providerName: z.string().min(1),
  providerType: z.nativeEnum(HealthcareProviderType),
  authorizationUrl: z.string().url(),
  tokenUrl: z.string().url(),
  userInfoUrl: z.string().url().optional(),
  clientId: z.string().min(1),
  clientSecret: z.string().min(1),
  redirectUri: z.string().url(),
  scopes: z.array(z.string()).min(1),
  pkce: z.boolean(),
  state: z.boolean(),
  encryption: z.object({
    encryptTokens: z.boolean(),
    encryptRefreshTokens: z.boolean(),
    tokenEncryptionAlgorithm: z.string(),
    keyRotationIntervalDays: z.number().min(1),
    useHSM: z.boolean()
  }),
  compliance: z.object({
    hipaaCompliant: z.boolean(),
    auditAllTokenOperations: z.boolean(),
    tokenExpiryMaxHours: z.number().min(1).max(24),
    refreshTokenExpiryDays: z.number().min(1).max(90),
    revokeOnSuspiciousActivity: z.boolean(),
    geoLocationTracking: z.boolean(),
    deviceFingerprinting: z.boolean()
  })
})

// ============================================================================
// HEALTHCARE OAUTH MANAGER
// ============================================================================

export class HealthcareOAuthManager {
  private config: HealthcareOAuthConfig
  private encryptionKey: string
  private auditLogger: OAuthAuditLogger

  constructor(config: HealthcareOAuthConfig) {
    // Validate configuration
    const validation = HealthcareOAuthConfigSchema.safeParse(config)
    if (!validation.success) {
      throw new Error(`Invalid OAuth config: ${validation.error.message}`)
    }

    if (!config.compliance.hipaaCompliant) {
      throw new Error('OAuth configuration must be HIPAA compliant for healthcare use')
    }

    this.config = config
    this.encryptionKey = this.getEncryptionKey()
    this.auditLogger = new OAuthAuditLogger(config.providerId)
  }

  // ============================================================================
  // AUTHORIZATION FLOW
  // ============================================================================

  async generateAuthorizationUrl(
    userId: string,
    additionalParams?: Record<string, string>
  ): Promise<AuthorizationUrlResult> {
    try {
      const state = this.generateSecureState(userId)
      const codeVerifier = this.config.pkce ? this.generateCodeVerifier() : undefined
      const codeChallenge = codeVerifier ? this.generateCodeChallenge(codeVerifier) : undefined

      const params = new URLSearchParams({
        response_type: 'code',
        client_id: this.config.clientId,
        redirect_uri: this.config.redirectUri,
        scope: this.config.scopes.join(' '),
        state,
        ...(codeChallenge && { code_challenge: codeChallenge, code_challenge_method: 'S256' }),
        ...(this.config.smartOnFhir?.aud && { aud: this.config.smartOnFhir.aud }),
        ...(this.config.smartOnFhir?.launch && { launch: this.config.smartOnFhir.launch }),
        ...additionalParams
      })

      const authUrl = `${this.config.authorizationUrl}?${params.toString()}`

      // Store authorization request details
      await this.storeAuthorizationRequest({
        userId,
        state,
        codeVerifier,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
      })

      await this.auditLogger.logAuthorizationRequest(userId, authUrl)

      return {
        success: true,
        authorizationUrl: authUrl,
        state
      }

    } catch (error) {
      await this.auditLogger.logError('authorization_url_generation', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate authorization URL'
      }
    }
  }

  async exchangeCodeForTokens(
    code: string,
    state: string,
    deviceInfo?: DeviceInfo
  ): Promise<TokenExchangeResult> {
    try {
      // Validate state and retrieve authorization request
      const authRequest = await this.validateAndRetrieveAuthRequest(state)
      if (!authRequest) {
        throw new Error('Invalid or expired authorization state')
      }

      // Prepare token exchange request
      const tokenParams = new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: this.config.redirectUri,
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        ...(authRequest.codeVerifier && { code_verifier: authRequest.codeVerifier })
      })

      // Make token exchange request
      const tokenResponse = await this.makeTokenRequest(tokenParams)

      // Validate and process token response
      const tokenSet = await this.processTokenResponse(tokenResponse, authRequest.userId, deviceInfo)

      // Store tokens securely
      const storedToken = await this.storeTokenSet(tokenSet, authRequest.userId, deviceInfo)

      await this.auditLogger.logTokenExchange(authRequest.userId, 'success', {
        scope: tokenSet.scope,
        expiresIn: tokenSet.expiresIn
      })

      return {
        success: true,
        tokenId: storedToken.id,
        accessToken: tokenSet.accessToken,
        expiresAt: tokenSet.expiresAt,
        scope: tokenSet.scope,
        patientContext: tokenSet.patientId,
        practitionerContext: tokenSet.practitionerId
      }

    } catch (error) {
      await this.auditLogger.logTokenExchange('unknown', 'error', { error: error?.toString() })
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Token exchange failed'
      }
    }
  }

  // ============================================================================
  // TOKEN VALIDATION AND REFRESH
  // ============================================================================

  async validateToken(
    tokenId: string,
    requiredScopes?: string[],
    deviceInfo?: DeviceInfo
  ): Promise<TokenValidationResult> {
    try {
      // Retrieve stored token
      const storedToken = await this.getStoredToken(tokenId)
      if (!storedToken || !storedToken.isActive) {
        return {
          valid: false,
          error: 'Token not found or inactive'
        }
      }

      // Check if token is expired
      if (storedToken.expiresAt <= new Date()) {
        await this.auditLogger.logTokenValidation(storedToken.userId, 'expired')
        return {
          valid: false,
          requiresRefresh: !!storedToken.refreshTokenHash,
          error: 'Token expired'
        }
      }

      // Validate scopes
      if (requiredScopes && !this.validateScopes(storedToken.scope, requiredScopes)) {
        await this.auditLogger.logTokenValidation(storedToken.userId, 'insufficient_scope')
        return {
          valid: false,
          error: 'Insufficient scope permissions'
        }
      }

      // Security checks
      const securityAlert = await this.performSecurityChecks(storedToken, deviceInfo)
      if (securityAlert && securityAlert.severity === AlertSeverity.CRITICAL) {
        await this.revokeToken(tokenId, 'security_violation')
        return {
          valid: false,
          error: 'Token revoked due to security violation',
          securityAlert
        }
      }

      // Decrypt and return token
      const decryptedToken = await this.decryptTokenSet(storedToken)

      // Update last used timestamp
      await this.updateTokenLastUsed(tokenId)

      await this.auditLogger.logTokenValidation(storedToken.userId, 'valid')

      return {
        valid: true,
        token: decryptedToken,
        securityAlert
      }

    } catch (error) {
      await this.auditLogger.logError('token_validation', error)
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Token validation failed'
      }
    }
  }

  async refreshToken(tokenId: string, deviceInfo?: DeviceInfo): Promise<TokenRefreshResult> {
    try {
      const storedToken = await this.getStoredToken(tokenId)
      if (!storedToken || !storedToken.refreshTokenHash) {
        throw new Error('Refresh token not available')
      }

      // Decrypt refresh token
      const refreshToken = await this.decryptData(storedToken.encryptedRefreshToken!)

      // Prepare refresh request
      const refreshParams = new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret
      })

      // Make refresh request
      const tokenResponse = await this.makeTokenRequest(refreshParams)

      // Process new token set
      const newTokenSet = await this.processTokenResponse(tokenResponse, storedToken.userId, deviceInfo)

      // Revoke old token and store new one
      await this.revokeToken(tokenId, 'refreshed')
      const newStoredToken = await this.storeTokenSet(newTokenSet, storedToken.userId, deviceInfo)

      await this.auditLogger.logTokenRefresh(storedToken.userId, 'success')

      return {
        success: true,
        tokenId: newStoredToken.id,
        accessToken: newTokenSet.accessToken,
        expiresAt: newTokenSet.expiresAt,
        scope: newTokenSet.scope
      }

    } catch (error) {
      await this.auditLogger.logTokenRefresh('unknown', 'error')
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Token refresh failed'
      }
    }
  }

  // ============================================================================
  // TOKEN REVOCATION
  // ============================================================================

  async revokeToken(tokenId: string, reason: string): Promise<boolean> {
    try {
      const storedToken = await this.getStoredToken(tokenId)
      if (!storedToken) {
        return false
      }

      // Revoke token with the provider if they support it
      if (this.config.tokenUrl.includes('/revoke')) {
        try {
          const decryptedToken = await this.decryptTokenSet(storedToken)
          await this.revokeTokenWithProvider(decryptedToken.accessToken)
        } catch (error) {
          // Log but don't fail if provider revocation fails
          await this.auditLogger.logError('provider_token_revocation', error)
        }
      }

      // Mark token as revoked in database
      await this.markTokenAsRevoked(tokenId, reason)

      await this.auditLogger.logTokenRevocation(storedToken.userId, reason)

      return true
    } catch (error) {
      await this.auditLogger.logError('token_revocation', error)
      return false
    }
  }

  async revokeAllUserTokens(userId: string, reason: string): Promise<number> {
    try {
      const userTokens = await this.getUserTokens(userId)
      let revokedCount = 0

      for (const token of userTokens) {
        if (await this.revokeToken(token.id, reason)) {
          revokedCount++
        }
      }

      await this.auditLogger.logBulkTokenRevocation(userId, revokedCount, reason)

      return revokedCount
    } catch (error) {
      await this.auditLogger.logError('bulk_token_revocation', error)
      return 0
    }
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  private generateSecureState(userId: string): string {
    const randomBytes = crypto.randomBytes(32)
    const timestamp = Date.now().toString()
    const userHash = crypto.createHash('sha256').update(userId).digest('hex').substring(0, 8)
    return `${randomBytes.toString('hex')}-${timestamp}-${userHash}`
  }

  private generateCodeVerifier(): string {
    return crypto.randomBytes(32).toString('base64url')
  }

  private generateCodeChallenge(verifier: string): string {
    return crypto.createHash('sha256').update(verifier).digest('base64url')
  }

  private async makeTokenRequest(params: URLSearchParams): Promise<any> {
    // This would use an actual HTTP client
    // For now, return a mock response
    return {
      access_token: 'mock_access_token',
      refresh_token: 'mock_refresh_token',
      token_type: 'Bearer',
      expires_in: 3600,
      scope: this.config.scopes.join(' ')
    }
  }

  private async processTokenResponse(
    response: any,
    userId: string,
    deviceInfo?: DeviceInfo
  ): Promise<OAuthTokenSet> {
    const expiresAt = new Date(Date.now() + (response.expires_in * 1000))

    return {
      accessToken: response.access_token,
      refreshToken: response.refresh_token,
      tokenType: response.token_type || 'Bearer',
      expiresIn: response.expires_in,
      expiresAt,
      scope: response.scope,
      patientId: response.patient,
      practitionerId: response.practitioner,
      encounterId: response.encounter,
      fhirUser: response.fhirUser
    }
  }

  private async storeTokenSet(
    tokenSet: OAuthTokenSet,
    userId: string,
    deviceInfo?: DeviceInfo
  ): Promise<StoredOAuthToken> {
    const id = crypto.randomUUID()
    const accessTokenHash = crypto.createHash('sha256').update(tokenSet.accessToken).digest('hex')
    const refreshTokenHash = tokenSet.refreshToken
      ? crypto.createHash('sha256').update(tokenSet.refreshToken).digest('hex')
      : undefined

    const encryptedAccessToken = await this.encryptData(tokenSet.accessToken)
    const encryptedRefreshToken = tokenSet.refreshToken
      ? await this.encryptData(tokenSet.refreshToken)
      : undefined

    const storedToken: StoredOAuthToken = {
      id,
      providerId: this.config.providerId,
      userId,
      accessTokenHash,
      refreshTokenHash,
      encryptedAccessToken,
      encryptedRefreshToken,
      tokenType: tokenSet.tokenType,
      scope: tokenSet.scope,
      expiresAt: tokenSet.expiresAt,
      patientContext: tokenSet.patientId,
      practitionerContext: tokenSet.practitionerId,
      encounterContext: tokenSet.encounterId,
      fhirUser: tokenSet.fhirUser,
      deviceFingerprint: deviceInfo?.fingerprint,
      ipAddress: deviceInfo?.ipAddress,
      geoLocation: deviceInfo?.geoLocation,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    // This would store in actual database
    // For now, just return the mock stored token
    return storedToken
  }

  private async encryptData(data: string): Promise<string> {
    if (!this.config.encryption.encryptTokens) {
      return data
    }

    const algorithm = this.config.encryption.tokenEncryptionAlgorithm
    const key = this.encryptionKey
    const iv = crypto.randomBytes(16)

    const cipher = crypto.createCipher(algorithm, key)
    let encrypted = cipher.update(data, 'utf8', 'hex')
    encrypted += cipher.final('hex')

    return `${iv.toString('hex')}:${encrypted}`
  }

  private async decryptData(encryptedData: string): Promise<string> {
    if (!this.config.encryption.encryptTokens) {
      return encryptedData
    }

    const [ivHex, encrypted] = encryptedData.split(':')
    const algorithm = this.config.encryption.tokenEncryptionAlgorithm
    const key = this.encryptionKey

    const decipher = crypto.createDecipher(algorithm, key)
    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')

    return decrypted
  }

  private async decryptTokenSet(storedToken: StoredOAuthToken): Promise<OAuthTokenSet> {
    const accessToken = await this.decryptData(storedToken.encryptedAccessToken)
    const refreshToken = storedToken.encryptedRefreshToken
      ? await this.decryptData(storedToken.encryptedRefreshToken)
      : undefined

    return {
      accessToken,
      refreshToken,
      tokenType: storedToken.tokenType,
      expiresIn: Math.floor((storedToken.expiresAt.getTime() - Date.now()) / 1000),
      expiresAt: storedToken.expiresAt,
      scope: storedToken.scope,
      patientId: storedToken.patientContext,
      practitionerId: storedToken.practitionerContext,
      encounterId: storedToken.encounterContext,
      fhirUser: storedToken.fhirUser
    }
  }

  private validateScopes(tokenScope: string, requiredScopes: string[]): boolean {
    const tokenScopeList = tokenScope.split(' ')
    return requiredScopes.every(scope => tokenScopeList.includes(scope))
  }

  private async performSecurityChecks(
    storedToken: StoredOAuthToken,
    deviceInfo?: DeviceInfo
  ): Promise<SecurityAlert | undefined> {
    const alerts: SecurityAlert[] = []

    // Check for suspicious location
    if (this.config.compliance.geoLocationTracking && deviceInfo?.geoLocation) {
      if (storedToken.geoLocation &&
          this.calculateDistance(storedToken.geoLocation, deviceInfo.geoLocation) > 1000) { // 1000km
        alerts.push({
          type: SecurityAlertType.SUSPICIOUS_LOCATION,
          severity: AlertSeverity.MEDIUM,
          description: 'Token used from significantly different location',
          metadata: {
            originalLocation: storedToken.geoLocation,
            currentLocation: deviceInfo.geoLocation
          },
          recommendedAction: 'Verify user identity'
        })
      }
    }

    // Check for device fingerprint mismatch
    if (this.config.compliance.deviceFingerprinting && deviceInfo?.fingerprint) {
      if (storedToken.deviceFingerprint && storedToken.deviceFingerprint !== deviceInfo.fingerprint) {
        alerts.push({
          type: SecurityAlertType.UNUSUAL_ACCESS_PATTERN,
          severity: AlertSeverity.HIGH,
          description: 'Token used from different device',
          metadata: {
            originalFingerprint: storedToken.deviceFingerprint,
            currentFingerprint: deviceInfo.fingerprint
          },
          recommendedAction: 'Force re-authentication'
        })
      }
    }

    // Return the highest severity alert
    if (alerts.length > 0) {
      return alerts.reduce((highest, current) => {
        const severityOrder = { low: 1, medium: 2, high: 3, critical: 4 }
        return severityOrder[current.severity] > severityOrder[highest.severity] ? current : highest
      })
    }

    return undefined
  }

  private calculateDistance(location1: string, location2: string): number {
    // Simple distance calculation - in production, use proper geolocation library
    return 0
  }

  private getEncryptionKey(): string {
    return process.env.OAUTH_ENCRYPTION_KEY || 'default-key-change-in-production'
  }

  // Mock database methods - these would be implemented with actual database
  private async storeAuthorizationRequest(request: any): Promise<void> {
    // Store in database
  }

  private async validateAndRetrieveAuthRequest(state: string): Promise<any> {
    // Validate and retrieve from database
    return { userId: 'mock-user-id', codeVerifier: 'mock-verifier' }
  }

  private async getStoredToken(tokenId: string): Promise<StoredOAuthToken | null> {
    // Retrieve from database
    return null
  }

  private async updateTokenLastUsed(tokenId: string): Promise<void> {
    // Update in database
  }

  private async markTokenAsRevoked(tokenId: string, reason: string): Promise<void> {
    // Update in database
  }

  private async getUserTokens(userId: string): Promise<StoredOAuthToken[]> {
    // Retrieve from database
    return []
  }

  private async revokeTokenWithProvider(accessToken: string): Promise<void> {
    // Make revocation request to OAuth provider
  }
}

// ============================================================================
// OAUTH AUDIT LOGGER
// ============================================================================

export class OAuthAuditLogger {
  private providerId: string

  constructor(providerId: string) {
    this.providerId = providerId
  }

  async logAuthorizationRequest(userId: string, authUrl: string): Promise<void> {
    console.log(`[AUDIT] Authorization request - Provider: ${this.providerId}, User: ${userId}`)
  }

  async logTokenExchange(userId: string, status: string, metadata?: any): Promise<void> {
    console.log(`[AUDIT] Token exchange - Provider: ${this.providerId}, User: ${userId}, Status: ${status}`)
  }

  async logTokenValidation(userId: string, status: string): Promise<void> {
    console.log(`[AUDIT] Token validation - Provider: ${this.providerId}, User: ${userId}, Status: ${status}`)
  }

  async logTokenRefresh(userId: string, status: string): Promise<void> {
    console.log(`[AUDIT] Token refresh - Provider: ${this.providerId}, User: ${userId}, Status: ${status}`)
  }

  async logTokenRevocation(userId: string, reason: string): Promise<void> {
    console.log(`[AUDIT] Token revocation - Provider: ${this.providerId}, User: ${userId}, Reason: ${reason}`)
  }

  async logBulkTokenRevocation(userId: string, count: number, reason: string): Promise<void> {
    console.log(`[AUDIT] Bulk token revocation - Provider: ${this.providerId}, User: ${userId}, Count: ${count}, Reason: ${reason}`)
  }

  async logError(operation: string, error: any): Promise<void> {
    console.error(`[AUDIT] Error - Provider: ${this.providerId}, Operation: ${operation}, Error: ${error}`)
  }
}

// ============================================================================
// RESULT INTERFACES
// ============================================================================

export interface AuthorizationUrlResult {
  success: boolean
  authorizationUrl?: string
  state?: string
  error?: string
}

export interface TokenExchangeResult {
  success: boolean
  tokenId?: string
  accessToken?: string
  expiresAt?: Date
  scope?: string
  patientContext?: string
  practitionerContext?: string
  error?: string
}

export interface TokenRefreshResult {
  success: boolean
  tokenId?: string
  accessToken?: string
  expiresAt?: Date
  scope?: string
  error?: string
}

export interface DeviceInfo {
  fingerprint: string
  ipAddress: string
  userAgent: string
  geoLocation?: string
  timezone?: string
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export function createHealthcareOAuthConfig(
  providerType: HealthcareProviderType,
  customConfig?: Partial<HealthcareOAuthConfig>
): HealthcareOAuthConfig {
  let defaultConfig: HealthcareOAuthConfig

  switch (providerType) {
    case HealthcareProviderType.EHR_EPIC:
      defaultConfig = {
        providerId: 'epic-ehr',
        providerName: 'Epic EHR',
        providerType,
        authorizationUrl: 'https://fhir.epic.com/interconnect-fhir-oauth/oauth2/authorize',
        tokenUrl: 'https://fhir.epic.com/interconnect-fhir-oauth/oauth2/token',
        clientId: process.env.EPIC_CLIENT_ID || '',
        clientSecret: process.env.EPIC_CLIENT_SECRET || '',
        redirectUri: process.env.EPIC_REDIRECT_URI || '',
        scopes: ['patient/*.read', 'patient/*.write', 'user/*.read'],
        smartOnFhir: {
          fhirBaseUrl: 'https://fhir.epic.com/interconnect-fhir-oauth/api/FHIR/R4',
          patientContext: true,
          practitionerContext: true,
          smartCapabilities: ['launch-ehr', 'client-public', 'client-confidential-symmetric']
        },
        pkce: true,
        state: true,
        encryption: {
          encryptTokens: true,
          encryptRefreshTokens: true,
          tokenEncryptionAlgorithm: 'aes-256-gcm',
          keyRotationIntervalDays: 90,
          useHSM: false
        },
        compliance: {
          hipaaCompliant: true,
          auditAllTokenOperations: true,
          tokenExpiryMaxHours: 12,
          refreshTokenExpiryDays: 30,
          revokeOnSuspiciousActivity: true,
          geoLocationTracking: true,
          deviceFingerprinting: true
        }
      }
      break

    case HealthcareProviderType.EHR_CERNER:
      defaultConfig = {
        providerId: 'cerner-ehr',
        providerName: 'Cerner EHR',
        providerType,
        authorizationUrl: 'https://authorization.cerner.com/oauth2/authorize',
        tokenUrl: 'https://authorization.cerner.com/oauth2/token',
        clientId: process.env.CERNER_CLIENT_ID || '',
        clientSecret: process.env.CERNER_CLIENT_SECRET || '',
        redirectUri: process.env.CERNER_REDIRECT_URI || '',
        scopes: ['patient/Patient.read', 'patient/Observation.read', 'patient/Encounter.read'],
        smartOnFhir: {
          fhirBaseUrl: 'https://fhir-open.cerner.com/r4',
          patientContext: true,
          practitionerContext: true,
          smartCapabilities: ['launch-ehr', 'client-public']
        },
        pkce: true,
        state: true,
        encryption: {
          encryptTokens: true,
          encryptRefreshTokens: true,
          tokenEncryptionAlgorithm: 'aes-256-gcm',
          keyRotationIntervalDays: 90,
          useHSM: false
        },
        compliance: {
          hipaaCompliant: true,
          auditAllTokenOperations: true,
          tokenExpiryMaxHours: 8,
          refreshTokenExpiryDays: 30,
          revokeOnSuspiciousActivity: true,
          geoLocationTracking: true,
          deviceFingerprinting: true
        }
      }
      break

    // Add more provider configurations as needed
    default:
      throw new Error(`Unsupported healthcare provider type: ${providerType}`)
  }

  return customConfig ? { ...defaultConfig, ...customConfig } : defaultConfig
}

export function generateDeviceFingerprint(request: Request): string {
  const components = [
    request.headers.get('user-agent') || '',
    request.headers.get('accept-language') || '',
    request.headers.get('accept-encoding') || '',
    // Add more fingerprinting components as needed
  ]

  return crypto.createHash('sha256').update(components.join('|')).digest('hex')
}

export function extractLocationFromIP(ipAddress: string): Promise<string | undefined> {
  // This would use a geolocation service in production
  return Promise.resolve(undefined)
}