import React from 'react';
import { FileText, Target, Calendar, Users, TrendingUp, Clock, Plus, Filter, CheckCircle, AlertCircle } from 'lucide-react';

export default function TreatmentPlansPage() {
  const treatmentPlans = [
    {
      id: 1,
      patient: 'Maria Chen',
      age: 40,
      mrn: 'MRN-2024001',
      treatmentType: 'Cognitive Behavioral Therapy',
      provider: 'Dr. Sarah Lee',
      startDate: '2024-11-30',
      nextReview: '2025-01-31',
      progress: 'Good improvement',
      status: 'active',
      sessionsCompleted: 6,
      sessionsAuthorized: 12,
      goals: [
        'Anxiety reduction through CBT techniques',
        'Develop coping skills for work stress',
        'Improve sleep quality and routine'
      ]
    },
    {
      id: 2,
      patient: 'David Kim',
      age: 47,
      mrn: 'MRN-2024002',
      treatmentType: 'Medication Management',
      provider: 'Dr. Michael Chang',
      startDate: '2024-10-15',
      nextReview: '2025-02-15',
      progress: 'Stable condition',
      status: 'active',
      sessionsCompleted: 4,
      sessionsAuthorized: 8,
      goals: [
        'Medication adherence monitoring',
        'Side effect management',
        'Dosage optimization'
      ]
    },
    {
      id: 3,
      patient: 'Lisa Wang',
      age: 30,
      mrn: 'MRN-2024003',
      treatmentType: 'Case Management + Mental Health',
      provider: 'Maria Rodriguez, MSW',
      startDate: '2024-12-01',
      nextReview: '2025-03-01',
      progress: 'Needs attention',
      status: 'urgent',
      sessionsCompleted: 2,
      sessionsAuthorized: 16,
      goals: [
        'Housing stability assistance',
        'Benefits enrollment support',
        'Mental health stabilization',
        'Employment assistance'
      ]
    },
    {
      id: 4,
      patient: 'James Nakamura',
      age: 34,
      mrn: 'MRN-2025001',
      treatmentType: 'Assessment & Intake',
      provider: 'Dr. Emily Honda',
      startDate: '2025-01-15',
      nextReview: '2025-02-15',
      progress: 'Assessment in progress',
      status: 'new',
      sessionsCompleted: 1,
      sessionsAuthorized: 6,
      goals: [
        'Complete comprehensive assessment',
        'Develop treatment recommendations',
        'Coordinate with appropriate services'
      ]
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'new': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Active Treatment';
      case 'urgent': return 'Needs Attention';
      case 'new': return 'New Patient';
      case 'completed': return 'Completed';
      default: return 'Unknown';
    }
  };

  const getProgressColor = (progress: string) => {
    if (progress.includes('Good') || progress.includes('Stable')) return 'text-green-600';
    if (progress.includes('Needs attention')) return 'text-red-600';
    if (progress.includes('progress')) return 'text-blue-600';
    return 'text-gray-600';
  };

  const calculateProgressPercentage = (completed: number, authorized: number) => {
    return Math.round((completed / authorized) * 100);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <FileText className="h-8 w-8 text-blue-600" />
            Treatment Plans
          </h1>
          <p className="mt-2 text-gray-600">
            Comprehensive treatment planning and progress tracking across all APCTC services
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex gap-3">
          <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <Filter className="h-4 w-4 mr-2" />
            Filter Plans
          </button>
          <button className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <Plus className="h-4 w-4 mr-2" />
            New Treatment Plan
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <FileText className="h-8 w-8 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600 font-medium">Total Plans</p>
              <p className="text-2xl font-bold text-gray-900">23</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <div>
              <p className="text-sm text-gray-600 font-medium">Active Treatment</p>
              <p className="text-2xl font-bold text-gray-900">18</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-8 w-8 text-red-600" />
            <div>
              <p className="text-sm text-gray-600 font-medium">Need Review</p>
              <p className="text-2xl font-bold text-gray-900">3</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-8 w-8 text-purple-600" />
            <div>
              <p className="text-sm text-gray-600 font-medium">Avg Progress</p>
              <p className="text-2xl font-bold text-gray-900">67%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Treatment Plans List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Current Treatment Plans</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {treatmentPlans.map((plan) => (
            <div key={plan.id} className="p-6 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-2">
                    <h4 className="text-lg font-semibold text-gray-900">{plan.patient}</h4>
                    <div className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(plan.status)}`}>
                      {getStatusText(plan.status)}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                    <span>Age {plan.age}</span>
                    <span>•</span>
                    <span>{plan.mrn}</span>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {plan.provider}
                    </div>
                  </div>
                  <p className="text-gray-700 font-medium mb-3">{plan.treatmentType}</p>
                </div>
                <div className="flex gap-2 ml-4">
                  <button className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded">
                    View Details
                  </button>
                  <button className="px-3 py-1 text-sm text-green-600 hover:text-green-800 hover:bg-green-50 rounded">
                    Update Plan
                  </button>
                </div>
              </div>

              {/* Progress Section */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h5 className="text-sm font-medium text-gray-700 mb-2">Session Progress</h5>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${calculateProgressPercentage(plan.sessionsCompleted, plan.sessionsAuthorized)}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      {calculateProgressPercentage(plan.sessionsCompleted, plan.sessionsAuthorized)}%
                    </span>
                  </div>
                  <p className="text-xs text-gray-600">
                    {plan.sessionsCompleted} of {plan.sessionsAuthorized} sessions completed
                  </p>
                </div>
                <div>
                  <h5 className="text-sm font-medium text-gray-700 mb-2">Progress Status</h5>
                  <p className={`text-sm font-medium ${getProgressColor(plan.progress)}`}>
                    {plan.progress}
                  </p>
                  <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                    <Calendar className="h-3 w-3" />
                    Next review: {new Date(plan.nextReview).toLocaleDateString()}
                  </div>
                </div>
                <div>
                  <h5 className="text-sm font-medium text-gray-700 mb-2">Treatment Duration</h5>
                  <p className="text-sm text-gray-600">
                    Started: {new Date(plan.startDate).toLocaleDateString()}
                  </p>
                  <p className="text-xs text-gray-500">
                    {Math.floor((new Date().getTime() - new Date(plan.startDate).getTime()) / (1000 * 60 * 60 * 24))} days in treatment
                  </p>
                </div>
              </div>

              {/* Treatment Goals */}
              <div>
                <h5 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                  <Target className="h-4 w-4" />
                  Treatment Goals
                </h5>
                <ul className="space-y-1">
                  {plan.goals.map((goal, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                      <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                      {goal}
                    </li>
                  ))}
                </ul>
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
            <span className="font-medium">Create New Treatment Plan</span>
          </button>
          <button className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Clock className="h-5 w-5 text-orange-600" />
            <span className="font-medium">Review Pending Plans</span>
          </button>
          <button className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <TrendingUp className="h-5 w-5 text-green-600" />
            <span className="font-medium">Progress Reports</span>
          </button>
        </div>
      </div>
    </div>
  );
}