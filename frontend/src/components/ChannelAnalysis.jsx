import { useState } from 'react'
import { BarChart3, Download, Users, Eye, Clock, TrendingUp, Star, AlertTriangle } from 'lucide-react'
import { getChannelAnalysis, downloadCSV } from '../services/api'

const ChannelAnalysis = () => {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [channelData, setChannelData] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!url.trim()) {
      setError('Please enter a YouTube channel URL')
      return
    }

    setLoading(true)
    setError('')
    setChannelData(null)

    try {
      const data = await getChannelAnalysis(url)
      setChannelData(data)
    } catch (err) {
      setError(err.error || 'Failed to fetch channel information')
    } finally {
      setLoading(false)
    }
  }

  const handleCSVDownload = async () => {
    if (!channelData) return

    try {
      setLoading(true)
      const csvData = await getChannelAnalysis(url, 'csv')
      const filename = `channel-analysis_${channelData.channelTitle?.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.csv`
      downloadCSV(csvData, filename)
    } catch (err) {
      setError('Failed to download CSV')
    } finally {
      setLoading(false)
    }
  }

  const formatNumber = (num) => {
    if (!num) return '0'
    return new Intl.NumberFormat().format(num)
  }

  const formatDuration = (seconds) => {
    if (!seconds) return '0s'
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    const parts = []
    if (hours > 0) parts.push(`${hours}h`)
    if (minutes > 0) parts.push(`${minutes}m`)
    if (secs > 0) parts.push(`${secs}s`)
    
    return parts.join(' ') || '0s'
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Channel Analysis</h1>
        <p className="text-gray-600">Comprehensive analysis of YouTube channels</p>
      </div>

      {/* Input Form */}
      <div className="card mb-8">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-2">
              YouTube Channel URL
            </label>
            <input
              type="url"
              id="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.youtube.com/@channel or https://www.youtube.com/channel/..."
              className="input-field"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full md:w-auto"
          >
            {loading ? 'Analyzing...' : 'Analyze Channel'}
          </button>
        </form>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Results */}
      {channelData && (
        <div className="space-y-6">
          {/* Channel Overview */}
          <div className="card">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{channelData.channelTitle}</h2>
                <p className="text-gray-600">Channel ID: {channelData.channelId}</p>
              </div>
              <button
                onClick={handleCSVDownload}
                disabled={loading}
                className="btn-secondary flex items-center space-x-2"
              >
                <Download className="h-4 w-4" />
                <span>Export CSV</span>
              </button>
            </div>

            {/* Key Metrics */}
            <div className="grid md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mx-auto mb-2">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900">{formatNumber(channelData.totalSubscribers)}</h3>
                <p className="text-sm text-gray-600">Subscribers</p>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mx-auto mb-2">
                  <Eye className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="font-semibold text-gray-900">{formatNumber(channelData.avgViews)}</h3>
                <p className="text-sm text-gray-600">Avg Views</p>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg mx-auto mb-2">
                  <Clock className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="font-semibold text-gray-900">{formatDuration(channelData.avgDurationSec)}</h3>
                <p className="text-sm text-gray-600">Avg Duration</p>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-orange-100 rounded-lg mx-auto mb-2">
                  <BarChart3 className="h-6 w-6 text-orange-600" />
                </div>
                <h3 className="font-semibold text-gray-900">{formatNumber(channelData.totalVideos)}</h3>
                <p className="text-sm text-gray-600">Total Videos</p>
              </div>
            </div>
          </div>

          {/* Top Videos */}
          {channelData.topVideos && channelData.topVideos.length > 0 && (
            <div className="card">
              <div className="flex items-center space-x-2 mb-4">
                <Star className="h-5 w-5 text-yellow-600" />
                <h3 className="text-lg font-semibold text-gray-900">Top 10 Most Viewed Videos</h3>
              </div>
              <div className="space-y-3">
                {channelData.topVideos.map((video, index) => (
                  <div key={video.videoId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <span className="font-semibold text-gray-600">#{index + 1}</span>
                      <div>
                        <h4 className="font-medium text-gray-900">{video.title}</h4>
                        <p className="text-sm text-gray-600">
                          {formatNumber(video.views)} views • {new Date(video.publishedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <a
                      href={`https://www.youtube.com/watch?v=${video.videoId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-600 hover:text-primary-700 text-sm"
                    >
                      Watch
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Outlier Videos */}
          {channelData.outlierVideos && channelData.outlierVideos.length > 0 && (
            <div className="card">
              <div className="flex items-center space-x-2 mb-4">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                <h3 className="text-lg font-semibold text-gray-900">Outlier Videos (5x+ Average Views)</h3>
              </div>
              <div className="space-y-3">
                {channelData.outlierVideos.map((video) => (
                  <div key={video.videoId} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div>
                        <h4 className="font-medium text-gray-900">{video.title}</h4>
                        <p className="text-sm text-gray-600">
                          {formatNumber(video.views)} views • {(video.views / channelData.avgViews).toFixed(1)}x average
                        </p>
                      </div>
                    </div>
                    <a
                      href={`https://www.youtube.com/watch?v=${video.videoId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-600 hover:text-primary-700 text-sm"
                    >
                      Watch
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top Tags */}
          {channelData.topTags && channelData.topTags.length > 0 && (
            <div className="card">
              <div className="flex items-center space-x-2 mb-4">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <h3 className="text-lg font-semibold text-gray-900">Most Used Tags</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {channelData.topTags.map(([tag, count]) => (
                  <span
                    key={tag}
                    className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm"
                  >
                    {tag} ({count})
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Upload Time Distribution */}
          {channelData.uploadHourDist && Object.keys(channelData.uploadHourDist).length > 0 && (
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload Time Distribution (UTC)</h3>
              <div className="grid grid-cols-6 md:grid-cols-12 gap-2">
                {Array.from({ length: 24 }, (_, hour) => (
                  <div key={hour} className="text-center">
                    <div className="text-xs text-gray-600 mb-1">{hour}:00</div>
                    <div className="bg-blue-100 rounded text-xs p-1">
                      {channelData.uploadHourDist[hour] || 0}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default ChannelAnalysis 