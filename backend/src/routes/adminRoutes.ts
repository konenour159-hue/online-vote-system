import { Router } from 'express';
import { authenticate, authorize, asyncHandler } from '../middleware/index.js';
import { listManageableElections, searchUsers, setCandidateAccount } from '../controllers/adminController.js';

const router = Router();

// Réservé aux administrateurs ; le contrôle par scrutin est fait dans les contrôleurs.
const adminOnly = [asyncHandler(authenticate), asyncHandler(authorize(['SUPER_ADMIN', 'ELECTION_ADMIN']))];

router.get('/elections', ...adminOnly, listManageableElections);
router.get('/users', ...adminOnly, searchUsers);
router.put('/candidates/:id/account', ...adminOnly, setCandidateAccount);

export default router;
