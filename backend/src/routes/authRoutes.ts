import { Router } from 'express';
import { login, refreshToken, logout, getCurrentUser } from '../controllers/index.js';
import { authenticate, authRateLimiter, asyncHandler } from '../middleware/index.js';
import { createRateLimiter } from '../middleware/rateLimiter.js';
import { requestSignup, signupStatus } from '../controllers/signupController.js';

const router = Router();

// Public routes
// Demandes d'accès : 20 par heure et par adresse IP, erreurs de saisie comprises (chaque demande est de toute façon validée par un administrateur)
const signupLimiter = createRateLimiter({ name: 'signup', windowMs: 60 * 60 * 1000, max: 20 });
router.get('/signup-status', signupStatus);
router.post('/signup', signupLimiter, requestSignup);
router.post('/login', authRateLimiter, asyncHandler(login));
router.post('/refresh', asyncHandler(refreshToken));

// Protected routes
router.post('/logout', asyncHandler(authenticate), asyncHandler(logout));
router.get('/me', asyncHandler(authenticate), asyncHandler(getCurrentUser));

export default router;
