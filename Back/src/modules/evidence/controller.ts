import { Request, Response } from 'express';
import * as evidenceService from './service';
import { EvidenceType } from './model';
import { AuthenticatedRequest } from '../../middleware/auth';

/**
 * Controller for evidence-related operations.
 */
export class EvidenceController {
  /**
   * Submit evidence for an event.
   * POST /api/events/:eventId/evidence
   */
  async submitEvidence(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { eventId } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const { evidenceType, evidenceUrl, content, description, supportedOption } = req.body;

      // Validation
      if (!evidenceType || !description || !supportedOption) {
        return res.status(400).json({
          message: 'Evidence type, description, and supported option are required',
        });
      }

      const evidence = await evidenceService.createEvidence({
        eventId,
        submittedBy: userId,
        evidenceType: evidenceType as EvidenceType,
        evidenceUrl,
        content,
        description,
        supportedOption,
      });

      return res.status(201).json({
        message: 'Evidence submitted successfully',
        evidence,
      });
    } catch (error: any) {
      console.error('Error submitting evidence:', error);

      if (error.name === 'EvidenceValidationError') {
        return res.status(error.status || 400).json({ message: error.message });
      }

      if (error.name === 'EvidencePermissionError') {
        return res.status(error.status || 403).json({ message: error.message });
      }

      return res.status(500).json({ message: 'Failed to submit evidence' });
    }
  }

  /**
   * Get all evidence for an event.
   * GET /api/events/:eventId/evidence
   */
  async getEventEvidence(req: Request, res: Response): Promise<Response> {
    try {
      const { eventId } = req.params;

      const evidence = await evidenceService.getEvidenceByEventId(eventId);
      const counts = await evidenceService.countEvidenceByRole(eventId);

      return res.status(200).json({
        evidence,
        counts,
        total: evidence.length,
      });
    } catch (error: any) {
      console.error('Error fetching evidence:', error);
      return res.status(500).json({ message: 'Failed to fetch evidence' });
    }
  }

  /**
   * Get a specific evidence by ID.
   * GET /api/evidence/:evidenceId
   */
  async getEvidenceById(req: Request, res: Response): Promise<Response> {
    try {
      const { evidenceId } = req.params;

      const evidence = await evidenceService.getEvidenceById(evidenceId);

      if (!evidence) {
        return res.status(404).json({ message: 'Evidence not found' });
      }

      return res.status(200).json({ evidence });
    } catch (error: any) {
      console.error('Error fetching evidence:', error);
      return res.status(500).json({ message: 'Failed to fetch evidence' });
    }
  }

  /**
   * Like an evidence.
   * POST /api/events/:eventId/evidence/:evidenceId/like
   */
  async likeEvidence(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { evidenceId } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const evidence = await evidenceService.likeEvidence(evidenceId, userId);

      return res.status(200).json({
        message: 'Evidence liked successfully',
        likesCount: evidence?.likesCount || 0,
      });
    } catch (error: any) {
      console.error('Error liking evidence:', error);

      if (error.name === 'EvidenceValidationError') {
        return res.status(error.status || 400).json({ message: error.message });
      }

      return res.status(500).json({ message: 'Failed to like evidence' });
    }
  }

  /**
   * Unlike an evidence.
   * DELETE /api/events/:eventId/evidence/:evidenceId/like
   */
  async unlikeEvidence(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { evidenceId } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const evidence = await evidenceService.unlikeEvidence(evidenceId, userId);

      return res.status(200).json({
        message: 'Evidence unliked successfully',
        likesCount: evidence?.likesCount || 0,
      });
    } catch (error: any) {
      console.error('Error unliking evidence:', error);

      if (error.name === 'EvidenceValidationError') {
        return res.status(error.status || 400).json({ message: error.message });
      }

      return res.status(500).json({ message: 'Failed to unlike evidence' });
    }
  }
}
