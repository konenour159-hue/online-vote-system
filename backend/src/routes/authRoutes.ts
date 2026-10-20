import { Router } from 'express';
import { login, refreshToken, logout, getCurrentUser } from '../controllers/index.js';
import { authenticate, authRateLimiter, asyncHandler } from '../middleware/index.js';

const router = Router();

// Public routes
router.post('/login', authRateLimiter, asyncHandler(login));
router.post('/refresh', asyncHandler(refreshToken));

// Protected routes
router.post('/logout', asyncHandler(authenticate), asyncHandler(logout));
router.get('/me', asyncHandler(authenticate), asyncHandler(getCurrentUser));

export default router;
