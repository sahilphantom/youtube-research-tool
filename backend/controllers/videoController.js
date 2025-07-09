import axios from 'axios';

// Helper function to extract video ID from URL
function extractVideoId(url) {
  const regex = /(?:v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

export const getVideoInfo = async (req, res) => {
  const { url } = req.body;
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
    res.json({
      videoId,
      title: snippet.title,
      channelTitle: snippet.channelTitle,
      viewCount: statistics.viewCount,
      likeCount: statistics.likeCount,
      uploadDate: snippet.publishedAt,
      description: snippet.description,
      tags: snippet.tags || [],
      duration: contentDetails.duration
    });
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