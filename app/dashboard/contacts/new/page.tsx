import Link from 'next/link'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import { ContactForm } from '@/components/contacts/contact-form'

/**
 * Add New Contact Page
 *
 * Features:
 * - Clean form layout optimized for desktop
 * - Form validation with Zod schemas
 * - Company association capabilities
 * - Navigation breadcrumbs
 */

export default function NewContactPage() {
  return (
    <div className="space-y-6">
      {/* Page Header with Breadcrumb */}
      <div className="flex items-center space-x-4">
        <Link
          href="/dashboard/contacts"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900
                   transition-colors duration-200"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Back to Contacts
        </Link>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Add New Contact</h1>
          <p className="mt-1 text-sm text-gray-600">
            Create a new contact record to manage customer relationships
          </p>
        </div>
      </div>

      {/* Contact Form */}
      <div className="bg-white shadow-sm ring-1 ring-gray-900/5 rounded-lg">
        <div className="px-6 py-8">
          <ContactForm mode="create" />
        </div>
      </div>
    </div>
  )
}