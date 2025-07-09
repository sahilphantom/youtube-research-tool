import { Link } from 'react-router-dom'
import { Youtube, BarChart3, Search, Download, TrendingUp, Users } from 'lucide-react'

const Home = () => {
  const features = [
    {
      title: 'Video Analysis',
      description: 'Get detailed information about any YouTube video including views, likes, upload date, and more.',
      icon: Youtube,
      path: '/video-analysis',
      color: 'bg-red-500'
    },
    {
      title: 'Channel Analysis',
      description: 'Comprehensive analysis of YouTube channels including subscriber count, average views, top videos, and trends.',
      icon: BarChart3,
      path: '/channel-analysis',
      color: 'bg-blue-500'
    },
    {
      title: 'Video Search',
      description: 'Search for videos with advanced filters including date range, view count, channel size, and more.',
      icon: Search,
      path: '/video-search',
      color: 'bg-green-500'
    }
  ]

  const benefits = [
    {
      icon: TrendingUp,
      title: 'Data-Driven Insights',
      description: 'Make informed decisions with comprehensive YouTube analytics and metrics.'
    },
    {
      icon: Download,
      title: 'CSV Export',
      description: 'Download all your research data in CSV format for further analysis in external tools.'
    },
    {
      icon: Users,
      title: 'Channel Research',
      description: 'Analyze channel performance, identify trends, and discover top-performing content.'
    }
  ]

  return (
    <div className="max-w-6xl mx-auto">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          YouTube Research Tool
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
          Comprehensive YouTube analytics and research platform. Analyze videos, channels, and search results with advanced filtering and data export capabilities.
        </p>
      </div>

      {/* Features Grid */}
      <div className="grid md:grid-cols-3 gap-8 mb-16">
        {features.map((feature) => {
          const Icon = feature.icon
          return (
            <Link
              key={feature.path}
              to={feature.path}
              className="card hover:shadow-lg transition-shadow duration-200 cursor-pointer"
            >
              <div className={`w-12 h-12 ${feature.color} rounded-lg flex items-center justify-center mb-4`}>
                <Icon className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600">
                {feature.description}
              </p>
            </Link>
          )
        })}
      </div>

      {/* Benefits Section */}
      <div className="bg-white rounded-lg shadow-md p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          Why Use Our Tool?
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon
            return (
              <div key={index} className="text-center">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Icon className="h-6 w-6 text-primary-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {benefit.title}
                </h3>
                <p className="text-gray-600">
                  {benefit.description}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default Home 