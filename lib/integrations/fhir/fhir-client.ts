/**
 * HL7 FHIR R4 Integration Client
 *
 * HIPAA-compliant FHIR client for healthcare data exchange
 * Supports major EHR systems: Epic, Cerner, AllScripts
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
// FHIR RESOURCE TYPES AND SCHEMAS
// ============================================================================

export interface FHIRResource {
  resourceType: string
  id?: string
  meta?: FHIRMeta
  identifier?: FHIRIdentifier[]
  text?: FHIRNarrative
}

export interface FHIRMeta {
  versionId?: string
  lastUpdated?: string
  source?: string
  profile?: string[]
  security?: FHIRCoding[]
  tag?: FHIRCoding[]
}

export interface FHIRIdentifier {
  use?: 'usual' | 'official' | 'temp' | 'secondary'
  type?: FHIRCodeableConcept
  system?: string
  value?: string
  period?: FHIRPeriod
  assigner?: FHIRReference
}

export interface FHIRCoding {
  system?: string
  version?: string
  code?: string
  display?: string
  userSelected?: boolean
}

export interface FHIRCodeableConcept {
  coding?: FHIRCoding[]
  text?: string
}

export interface FHIRNarrative {
  status: 'generated' | 'extensions' | 'additional' | 'empty'
  div: string
}

export interface FHIRPeriod {
  start?: string
  end?: string
}

export interface FHIRReference {
  reference?: string
  type?: string
  identifier?: FHIRIdentifier
  display?: string
}

// ============================================================================
// PATIENT RESOURCE (Core for APCTC)
// ============================================================================

export interface FHIRPatient extends FHIRResource {
  resourceType: 'Patient'
  active?: boolean
  name?: FHIRHumanName[]
  telecom?: FHIRContactPoint[]
  gender?: 'male' | 'female' | 'other' | 'unknown'
  birthDate?: string
  address?: FHIRAddress[]
  maritalStatus?: FHIRCodeableConcept
  multipleBirthBoolean?: boolean
  photo?: FHIRAttachment[]
  contact?: FHIRPatientContact[]
  communication?: FHIRPatientCommunication[]
  generalPractitioner?: FHIRReference[]
  managingOrganization?: FHIRReference
  link?: FHIRPatientLink[]
}

export interface FHIRHumanName {
  use?: 'usual' | 'official' | 'temp' | 'nickname' | 'anonymous' | 'old' | 'maiden'
  text?: string
  family?: string
  given?: string[]
  prefix?: string[]
  suffix?: string[]
  period?: FHIRPeriod
}

export interface FHIRContactPoint {
  system?: 'phone' | 'fax' | 'email' | 'pager' | 'url' | 'sms' | 'other'
  value?: string
  use?: 'home' | 'work' | 'temp' | 'old' | 'mobile'
  rank?: number
  period?: FHIRPeriod
}

export interface FHIRAddress {
  use?: 'home' | 'work' | 'temp' | 'old' | 'billing'
  type?: 'postal' | 'physical' | 'both'
  text?: string
  line?: string[]
  city?: string
  district?: string
  state?: string
  postalCode?: string
  country?: string
  period?: FHIRPeriod
}

export interface FHIRPatientContact {
  relationship?: FHIRCodeableConcept[]
  name?: FHIRHumanName
  telecom?: FHIRContactPoint[]
  address?: FHIRAddress
  gender?: 'male' | 'female' | 'other' | 'unknown'
  organization?: FHIRReference
  period?: FHIRPeriod
}

export interface FHIRPatientCommunication {
  language: FHIRCodeableConcept
  preferred?: boolean
}

export interface FHIRPatientLink {
  other: FHIRReference
  type: 'replaced-by' | 'replaces' | 'refer' | 'seealso'
}

export interface FHIRAttachment {
  contentType?: string
  language?: string
  data?: string
  url?: string
  size?: number
  hash?: string
  title?: string
  creation?: string
}

// ============================================================================
// PRACTITIONER RESOURCE (Healthcare Providers)
// ============================================================================

export interface FHIRPractitioner extends FHIRResource {
  resourceType: 'Practitioner'
  active?: boolean
  name?: FHIRHumanName[]
  telecom?: FHIRContactPoint[]
  address?: FHIRAddress[]
  gender?: 'male' | 'female' | 'other' | 'unknown'
  birthDate?: string
  photo?: FHIRAttachment[]
  qualification?: FHIRPractitionerQualification[]
  communication?: FHIRCodeableConcept[]
}

export interface FHIRPractitionerQualification {
  identifier?: FHIRIdentifier[]
  code: FHIRCodeableConcept
  period?: FHIRPeriod
  issuer?: FHIRReference
}

// ============================================================================
// ENCOUNTER RESOURCE (Appointments/Visits)
// ============================================================================

export interface FHIREncounter extends FHIRResource {
  resourceType: 'Encounter'
  status: 'planned' | 'arrived' | 'triaged' | 'in-progress' | 'onleave' | 'finished' | 'cancelled' | 'entered-in-error' | 'unknown'
  statusHistory?: FHIREncounterStatusHistory[]
  class: FHIRCoding
  classHistory?: FHIREncounterClassHistory[]
  type?: FHIRCodeableConcept[]
  serviceType?: FHIRCodeableConcept
  priority?: FHIRCodeableConcept
  subject?: FHIRReference
  episodeOfCare?: FHIRReference[]
  basedOn?: FHIRReference[]
  participant?: FHIREncounterParticipant[]
  appointment?: FHIRReference[]
  period?: FHIRPeriod
  length?: FHIRDuration
  reasonCode?: FHIRCodeableConcept[]
  reasonReference?: FHIRReference[]
  diagnosis?: FHIREncounterDiagnosis[]
  account?: FHIRReference[]
  hospitalization?: FHIREncounterHospitalization
  location?: FHIREncounterLocation[]
  serviceProvider?: FHIRReference
  partOf?: FHIRReference
}

export interface FHIREncounterStatusHistory {
  status: string
  period: FHIRPeriod
}

export interface FHIREncounterClassHistory {
  class: FHIRCoding
  period: FHIRPeriod
}

export interface FHIREncounterParticipant {
  type?: FHIRCodeableConcept[]
  period?: FHIRPeriod
  individual?: FHIRReference
}

export interface FHIRDuration {
  value?: number
  comparator?: '<' | '<=' | '>=' | '>'
  unit?: string
  system?: string
  code?: string
}

export interface FHIREncounterDiagnosis {
  condition: FHIRReference
  use?: FHIRCodeableConcept
  rank?: number
}

export interface FHIREncounterHospitalization {
  preAdmissionIdentifier?: FHIRIdentifier
  origin?: FHIRReference
  admitSource?: FHIRCodeableConcept
  reAdmission?: FHIRCodeableConcept
  dietPreference?: FHIRCodeableConcept[]
  specialCourtesy?: FHIRCodeableConcept[]
  specialArrangement?: FHIRCodeableConcept[]
  destination?: FHIRReference
  dischargeDisposition?: FHIRCodeableConcept
}

export interface FHIREncounterLocation {
  location: FHIRReference
  status?: 'planned' | 'active' | 'reserved' | 'completed'
  physicalType?: FHIRCodeableConcept
  period?: FHIRPeriod
}

// ============================================================================
// OBSERVATION RESOURCE (Mental Health Assessments)
// ============================================================================

export interface FHIRObservation extends FHIRResource {
  resourceType: 'Observation'
  status: 'registered' | 'preliminary' | 'final' | 'amended' | 'corrected' | 'cancelled' | 'entered-in-error' | 'unknown'
  category?: FHIRCodeableConcept[]
  code: FHIRCodeableConcept
  subject?: FHIRReference
  focus?: FHIRReference[]
  encounter?: FHIRReference
  effectiveDateTime?: string
  effectivePeriod?: FHIRPeriod
  issued?: string
  performer?: FHIRReference[]
  valueQuantity?: FHIRQuantity
  valueCodeableConcept?: FHIRCodeableConcept
  valueString?: string
  valueBoolean?: boolean
  valueInteger?: number
  valueRange?: FHIRRange
  valueRatio?: FHIRRatio
  valueSampledData?: FHIRSampledData
  valueTime?: string
  valueDateTime?: string
  valuePeriod?: FHIRPeriod
  dataAbsentReason?: FHIRCodeableConcept
  interpretation?: FHIRCodeableConcept[]
  note?: FHIRAnnotation[]
  bodySite?: FHIRCodeableConcept
  method?: FHIRCodeableConcept
  specimen?: FHIRReference
  device?: FHIRReference
  referenceRange?: FHIRObservationReferenceRange[]
  hasMember?: FHIRReference[]
  derivedFrom?: FHIRReference[]
  component?: FHIRObservationComponent[]
}

export interface FHIRQuantity {
  value?: number
  comparator?: '<' | '<=' | '>=' | '>'
  unit?: string
  system?: string
  code?: string
}

export interface FHIRRange {
  low?: FHIRQuantity
  high?: FHIRQuantity
}

export interface FHIRRatio {
  numerator?: FHIRQuantity
  denominator?: FHIRQuantity
}

export interface FHIRSampledData {
  origin: FHIRQuantity
  period: number
  factor?: number
  lowerLimit?: number
  upperLimit?: number
  dimensions: number
  data?: string
}

export interface FHIRAnnotation {
  authorReference?: FHIRReference
  authorString?: string
  time?: string
  text: string
}

export interface FHIRObservationReferenceRange {
  low?: FHIRQuantity
  high?: FHIRQuantity
  type?: FHIRCodeableConcept
  appliesTo?: FHIRCodeableConcept[]
  age?: FHIRRange
  text?: string
}

export interface FHIRObservationComponent {
  code: FHIRCodeableConcept
  valueQuantity?: FHIRQuantity
  valueCodeableConcept?: FHIRCodeableConcept
  valueString?: string
  valueBoolean?: boolean
  valueInteger?: number
  valueRange?: FHIRRange
  valueRatio?: FHIRRatio
  valueSampledData?: FHIRSampledData
  valueTime?: string
  valueDateTime?: string
  valuePeriod?: FHIRPeriod
  dataAbsentReason?: FHIRCodeableConcept
  interpretation?: FHIRCodeableConcept[]
  referenceRange?: FHIRObservationReferenceRange[]
}

// ============================================================================
// FHIR BUNDLE (For bulk operations)
// ============================================================================

export interface FHIRBundle extends FHIRResource {
  resourceType: 'Bundle'
  type: 'document' | 'message' | 'transaction' | 'transaction-response' | 'batch' | 'batch-response' | 'history' | 'searchset' | 'collection'
  timestamp?: string
  total?: number
  link?: FHIRBundleLink[]
  entry?: FHIRBundleEntry[]
  signature?: FHIRSignature
}

export interface FHIRBundleLink {
  relation: string
  url: string
}

export interface FHIRBundleEntry {
  link?: FHIRBundleLink[]
  fullUrl?: string
  resource?: FHIRResource
  search?: FHIRBundleEntrySearch
  request?: FHIRBundleEntryRequest
  response?: FHIRBundleEntryResponse
}

export interface FHIRBundleEntrySearch {
  mode?: 'match' | 'include' | 'outcome'
  score?: number
}

export interface FHIRBundleEntryRequest {
  method: 'GET' | 'HEAD' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  url: string
  ifNoneMatch?: string
  ifModifiedSince?: string
  ifMatch?: string
  ifNoneExist?: string
}

export interface FHIRBundleEntryResponse {
  status: string
  location?: string
  etag?: string
  lastModified?: string
  outcome?: FHIRResource
}

export interface FHIRSignature {
  type: FHIRCoding[]
  when: string
  who: FHIRReference
  onBehalfOf?: FHIRReference
  targetFormat?: string
  sigFormat?: string
  data?: string
}

// ============================================================================
// FHIR CLIENT CONFIGURATION
// ============================================================================

export interface FHIRClientConfig {
  baseUrl: string
  version: 'R4' | 'STU3' | 'DSTU2'
  authentication: FHIRAuthConfig
  retryPolicy: FHIRRetryPolicy
  caching: FHIRCachingConfig
  validation: FHIRValidationConfig
}

export interface FHIRAuthConfig {
  type: 'smart-on-fhir' | 'oauth2' | 'basic' | 'bearer'
  smartOnFhir?: SmartOnFhirConfig
  oauth2?: FHIROAuth2Config
  bearer?: string
  basic?: {
    username: string
    password: string
  }
}

export interface SmartOnFhirConfig {
  authorizationUrl: string
  tokenUrl: string
  clientId: string
  redirectUri: string
  scopes: string[]
  launch?: string
  aud?: string
}

export interface FHIROAuth2Config {
  clientId: string
  clientSecret: string
  tokenUrl: string
  scopes: string[]
}

export interface FHIRRetryPolicy {
  maxRetries: number
  baseDelay: number
  maxDelay: number
  backoffFactor: number
}

export interface FHIRCachingConfig {
  enabled: boolean
  ttl: number // seconds
  maxSize: number // number of cached responses
}

export interface FHIRValidationConfig {
  validateResources: boolean
  strictMode: boolean
  customProfiles?: string[]
}

// ============================================================================
// FHIR CLIENT IMPLEMENTATION
// ============================================================================

export class FHIRClient extends BaseHealthcareIntegration {
  private fhirConfig: FHIRClientConfig
  private baseUrl: string
  private version: string

  constructor(config: HealthcareIntegrationConfig, fhirConfig: FHIRClientConfig) {
    super(config)
    this.fhirConfig = fhirConfig
    this.baseUrl = fhirConfig.baseUrl.replace(/\/$/, '') // Remove trailing slash
    this.version = fhirConfig.version
  }

  async authenticate(): Promise<AuthenticationResult> {
    try {
      switch (this.fhirConfig.authentication.type) {
        case 'smart-on-fhir':
          return await this.authenticateSmartOnFhir()
        case 'oauth2':
          return await this.authenticateOAuth2()
        case 'bearer':
          return await this.authenticateBearer()
        case 'basic':
          return await this.authenticateBasic()
        default:
          throw new Error(`Unsupported authentication type: ${this.fhirConfig.authentication.type}`)
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
      const response = await this.makeSecureRequest<any>(
        '/metadata',
        'GET'
      )

      const endTime = Date.now()
      const latency = endTime - startTime

      if (response.success && response.data?.resourceType === 'CapabilityStatement') {
        return {
          connected: true,
          latency,
          serverVersion: response.data.fhirVersion || 'Unknown'
        }
      } else {
        return {
          connected: false,
          error: 'Invalid FHIR server response'
        }
      }
    } catch (error) {
      const endTime = Date.now()
      const latency = endTime - startTime

      return {
        connected: false,
        latency,
        error: error instanceof Error ? error.message : 'Connection failed'
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
  // FHIR RESOURCE OPERATIONS
  // ============================================================================

  // Patient Operations
  async getPatient(id: string): Promise<SecureResponse<FHIRPatient>> {
    return this.makeSecureRequest<FHIRPatient>(`/Patient/${id}`, 'GET')
  }

  async searchPatients(searchParams: PatientSearchParams): Promise<SecureResponse<FHIRBundle>> {
    const queryString = this.buildSearchQuery(searchParams)
    return this.makeSecureRequest<FHIRBundle>(`/Patient?${queryString}`, 'GET')
  }

  async createPatient(patient: FHIRPatient): Promise<SecureResponse<FHIRPatient>> {
    return this.makeSecureRequest<FHIRPatient>('/Patient', 'POST', patient)
  }

  async updatePatient(id: string, patient: FHIRPatient): Promise<SecureResponse<FHIRPatient>> {
    return this.makeSecureRequest<FHIRPatient>(`/Patient/${id}`, 'PUT', patient)
  }

  // Practitioner Operations
  async getPractitioner(id: string): Promise<SecureResponse<FHIRPractitioner>> {
    return this.makeSecureRequest<FHIRPractitioner>(`/Practitioner/${id}`, 'GET')
  }

  async searchPractitioners(searchParams: PractitionerSearchParams): Promise<SecureResponse<FHIRBundle>> {
    const queryString = this.buildSearchQuery(searchParams)
    return this.makeSecureRequest<FHIRBundle>(`/Practitioner?${queryString}`, 'GET')
  }

  // Encounter Operations
  async getEncounter(id: string): Promise<SecureResponse<FHIREncounter>> {
    return this.makeSecureRequest<FHIREncounter>(`/Encounter/${id}`, 'GET')
  }

  async searchEncounters(searchParams: EncounterSearchParams): Promise<SecureResponse<FHIRBundle>> {
    const queryString = this.buildSearchQuery(searchParams)
    return this.makeSecureRequest<FHIRBundle>(`/Encounter?${queryString}`, 'GET')
  }

  async createEncounter(encounter: FHIREncounter): Promise<SecureResponse<FHIREncounter>> {
    return this.makeSecureRequest<FHIREncounter>('/Encounter', 'POST', encounter)
  }

  // Observation Operations (Mental Health Assessments)
  async getObservation(id: string): Promise<SecureResponse<FHIRObservation>> {
    return this.makeSecureRequest<FHIRObservation>(`/Observation/${id}`, 'GET')
  }

  async searchObservations(searchParams: ObservationSearchParams): Promise<SecureResponse<FHIRBundle>> {
    const queryString = this.buildSearchQuery(searchParams)
    return this.makeSecureRequest<FHIRBundle>(`/Observation?${queryString}`, 'GET')
  }

  async createObservation(observation: FHIRObservation): Promise<SecureResponse<FHIRObservation>> {
    return this.makeSecureRequest<FHIRObservation>('/Observation', 'POST', observation)
  }

  // Bulk Operations
  async bulkExport(resourceTypes: string[], since?: Date): Promise<SecureResponse<any>> {
    const params = new URLSearchParams()
    params.append('_type', resourceTypes.join(','))
    if (since) {
      params.append('_since', since.toISOString())
    }

    return this.makeSecureRequest<any>(
      `/$export?${params.toString()}`,
      'GET',
      undefined,
      {
        'Accept': 'application/fhir+json',
        'Prefer': 'respond-async'
      }
    )
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  private async authenticateSmartOnFhir(): Promise<AuthenticationResult> {
    const smartConfig = this.fhirConfig.authentication.smartOnFhir
    if (!smartConfig) {
      throw new Error('SMART on FHIR configuration is required')
    }

    // This would implement the SMART on FHIR authorization flow
    // For now, return a placeholder
    return {
      success: true,
      token: 'smart-on-fhir-token',
      expiresAt: new Date(Date.now() + 3600000) // 1 hour
    }
  }

  private async authenticateOAuth2(): Promise<AuthenticationResult> {
    const oauth2Config = this.fhirConfig.authentication.oauth2
    if (!oauth2Config) {
      throw new Error('OAuth2 configuration is required')
    }

    // This would implement OAuth2 client credentials flow
    // For now, return a placeholder
    return {
      success: true,
      token: 'oauth2-token',
      expiresAt: new Date(Date.now() + 3600000) // 1 hour
    }
  }

  private async authenticateBearer(): Promise<AuthenticationResult> {
    const bearerToken = this.fhirConfig.authentication.bearer
    if (!bearerToken) {
      throw new Error('Bearer token is required')
    }

    return {
      success: true,
      token: bearerToken,
      expiresAt: new Date(Date.now() + 86400000) // 24 hours (assume long-lived)
    }
  }

  private async authenticateBasic(): Promise<AuthenticationResult> {
    const basicConfig = this.fhirConfig.authentication.basic
    if (!basicConfig) {
      throw new Error('Basic authentication configuration is required')
    }

    // Basic auth doesn't use tokens, but we'll return success
    return {
      success: true,
      token: Buffer.from(`${basicConfig.username}:${basicConfig.password}`).toString('base64'),
      expiresAt: new Date(Date.now() + 86400000) // 24 hours
    }
  }

  private buildSearchQuery(params: Record<string, any>): string {
    const queryParams = new URLSearchParams()

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach(v => queryParams.append(key, v.toString()))
        } else {
          queryParams.append(key, value.toString())
        }
      }
    })

    return queryParams.toString()
  }

  protected async executeRequest(
    endpoint: string,
    method: string,
    data?: string,
    headers?: Record<string, string>
  ): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`
    const requestHeaders = {
      'Content-Type': 'application/fhir+json',
      'Accept': 'application/fhir+json',
      ...headers
    }

    // Add authentication header based on configuration
    if (this.fhirConfig.authentication.type === 'bearer') {
      requestHeaders['Authorization'] = `Bearer ${this.fhirConfig.authentication.bearer}`
    } else if (this.fhirConfig.authentication.type === 'basic') {
      const basic = this.fhirConfig.authentication.basic
      if (basic) {
        const token = Buffer.from(`${basic.username}:${basic.password}`).toString('base64')
        requestHeaders['Authorization'] = `Basic ${token}`
      }
    }

    // This would use an actual HTTP client like fetch or axios
    // For now, this is a placeholder implementation
    const response = {
      status: 200,
      data: data ? JSON.parse(data) : { resourceType: 'CapabilityStatement', fhirVersion: '4.0.1' },
      encrypted: false
    }

    return response
  }
}

// ============================================================================
// SEARCH PARAMETER INTERFACES
// ============================================================================

export interface PatientSearchParams {
  _id?: string
  identifier?: string
  name?: string
  family?: string
  given?: string
  birthdate?: string
  gender?: 'male' | 'female' | 'other' | 'unknown'
  address?: string
  'address-city'?: string
  'address-state'?: string
  'address-postalcode'?: string
  telecom?: string
  email?: string
  phone?: string
  active?: boolean
  language?: string
  _count?: number
  _offset?: number
  _sort?: string
}

export interface PractitionerSearchParams {
  _id?: string
  identifier?: string
  name?: string
  family?: string
  given?: string
  telecom?: string
  email?: string
  phone?: string
  address?: string
  'address-city'?: string
  'address-state'?: string
  active?: boolean
  _count?: number
  _offset?: number
  _sort?: string
}

export interface EncounterSearchParams {
  _id?: string
  identifier?: string
  status?: string
  class?: string
  type?: string
  subject?: string
  participant?: string
  practitioner?: string
  date?: string
  length?: string
  location?: string
  'service-provider'?: string
  _count?: number
  _offset?: number
  _sort?: string
}

export interface ObservationSearchParams {
  _id?: string
  identifier?: string
  status?: string
  category?: string
  code?: string
  subject?: string
  patient?: string
  encounter?: string
  performer?: string
  date?: string
  'value-quantity'?: string
  'value-concept'?: string
  'value-string'?: string
  _count?: number
  _offset?: number
  _sort?: string
}

// ============================================================================
// FHIR CLIENT FACTORY
// ============================================================================

export function createFHIRClient(
  ehrSystem: 'epic' | 'cerner' | 'allscripts' | 'custom',
  customConfig?: Partial<FHIRClientConfig>
): FHIRClient {
  let defaultConfig: FHIRClientConfig

  switch (ehrSystem) {
    case 'epic':
      defaultConfig = {
        baseUrl: 'https://fhir.epic.com/interconnect-fhir-oauth/api/FHIR/R4',
        version: 'R4',
        authentication: {
          type: 'smart-on-fhir',
          smartOnFhir: {
            authorizationUrl: 'https://fhir.epic.com/interconnect-fhir-oauth/oauth2/authorize',
            tokenUrl: 'https://fhir.epic.com/interconnect-fhir-oauth/oauth2/token',
            clientId: process.env.EPIC_CLIENT_ID || '',
            redirectUri: process.env.EPIC_REDIRECT_URI || '',
            scopes: ['patient/*.read', 'patient/*.write', 'user/*.read']
          }
        },
        retryPolicy: {
          maxRetries: 3,
          baseDelay: 1000,
          maxDelay: 10000,
          backoffFactor: 2
        },
        caching: {
          enabled: true,
          ttl: 300, // 5 minutes
          maxSize: 1000
        },
        validation: {
          validateResources: true,
          strictMode: false
        }
      }
      break

    case 'cerner':
      defaultConfig = {
        baseUrl: 'https://fhir-open.cerner.com/r4',
        version: 'R4',
        authentication: {
          type: 'smart-on-fhir',
          smartOnFhir: {
            authorizationUrl: 'https://authorization.cerner.com/oauth2/authorize',
            tokenUrl: 'https://authorization.cerner.com/oauth2/token',
            clientId: process.env.CERNER_CLIENT_ID || '',
            redirectUri: process.env.CERNER_REDIRECT_URI || '',
            scopes: ['patient/Patient.read', 'patient/Observation.read', 'patient/Encounter.read']
          }
        },
        retryPolicy: {
          maxRetries: 3,
          baseDelay: 1000,
          maxDelay: 10000,
          backoffFactor: 2
        },
        caching: {
          enabled: true,
          ttl: 300,
          maxSize: 1000
        },
        validation: {
          validateResources: true,
          strictMode: false
        }
      }
      break

    case 'allscripts':
      defaultConfig = {
        baseUrl: 'https://fhir.allscripts.com/fhir/r4',
        version: 'R4',
        authentication: {
          type: 'oauth2',
          oauth2: {
            clientId: process.env.ALLSCRIPTS_CLIENT_ID || '',
            clientSecret: process.env.ALLSCRIPTS_CLIENT_SECRET || '',
            tokenUrl: 'https://fhir.allscripts.com/oauth2/token',
            scopes: ['patient/*.read', 'patient/*.write']
          }
        },
        retryPolicy: {
          maxRetries: 3,
          baseDelay: 1000,
          maxDelay: 10000,
          backoffFactor: 2
        },
        caching: {
          enabled: true,
          ttl: 300,
          maxSize: 1000
        },
        validation: {
          validateResources: true,
          strictMode: false
        }
      }
      break

    default:
      throw new Error(`Unsupported EHR system: ${ehrSystem}`)
  }

  // Merge with custom configuration
  const finalConfig = customConfig ? { ...defaultConfig, ...customConfig } : defaultConfig

  // Create healthcare integration config
  const healthcareConfig = {
    name: `FHIR-${ehrSystem}`,
    type: HealthcareSystemType.EHR,
    baseUrl: finalConfig.baseUrl,
    apiVersion: finalConfig.version,
    authentication: {
      type: 'oauth2' as const,
      tokenStorage: 'encrypted-database' as const,
      refreshStrategy: 'automatic' as const,
      sessionTimeout: 900
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
      requestsPerMinute: 100,
      burstLimit: 200,
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
        criticalLatency: 5000,
        errorThreshold: 5,
        downtimeThreshold: 30
      }
    }
  }

  return new FHIRClient(healthcareConfig, finalConfig)
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export function validateFHIRResource(resource: any, resourceType: string): boolean {
  if (!resource || typeof resource !== 'object') {
    return false
  }

  if (resource.resourceType !== resourceType) {
    return false
  }

  // Add specific validation logic for each resource type
  switch (resourceType) {
    case 'Patient':
      return validatePatient(resource)
    case 'Practitioner':
      return validatePractitioner(resource)
    case 'Encounter':
      return validateEncounter(resource)
    case 'Observation':
      return validateObservation(resource)
    default:
      return true // Generic validation passed
  }
}

function validatePatient(patient: any): boolean {
  // Must have at least one name or identifier
  return !!(patient.name?.length > 0 || patient.identifier?.length > 0)
}

function validatePractitioner(practitioner: any): boolean {
  // Must have at least one name or identifier
  return !!(practitioner.name?.length > 0 || practitioner.identifier?.length > 0)
}

function validateEncounter(encounter: any): boolean {
  // Must have status and class
  return !!(encounter.status && encounter.class)
}

function validateObservation(observation: any): boolean {
  // Must have status and code
  return !!(observation.status && observation.code)
}

export function extractPatientId(patientReference: string): string | null {
  const match = patientReference.match(/Patient\/(.+)/)
  return match ? match[1] : null
}

export function createPatientReference(patientId: string): string {
  return `Patient/${patientId}`
}

export function createPractitionerReference(practitionerId: string): string {
  return `Practitioner/${practitionerId}`
}