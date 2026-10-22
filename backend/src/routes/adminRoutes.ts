import { Router } from 'express';
import { authenticate, authorize, asyncHandler } from '../middleware/index.js';
import * as votes from '../controllers/adminVoteController.js';
import * as signups from '../controllers/signupController.js';

const router = Router();

// Réservé aux administrateurs ; l'appartenance du vote est contrôlée dans le service.
const adminOnly = [asyncHandler(authenticate), asyncHandler(authorize(['SUPER_ADMIN', 'ELECTION_ADMIN']))];

router.get('/capabilities', ...adminOnly, votes.capabilities);
router.get('/votes', ...adminOnly, votes.listVotes);
router.post('/votes', ...adminOnly, votes.createVote);
router.get('/votes/:id', ...adminOnly, votes.getVote);
router.put('/votes/:id', ...adminOnly, votes.updateVote);
router.delete('/votes/:id', ...adminOnly, votes.deleteVote);
router.post('/votes/:id/open', ...adminOnly, votes.openVote);
router.post('/votes/:id/close', ...adminOnly, votes.closeVote);
router.post('/votes/:id/participants/approve-all', ...adminOnly, votes.approveAllPending);
router.post('/votes/:id/participants/:participantId/approve', ...adminOnly, votes.approveParticipant);
router.post('/votes/:id/participants/:participantId/reject', ...adminOnly, votes.rejectParticipant);
router.post('/votes/:id/candidates', ...adminOnly, votes.addCandidate);
router.put('/votes/:id/candidates/:candidateId', ...adminOnly, votes.updateCandidate);
router.delete('/votes/:id/candidates/:candidateId', ...adminOnly, votes.removeCandidate);
router.post('/votes/:id/candidates/:candidateId/regenerate-link', ...adminOnly, votes.regenerateCandidateLink);

// Inscriptions des organisateurs : réservé aux super administrateurs
const superAdmin = [asyncHandler(authenticate), asyncHandler(authorize(['SUPER_ADMIN']))];
router.get('/signups', ...superAdmin, signups.listSignups);
router.put('/signups/settings', ...superAdmin, signups.setSignupsOpen);
router.post('/signups/:id/approve', ...superAdmin, signups.approveSignup);
router.post('/signups/:id/reject', ...superAdmin, signups.rejectSignup);

export default router;
