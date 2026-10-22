import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/index.js';
import { publicVoteService } from '../services/publicVoteService.js';
import { sendSuccess } from '../utils/response.js';

const bearer = (req: Request): string | undefined => req.headers.authorization?.split(' ')[1];

// Ces réponses contiennent des données de vote : jamais de copie en cache (navigateur, proxy, service worker).
const noStore = (res: Response) => res.setHeader('Cache-Control', 'no-store');

export const getVote = asyncHandler(async (req: Request, res: Response) => {
  noStore(res);
  sendSuccess(res, 200, 'Vote retrieved', await publicVoteService.getVote(req.params.token));
});

export const identify = asyncHandler(async (req: Request, res: Response) => {
  noStore(res);
  sendSuccess(res, 200, 'Code sent', await publicVoteService.identify(req.params.token, req.body));
});

export const join = asyncHandler(async (req: Request, res: Response) => {
  noStore(res);
  sendSuccess(res, 201, 'Join request received', await publicVoteService.join(req.params.token, req.body));
});

export const joinStatus = asyncHandler(async (req: Request, res: Response) => {
  noStore(res);
  sendSuccess(res, 200, 'Join status retrieved', await publicVoteService.getJoinStatus(req.params.token, req.body));
});

export const verify = asyncHandler(async (req: Request, res: Response) => {
  noStore(res);
  sendSuccess(res, 200, 'Code verified', await publicVoteService.verify(req.params.token, req.body));
});

export const castVote = asyncHandler(async (req: Request, res: Response) => {
  noStore(res);
  sendSuccess(res, 201, 'Vote recorded', await publicVoteService.castVote(req.params.token, bearer(req), req.body?.candidateId));
});

export const getResults = asyncHandler(async (req: Request, res: Response) => {
  noStore(res);
  sendSuccess(res, 200, 'Results retrieved', await publicVoteService.getResults(req.params.token));
});

export const getCandidateView = asyncHandler(async (req: Request, res: Response) => {
  noStore(res);
  sendSuccess(res, 200, 'Candidate view retrieved', await publicVoteService.getCandidateView(req.params.accessToken));
});
