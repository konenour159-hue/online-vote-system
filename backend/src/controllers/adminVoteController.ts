import { Request, Response } from 'express';
import { z, ZodSchema } from 'zod';
import { asyncHandler } from '../middleware/index.js';
import { prisma } from '../config/database.js';
import { sendSuccess } from '../utils/response.js';
import { AuthorizationError, UserError, ValidationError } from '../utils/errors.js';
import { recordAudit } from '../utils/audit.js';
import {
  adminVoteService,
  Admin,
  candidateSchema,
  createVoteSchema,
  updateVoteSchema
} from '../services/adminVoteService.js';

const currentAdmin = async (req: Request): Promise<Admin> => {
  if (!req.user) throw new ValidationError('User not authenticated');
  const user = await prisma.user.findUnique({ where: { id: req.user.userId }, include: { role: true } });
  if (!user || !user.role) throw new AuthorizationError('User role not found');
  return { id: user.id, role: user.role.name };
};

const parse = <S extends ZodSchema>(schema: S, body: unknown): z.infer<S> => {
  const result = schema.safeParse(body);
  if (!result.success) throw new UserError(400, result.error.issues[0].message);
  return result.data;
};

const audit = (admin: Admin, action: string, req: Request, electionId: string, changes?: Record<string, unknown>) =>
  recordAudit(admin.id, action, req, { entity: 'Election', entityId: electionId, electionId, changes });

export const listVotes = asyncHandler(async (req: Request, res: Response) => {
  sendSuccess(res, 200, 'Votes retrieved', await adminVoteService.list(await currentAdmin(req)));
});

export const getVote = asyncHandler(async (req: Request, res: Response) => {
  sendSuccess(res, 200, 'Vote retrieved', await adminVoteService.get(await currentAdmin(req), req.params.id));
});

export const createVote = asyncHandler(async (req: Request, res: Response) => {
  const admin = await currentAdmin(req);
  const created = await adminVoteService.create(admin, parse(createVoteSchema, req.body));
  audit(admin, 'VOTE_CREATED', req, created.id, { title: created.title });
  sendSuccess(res, 201, 'Vote created', created);
});

export const updateVote = asyncHandler(async (req: Request, res: Response) => {
  const admin = await currentAdmin(req);
  const updated = await adminVoteService.update(admin, req.params.id, parse(updateVoteSchema, req.body));
  sendSuccess(res, 200, 'Vote updated', updated);
});

export const openVote = asyncHandler(async (req: Request, res: Response) => {
  const admin = await currentAdmin(req);
  const result = await adminVoteService.setStatus(admin, req.params.id, 'open');
  audit(admin, 'VOTE_OPENED', req, req.params.id);
  sendSuccess(res, 200, 'Vote opened', result);
});

export const closeVote = asyncHandler(async (req: Request, res: Response) => {
  const admin = await currentAdmin(req);
  const result = await adminVoteService.setStatus(admin, req.params.id, 'close');
  audit(admin, 'VOTE_CLOSED', req, req.params.id);
  sendSuccess(res, 200, 'Vote closed', result);
});

export const deleteVote = asyncHandler(async (req: Request, res: Response) => {
  const admin = await currentAdmin(req);
  const detail = await adminVoteService.get(admin, req.params.id);
  await adminVoteService.remove(admin, req.params.id);
  recordAudit(admin.id, 'VOTE_DELETED', req, { entity: 'Election', entityId: req.params.id, changes: { title: detail.title } });
  sendSuccess(res, 200, 'Vote deleted');
});

export const addCandidate = asyncHandler(async (req: Request, res: Response) => {
  const admin = await currentAdmin(req);
  sendSuccess(res, 201, 'Candidate added', await adminVoteService.addCandidate(admin, req.params.id, parse(candidateSchema, req.body)));
});

export const updateCandidate = asyncHandler(async (req: Request, res: Response) => {
  const admin = await currentAdmin(req);
  sendSuccess(
    res,
    200,
    'Candidate updated',
    await adminVoteService.updateCandidate(admin, req.params.id, req.params.candidateId, parse(candidateSchema, req.body))
  );
});

export const removeCandidate = asyncHandler(async (req: Request, res: Response) => {
  const admin = await currentAdmin(req);
  sendSuccess(res, 200, 'Candidate removed', await adminVoteService.removeCandidate(admin, req.params.id, req.params.candidateId));
});

export const regenerateCandidateLink = asyncHandler(async (req: Request, res: Response) => {
  const admin = await currentAdmin(req);
  const result = await adminVoteService.regenerateCandidateLink(admin, req.params.id, req.params.candidateId);
  audit(admin, 'CANDIDATE_LINK_RESET', req, req.params.id, { candidateId: req.params.candidateId });
  sendSuccess(res, 200, 'Candidate link regenerated', result);
});
