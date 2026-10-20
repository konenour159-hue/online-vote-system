import { Router } from 'express';
import { getSystemStats, getUserActivityLog, getAllActivity } from '../controllers/analyticsController.js';
import { authenticate, authorize, asyncHandler } from '../middleware/index.js';

const router = Router();

// Réservé aux super administrateurs
const superAdmin = [asyncHandler(authenticate), asyncHandler(authorize(['SUPER_ADMIN']))];
router.get('/system/stats', ...superAdmin, asyncHandler(getSystemStats));
router.get('/system/activity', ...superAdmin, asyncHandler(getAllActivity));

// Activité de l'utilisateur connecté
router.get('/user/activity-log', asyncHandler(authenticate), asyncHandler(getUserActivityLog));

export default router;
