import React from 'react';
import { Users, Phone, Mail, MapPin, Plus, Filter, Search, Heart, AlertCircle, Clock } from 'lucide-react';

export default function FamilyContactsPage() {
  const familyContacts = [
    {
      id: 1,
      name: 'Jennifer Chen',
      relationship: 'Spouse',
      patient: 'Maria Chen',
      phone: '(626) 555-0124',
      email: 'jennifer.chen@email.com',
      address: '1234 Maple St, Alhambra, CA 91801',
      emergencyContact: true,
      preferredLanguage: 'English',
      notes: 'Primary emergency contact, works nights',
      lastContact: '2024-12-15',
      status: 'active'
    },
    {
      id: 2,
      name: 'Robert Kim Sr.',
      relationship: 'Father',
      patient: 'David Kim',
      phone: '(323) 555-0198',
      email: 'rkim.sr@email.com',
      address: '5678 Oak Ave, Monterey Park, CA 91754',
      emergencyContact: true,
      preferredLanguage: 'Korean',
      notes: 'Prefers Korean interpreter for communication',
      lastContact: '2024-12-10',
      status: 'active'
    },
    {
      id: 3,
      name: 'Amy Wang',
      relationship: 'Sister',
      patient: 'Lisa Wang',
      phone: '(213) 555-0167',
      email: 'amy.wang@email.com',
      address: '9012 Pine St, Los Angeles, CA 90012',
      emergencyContact: false,
      preferredLanguage: 'English',
      notes: 'Lives nearby, available for transportation support',
      lastContact: '2024-11-28',
      status: 'active'
    },
    {
      id: 4,
      name: 'Michael Nakamura',
      relationship: 'Brother',
      patient: 'James Nakamura',
      phone: '(714) 555-0143',
      email: 'mike.nakamura@email.com',
      address: '3456 Cedar Dr, Orange, CA 92865',
      emergencyContact: true,
      preferredLanguage: 'English',
      notes: 'Lives out of area, prefers text communication',
      lastContact: '2024-12-20',
      status: 'active'
    },
    {
      id: 5,
      name: 'Susan Chen',
      relationship: 'Mother',
      patient: 'Robert Chen',
      phone: '(626) 555-0189',
      email: 'susan.chen@email.com',
      address: '7890 Elm St, San Gabriel, CA 91776',
      emergencyContact: true,
      preferredLanguage: 'Mandarin',
      notes: 'Requires Mandarin interpreter, limited English',
      lastContact: '2024-12-18',
      status: 'active'
    }
  ];

  const getRelationshipColor = (relationship: string) => {
    switch (relationship.toLowerCase()) {
      case 'spouse': return 'bg-pink-100 text-pink-800 border-pink-200';
      case 'parent':
      case 'father':
      case 'mother': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'sibling':
      case 'sister':
      case 'brother': return 'bg-green-100 text-green-800 border-green-200';
      case 'child':
      case 'son':
      case 'daughter': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getLanguageFlag = (language: string) => {
    switch (language.toLowerCase()) {
      case 'korean': return '🇰🇷';
      case 'mandarin':
      case 'chinese': return '🇨🇳';
      case 'spanish': return '🇪🇸';
      case 'vietnamese': return '🇻🇳';
      case 'japanese': return '🇯🇵';
      default: return '🇺🇸';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Users className="h-8 w-8 text-blue-600" />
            Family & Emergency Contacts
          </h1>
          <p className="mt-2 text-gray-600">
            Patient family members and emergency contacts across all APCTC locations
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex gap-3">
          <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <Filter className="h-4 w-4 mr-2" />
            Filter Contacts
          </button>
          <button className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <Plus className="h-4 w-4 mr-2" />
            Add Family Contact
          </button>
        </div>
      </div>

      {/* Search and Quick Stats */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search family contacts..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <div className="flex gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <Heart className="h-4 w-4 text-red-500" />
              <span>{familyContacts.filter(c => c.emergencyContact).length} Emergency Contacts</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4 text-blue-500" />
              <span>{familyContacts.length} Total Contacts</span>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-red-50 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-8 w-8 text-red-600" />
              <div>
                <p className="text-sm text-red-600 font-medium">Emergency Contacts</p>
                <p className="text-2xl font-bold text-red-900">4</p>
              </div>
            </div>
          </div>
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm text-blue-600 font-medium">Total Contacts</p>
                <p className="text-2xl font-bold text-blue-900">5</p>
              </div>
            </div>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <Phone className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm text-green-600 font-medium">Recent Contact</p>
                <p className="text-lg font-bold text-green-900">2 days ago</p>
              </div>
            </div>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                🌐
              </div>
              <div>
                <p className="text-sm text-purple-600 font-medium">Languages</p>
                <p className="text-2xl font-bold text-purple-900">4</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Family Contacts List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Family & Emergency Contacts</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {familyContacts.map((contact) => (
            <div key={contact.id} className="p-6 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-3">
                    <h4 className="text-lg font-semibold text-gray-900">{contact.name}</h4>
                    <div className={`px-3 py-1 rounded-full text-xs font-medium border ${getRelationshipColor(contact.relationship)}`}>
                      {contact.relationship}
                    </div>
                    {contact.emergencyContact && (
                      <div className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200 flex items-center gap-1">
                        <Heart className="h-3 w-3" />
                        Emergency Contact
                      </div>
                    )}
                  </div>

                  <div className="mb-3">
                    <p className="text-gray-600 font-medium">Patient: {contact.patient}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone className="h-4 w-4" />
                        {contact.phone}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Mail className="h-4 w-4" />
                        {contact.email}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="h-4 w-4" />
                        {contact.address}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span className="text-lg">{getLanguageFlag(contact.preferredLanguage)}</span>
                        <span>Preferred: {contact.preferredLanguage}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="h-4 w-4" />
                        Last contact: {new Date(contact.lastContact).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  {contact.notes && (
                    <div className="bg-yellow-50 rounded-lg p-3 mb-3">
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Notes:</span> {contact.notes}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 ml-4">
                  <button className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded">
                    Call
                  </button>
                  <button className="px-3 py-1 text-sm text-green-600 hover:text-green-800 hover:bg-green-50 rounded">
                    Email
                  </button>
                  <button className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded">
                    Edit
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Plus className="h-5 w-5 text-blue-600" />
            <span className="font-medium">Add Family Contact</span>
          </button>
          <button className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <span className="font-medium">Emergency Contact Report</span>
          </button>
          <button className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Phone className="h-5 w-5 text-green-600" />
            <span className="font-medium">Contact History</span>
          </button>
        </div>
      </div>
    </div>
  );
}