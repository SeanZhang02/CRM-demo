import React from 'react';
import { Clock, User, FileText, Calendar, Target, Plus, Filter, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

export default function SessionsPage() {
  const sessions = [
    {
      id: 1,
      date: '2024-12-20',
      time: '2:00 PM',
      duration: '60 min',
      patient: 'Maria Chen',
      provider: 'Dr. Sarah Lee',
      service: 'Mental Health Counseling',
      type: 'Individual Therapy',
      status: 'completed',
      location: 'Alhambra Center - Room 203',
      notes: 'Good progress on anxiety management techniques. Patient reports improved sleep quality.',
      treatmentPlan: 'Cognitive Behavioral Therapy Plan',
      sessionNumber: 7,
      totalAuthorized: 12,
      goals: [
        'Practice deep breathing exercises',
        'Identify anxiety triggers',
        'Develop coping strategies'
      ],
      progress: 'Excellent progress',
      nextSession: '2024-12-27'
    },
    {
      id: 2,
      date: '2024-12-20',
      time: '10:30 AM',
      duration: '30 min',
      patient: 'David Kim',
      provider: 'Dr. Michael Chang',
      service: 'Medication Management',
      type: 'Medication Review',
      status: 'completed',
      location: 'Monterey Park Center - Room 105',
      notes: 'Medication adherence good. No significant side effects reported. Continue current dosage.',
      treatmentPlan: 'Bipolar Disorder Management',
      sessionNumber: 5,
      totalAuthorized: 8,
      goals: [
        'Monitor medication effectiveness',
        'Assess side effects',
        'Adjust dosage if needed'
      ],
      progress: 'Stable condition',
      nextSession: '2025-01-20'
    },
    {
      id: 3,
      date: '2024-12-19',
      time: '3:30 PM',
      duration: '45 min',
      patient: 'Lisa Wang',
      provider: 'Maria Rodriguez, MSW',
      service: 'Case Management',
      type: 'Support Services',
      status: 'completed',
      location: 'Los Angeles Center - Room 301',
      notes: 'Housing application submitted. Assisted with benefits enrollment. Follow-up needed on job placement.',
      treatmentPlan: 'Comprehensive Support Plan',
      sessionNumber: 3,
      totalAuthorized: 16,
      goals: [
        'Secure stable housing',
        'Complete benefits enrollment',
        'Find employment support'
      ],
      progress: 'Making progress',
      nextSession: '2024-12-26'
    },
    {
      id: 4,
      date: '2024-12-21',
      time: '11:30 AM',
      duration: '60 min',
      patient: 'James Nakamura',
      provider: 'Dr. Emily Honda',
      service: 'Assessment & Intake',
      type: 'Initial Assessment',
      status: 'scheduled',
      location: 'Orange Center - Room 201',
      notes: 'Initial comprehensive assessment appointment',
      treatmentPlan: 'Assessment Phase',
      sessionNumber: 2,
      totalAuthorized: 6,
      goals: [
        'Complete psychological assessment',
        'Develop treatment recommendations',
        'Coordinate service referrals'
      ],
      progress: 'Assessment in progress',
      nextSession: '2024-12-28'
    },
    {
      id: 5,
      date: '2024-12-18',
      time: '1:00 PM',
      duration: '90 min',
      patient: 'Robert Chen',
      provider: 'Dr. Sarah Lee',
      service: 'Family Therapy',
      type: 'Family Session',
      status: 'no_show',
      location: 'Alhambra Center - Room 203',
      notes: 'Patient and family did not attend scheduled session. Follow-up call made.',
      treatmentPlan: 'Family Therapy Plan',
      sessionNumber: 4,
      totalAuthorized: 10,
      goals: [
        'Improve family communication',
        'Address relationship conflicts',
        'Develop family coping strategies'
      ],
      progress: 'Needs attention',
      nextSession: '2024-12-25'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'scheduled': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'no_show': return 'bg-red-100 text-red-800 border-red-200';
      case 'cancelled': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Completed';
      case 'scheduled': return 'Scheduled';
      case 'no_show': return 'No Show';
      case 'cancelled': return 'Cancelled';
      default: return 'Unknown';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'scheduled': return <Clock className="h-4 w-4" />;
      case 'no_show': return <XCircle className="h-4 w-4" />;
      case 'cancelled': return <AlertTriangle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getProgressColor = (progress: string) => {
    if (progress.includes('Excellent') || progress.includes('Good')) return 'text-green-600';
    if (progress.includes('Stable')) return 'text-blue-600';
    if (progress.includes('Making')) return 'text-yellow-600';
    if (progress.includes('Needs')) return 'text-red-600';
    return 'text-gray-600';
  };

  const calculateProgressPercentage = (sessionNumber: number, totalAuthorized: number) => {
    return Math.round((sessionNumber / totalAuthorized) * 100);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <FileText className="h-8 w-8 text-blue-600" />
            Patient Sessions
          </h1>
          <p className="mt-2 text-gray-600">
            Session documentation and progress tracking across all APCTC treatment services
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex gap-3">
          <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <Filter className="h-4 w-4 mr-2" />
            Filter Sessions
          </button>
          <button className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <Plus className="h-4 w-4 mr-2" />
            Document Session
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <div>
              <p className="text-sm text-gray-600 font-medium">Completed Today</p>
              <p className="text-2xl font-bold text-gray-900">3</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <Clock className="h-8 w-8 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600 font-medium">Scheduled</p>
              <p className="text-2xl font-bold text-gray-900">1</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <XCircle className="h-8 w-8 text-red-600" />
            <div>
              <p className="text-sm text-gray-600 font-medium">No Shows</p>
              <p className="text-2xl font-bold text-gray-900">1</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <Target className="h-8 w-8 text-purple-600" />
            <div>
              <p className="text-sm text-gray-600 font-medium">Avg Progress</p>
              <p className="text-2xl font-bold text-gray-900">72%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Sessions List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Recent Sessions</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {sessions.map((session) => (
            <div key={session.id} className="p-6 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span className="text-lg font-semibold text-gray-900">
                        {new Date(session.date).toLocaleDateString()} at {session.time}
                      </span>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-1 ${getStatusColor(session.status)}`}>
                      {getStatusIcon(session.status)}
                      {getStatusText(session.status)}
                    </div>
                    <span className="text-sm text-gray-600">{session.duration}</span>
                  </div>

                  <div className="mb-3">
                    <h4 className="text-lg font-medium text-gray-900">{session.patient}</h4>
                    <p className="text-gray-600">{session.service} • {session.type}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        {session.provider}
                      </div>
                      <span>•</span>
                      <span>{session.location}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                  <button className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded">
                    View Details
                  </button>
                  <button className="px-3 py-1 text-sm text-green-600 hover:text-green-800 hover:bg-green-50 rounded">
                    Edit Notes
                  </button>
                </div>
              </div>

              {/* Session Progress and Goals */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                <div>
                  <h5 className="text-sm font-medium text-gray-700 mb-2">Treatment Progress</h5>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${calculateProgressPercentage(session.sessionNumber, session.totalAuthorized)}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {calculateProgressPercentage(session.sessionNumber, session.totalAuthorized)}%
                      </span>
                    </div>
                    <p className="text-xs text-gray-600">
                      Session {session.sessionNumber} of {session.totalAuthorized} authorized
                    </p>
                    <p className={`text-sm font-medium mt-1 ${getProgressColor(session.progress)}`}>
                      {session.progress}
                    </p>
                  </div>
                </div>

                <div>
                  <h5 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                    <Target className="h-4 w-4" />
                    Session Goals
                  </h5>
                  <ul className="space-y-1">
                    {session.goals.map((goal, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                        <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                        {goal}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Session Notes */}
              <div className="bg-blue-50 rounded-lg p-4 mb-3">
                <h5 className="text-sm font-medium text-gray-700 mb-2">Session Notes</h5>
                <p className="text-sm text-gray-700">{session.notes}</p>
              </div>

              {/* Treatment Plan and Next Session */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-sm text-gray-600">
                <div>
                  <span className="font-medium">Treatment Plan:</span> {session.treatmentPlan}
                </div>
                {session.nextSession && (
                  <div className="mt-1 sm:mt-0">
                    <span className="font-medium">Next Session:</span> {new Date(session.nextSession).toLocaleDateString()}
                  </div>
                )}
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
            <span className="font-medium">Document New Session</span>
          </button>
          <button className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <FileText className="h-5 w-5 text-green-600" />
            <span className="font-medium">Generate Progress Report</span>
          </button>
          <button className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Target className="h-5 w-5 text-purple-600" />
            <span className="font-medium">Review Treatment Goals</span>
          </button>
        </div>
      </div>
    </div>
  );
}