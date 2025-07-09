import axios from 'axios';
import { jsonToCSV, generateFilename } from '../utils/csvExporter.js';

// Helper function to extract video ID from URL
function extractVideoId(url) {
  const regex = /(?:v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

// Helper to extract channel ID from URL
function extractChannelId(url) {
  // Handles /channel/ID, /user/USERNAME, /@handle, and /c/CUSTOM
  const channelRegex = /(?:channel\/|\/c\/|\/user\/|@)([\w-]+)/;
  const match = url.match(channelRegex);
  return match ? match[1] : null;
}

export const getVideoInfo = async (req, res) => {
  const { url, format = 'json' } = req.body;
  if (!url) {
    return res.status(400).json({ error: 'No URL provided', body: req.body });
  }
  const videoId = extractVideoId(url);
  if (!videoId) {
    return res.status(400).json({ error: 'Invalid YouTube video URL' });
  }
  try {
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'YouTube API key not configured' });
    }
    const apiUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=${videoId}&key=${apiKey}`;
    const response = await axios.get(apiUrl);
    const items = response.data.items;
    if (!items || items.length === 0) {
      return res.status(404).json({ error: 'Video not found' });
    }
    const video = items[0];
    const { snippet, statistics, contentDetails } = video;
    const responseData = {
      videoId,
      title: snippet.title,
      channelTitle: snippet.channelTitle,
      viewCount: statistics.viewCount,
      likeCount: statistics.likeCount,
      uploadDate: snippet.publishedAt,
      description: snippet.description,
      tags: snippet.tags || [],
      duration: contentDetails.duration
    };

    if (format === 'csv') {
      const csvData = jsonToCSV(responseData, 'video-info');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${generateFilename('video-info', snippet.title)}"`);
      res.send(csvData);
    } else {
      res.json(responseData);
    }
  } catch (error) {
    console.error('YouTube API Error:', error.response?.data || error.message);
    if (error.response?.status === 400) {
      return res.status(500).json({
        error: 'YouTube API Error',
        details: error.response.data?.error?.message || 'Invalid API key or request'
      });
    }
    res.status(500).json({ error: 'Failed to fetch video info', details: error.message });
  }
};

export const getChannelAnalysis = async (req, res) => {
  const { url, format = 'json' } = req.body;
  if (!url) {
    return res.status(400).json({ error: 'No URL provided', body: req.body });
  }
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'YouTube API key not configured' });
  }
  // 1. Extract channel ID
  let channelId = extractChannelId(url);
  let channelInfo;
  try {
    // If not a channel ID, resolve from username or handle
    if (!url.includes('/channel/')) {
      // Use search.list to resolve channel ID
      const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${encodeURIComponent(url)}&key=${apiKey}`;
      const searchResp = await axios.get(searchUrl);
      if (searchResp.data.items && searchResp.data.items.length > 0) {
        channelId = searchResp.data.items[0].snippet.channelId;
      } else {
        return res.status(404).json({ error: 'Channel not found' });
      }
    }
    // 2. Fetch channel info
    const channelUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,contentDetails&id=${channelId}&key=${apiKey}`;
    const channelResp = await axios.get(channelUrl);
    if (!channelResp.data.items || channelResp.data.items.length === 0) {
      return res.status(404).json({ error: 'Channel not found' });
    }
    channelInfo = channelResp.data.items[0];
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch channel info', details: err.message });
  }

  // 3. Fetch up to 100 videos from uploads playlist
  const uploadsPlaylistId = channelInfo.contentDetails.relatedPlaylists.uploads;
  let videos = [];
  let nextPageToken = '';
  try {
    while (videos.length < 100) {
      const playlistUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&playlistId=${uploadsPlaylistId}&maxResults=50&pageToken=${nextPageToken}&key=${apiKey}`;
      const playlistResp = await axios.get(playlistUrl);
      videos = videos.concat(playlistResp.data.items);
      nextPageToken = playlistResp.data.nextPageToken;
      if (!nextPageToken) break;
    }
    videos = videos.slice(0, 100);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch channel videos', details: err.message });
  }

  // 4. Fetch video stats in batches
  const videoIds = videos.map(v => v.contentDetails.videoId).filter(Boolean);
  let videoStats = [];
  try {
    for (let i = 0; i < videoIds.length; i += 50) {
      const batchIds = videoIds.slice(i, i + 50).join(',');
      const statsUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=${batchIds}&key=${apiKey}`;
      const statsResp = await axios.get(statsUrl);
      videoStats = videoStats.concat(statsResp.data.items);
    }
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch video stats', details: err.message });
  }

  // 5. Calculate metrics
  const totalVideos = videoStats.length;
  const totalSubscribers = parseInt(channelInfo.statistics.subscriberCount || '0', 10);
  let totalViews = 0;
  let totalDurationSec = 0;
  let uploadTimes = [];
  let tags = [];
  let viewCounts = [];
  let videoData = [];

  function parseISODuration(iso) {
    // e.g. PT1H2M3S
    if (!iso) return 0;
    const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return 0;
    const [, h, m, s] = match.map(x => parseInt(x || '0', 10));
    return h * 3600 + m * 60 + s;
  }

  for (const v of videoStats) {
    const views = parseInt(v.statistics.viewCount || '0', 10);
    const durationSec = parseISODuration(v.contentDetails.duration);
    totalViews += views;
    totalDurationSec += durationSec;
    uploadTimes.push(v.snippet.publishedAt);
    if (v.snippet.tags) tags.push(...v.snippet.tags);
    viewCounts.push(views);
    videoData.push({
      videoId: v.id,
      title: v.snippet.title,
      views,
      duration: v.contentDetails.duration,
      publishedAt: v.snippet.publishedAt,
      tags: v.snippet.tags || []
    });
  }

  const avgViews = totalVideos ? totalViews / totalVideos : 0;
  const avgDurationSec = totalVideos ? totalDurationSec / totalVideos : 0;

  // Distribution of upload times (by hour UTC)
  const uploadHourDist = {};
  uploadTimes.forEach(time => {
    const hour = new Date(time).getUTCHours();
    uploadHourDist[hour] = (uploadHourDist[hour] || 0) + 1;
  });

  // Tag frequency
  const tagFreq = {};
  tags.forEach(tag => {
    tagFreq[tag] = (tagFreq[tag] || 0) + 1;
  });
  const sortedTags = Object.entries(tagFreq).sort((a, b) => b[1] - a[1]);

  // Top 10 most viewed videos
  const topVideos = [...videoData].sort((a, b) => b.views - a.views).slice(0, 10);

  // Outlier videos (views > 5x avg)
  const outlierVideos = videoData.filter(v => v.views > 5 * avgViews);

  const responseData = {
    channelId,
    channelTitle: channelInfo.snippet.title,
    totalSubscribers,
    totalVideos,
    avgViews: Math.round(avgViews),
    avgDurationSec: Math.round(avgDurationSec),
    uploadHourDist,
    topTags: sortedTags.slice(0, 10),
    topVideos,
    outlierVideos
  };

  if (format === 'csv') {
    const csvData = jsonToCSV(responseData, 'channel-analysis');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${generateFilename('channel-analysis', channelInfo.snippet.title)}"`);
    res.send(csvData);
  } else {
    res.json(responseData);
  }
};

export const searchVideos = async (req, res) => {
  const {
    query,
    uploadDateAfter,
    uploadDateBefore,
    sortBy = 'relevance', // relevance, viewCount, rating, date
    videoType = 'any', // any, movie, episode, short
    channelSubscriberRange,
    viewToSubRatio,
    maxResults = 50,
    format = 'json'
  } = req.body;

  if (!query) {
    return res.status(400).json({ error: 'Search query is required' });
  }

  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'YouTube API key not configured' });
  }

  try {
    // Build search parameters
    const searchParams = new URLSearchParams({
      part: 'snippet',
      q: query,
      type: 'video',
      maxResults: Math.min(maxResults, 50), // YouTube API max is 50
      order: sortBy,
      key: apiKey
    });

    // Add date filters if provided
    if (uploadDateAfter) {
      searchParams.append('publishedAfter', uploadDateAfter);
    }
    if (uploadDateBefore) {
      searchParams.append('publishedBefore', uploadDateBefore);
    }

    // Add video type filter
    if (videoType === 'short') {
      searchParams.append('videoDuration', 'short');
    } else if (videoType === 'long') {
      searchParams.append('videoDuration', 'medium');
    }

    const searchUrl = `https://www.googleapis.com/youtube/v3/search?${searchParams.toString()}`;
    const searchResponse = await axios.get(searchUrl);
    
    if (!searchResponse.data.items || searchResponse.data.items.length === 0) {
      return res.json({ videos: [], totalResults: 0 });
    }

    // Get video IDs for detailed stats
    const videoIds = searchResponse.data.items.map(item => item.id.videoId);
    
    // Fetch detailed video information
    const videoDetailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=${videoIds.join(',')}&key=${apiKey}`;
    const videoDetailsResponse = await axios.get(videoDetailsUrl);
    
    let videos = videoDetailsResponse.data.items || [];

    // Apply additional filters
    if (channelSubscriberRange || viewToSubRatio) {
      // Get channel IDs for subscriber info
      const channelIds = [...new Set(videos.map(v => v.snippet.channelId))];
      const channelDetailsUrl = `https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${channelIds.join(',')}&key=${apiKey}`;
      const channelResponse = await axios.get(channelDetailsUrl);
      
      const channelStats = {};
      channelResponse.data.items.forEach(channel => {
        channelStats[channel.id] = parseInt(channel.statistics.subscriberCount || '0', 10);
      });

      // Apply subscriber range filter
      if (channelSubscriberRange) {
        const [min, max] = channelSubscriberRange.split('-').map(s => parseInt(s, 10));
        videos = videos.filter(video => {
          const subscribers = channelStats[video.snippet.channelId] || 0;
          return subscribers >= min && subscribers <= max;
        });
      }

      // Apply view-to-subscriber ratio filter
      if (viewToSubRatio) {
        const ratio = parseFloat(viewToSubRatio);
        videos = videos.filter(video => {
          const views = parseInt(video.statistics.viewCount || '0', 10);
          const subscribers = channelStats[video.snippet.channelId] || 1;
          return (views / subscribers) >= ratio;
        });
      }
    }

    // Format response
    const formattedVideos = videos.map(video => ({
      videoId: video.id,
      title: video.snippet.title,
      channelTitle: video.snippet.channelTitle,
      channelId: video.snippet.channelId,
      viewCount: parseInt(video.statistics.viewCount || '0', 10),
      likeCount: parseInt(video.statistics.likeCount || '0', 10),
      uploadDate: video.snippet.publishedAt,
      description: video.snippet.description,
      duration: video.contentDetails.duration,
      thumbnail: video.snippet.thumbnails?.high?.url
    }));

    const responseData = {
      videos: formattedVideos,
      totalResults: searchResponse.data.pageInfo.totalResults,
      resultsPerPage: searchResponse.data.pageInfo.resultsPerPage
    };

    if (format === 'csv') {
      const csvData = jsonToCSV(responseData, 'search-results');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${generateFilename('search-results', query)}"`);
      res.send(csvData);
    } else {
      res.json(responseData);
    }

  } catch (error) {
    console.error('Search API Error:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Failed to search videos', 
      details: error.response?.data?.error?.message || error.message 
    });
  }
}; 