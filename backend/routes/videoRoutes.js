import express from 'express';
import { getVideoInfo } from '../controllers/videoController.js';

const router = express.Router();

// POST /api/video-info
router.post('/video-info', getVideoInfo);

export default router; 