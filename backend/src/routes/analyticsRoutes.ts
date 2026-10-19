import { Router } from 'express';
import {
  getElectionStats,
  getSystemStats,
  getUserActivityLog,
  getAllActivity,
  getMyCandidacies,
  getElectionReport,
  exportReportAsPDF,
  exportReportAsCSV
} from '../controllers/analyticsController.js';
import { authenticate, authorize, authorizeResultsAccess, asyncHandler } from '../middleware/index.js';

const router = Router();

// Résultats : connexion obligatoire, puis administrateur ou scrutin clos
const results = [asyncHandler(authenticate), asyncHandler(authorizeResultsAccess)];
router.get('/election/:electionId/stats', ...results, asyncHandler(getElectionStats));
router.get('/election/:electionId/report', ...results, asyncHandler(getElectionReport));
router.get('/election/:electionId/report/pdf', ...results, asyncHandler(exportReportAsPDF));
router.get('/election/:electionId/report/csv', ...results, asyncHandler(exportReportAsCSV));

// Protected routes - Admin only
router.get(
  '/system/stats',
  asyncHandler(authenticate),
  asyncHandler(authorize(['SUPER_ADMIN'])),
  asyncHandler(getSystemStats)
);

router.get(
  '/system/activity',
  asyncHandler(authenticate),
  asyncHandler(authorize(['SUPER_ADMIN'])),
  asyncHandler(getAllActivity)
);

router.get('/me/candidacy', asyncHandler(authenticate), asyncHandler(getMyCandidacies));

router.get(
  '/user/activity-log',
  asyncHandler(authenticate),
  asyncHandler(getUserActivityLog)
);

export default router;
