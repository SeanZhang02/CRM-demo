import { redirect } from 'next/navigation'

/**
 * Root page redirects to the main CRM dashboard
 * Following desktop-first design principles with clear navigation
 */
export default function RootPage() {
  redirect('/dashboard')
}
