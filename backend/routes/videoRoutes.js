import express from 'express';
import { getVideoInfo, getChannelAnalysis, searchVideos } from '../controllers/videoController.js';

const router = express.Router();

// POST /api/video-info
router.post('/video-info', getVideoInfo);

// POST /api/channel-analysis
router.post('/channel-analysis', getChannelAnalysis);

// POST /api/search-videos
router.post('/search-videos', searchVideos);

export default router; 