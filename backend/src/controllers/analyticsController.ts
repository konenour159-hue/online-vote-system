import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/index.js';
import { analyticsService } from '../services/analyticsService.js';
import { sendSuccess } from '../utils/response.js';
import { ValidationError } from '../utils/errors.js';

export const getSystemStats = asyncHandler(async (_req: Request, res: Response) => {
  const stats = await analyticsService.getSystemStats();
  sendSuccess(res, 200, 'System statistics retrieved', stats);
});

export const getAllActivity = asyncHandler(async (req: Request, res: Response) => {
  const limit = Math.min(Math.max(parseInt(req.query.limit as string) || 50, 1), 200);
  const action = typeof req.query.action === 'string' && req.query.action ? req.query.action : undefined;

  const result = await analyticsService.getAllActivity(limit, action);
  sendSuccess(res, 200, 'Activity log retrieved', result);
});

export const getUserActivityLog = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ValidationError('User not authenticated');
  }

  const limit = parseInt(req.query.limit as string) || 50;
  const logs = await analyticsService.getUserActivityLog(req.user.userId, limit);
  sendSuccess(res, 200, 'User activity log retrieved', logs);
});
