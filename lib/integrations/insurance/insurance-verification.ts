/**
 * Real-time Insurance Verification System
 *
 * HIPAA-compliant insurance eligibility verification and prior authorization
 * for APCTC healthcare operations with behavioral health specialization
 */

import { z } from 'zod'
import {
  BaseHealthcareIntegration,
  HealthcareIntegrationConfig,
  HealthcareSystemType,
  AuthenticationResult,
  ConnectionResult,
  HealthStatus,
  SecureResponse
} from '../healthcare-base'

// ============================================================================
// INSURANCE VERIFICATION TYPES
// ============================================================================

export interface InsuranceVerificationRequest {
  patientId: string
  memberId: string
  memberFirstName: string
  memberLastName: string
  memberDateOfBirth: string
  memberGender?: 'M' | 'F' | 'U'
  subscriberId?: string
  subscriberFirstName?: string
  subscriberLastName?: string
  subscriberRelationship?: InsuranceRelationship
  payerNPI?: string
  payerName?: string
  planName?: string
  groupNumber?: string
  serviceDate: string
  serviceTypes: HealthcareServiceType[]
  providerId: string
  providerNPI: string
  facilityNPI?: string
  requestId?: string
}

export interface InsuranceVerificationResponse {
  requestId: string
  patientId: string
  verificationDate: string
  eligibilityStatus: EligibilityStatus
  coverageDetails: CoverageDetails
  benefits: BenefitInformation[]
  priorAuthorizationRequired: boolean
  priorAuthorizationDetails?: PriorAuthorizationInfo
  copayAmount?: number
  deductibleRemaining?: number
  outOfPocketMax?: number
  outOfPocketRemaining?: number
  networkStatus: NetworkStatus
  planLimitations?: PlanLimitation[]
  errors?: VerificationError[]
  warnings?: VerificationWarning[]
  rawResponse?: any
}

export interface CoverageDetails {
  isActive: boolean
  effectiveDate: string
  terminationDate?: string
  planType: InsurancePlanType
  planName: string
  payerName: string
  payerId: string
  groupNumber?: string
  memberNumber: string
  subscriberId: string
  subscriberName: string
  relationshipToSubscriber: InsuranceRelationship
}

export interface BenefitInformation {
  serviceType: HealthcareServiceType
  serviceCategory: ServiceCategory
  benefitType: BenefitType
  networkStatus: NetworkStatus
  coverageLevel: CoverageLevel
  timePeriod: TimePeriod
  monetary?: MonetaryAmount
  quantity?: QuantityLimit
  percent?: number
  authorizationRequired: boolean
  priorAuthorizationRequired: boolean
  referralRequired: boolean
  restrictions?: string[]
}

export interface PriorAuthorizationInfo {
  required: boolean
  serviceTypes: HealthcareServiceType[]
  submissionDeadline?: string
  reviewTimeframe?: string
  contactInfo?: ContactInformation
  onlinePortal?: string
  requiredDocuments?: string[]
  cptCodes?: string[]
}

export interface MonetaryAmount {
  amount: number
  currency: string
  type: MonetaryType
  period?: TimePeriod
  remaining?: number
}

export interface QuantityLimit {
  value: number
  unit: QuantityUnit
  period?: TimePeriod
  remaining?: number
  unlimited?: boolean
}

export interface PlanLimitation {
  serviceType: HealthcareServiceType
  limitationType: LimitationType
  description: string
  effectiveDate?: string
  expirationDate?: string
  monetary?: MonetaryAmount
  quantity?: QuantityLimit
}

export interface ContactInformation {
  name?: string
  phone?: string
  fax?: string
  email?: string
  address?: string
  website?: string
  hours?: string
}

export interface VerificationError {
  code: string
  message: string
  severity: ErrorSeverity
  field?: string
}

export interface VerificationWarning {
  code: string
  message: string
  field?: string
}

// ============================================================================
// ENUMS
// ============================================================================

export enum EligibilityStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending',
  SUSPENDED = 'suspended',
  TERMINATED = 'terminated',
  UNKNOWN = 'unknown'
}

export enum InsurancePlanType {
  HMO = 'hmo',
  PPO = 'ppo',
  EPO = 'epo',
  POS = 'pos',
  MEDICARE = 'medicare',
  MEDICAID = 'medicaid',
  COMMERCIAL = 'commercial',
  SELF_PAY = 'self_pay',
  OTHER = 'other'
}

export enum InsuranceRelationship {
  SELF = 'self',
  SPOUSE = 'spouse',
  CHILD = 'child',
  DEPENDENT = 'dependent',
  EMPLOYEE = 'employee',
  OTHER = 'other'
}

export enum HealthcareServiceType {
  // Mental Health Services (APCTC Core)
  MENTAL_HEALTH_OUTPATIENT = 'mental_health_outpatient',
  MENTAL_HEALTH_INTENSIVE = 'mental_health_intensive',
  PSYCHOLOGICAL_TESTING = 'psychological_testing',
  PSYCHIATRIC_SERVICES = 'psychiatric_services',
  CRISIS_INTERVENTION = 'crisis_intervention',

  // Substance Abuse Services
  SUBSTANCE_ABUSE_OUTPATIENT = 'substance_abuse_outpatient',
  SUBSTANCE_ABUSE_INTENSIVE = 'substance_abuse_intensive',
  SUBSTANCE_ABUSE_DETOX = 'substance_abuse_detox',
  MEDICATION_ASSISTED_TREATMENT = 'medication_assisted_treatment',

  // Case Management
  CASE_MANAGEMENT = 'case_management',
  CARE_COORDINATION = 'care_coordination',
  SOCIAL_SERVICES = 'social_services',

  // Medical Services
  PRIMARY_CARE = 'primary_care',
  PREVENTIVE_CARE = 'preventive_care',
  MEDICAL_CONSULTATION = 'medical_consultation',

  // Telehealth
  TELEHEALTH_MENTAL_HEALTH = 'telehealth_mental_health',
  TELEHEALTH_PRIMARY_CARE = 'telehealth_primary_care',

  // Other
  OFFICE_VISIT = 'office_visit',
  CONSULTATION = 'consultation',
  EMERGENCY = 'emergency'
}

export enum ServiceCategory {
  BEHAVIORAL_HEALTH = 'behavioral_health',
  MEDICAL = 'medical',
  PREVENTIVE = 'preventive',
  EMERGENCY = 'emergency',
  PHARMACY = 'pharmacy',
  ANCILLARY = 'ancillary'
}

export enum BenefitType {
  COPAY = 'copay',
  COINSURANCE = 'coinsurance',
  DEDUCTIBLE = 'deductible',
  OUT_OF_POCKET_MAXIMUM = 'out_of_pocket_maximum',
  VISIT_LIMIT = 'visit_limit',
  DOLLAR_LIMIT = 'dollar_limit',
  COVERAGE = 'coverage'
}

export enum NetworkStatus {
  IN_NETWORK = 'in_network',
  OUT_OF_NETWORK = 'out_of_network',
  UNKNOWN = 'unknown'
}

export enum CoverageLevel {
  INDIVIDUAL = 'individual',
  FAMILY = 'family',
  EMPLOYEE_PLUS_ONE = 'employee_plus_one',
  EMPLOYEE_PLUS_CHILDREN = 'employee_plus_children'
}

export enum TimePeriod {
  VISIT = 'visit',
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
  QUARTER = 'quarter',
  YEAR = 'year',
  LIFETIME = 'lifetime'
}

export enum MonetaryType {
  COPAY = 'copay',
  COINSURANCE = 'coinsurance',
  DEDUCTIBLE = 'deductible',
  OUT_OF_POCKET = 'out_of_pocket',
  BENEFIT_AMOUNT = 'benefit_amount',
  MAXIMUM = 'maximum'
}

export enum QuantityUnit {
  VISITS = 'visits',
  DAYS = 'days',
  SESSIONS = 'sessions',
  PROCEDURES = 'procedures',
  UNITS = 'units'
}

export enum LimitationType {
  VISIT_LIMIT = 'visit_limit',
  SESSION_LIMIT = 'session_limit',
  DOLLAR_LIMIT = 'dollar_limit',
  TIME_LIMIT = 'time_limit',
  FREQUENCY_LIMIT = 'frequency_limit',
  AGE_LIMIT = 'age_limit'
}

export enum ErrorSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

export const InsuranceVerificationRequestSchema = z.object({
  patientId: z.string().min(1),
  memberId: z.string().min(1),
  memberFirstName: z.string().min(1),
  memberLastName: z.string().min(1),
  memberDateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  memberGender: z.enum(['M', 'F', 'U']).optional(),
  subscriberId: z.string().optional(),
  subscriberFirstName: z.string().optional(),
  subscriberLastName: z.string().optional(),
  subscriberRelationship: z.nativeEnum(InsuranceRelationship).optional(),
  payerNPI: z.string().optional(),
  payerName: z.string().optional(),
  planName: z.string().optional(),
  groupNumber: z.string().optional(),
  serviceDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  serviceTypes: z.array(z.nativeEnum(HealthcareServiceType)).min(1),
  providerId: z.string().min(1),
  providerNPI: z.string().min(1),
  facilityNPI: z.string().optional(),
  requestId: z.string().optional()
})

// ============================================================================
// INSURANCE PROVIDER CONFIGURATIONS
// ============================================================================

export interface InsuranceProviderConfig {
  providerId: string
  providerName: string
  apiEndpoint: string
  apiVersion: string
  authentication: InsuranceAuthConfig
  supportedTransactions: InsuranceTransaction[]
  responseFormat: ResponseFormat
  rateLimiting: InsuranceRateLimit
  testMode: boolean
}

export interface InsuranceAuthConfig {
  type: 'api-key' | 'oauth2' | 'mutual-tls'
  apiKey?: string
  oauth2?: {
    clientId: string
    clientSecret: string
    tokenUrl: string
    scopes: string[]
  }
  mtls?: {
    clientCert: string
    clientKey: string
    caCert: string
  }
}

export interface InsuranceRateLimit {
  requestsPerMinute: number
  dailyLimit: number
  burstLimit: number
  backoffStrategy: 'linear' | 'exponential'
}

export enum InsuranceTransaction {
  ELIGIBILITY_INQUIRY = '270',
  ELIGIBILITY_RESPONSE = '271',
  CLAIM_STATUS_INQUIRY = '276',
  CLAIM_STATUS_RESPONSE = '277',
  PRIOR_AUTHORIZATION_REQUEST = '278',
  PRIOR_AUTHORIZATION_RESPONSE = '279'
}

export enum ResponseFormat {
  X12_EDI = 'x12_edi',
  JSON = 'json',
  XML = 'xml',
  HL7_FHIR = 'hl7_fhir'
}

// ============================================================================
// INSURANCE VERIFICATION CLIENT
// ============================================================================

export class InsuranceVerificationClient extends BaseHealthcareIntegration {
  private providerConfig: InsuranceProviderConfig
  private cacheManager: InsuranceCacheManager

  constructor(
    config: HealthcareIntegrationConfig,
    providerConfig: InsuranceProviderConfig
  ) {
    super(config)
    this.providerConfig = providerConfig
    this.cacheManager = new InsuranceCacheManager()
  }

  async authenticate(): Promise<AuthenticationResult> {
    try {
      switch (this.providerConfig.authentication.type) {
        case 'api-key':
          return await this.authenticateApiKey()
        case 'oauth2':
          return await this.authenticateOAuth2()
        case 'mutual-tls':
          return await this.authenticateMutualTLS()
        default:
          throw new Error(`Unsupported authentication type: ${this.providerConfig.authentication.type}`)
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Authentication failed'
      }
    }
  }

  async testConnection(): Promise<ConnectionResult> {
    const startTime = Date.now()

    try {
      // Make a simple test request
      const testRequest: InsuranceVerificationRequest = {
        patientId: 'test-patient',
        memberId: 'test-member',
        memberFirstName: 'Test',
        memberLastName: 'Patient',
        memberDateOfBirth: '1980-01-01',
        serviceDate: new Date().toISOString().split('T')[0],
        serviceTypes: [HealthcareServiceType.MENTAL_HEALTH_OUTPATIENT],
        providerId: 'test-provider',
        providerNPI: '1234567890',
        requestId: 'test-connection'
      }

      const response = await this.verifyEligibility(testRequest)
      const endTime = Date.now()
      const latency = endTime - startTime

      return {
        connected: response.success,
        latency,
        serverVersion: this.providerConfig.apiVersion
      }
    } catch (error) {
      const endTime = Date.now()
      const latency = endTime - startTime

      return {
        connected: false,
        latency,
        error: error instanceof Error ? error.message : 'Connection test failed'
      }
    }
  }

  async getHealthStatus(): Promise<HealthStatus> {
    const connectionResult = await this.testConnection()

    return {
      healthy: connectionResult.connected,
      lastChecked: new Date(),
      responseTime: connectionResult.latency || 0,
      errorRate: connectionResult.connected ? 0 : 100,
      uptime: connectionResult.connected ? 100 : 0
    }
  }

  // ============================================================================
  // CORE VERIFICATION METHODS
  // ============================================================================

  async verifyEligibility(
    request: InsuranceVerificationRequest
  ): Promise<SecureResponse<InsuranceVerificationResponse>> {
    try {
      // Validate request
      const validation = InsuranceVerificationRequestSchema.safeParse(request)
      if (!validation.success) {
        throw new Error(`Invalid request: ${validation.error.message}`)
      }

      // Check cache first
      const cachedResult = await this.cacheManager.getCachedVerification(request)
      if (cachedResult) {
        return {
          success: true,
          data: cachedResult,
          metadata: {
            requestId: request.requestId || crypto.randomUUID(),
            duration: 0,
            timestamp: new Date(),
            endpoint: 'cache'
          }
        }
      }

      // Prepare verification request based on provider format
      const providerRequest = await this.prepareProviderRequest(request)

      // Make secure request to insurance provider
      const response = await this.makeSecureRequest<any>(
        '/eligibility',
        'POST',
        providerRequest,
        {
          'Content-Type': this.getContentType(),
          'X-Patient-ID': request.patientId,
          'X-Request-ID': request.requestId || crypto.randomUUID()
        }
      )

      if (!response.success) {
        throw new Error('Insurance verification request failed')
      }

      // Parse provider response
      const verificationResponse = await this.parseProviderResponse(response.data, request)

      // Cache successful response
      await this.cacheManager.cacheVerification(request, verificationResponse)

      return {
        success: true,
        data: verificationResponse,
        metadata: response.metadata
      }

    } catch (error) {
      // Create error response
      const errorResponse: InsuranceVerificationResponse = {
        requestId: request.requestId || crypto.randomUUID(),
        patientId: request.patientId,
        verificationDate: new Date().toISOString(),
        eligibilityStatus: EligibilityStatus.UNKNOWN,
        coverageDetails: this.createEmptyCoverageDetails(request),
        benefits: [],
        priorAuthorizationRequired: false,
        networkStatus: NetworkStatus.UNKNOWN,
        errors: [{
          code: 'VERIFICATION_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
          severity: ErrorSeverity.ERROR
        }]
      }

      return {
        success: false,
        data: errorResponse,
        metadata: {
          requestId: request.requestId || crypto.randomUUID(),
          duration: 0,
          timestamp: new Date(),
          endpoint: '/eligibility'
        }
      }
    }
  }

  async checkPriorAuthorization(
    request: PriorAuthorizationRequest
  ): Promise<SecureResponse<PriorAuthorizationResponse>> {
    try {
      const providerRequest = await this.preparePriorAuthRequest(request)

      const response = await this.makeSecureRequest<any>(
        '/prior-authorization',
        'POST',
        providerRequest,
        {
          'Content-Type': this.getContentType(),
          'X-Patient-ID': request.patientId,
          'X-Request-ID': request.requestId || crypto.randomUUID()
        }
      )

      if (!response.success) {
        throw new Error('Prior authorization request failed')
      }

      const priorAuthResponse = await this.parsePriorAuthResponse(response.data, request)

      return {
        success: true,
        data: priorAuthResponse,
        metadata: response.metadata
      }

    } catch (error) {
      const errorResponse: PriorAuthorizationResponse = {
        requestId: request.requestId || crypto.randomUUID(),
        patientId: request.patientId,
        authorizationRequired: true,
        status: PriorAuthStatus.UNKNOWN,
        submissionDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        errors: [{
          code: 'PRIOR_AUTH_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
          severity: ErrorSeverity.ERROR
        }]
      }

      return {
        success: false,
        data: errorResponse,
        metadata: {
          requestId: request.requestId || crypto.randomUUID(),
          duration: 0,
          timestamp: new Date(),
          endpoint: '/prior-authorization'
        }
      }
    }
  }

  async getBulkEligibility(
    requests: InsuranceVerificationRequest[]
  ): Promise<SecureResponse<InsuranceVerificationResponse[]>> {
    try {
      const results: InsuranceVerificationResponse[] = []
      const batchSize = 10 // Process in batches to avoid rate limits

      for (let i = 0; i < requests.length; i += batchSize) {
        const batch = requests.slice(i, i + batchSize)
        const batchPromises = batch.map(request => this.verifyEligibility(request))
        const batchResults = await Promise.allSettled(batchPromises)

        for (const result of batchResults) {
          if (result.status === 'fulfilled' && result.value.success) {
            results.push(result.value.data)
          } else {
            // Add error result for failed verification
            const failedRequest = batch[batchResults.indexOf(result)]
            results.push({
              requestId: failedRequest.requestId || crypto.randomUUID(),
              patientId: failedRequest.patientId,
              verificationDate: new Date().toISOString(),
              eligibilityStatus: EligibilityStatus.UNKNOWN,
              coverageDetails: this.createEmptyCoverageDetails(failedRequest),
              benefits: [],
              priorAuthorizationRequired: false,
              networkStatus: NetworkStatus.UNKNOWN,
              errors: [{
                code: 'BULK_VERIFICATION_ERROR',
                message: 'Failed to verify eligibility',
                severity: ErrorSeverity.ERROR
              }]
            })
          }
        }

        // Add delay between batches to respect rate limits
        if (i + batchSize < requests.length) {
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      }

      return {
        success: true,
        data: results,
        metadata: {
          requestId: crypto.randomUUID(),
          duration: 0,
          timestamp: new Date(),
          endpoint: '/bulk-eligibility'
        }
      }

    } catch (error) {
      return {
        success: false,
        data: [],
        metadata: {
          requestId: crypto.randomUUID(),
          duration: 0,
          timestamp: new Date(),
          endpoint: '/bulk-eligibility'
        }
      }
    }
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  private async authenticateApiKey(): Promise<AuthenticationResult> {
    const apiKey = this.providerConfig.authentication.apiKey
    if (!apiKey) {
      throw new Error('API key is required')
    }

    return {
      success: true,
      token: apiKey,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    }
  }

  private async authenticateOAuth2(): Promise<AuthenticationResult> {
    const oauth2Config = this.providerConfig.authentication.oauth2
    if (!oauth2Config) {
      throw new Error('OAuth2 configuration is required')
    }

    // This would implement actual OAuth2 flow
    return {
      success: true,
      token: 'oauth2-token',
      expiresAt: new Date(Date.now() + 60 * 60 * 1000) // 1 hour
    }
  }

  private async authenticateMutualTLS(): Promise<AuthenticationResult> {
    const mtlsConfig = this.providerConfig.authentication.mtls
    if (!mtlsConfig) {
      throw new Error('Mutual TLS configuration is required')
    }

    // This would implement mTLS authentication
    return {
      success: true,
      token: 'mtls-session',
      expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000) // 8 hours
    }
  }

  private async prepareProviderRequest(request: InsuranceVerificationRequest): Promise<any> {
    switch (this.providerConfig.responseFormat) {
      case ResponseFormat.X12_EDI:
        return this.createX12EligibilityRequest(request)
      case ResponseFormat.JSON:
        return this.createJSONEligibilityRequest(request)
      case ResponseFormat.XML:
        return this.createXMLEligibilityRequest(request)
      case ResponseFormat.HL7_FHIR:
        return this.createFHIREligibilityRequest(request)
      default:
        throw new Error(`Unsupported response format: ${this.providerConfig.responseFormat}`)
    }
  }

  private createJSONEligibilityRequest(request: InsuranceVerificationRequest): any {
    return {
      transaction_type: '270',
      member: {
        id: request.memberId,
        first_name: request.memberFirstName,
        last_name: request.memberLastName,
        date_of_birth: request.memberDateOfBirth,
        gender: request.memberGender
      },
      subscriber: {
        id: request.subscriberId || request.memberId,
        first_name: request.subscriberFirstName || request.memberFirstName,
        last_name: request.subscriberLastName || request.memberLastName,
        relationship: request.subscriberRelationship || InsuranceRelationship.SELF
      },
      provider: {
        id: request.providerId,
        npi: request.providerNPI
      },
      service_date: request.serviceDate,
      service_types: request.serviceTypes.map(this.mapServiceTypeToCode),
      request_id: request.requestId || crypto.randomUUID()
    }
  }

  private createX12EligibilityRequest(request: InsuranceVerificationRequest): string {
    // This would create an actual X12 270 transaction
    // For now, return a simplified mock
    return `ISA*00*          *00*          *ZZ*${request.providerId.padEnd(15)}*ZZ*${request.payerNPI?.padEnd(15) || 'PAYER'.padEnd(15)}*${new Date().toISOString().replace(/[-:]/g, '').slice(0, 8)}*${new Date().toISOString().replace(/[-:]/g, '').slice(8, 12)}*^*00501*${request.requestId?.slice(0, 9) || '000000001'}*0*T*:~`
  }

  private createXMLEligibilityRequest(request: InsuranceVerificationRequest): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
    <eligibility_request>
      <member_id>${request.memberId}</member_id>
      <member_name>
        <first>${request.memberFirstName}</first>
        <last>${request.memberLastName}</last>
      </member_name>
      <date_of_birth>${request.memberDateOfBirth}</date_of_birth>
      <service_date>${request.serviceDate}</service_date>
      <provider_npi>${request.providerNPI}</provider_npi>
    </eligibility_request>`
  }

  private createFHIREligibilityRequest(request: InsuranceVerificationRequest): any {
    return {
      resourceType: 'CoverageEligibilityRequest',
      status: 'active',
      priority: {
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/processpriority',
          code: 'normal'
        }]
      },
      patient: {
        identifier: [{
          value: request.memberId
        }],
        name: [{
          given: [request.memberFirstName],
          family: request.memberLastName
        }],
        birthDate: request.memberDateOfBirth
      },
      servicedDate: request.serviceDate,
      provider: {
        identifier: [{
          system: 'http://hl7.org/fhir/sid/us-npi',
          value: request.providerNPI
        }]
      },
      item: request.serviceTypes.map(serviceType => ({
        category: {
          coding: [{
            system: 'http://terminology.hl7.org/CodeSystem/ex-benefitcategory',
            code: this.mapServiceTypeToFHIRCategory(serviceType)
          }]
        }
      }))
    }
  }

  private async parseProviderResponse(
    response: any,
    originalRequest: InsuranceVerificationRequest
  ): Promise<InsuranceVerificationResponse> {
    switch (this.providerConfig.responseFormat) {
      case ResponseFormat.JSON:
        return this.parseJSONResponse(response, originalRequest)
      case ResponseFormat.X12_EDI:
        return this.parseX12Response(response, originalRequest)
      case ResponseFormat.XML:
        return this.parseXMLResponse(response, originalRequest)
      case ResponseFormat.HL7_FHIR:
        return this.parseFHIRResponse(response, originalRequest)
      default:
        throw new Error(`Unsupported response format: ${this.providerConfig.responseFormat}`)
    }
  }

  private parseJSONResponse(
    response: any,
    originalRequest: InsuranceVerificationRequest
  ): InsuranceVerificationResponse {
    return {
      requestId: response.request_id || originalRequest.requestId || crypto.randomUUID(),
      patientId: originalRequest.patientId,
      verificationDate: new Date().toISOString(),
      eligibilityStatus: this.mapEligibilityStatus(response.eligibility_status),
      coverageDetails: {
        isActive: response.coverage?.active === true,
        effectiveDate: response.coverage?.effective_date || '',
        terminationDate: response.coverage?.termination_date,
        planType: this.mapPlanType(response.coverage?.plan_type),
        planName: response.coverage?.plan_name || '',
        payerName: response.payer?.name || '',
        payerId: response.payer?.id || '',
        groupNumber: response.coverage?.group_number,
        memberNumber: response.member?.id || originalRequest.memberId,
        subscriberId: response.subscriber?.id || originalRequest.subscriberId || originalRequest.memberId,
        subscriberName: `${response.subscriber?.first_name || ''} ${response.subscriber?.last_name || ''}`.trim(),
        relationshipToSubscriber: this.mapRelationship(response.subscriber?.relationship)
      },
      benefits: this.mapBenefits(response.benefits || []),
      priorAuthorizationRequired: response.prior_authorization_required === true,
      priorAuthorizationDetails: response.prior_authorization ? {
        required: response.prior_authorization.required === true,
        serviceTypes: originalRequest.serviceTypes,
        submissionDeadline: response.prior_authorization.deadline,
        reviewTimeframe: response.prior_authorization.review_time,
        contactInfo: response.prior_authorization.contact,
        onlinePortal: response.prior_authorization.portal_url,
        requiredDocuments: response.prior_authorization.required_documents,
        cptCodes: response.prior_authorization.cpt_codes
      } : undefined,
      copayAmount: response.copay_amount,
      deductibleRemaining: response.deductible_remaining,
      outOfPocketMax: response.out_of_pocket_max,
      outOfPocketRemaining: response.out_of_pocket_remaining,
      networkStatus: this.mapNetworkStatus(response.network_status),
      planLimitations: this.mapPlanLimitations(response.limitations || []),
      errors: response.errors?.map((error: any) => ({
        code: error.code,
        message: error.message,
        severity: this.mapErrorSeverity(error.severity),
        field: error.field
      })) || [],
      warnings: response.warnings?.map((warning: any) => ({
        code: warning.code,
        message: warning.message,
        field: warning.field
      })) || [],
      rawResponse: response
    }
  }

  private parseX12Response(response: string, originalRequest: InsuranceVerificationRequest): InsuranceVerificationResponse {
    // This would parse an actual X12 271 response
    // For now, return a simplified mock response
    return {
      requestId: originalRequest.requestId || crypto.randomUUID(),
      patientId: originalRequest.patientId,
      verificationDate: new Date().toISOString(),
      eligibilityStatus: EligibilityStatus.ACTIVE,
      coverageDetails: this.createEmptyCoverageDetails(originalRequest),
      benefits: [],
      priorAuthorizationRequired: false,
      networkStatus: NetworkStatus.IN_NETWORK
    }
  }

  private parseXMLResponse(response: string, originalRequest: InsuranceVerificationRequest): InsuranceVerificationResponse {
    // This would parse XML response
    // For now, return a simplified mock response
    return {
      requestId: originalRequest.requestId || crypto.randomUUID(),
      patientId: originalRequest.patientId,
      verificationDate: new Date().toISOString(),
      eligibilityStatus: EligibilityStatus.ACTIVE,
      coverageDetails: this.createEmptyCoverageDetails(originalRequest),
      benefits: [],
      priorAuthorizationRequired: false,
      networkStatus: NetworkStatus.IN_NETWORK
    }
  }

  private parseFHIRResponse(response: any, originalRequest: InsuranceVerificationRequest): InsuranceVerificationResponse {
    // This would parse FHIR CoverageEligibilityResponse
    // For now, return a simplified mock response
    return {
      requestId: response.id || originalRequest.requestId || crypto.randomUUID(),
      patientId: originalRequest.patientId,
      verificationDate: response.created || new Date().toISOString(),
      eligibilityStatus: this.mapFHIREligibilityStatus(response.outcome),
      coverageDetails: this.createEmptyCoverageDetails(originalRequest),
      benefits: [],
      priorAuthorizationRequired: false,
      networkStatus: NetworkStatus.IN_NETWORK
    }
  }

  private getContentType(): string {
    switch (this.providerConfig.responseFormat) {
      case ResponseFormat.JSON:
        return 'application/json'
      case ResponseFormat.XML:
        return 'application/xml'
      case ResponseFormat.X12_EDI:
        return 'application/edi-x12'
      case ResponseFormat.HL7_FHIR:
        return 'application/fhir+json'
      default:
        return 'application/json'
    }
  }

  private createEmptyCoverageDetails(request: InsuranceVerificationRequest): CoverageDetails {
    return {
      isActive: false,
      effectiveDate: '',
      planType: InsurancePlanType.OTHER,
      planName: request.planName || 'Unknown',
      payerName: request.payerName || 'Unknown',
      payerId: request.payerNPI || 'Unknown',
      groupNumber: request.groupNumber,
      memberNumber: request.memberId,
      subscriberId: request.subscriberId || request.memberId,
      subscriberName: `${request.subscriberFirstName || request.memberFirstName} ${request.subscriberLastName || request.memberLastName}`,
      relationshipToSubscriber: request.subscriberRelationship || InsuranceRelationship.SELF
    }
  }

  // Mapping utility methods
  private mapServiceTypeToCode(serviceType: HealthcareServiceType): string {
    const codeMap: Record<HealthcareServiceType, string> = {
      [HealthcareServiceType.MENTAL_HEALTH_OUTPATIENT]: '30',
      [HealthcareServiceType.MENTAL_HEALTH_INTENSIVE]: '30',
      [HealthcareServiceType.PSYCHOLOGICAL_TESTING]: '30',
      [HealthcareServiceType.PSYCHIATRIC_SERVICES]: '30',
      [HealthcareServiceType.CRISIS_INTERVENTION]: '30',
      [HealthcareServiceType.SUBSTANCE_ABUSE_OUTPATIENT]: '30',
      [HealthcareServiceType.SUBSTANCE_ABUSE_INTENSIVE]: '30',
      [HealthcareServiceType.SUBSTANCE_ABUSE_DETOX]: '30',
      [HealthcareServiceType.MEDICATION_ASSISTED_TREATMENT]: '30',
      [HealthcareServiceType.CASE_MANAGEMENT]: '30',
      [HealthcareServiceType.CARE_COORDINATION]: '30',
      [HealthcareServiceType.SOCIAL_SERVICES]: '30',
      [HealthcareServiceType.PRIMARY_CARE]: '1',
      [HealthcareServiceType.PREVENTIVE_CARE]: '1',
      [HealthcareServiceType.MEDICAL_CONSULTATION]: '1',
      [HealthcareServiceType.TELEHEALTH_MENTAL_HEALTH]: '30',
      [HealthcareServiceType.TELEHEALTH_PRIMARY_CARE]: '1',
      [HealthcareServiceType.OFFICE_VISIT]: '1',
      [HealthcareServiceType.CONSULTATION]: '1',
      [HealthcareServiceType.EMERGENCY]: '86'
    }
    return codeMap[serviceType] || '1'
  }

  private mapServiceTypeToFHIRCategory(serviceType: HealthcareServiceType): string {
    const categoryMap: Record<HealthcareServiceType, string> = {
      [HealthcareServiceType.MENTAL_HEALTH_OUTPATIENT]: 'mental-health',
      [HealthcareServiceType.MENTAL_HEALTH_INTENSIVE]: 'mental-health',
      [HealthcareServiceType.PSYCHOLOGICAL_TESTING]: 'mental-health',
      [HealthcareServiceType.PSYCHIATRIC_SERVICES]: 'mental-health',
      [HealthcareServiceType.CRISIS_INTERVENTION]: 'mental-health',
      [HealthcareServiceType.SUBSTANCE_ABUSE_OUTPATIENT]: 'substance-abuse',
      [HealthcareServiceType.SUBSTANCE_ABUSE_INTENSIVE]: 'substance-abuse',
      [HealthcareServiceType.SUBSTANCE_ABUSE_DETOX]: 'substance-abuse',
      [HealthcareServiceType.MEDICATION_ASSISTED_TREATMENT]: 'substance-abuse',
      [HealthcareServiceType.CASE_MANAGEMENT]: 'medical',
      [HealthcareServiceType.CARE_COORDINATION]: 'medical',
      [HealthcareServiceType.SOCIAL_SERVICES]: 'medical',
      [HealthcareServiceType.PRIMARY_CARE]: 'medical',
      [HealthcareServiceType.PREVENTIVE_CARE]: 'medical',
      [HealthcareServiceType.MEDICAL_CONSULTATION]: 'medical',
      [HealthcareServiceType.TELEHEALTH_MENTAL_HEALTH]: 'mental-health',
      [HealthcareServiceType.TELEHEALTH_PRIMARY_CARE]: 'medical',
      [HealthcareServiceType.OFFICE_VISIT]: 'medical',
      [HealthcareServiceType.CONSULTATION]: 'medical',
      [HealthcareServiceType.EMERGENCY]: 'medical'
    }
    return categoryMap[serviceType] || 'medical'
  }

  private mapEligibilityStatus(status: string): EligibilityStatus {
    const statusMap: Record<string, EligibilityStatus> = {
      'active': EligibilityStatus.ACTIVE,
      'inactive': EligibilityStatus.INACTIVE,
      'pending': EligibilityStatus.PENDING,
      'suspended': EligibilityStatus.SUSPENDED,
      'terminated': EligibilityStatus.TERMINATED
    }
    return statusMap[status?.toLowerCase()] || EligibilityStatus.UNKNOWN
  }

  private mapPlanType(planType: string): InsurancePlanType {
    const typeMap: Record<string, InsurancePlanType> = {
      'hmo': InsurancePlanType.HMO,
      'ppo': InsurancePlanType.PPO,
      'epo': InsurancePlanType.EPO,
      'pos': InsurancePlanType.POS,
      'medicare': InsurancePlanType.MEDICARE,
      'medicaid': InsurancePlanType.MEDICAID,
      'commercial': InsurancePlanType.COMMERCIAL
    }
    return typeMap[planType?.toLowerCase()] || InsurancePlanType.OTHER
  }

  private mapRelationship(relationship: string): InsuranceRelationship {
    const relationshipMap: Record<string, InsuranceRelationship> = {
      'self': InsuranceRelationship.SELF,
      'spouse': InsuranceRelationship.SPOUSE,
      'child': InsuranceRelationship.CHILD,
      'dependent': InsuranceRelationship.DEPENDENT,
      'employee': InsuranceRelationship.EMPLOYEE
    }
    return relationshipMap[relationship?.toLowerCase()] || InsuranceRelationship.OTHER
  }

  private mapNetworkStatus(status: string): NetworkStatus {
    const statusMap: Record<string, NetworkStatus> = {
      'in_network': NetworkStatus.IN_NETWORK,
      'out_of_network': NetworkStatus.OUT_OF_NETWORK,
      'in-network': NetworkStatus.IN_NETWORK,
      'out-of-network': NetworkStatus.OUT_OF_NETWORK
    }
    return statusMap[status?.toLowerCase()] || NetworkStatus.UNKNOWN
  }

  private mapErrorSeverity(severity: string): ErrorSeverity {
    const severityMap: Record<string, ErrorSeverity> = {
      'info': ErrorSeverity.INFO,
      'warning': ErrorSeverity.WARNING,
      'error': ErrorSeverity.ERROR,
      'critical': ErrorSeverity.CRITICAL
    }
    return severityMap[severity?.toLowerCase()] || ErrorSeverity.ERROR
  }

  private mapFHIREligibilityStatus(outcome: string): EligibilityStatus {
    const outcomeMap: Record<string, EligibilityStatus> = {
      'complete': EligibilityStatus.ACTIVE,
      'error': EligibilityStatus.UNKNOWN,
      'partial': EligibilityStatus.PENDING
    }
    return outcomeMap[outcome?.toLowerCase()] || EligibilityStatus.UNKNOWN
  }

  private mapBenefits(benefits: any[]): BenefitInformation[] {
    return benefits.map(benefit => ({
      serviceType: this.mapCodeToServiceType(benefit.service_type_code),
      serviceCategory: this.mapToServiceCategory(benefit.category),
      benefitType: this.mapToBenefitType(benefit.type),
      networkStatus: this.mapNetworkStatus(benefit.network),
      coverageLevel: this.mapToCoverageLevel(benefit.coverage_level),
      timePeriod: this.mapToTimePeriod(benefit.time_period),
      monetary: benefit.monetary ? {
        amount: benefit.monetary.amount,
        currency: benefit.monetary.currency || 'USD',
        type: this.mapToMonetaryType(benefit.monetary.type),
        period: this.mapToTimePeriod(benefit.monetary.period),
        remaining: benefit.monetary.remaining
      } : undefined,
      quantity: benefit.quantity ? {
        value: benefit.quantity.value,
        unit: this.mapToQuantityUnit(benefit.quantity.unit),
        period: this.mapToTimePeriod(benefit.quantity.period),
        remaining: benefit.quantity.remaining,
        unlimited: benefit.quantity.unlimited
      } : undefined,
      percent: benefit.percent,
      authorizationRequired: benefit.authorization_required === true,
      priorAuthorizationRequired: benefit.prior_authorization_required === true,
      referralRequired: benefit.referral_required === true,
      restrictions: benefit.restrictions || []
    }))
  }

  private mapPlanLimitations(limitations: any[]): PlanLimitation[] {
    return limitations.map(limitation => ({
      serviceType: this.mapCodeToServiceType(limitation.service_type_code),
      limitationType: this.mapToLimitationType(limitation.type),
      description: limitation.description,
      effectiveDate: limitation.effective_date,
      expirationDate: limitation.expiration_date,
      monetary: limitation.monetary ? {
        amount: limitation.monetary.amount,
        currency: limitation.monetary.currency || 'USD',
        type: this.mapToMonetaryType(limitation.monetary.type),
        period: this.mapToTimePeriod(limitation.monetary.period)
      } : undefined,
      quantity: limitation.quantity ? {
        value: limitation.quantity.value,
        unit: this.mapToQuantityUnit(limitation.quantity.unit),
        period: this.mapToTimePeriod(limitation.quantity.period)
      } : undefined
    }))
  }

  private mapCodeToServiceType(code: string): HealthcareServiceType {
    // Map service type codes back to enum values
    const codeMap: Record<string, HealthcareServiceType> = {
      '30': HealthcareServiceType.MENTAL_HEALTH_OUTPATIENT,
      '1': HealthcareServiceType.PRIMARY_CARE,
      '86': HealthcareServiceType.EMERGENCY
    }
    return codeMap[code] || HealthcareServiceType.OFFICE_VISIT
  }

  private mapToServiceCategory(category: string): ServiceCategory {
    const categoryMap: Record<string, ServiceCategory> = {
      'behavioral_health': ServiceCategory.BEHAVIORAL_HEALTH,
      'medical': ServiceCategory.MEDICAL,
      'preventive': ServiceCategory.PREVENTIVE,
      'emergency': ServiceCategory.EMERGENCY,
      'pharmacy': ServiceCategory.PHARMACY,
      'ancillary': ServiceCategory.ANCILLARY
    }
    return categoryMap[category?.toLowerCase()] || ServiceCategory.MEDICAL
  }

  private mapToBenefitType(type: string): BenefitType {
    const typeMap: Record<string, BenefitType> = {
      'copay': BenefitType.COPAY,
      'coinsurance': BenefitType.COINSURANCE,
      'deductible': BenefitType.DEDUCTIBLE,
      'out_of_pocket_maximum': BenefitType.OUT_OF_POCKET_MAXIMUM,
      'visit_limit': BenefitType.VISIT_LIMIT,
      'dollar_limit': BenefitType.DOLLAR_LIMIT,
      'coverage': BenefitType.COVERAGE
    }
    return typeMap[type?.toLowerCase()] || BenefitType.COVERAGE
  }

  private mapToCoverageLevel(level: string): CoverageLevel {
    const levelMap: Record<string, CoverageLevel> = {
      'individual': CoverageLevel.INDIVIDUAL,
      'family': CoverageLevel.FAMILY,
      'employee_plus_one': CoverageLevel.EMPLOYEE_PLUS_ONE,
      'employee_plus_children': CoverageLevel.EMPLOYEE_PLUS_CHILDREN
    }
    return levelMap[level?.toLowerCase()] || CoverageLevel.INDIVIDUAL
  }

  private mapToTimePeriod(period: string): TimePeriod {
    const periodMap: Record<string, TimePeriod> = {
      'visit': TimePeriod.VISIT,
      'day': TimePeriod.DAY,
      'week': TimePeriod.WEEK,
      'month': TimePeriod.MONTH,
      'quarter': TimePeriod.QUARTER,
      'year': TimePeriod.YEAR,
      'lifetime': TimePeriod.LIFETIME
    }
    return periodMap[period?.toLowerCase()] || TimePeriod.YEAR
  }

  private mapToMonetaryType(type: string): MonetaryType {
    const typeMap: Record<string, MonetaryType> = {
      'copay': MonetaryType.COPAY,
      'coinsurance': MonetaryType.COINSURANCE,
      'deductible': MonetaryType.DEDUCTIBLE,
      'out_of_pocket': MonetaryType.OUT_OF_POCKET,
      'benefit_amount': MonetaryType.BENEFIT_AMOUNT,
      'maximum': MonetaryType.MAXIMUM
    }
    return typeMap[type?.toLowerCase()] || MonetaryType.BENEFIT_AMOUNT
  }

  private mapToQuantityUnit(unit: string): QuantityUnit {
    const unitMap: Record<string, QuantityUnit> = {
      'visits': QuantityUnit.VISITS,
      'days': QuantityUnit.DAYS,
      'sessions': QuantityUnit.SESSIONS,
      'procedures': QuantityUnit.PROCEDURES,
      'units': QuantityUnit.UNITS
    }
    return unitMap[unit?.toLowerCase()] || QuantityUnit.VISITS
  }

  private mapToLimitationType(type: string): LimitationType {
    const typeMap: Record<string, LimitationType> = {
      'visit_limit': LimitationType.VISIT_LIMIT,
      'session_limit': LimitationType.SESSION_LIMIT,
      'dollar_limit': LimitationType.DOLLAR_LIMIT,
      'time_limit': LimitationType.TIME_LIMIT,
      'frequency_limit': LimitationType.FREQUENCY_LIMIT,
      'age_limit': LimitationType.AGE_LIMIT
    }
    return typeMap[type?.toLowerCase()] || LimitationType.VISIT_LIMIT
  }

  private async preparePriorAuthRequest(request: PriorAuthorizationRequest): Promise<any> {
    // This would prepare a prior authorization request based on provider format
    return {
      transaction_type: '278',
      patient: {
        id: request.patientId,
        member_id: request.memberId
      },
      services: request.services,
      provider: {
        npi: request.providerNPI
      },
      request_id: request.requestId || crypto.randomUUID()
    }
  }

  private async parsePriorAuthResponse(response: any, request: PriorAuthorizationRequest): Promise<PriorAuthorizationResponse> {
    return {
      requestId: response.request_id || request.requestId || crypto.randomUUID(),
      patientId: request.patientId,
      authorizationRequired: response.authorization_required === true,
      status: this.mapToPriorAuthStatus(response.status),
      authorizationNumber: response.authorization_number,
      approvedServices: response.approved_services || [],
      deniedServices: response.denied_services || [],
      submissionDeadline: response.submission_deadline,
      reviewTimeframe: response.review_timeframe,
      contactInfo: response.contact_info,
      onlinePortal: response.online_portal,
      requiredDocuments: response.required_documents || [],
      errors: response.errors || []
    }
  }

  private mapToPriorAuthStatus(status: string): PriorAuthStatus {
    const statusMap: Record<string, PriorAuthStatus> = {
      'approved': PriorAuthStatus.APPROVED,
      'denied': PriorAuthStatus.DENIED,
      'pending': PriorAuthStatus.PENDING,
      'partial': PriorAuthStatus.PARTIAL,
      'unknown': PriorAuthStatus.UNKNOWN
    }
    return statusMap[status?.toLowerCase()] || PriorAuthStatus.UNKNOWN
  }

  protected async executeRequest(
    endpoint: string,
    method: string,
    data?: string,
    headers?: Record<string, string>
  ): Promise<any> {
    // This would use an actual HTTP client
    // For now, return a mock response
    return {
      status: 200,
      data: { eligibility_status: 'active', coverage: { active: true } },
      encrypted: false
    }
  }
}

// ============================================================================
// INSURANCE CACHE MANAGER
// ============================================================================

export class InsuranceCacheManager {
  private cacheTTL = 24 * 60 * 60 * 1000 // 24 hours in milliseconds

  async getCachedVerification(
    request: InsuranceVerificationRequest
  ): Promise<InsuranceVerificationResponse | null> {
    // This would check cache (Redis, memory, etc.)
    // For now, return null (no cache hit)
    return null
  }

  async cacheVerification(
    request: InsuranceVerificationRequest,
    response: InsuranceVerificationResponse
  ): Promise<void> {
    // This would store in cache
    // For now, just log
    console.log(`Caching verification for patient ${request.patientId}`)
  }

  private generateCacheKey(request: InsuranceVerificationRequest): string {
    const keyComponents = [
      request.memberId,
      request.serviceDate,
      request.serviceTypes.sort().join(','),
      request.providerNPI
    ]
    return `insurance:verification:${keyComponents.join(':')}`
  }
}

// ============================================================================
// ADDITIONAL INTERFACES
// ============================================================================

export interface PriorAuthorizationRequest {
  patientId: string
  memberId: string
  services: PriorAuthService[]
  providerNPI: string
  facilityNPI?: string
  requestId?: string
}

export interface PriorAuthService {
  serviceType: HealthcareServiceType
  cptCode?: string
  description: string
  quantity: number
  startDate: string
  endDate?: string
}

export interface PriorAuthorizationResponse {
  requestId: string
  patientId: string
  authorizationRequired: boolean
  status: PriorAuthStatus
  authorizationNumber?: string
  approvedServices?: PriorAuthService[]
  deniedServices?: PriorAuthService[]
  submissionDeadline?: string
  reviewTimeframe?: string
  contactInfo?: ContactInformation
  onlinePortal?: string
  requiredDocuments?: string[]
  errors?: VerificationError[]
}

export enum PriorAuthStatus {
  APPROVED = 'approved',
  DENIED = 'denied',
  PENDING = 'pending',
  PARTIAL = 'partial',
  UNKNOWN = 'unknown'
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export function createInsuranceProviderConfig(
  providerId: string,
  customConfig?: Partial<InsuranceProviderConfig>
): InsuranceProviderConfig {
  const defaultConfigs: Record<string, InsuranceProviderConfig> = {
    'availity': {
      providerId: 'availity',
      providerName: 'Availity',
      apiEndpoint: 'https://api.availity.com/v1',
      apiVersion: '1.0',
      authentication: {
        type: 'oauth2',
        oauth2: {
          clientId: process.env.AVAILITY_CLIENT_ID || '',
          clientSecret: process.env.AVAILITY_CLIENT_SECRET || '',
          tokenUrl: 'https://api.availity.com/oauth/token',
          scopes: ['eligibility', 'prior_auth']
        }
      },
      supportedTransactions: [
        InsuranceTransaction.ELIGIBILITY_INQUIRY,
        InsuranceTransaction.ELIGIBILITY_RESPONSE,
        InsuranceTransaction.PRIOR_AUTHORIZATION_REQUEST,
        InsuranceTransaction.PRIOR_AUTHORIZATION_RESPONSE
      ],
      responseFormat: ResponseFormat.JSON,
      rateLimiting: {
        requestsPerMinute: 100,
        dailyLimit: 10000,
        burstLimit: 200,
        backoffStrategy: 'exponential'
      },
      testMode: process.env.NODE_ENV !== 'production'
    },
    'change-healthcare': {
      providerId: 'change-healthcare',
      providerName: 'Change Healthcare',
      apiEndpoint: 'https://api.changehealthcare.com/medicalnetwork/eligibility/v3',
      apiVersion: '3.0',
      authentication: {
        type: 'oauth2',
        oauth2: {
          clientId: process.env.CHANGE_CLIENT_ID || '',
          clientSecret: process.env.CHANGE_CLIENT_SECRET || '',
          tokenUrl: 'https://apigw.changehealthcare.com/auth/oauth/v2/token',
          scopes: ['user/MedicalNetwork.read']
        }
      },
      supportedTransactions: [
        InsuranceTransaction.ELIGIBILITY_INQUIRY,
        InsuranceTransaction.ELIGIBILITY_RESPONSE
      ],
      responseFormat: ResponseFormat.JSON,
      rateLimiting: {
        requestsPerMinute: 60,
        dailyLimit: 5000,
        burstLimit: 120,
        backoffStrategy: 'exponential'
      },
      testMode: process.env.NODE_ENV !== 'production'
    }
  }

  const baseConfig = defaultConfigs[providerId]
  if (!baseConfig) {
    throw new Error(`Unknown insurance provider: ${providerId}`)
  }

  return customConfig ? { ...baseConfig, ...customConfig } : baseConfig
}

export function createInsuranceVerificationClient(
  providerId: string,
  customConfig?: Partial<InsuranceProviderConfig>
): InsuranceVerificationClient {
  const providerConfig = createInsuranceProviderConfig(providerId, customConfig)

  const healthcareConfig = {
    name: `Insurance-${providerId}`,
    type: HealthcareSystemType.INSURANCE,
    baseUrl: providerConfig.apiEndpoint,
    apiVersion: providerConfig.apiVersion,
    authentication: {
      type: 'oauth2' as const,
      tokenStorage: 'encrypted-database' as const,
      refreshStrategy: 'automatic' as const,
      sessionTimeout: 3600
    },
    encryption: {
      algorithm: 'AES-256-GCM' as const,
      keyDerivation: 'Argon2' as const,
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
      retentionPeriodDays: 2555,
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
      requestsPerMinute: providerConfig.rateLimiting.requestsPerMinute,
      burstLimit: providerConfig.rateLimiting.burstLimit,
      backoffStrategy: 'exponential' as const,
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
        criticalLatency: 10000, // 10 seconds for insurance verifications
        errorThreshold: 10, // 10% error rate
        downtimeThreshold: 60 // 1 minute
      }
    }
  }

  return new InsuranceVerificationClient(healthcareConfig, providerConfig)
}