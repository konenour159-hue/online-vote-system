import { Router } from 'express';
import { authenticate, authorize, asyncHandler } from '../middleware/index.js';
import * as votes from '../controllers/adminVoteController.js';

const router = Router();

// Réservé aux administrateurs ; l'appartenance du vote est contrôlée dans le service.
const adminOnly = [asyncHandler(authenticate), asyncHandler(authorize(['SUPER_ADMIN', 'ELECTION_ADMIN']))];

router.get('/votes', ...adminOnly, votes.listVotes);
router.post('/votes', ...adminOnly, votes.createVote);
router.get('/votes/:id', ...adminOnly, votes.getVote);
router.put('/votes/:id', ...adminOnly, votes.updateVote);
router.delete('/votes/:id', ...adminOnly, votes.deleteVote);
router.post('/votes/:id/open', ...adminOnly, votes.openVote);
router.post('/votes/:id/close', ...adminOnly, votes.closeVote);
router.post('/votes/:id/candidates', ...adminOnly, votes.addCandidate);
router.put('/votes/:id/candidates/:candidateId', ...adminOnly, votes.updateCandidate);
router.delete('/votes/:id/candidates/:candidateId', ...adminOnly, votes.removeCandidate);
router.post('/votes/:id/candidates/:candidateId/regenerate-link', ...adminOnly, votes.regenerateCandidateLink);

export default router;
