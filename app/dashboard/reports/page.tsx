import {
  ChartBarIcon,
  CurrencyDollarIcon,
  UsersIcon,
  TrophyIcon,
  ArrowTrendingUpIcon,
  DocumentChartBarIcon,
  CalendarIcon
} from '@heroicons/react/24/outline'

/**
 * Reports Page
 *
 * Features:
 * - CRM analytics and metrics dashboard
 * - Sales performance charts
 * - Pipeline analysis
 * - Export capabilities
 * - Desktop-optimized layout
 */

// Mock data for reports - in real implementation, this would come from API
const salesMetrics = {
  thisMonth: {
    revenue: 145000,
    deals: 8,
    activities: 47,
    conversion: 24.5
  },
  lastMonth: {
    revenue: 128000,
    deals: 6,
    activities: 39,
    conversion: 21.8
  }
}

const pipelineData = [
  { stage: 'Lead', deals: 23, value: 890000, probability: 0.1 },
  { stage: 'Qualified', deals: 15, value: 650000, probability: 0.25 },
  { stage: 'Proposal', deals: 8, value: 420000, probability: 0.5 },
  { stage: 'Negotiation', deals: 5, value: 285000, probability: 0.75 },
  { stage: 'Closed Won', deals: 3, value: 145000, probability: 1.0 },
]

const topPerformers = [
  { name: 'Sarah Johnson', deals: 12, revenue: 425000, target: 400000 },
  { name: 'Mike Chen', deals: 8, revenue: 320000, target: 350000 },
  { name: 'Alex Rivera', deals: 6, revenue: 280000, target: 300000 },
  { name: 'Jessica Park', deals: 5, revenue: 195000, target: 250000 },
]

const recentDeals = [
  { company: 'Acme Corp', value: 45000, stage: 'Closed Won', date: '2024-01-18' },
  { company: 'Beta Inc', value: 32000, stage: 'Negotiation', date: '2024-01-17' },
  { company: 'Charlie Co', value: 28000, stage: 'Proposal', date: '2024-01-16' },
  { company: 'Delta LLC', value: 55000, stage: 'Qualified', date: '2024-01-15' },
]

const calculateGrowth = (current: number, previous: number) => {
  const growth = ((current - previous) / previous) * 100
  return { value: Math.abs(growth), isPositive: growth >= 0 }
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(amount)
}

const formatPercentage = (value: number) => {
  return `${value.toFixed(1)}%`
}

export default function ReportsPage() {
  const revenueGrowth = calculateGrowth(salesMetrics.thisMonth.revenue, salesMetrics.lastMonth.revenue)
  const dealsGrowth = calculateGrowth(salesMetrics.thisMonth.deals, salesMetrics.lastMonth.deals)
  const activitiesGrowth = calculateGrowth(salesMetrics.thisMonth.activities, salesMetrics.lastMonth.activities)
  const conversionGrowth = calculateGrowth(salesMetrics.thisMonth.conversion, salesMetrics.lastMonth.conversion)

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <ChartBarIcon className="h-6 w-6 mr-3 text-blue-600" />
            Reports & Analytics
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Track your sales performance and business metrics
          </p>
        </div>
        <div className="flex space-x-3">
          <button className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700
                           bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50
                           focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
            <CalendarIcon className="h-4 w-4 mr-2" />
            Last 30 Days
          </button>
          <button className="inline-flex items-center px-4 py-2 text-sm font-medium text-white
                           bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700
                           focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
            <DocumentChartBarIcon className="h-4 w-4 mr-2" />
            Export Report
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm ring-1 ring-gray-900/5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Revenue</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(salesMetrics.thisMonth.revenue)}
              </p>
              <div className={`flex items-center text-sm ${
                revenueGrowth.isPositive ? 'text-green-600' : 'text-red-600'
              }`}>
                <ArrowTrendingUpIcon className={`h-4 w-4 mr-1 ${
                  !revenueGrowth.isPositive ? 'transform rotate-180' : ''
                }`} />
                {formatPercentage(revenueGrowth.value)} vs last month
              </div>
            </div>
            <CurrencyDollarIcon className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm ring-1 ring-gray-900/5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Deals Closed</p>
              <p className="text-2xl font-bold text-gray-900">{salesMetrics.thisMonth.deals}</p>
              <div className={`flex items-center text-sm ${
                dealsGrowth.isPositive ? 'text-green-600' : 'text-red-600'
              }`}>
                <ArrowTrendingUpIcon className={`h-4 w-4 mr-1 ${
                  !dealsGrowth.isPositive ? 'transform rotate-180' : ''
                }`} />
                {formatPercentage(dealsGrowth.value)} vs last month
              </div>
            </div>
            <TrophyIcon className="h-8 w-8 text-yellow-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm ring-1 ring-gray-900/5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Activities</p>
              <p className="text-2xl font-bold text-gray-900">{salesMetrics.thisMonth.activities}</p>
              <div className={`flex items-center text-sm ${
                activitiesGrowth.isPositive ? 'text-green-600' : 'text-red-600'
              }`}>
                <ArrowTrendingUpIcon className={`h-4 w-4 mr-1 ${
                  !activitiesGrowth.isPositive ? 'transform rotate-180' : ''
                }`} />
                {formatPercentage(activitiesGrowth.value)} vs last month
              </div>
            </div>
            <CalendarIcon className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm ring-1 ring-gray-900/5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatPercentage(salesMetrics.thisMonth.conversion)}
              </p>
              <div className={`flex items-center text-sm ${
                conversionGrowth.isPositive ? 'text-green-600' : 'text-red-600'
              }`}>
                <ArrowTrendingUpIcon className={`h-4 w-4 mr-1 ${
                  !conversionGrowth.isPositive ? 'transform rotate-180' : ''
                }`} />
                {formatPercentage(conversionGrowth.value)} vs last month
              </div>
            </div>
            <ChartBarIcon className="h-8 w-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Charts and Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Pipeline Analysis */}
        <div className="bg-white p-6 rounded-lg shadow-sm ring-1 ring-gray-900/5">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Sales Pipeline</h3>
          <div className="space-y-4">
            {pipelineData.map((stage, index) => (
              <div key={stage.stage} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: `hsl(${index * 72}, 70%, 50%)` }}
                  />
                  <span className="text-sm font-medium text-gray-900">{stage.stage}</span>
                </div>
                <div className="flex items-center space-x-6 text-sm text-gray-600">
                  <span>{stage.deals} deals</span>
                  <span className="font-medium">{formatCurrency(stage.value)}</span>
                  <span>{formatPercentage(stage.probability * 100)} prob.</span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex justify-between text-sm">
              <span className="font-medium text-gray-900">Total Pipeline</span>
              <span className="font-bold text-gray-900">
                {formatCurrency(pipelineData.reduce((sum, stage) => sum + stage.value, 0))}
              </span>
            </div>
          </div>
        </div>

        {/* Top Performers */}
        <div className="bg-white p-6 rounded-lg shadow-sm ring-1 ring-gray-900/5">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Top Performers</h3>
          <div className="space-y-4">
            {topPerformers.map((performer, index) => (
              <div key={performer.name} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-600">
                        {performer.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">{performer.name}</div>
                    <div className="text-xs text-gray-500">{performer.deals} deals closed</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">
                    {formatCurrency(performer.revenue)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatPercentage((performer.revenue / performer.target) * 100)} of target
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Deals */}
      <div className="bg-white shadow-sm ring-1 ring-gray-900/5 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Recent Deals</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Company
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Value
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stage
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentDeals.map((deal, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {deal.company}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(deal.value)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      deal.stage === 'Closed Won'
                        ? 'text-green-600 bg-green-50'
                        : deal.stage === 'Negotiation'
                        ? 'text-blue-600 bg-blue-50'
                        : deal.stage === 'Proposal'
                        ? 'text-yellow-600 bg-yellow-50'
                        : 'text-gray-600 bg-gray-50'
                    }`}>
                      {deal.stage}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(deal.date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}