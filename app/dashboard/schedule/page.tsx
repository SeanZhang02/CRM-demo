import React from 'react';
import { Calendar, Clock, Users, MapPin, Plus, Filter, ChevronLeft, ChevronRight } from 'lucide-react';

export default function SchedulePage() {
  const appointments = [
    {
      id: 1,
      time: '9:00 AM',
      duration: '60 min',
      patient: 'Maria Chen',
      service: 'Mental Health Session',
      provider: 'Dr. Sarah Lee',
      room: 'Room 203',
      status: 'confirmed',
      notes: 'Follow-up on anxiety coping strategies'
    },
    {
      id: 2,
      time: '10:30 AM',
      duration: '30 min',
      patient: 'David Kim',
      service: 'Medication Review',
      provider: 'Dr. Michael Chang',
      room: 'Room 205',
      status: 'confirmed',
      notes: 'Monthly medication check-in'
    },
    {
      id: 3,
      time: '11:30 AM',
      duration: '45 min',
      patient: 'James Nakamura',
      service: 'Assessment & Intake',
      provider: 'Dr. Emily Honda',
      room: 'Room 201',
      status: 'new_patient',
      notes: 'Initial assessment appointment'
    },
    {
      id: 4,
      time: '2:00 PM',
      duration: '45 min',
      patient: 'Lisa Wang',
      service: 'Case Management',
      provider: 'Maria Rodriguez, MSW',
      room: 'Room 101',
      status: 'urgent',
      notes: 'Housing assistance follow-up'
    },
    {
      id: 5,
      time: '3:30 PM',
      duration: '60 min',
      patient: 'Robert Chen',
      service: 'Family Therapy',
      provider: 'Dr. Sarah Lee',
      room: 'Room 203',
      status: 'confirmed',
      notes: 'Joint session with spouse'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800 border-green-200';
      case 'new_patient': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed': return 'Confirmed';
      case 'new_patient': return 'New Patient';
      case 'urgent': return 'Urgent';
      default: return 'Scheduled';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Calendar className="h-8 w-8 text-blue-600" />
            My Schedule
          </h1>
          <p className="mt-2 text-gray-600">
            Today's appointments and schedule management • Dr. Sarah Lee • Alhambra Center
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex gap-3">
          <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </button>
          <button className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <Plus className="h-4 w-4 mr-2" />
            New Appointment
          </button>
        </div>
      </div>

      {/* Schedule Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-gray-100 rounded-lg">
              <ChevronLeft className="h-5 w-5 text-gray-600" />
            </button>
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-900">Saturday, September 21, 2025</h2>
              <p className="text-sm text-gray-500">8 appointments scheduled</p>
            </div>
            <button className="p-2 hover:bg-gray-100 rounded-lg">
              <ChevronRight className="h-5 w-5 text-gray-600" />
            </button>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="h-4 w-4" />
            Current time: 8:45 AM
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <Calendar className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm text-blue-600 font-medium">Total Appointments</p>
                <p className="text-2xl font-bold text-blue-900">8</p>
              </div>
            </div>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm text-green-600 font-medium">Confirmed</p>
                <p className="text-2xl font-bold text-green-900">6</p>
              </div>
            </div>
          </div>
          <div className="bg-yellow-50 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-yellow-600" />
              <div>
                <p className="text-sm text-yellow-600 font-medium">Next Up</p>
                <p className="text-lg font-bold text-yellow-900">15 mins</p>
              </div>
            </div>
          </div>
          <div className="bg-red-50 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-red-600 rounded-full flex items-center justify-center text-white font-bold">
                !
              </div>
              <div>
                <p className="text-sm text-red-600 font-medium">Urgent</p>
                <p className="text-2xl font-bold text-red-900">1</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Appointments List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Today's Appointments</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {appointments.map((appointment) => (
            <div key={appointment.id} className="p-6 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-3">
                    <div className="text-lg font-semibold text-gray-900 min-w-[80px]">
                      {appointment.time}
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(appointment.status)}`}>
                      {getStatusText(appointment.status)}
                    </div>
                    <div className="text-sm text-gray-600">
                      {appointment.duration}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-lg font-medium text-gray-900">{appointment.patient}</h4>
                    <p className="text-gray-600">{appointment.service}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {appointment.provider}
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {appointment.room}
                      </div>
                    </div>
                    {appointment.notes && (
                      <p className="text-sm text-gray-600 italic">"{appointment.notes}"</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                  <button className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded">
                    Reschedule
                  </button>
                  <button className="px-3 py-1 text-sm text-green-600 hover:text-green-800 hover:bg-green-50 rounded">
                    Check In
                  </button>
                  <button className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded">
                    Notes
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
            <span className="font-medium">Schedule New Appointment</span>
          </button>
          <button className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Clock className="h-5 w-5 text-green-600" />
            <span className="font-medium">View Weekly Schedule</span>
          </button>
          <button className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Users className="h-5 w-5 text-purple-600" />
            <span className="font-medium">Provider Availability</span>
          </button>
        </div>
      </div>
    </div>
  );
}