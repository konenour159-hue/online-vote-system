import { Request, Response } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../middleware/index.js';
import { signupService } from '../services/signupService.js';
import { sendSuccess } from '../utils/response.js';
import { UserError } from '../utils/errors.js';
import { recordAudit } from '../utils/audit.js';

export const requestSignup = asyncHandler(async (req: Request, res: Response) => {
  res.setHeader('Cache-Control', 'no-store');
  sendSuccess(res, 202, 'Signup request received', await signupService.request(req.body));
});

export const signupStatus = asyncHandler(async (_req: Request, res: Response) => {
  sendSuccess(res, 200, 'Signup status retrieved', { open: await signupService.isOpen() });
});

// --- Super administrateur ---

export const listSignups = asyncHandler(async (req: Request, res: Response) => {
  const status = typeof req.query.status === 'string' && ['PENDING', 'APPROVED', 'REJECTED'].includes(req.query.status) ? req.query.status : undefined;
  sendSuccess(res, 200, 'Signups retrieved', await signupService.list(status));
});

const reviewerId = (req: Request): string => {
  if (!req.user) throw new UserError(401, 'Connexion requise.');
  return req.user.userId;
};

export const approveSignup = asyncHandler(async (req: Request, res: Response) => {
  const result = await signupService.decide(reviewerId(req), req.params.id, 'approve');
  recordAudit(reviewerId(req), 'SIGNUP_APPROVED', req, { entity: 'User', entityId: result.id, changes: { email: result.email } });
  sendSuccess(res, 200, 'Signup approved', result);
});

export const rejectSignup = asyncHandler(async (req: Request, res: Response) => {
  const result = await signupService.decide(reviewerId(req), req.params.id, 'reject');
  recordAudit(reviewerId(req), 'SIGNUP_REJECTED', req, { entity: 'User', entityId: result.id, changes: { email: result.email } });
  sendSuccess(res, 200, 'Signup rejected', result);
});

export const setSignupsOpen = asyncHandler(async (req: Request, res: Response) => {
  const parsed = z.object({ open: z.boolean() }).safeParse(req.body);
  if (!parsed.success) throw new UserError(400, 'Valeur invalide.');
  const open = await signupService.setOpen(parsed.data.open);
  recordAudit(reviewerId(req), open ? 'SIGNUPS_OPENED' : 'SIGNUPS_CLOSED', req, { entity: 'Setting', entityId: 'signups_open' });
  sendSuccess(res, 200, 'Signup setting updated', { open });
});
