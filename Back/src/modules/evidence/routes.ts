import { Router } from 'express';
import { EvidenceController } from './controller';
import { authMiddleware } from '../../middleware/auth';

const router = Router();
const controller = new EvidenceController();

/**
 * Submit evidence for an event.
 * POST /api/events/:eventId/evidence
 * Requires authentication.
 */
router.post(
  '/:eventId/evidence',
  authMiddleware,
  controller.submitEvidence.bind(controller)
);

/**
 * Get all evidence for an event.
 * GET /api/events/:eventId/evidence
 * Public endpoint.
 */
router.get(
  '/:eventId/evidence',
  controller.getEventEvidence.bind(controller)
);

/**
 * Get a specific evidence by ID.
 * GET /api/evidence/:evidenceId
 * Public endpoint.
 */
router.get(
  '/evidence/:evidenceId',
  controller.getEvidenceById.bind(controller)
);

export default router;
