import { Router } from 'express';
import { castVote, getVoteResults, getElectionResults } from '../controllers/index.js';
import { authenticate, authorizeResultsAccess, asyncHandler } from '../middleware/index.js';

const router = Router();

// Protected routes
router.post('/', asyncHandler(authenticate), asyncHandler(castVote));

// Résultats : connexion obligatoire, puis administrateur ou scrutin clos
const results = [asyncHandler(authenticate), asyncHandler(authorizeResultsAccess)];
router.get('/election/:electionId/results', ...results, asyncHandler(getElectionResults));
router.get('/:electionId/position/:positionId', ...results, asyncHandler(getVoteResults));

export default router;
