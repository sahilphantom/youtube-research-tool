// Utility function to convert JSON to CSV
export function jsonToCSV(data, type) {
  if (!data || data.length === 0) {
    return '';
  }

  let headers = [];
  let rows = [];

  switch (type) {
    case 'video-info':
      headers = ['Video ID', 'Title', 'Channel', 'Views', 'Likes', 'Upload Date', 'Duration', 'Description'];
      rows = [[
        data.videoId,
        `"${data.title?.replace(/"/g, '""')}"`,
        `"${data.channelTitle?.replace(/"/g, '""')}"`,
        data.viewCount,
        data.likeCount,
        data.uploadDate,
        data.duration,
        `"${data.description?.replace(/"/g, '""')}"`
      ]];
      break;

    case 'channel-analysis':
      headers = ['Channel ID', 'Channel Title', 'Subscribers', 'Total Videos', 'Avg Views', 'Avg Duration (sec)'];
      rows = [[
        data.channelId,
        `"${data.channelTitle?.replace(/"/g, '""')}"`,
        data.totalSubscribers,
        data.totalVideos,
        data.avgViews,
        data.avgDurationSec
      ]];
      break;

    case 'search-results':
      headers = ['Video ID', 'Title', 'Channel', 'Views', 'Likes', 'Upload Date', 'Duration', 'Description'];
      rows = data.videos.map(video => [
        video.videoId,
        `"${video.title?.replace(/"/g, '""')}"`,
        `"${video.channelTitle?.replace(/"/g, '""')}"`,
        video.viewCount,
        video.likeCount,
        video.uploadDate,
        video.duration,
        `"${video.description?.replace(/"/g, '""')}"`
      ]);
      break;

    case 'top-videos':
      headers = ['Rank', 'Video ID', 'Title', 'Views', 'Upload Date', 'Duration'];
      rows = data.topVideos.map((video, index) => [
        index + 1,
        video.videoId,
        `"${video.title?.replace(/"/g, '""')}"`,
        video.views,
        video.publishedAt,
        video.duration
      ]);
      break;

    case 'outlier-videos':
      headers = ['Video ID', 'Title', 'Views', 'Avg Views', 'Ratio', 'Upload Date'];
      rows = data.outlierVideos.map(video => [
        video.videoId,
        `"${video.title?.replace(/"/g, '""')}"`,
        video.views,
        data.avgViews,
        (video.views / data.avgViews).toFixed(2),
        video.publishedAt
      ]);
      break;

    default:
      return '';
  }

  const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  return csvContent;
}

// Generate filename with timestamp
export function generateFilename(type, query = '') {
  const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
  const prefix = query ? query.replace(/[^a-zA-Z0-9]/g, '_') : '';
  return `${type}_${prefix}_${timestamp}.csv`;
} 