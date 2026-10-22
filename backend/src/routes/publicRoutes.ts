import { Router } from 'express';
import { createRateLimiter } from '../middleware/rateLimiter.js';
import * as pub from '../controllers/publicVoteController.js';

const router = Router();
const MIN15 = 15 * 60 * 1000;

// Chaque étape a sa propre limite par adresse IP (en plus des limites par e-mail dans le service).
const read = createRateLimiter({ name: 'public-read', windowMs: MIN15, max: 300 });
const identify = createRateLimiter({ name: 'public-identify', windowMs: MIN15, max: 15 });
// Demandes d'accès : 15 par 15 minutes et par adresse IP. Le suivi se rafraîchit toutes les 4 secondes (225 appels).
const join = createRateLimiter({ name: 'public-join', windowMs: MIN15, max: 15 });
const joinStatus = createRateLimiter({ name: 'public-join-status', windowMs: MIN15, max: 600 });
const verify = createRateLimiter({ name: 'public-verify', windowMs: MIN15, max: 40 });
const ballot = createRateLimiter({ name: 'public-ballot', windowMs: MIN15, max: 40 });
// La page d'un candidat se rafraîchit toutes les 5 secondes : 180 appels par 15 minutes.
const candidate = createRateLimiter({ name: 'public-candidate', windowMs: MIN15, max: 600 });

router.get('/votes/:token', read, pub.getVote);
router.post('/votes/:token/identify', identify, pub.identify);
router.post('/votes/:token/join', join, pub.join);
router.post('/votes/:token/join-status', joinStatus, pub.joinStatus);
router.post('/votes/:token/verify', verify, pub.verify);
router.post('/votes/:token/ballot', ballot, pub.castVote);
router.get('/votes/:token/results', read, pub.getResults);
router.get('/candidates/:accessToken', candidate, pub.getCandidateView);

export default router;
