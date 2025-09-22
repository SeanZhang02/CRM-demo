'use client'

import Link from 'next/link'
import {
  ArrowLeftIcon,
  UserPlusIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  CalendarIcon,
  IdentificationIcon,
  HeartIcon,
  BeakerIcon,
  ClipboardDocumentListIcon,
  HomeIcon,
  ExclamationTriangleIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline'

/**
 * New Patient Registration Page
 *
 * Healthcare provider interface for registering new patients in the APCTC system.
 * Captures essential patient information for healthcare service delivery.
 *
 * Features:
 * - Patient demographics and contact information
 * - Insurance and emergency contact details
 * - Initial service category assignment
 * - APCTC location assignment
 * - HIPAA compliance documentation
 */

export default function NewPatientPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center space-x-4">
        <Link
          href="/dashboard/patients"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900
                   transition-colors duration-200"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Back to All Patients
        </Link>
      </div>

      {/* Registration Form */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="px-6 py-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                <UserPlusIcon className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Register New Patient</h1>
                <p className="text-sm text-gray-600">Add new patient to APCTC healthcare system</p>
              </div>
            </div>
            <div className="text-sm text-gray-500">
              Provider: Dr. Sarah Lee • Alhambra Center
            </div>
          </div>

          <form className="space-y-8">
            {/* Basic Information */}
            <div className="border-b border-gray-200 pb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <IdentificationIcon className="h-5 w-5 text-gray-400 mr-2" />
                Basic Information
              </h2>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div>
                  <label htmlFor="first-name" className="block text-sm font-medium text-gray-700 mb-2">
                    First Name *
                  </label>
                  <input
                    type="text"
                    id="first-name"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg
                             focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="last-name" className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    id="last-name"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg
                             focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="date-of-birth" className="block text-sm font-medium text-gray-700 mb-2">
                    Date of Birth *
                  </label>
                  <input
                    type="date"
                    id="date-of-birth"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg
                             focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-2">
                    Gender
                  </label>
                  <select
                    id="gender"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg
                             focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select gender...</option>
                    <option value="female">Female</option>
                    <option value="male">Male</option>
                    <option value="non-binary">Non-binary</option>
                    <option value="prefer-not-to-say">Prefer not to say</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="primary-language" className="block text-sm font-medium text-gray-700 mb-2">
                    Primary Language
                  </label>
                  <select
                    id="primary-language"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg
                             focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="english">English</option>
                    <option value="spanish">Spanish</option>
                    <option value="mandarin">Mandarin</option>
                    <option value="cantonese">Cantonese</option>
                    <option value="vietnamese">Vietnamese</option>
                    <option value="korean">Korean</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="mrn" className="block text-sm font-medium text-gray-700 mb-2">
                    Medical Record Number
                  </label>
                  <input
                    type="text"
                    id="mrn"
                    placeholder="Auto-generated"
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50
                             text-gray-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Will be assigned automatically upon registration</p>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="border-b border-gray-200 pb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <PhoneIcon className="h-5 w-5 text-gray-400 mr-2" />
                Contact Information
              </h2>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    required
                    placeholder="(626) 555-0123"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg
                             focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    placeholder="patient@example.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg
                             focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="lg:col-span-2">
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                    Home Address
                  </label>
                  <textarea
                    id="address"
                    rows={3}
                    placeholder="Street address, city, state, ZIP code"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg
                             focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Service Category & Location */}
            <div className="border-b border-gray-200 pb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <MapPinIcon className="h-5 w-5 text-gray-400 mr-2" />
                Service Assignment
              </h2>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="service-category" className="block text-sm font-medium text-gray-700 mb-2">
                    Primary Service Category *
                  </label>
                  <select
                    id="service-category"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg
                             focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select service...</option>
                    <option value="assessment">Assessment & Intake</option>
                    <option value="mental-health">Mental Health Counseling</option>
                    <option value="medication">Medication Management</option>
                    <option value="case-management">Case Management</option>
                    <option value="community-education">Community Education</option>
                    <option value="crisis-intervention">Crisis Intervention</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="apctc-location" className="block text-sm font-medium text-gray-700 mb-2">
                    APCTC Location *
                  </label>
                  <select
                    id="apctc-location"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg
                             focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select location...</option>
                    <option value="alhambra">Alhambra Center</option>
                    <option value="monterey-park">Monterey Park Center</option>
                    <option value="rosemead">Rosemead Center</option>
                    <option value="el-monte">El Monte Center</option>
                    <option value="baldwin-park">Baldwin Park Center</option>
                    <option value="west-covina">West Covina Center</option>
                    <option value="azusa">Azusa Center</option>
                    <option value="pomona">Pomona Center</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="border-b border-gray-200 pb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <PhoneIcon className="h-5 w-5 text-gray-400 mr-2" />
                Emergency Contact
              </h2>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div>
                  <label htmlFor="emergency-name" className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Name *
                  </label>
                  <input
                    type="text"
                    id="emergency-name"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg
                             focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="emergency-relationship" className="block text-sm font-medium text-gray-700 mb-2">
                    Relationship *
                  </label>
                  <select
                    id="emergency-relationship"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg
                             focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select relationship...</option>
                    <option value="spouse">Spouse/Partner</option>
                    <option value="parent">Parent</option>
                    <option value="child">Child</option>
                    <option value="sibling">Sibling</option>
                    <option value="friend">Friend</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="emergency-phone" className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    id="emergency-phone"
                    required
                    placeholder="(626) 555-0123"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg
                             focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Insurance Information */}
            <div className="border-b border-gray-200 pb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <IdentificationIcon className="h-5 w-5 text-gray-400 mr-2" />
                Insurance Information
              </h2>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="insurance-provider" className="block text-sm font-medium text-gray-700 mb-2">
                    Insurance Provider
                  </label>
                  <select
                    id="insurance-provider"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg
                             focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select insurance...</option>
                    <option value="la-care">LA Care Health Plan</option>
                    <option value="blue-cross">Blue Cross Blue Shield</option>
                    <option value="kaiser">Kaiser Permanente</option>
                    <option value="anthem">Anthem</option>
                    <option value="medi-cal">Medi-Cal</option>
                    <option value="uninsured">Uninsured/Self-Pay</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="insurance-id" className="block text-sm font-medium text-gray-700 mb-2">
                    Insurance ID Number
                  </label>
                  <input
                    type="text"
                    id="insurance-id"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg
                             focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Consent & Authorization */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Consent & Authorization
              </h2>

              <div className="space-y-4">
                <div className="flex items-start">
                  <input
                    type="checkbox"
                    id="hipaa-consent"
                    required
                    className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded
                             focus:ring-blue-500"
                  />
                  <label htmlFor="hipaa-consent" className="ml-3 text-sm text-gray-700">
                    <span className="font-medium">HIPAA Authorization:</span> I authorize APCTC to use and disclose my protected health information for treatment, payment, and healthcare operations as described in the Notice of Privacy Practices. *
                  </label>
                </div>

                <div className="flex items-start">
                  <input
                    type="checkbox"
                    id="treatment-consent"
                    required
                    className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded
                             focus:ring-blue-500"
                  />
                  <label htmlFor="treatment-consent" className="ml-3 text-sm text-gray-700">
                    <span className="font-medium">Treatment Consent:</span> I consent to receive mental health services from APCTC and understand my rights as a patient. *
                  </label>
                </div>

                <div className="flex items-start">
                  <input
                    type="checkbox"
                    id="emergency-contact-authorization"
                    className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded
                             focus:ring-blue-500"
                  />
                  <label htmlFor="emergency-contact-authorization" className="ml-3 text-sm text-gray-700">
                    <span className="font-medium">Emergency Contact Authorization:</span> I authorize APCTC to contact the emergency contact listed above in case of a medical emergency.
                  </label>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-200">
              <div className="text-sm text-gray-600">
                * Required fields • All information is HIPAA protected
              </div>
              <div className="flex items-center space-x-3">
                <Link
                  href="/dashboard/patients"
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium
                           text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium
                           hover:bg-green-700 transition-colors duration-200"
                >
                  Register Patient
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Help Section */}
      <div className="bg-blue-50 rounded-lg p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <ClipboardDocumentListIcon className="h-5 w-5 text-blue-600 mt-0.5" />
          </div>
          <div className="ml-3">
            <h4 className="text-sm font-medium text-blue-900">Patient Registration Guidelines</h4>
            <p className="text-sm text-blue-700 mt-1">
              Complete all required fields to register a new patient. The Medical Record Number (MRN) will be automatically assigned.
              After registration, you can schedule the patient's first appointment and begin their treatment plan.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}