import { Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from '../../middleware/auth';
import {
  placeEventWager,
  getEventWagers,
  getUserEventWagers,
  getEventWagerById,
  getEventWagerStats,
  settleEvent,
} from './service';

/**
 * Controller for handling event wager-related requests.
 */
export class EventWagersController {
  /**
   * Place a wager on an event.
   * POST /api/event-wagers
   * @access Private (authenticated users)
   */
  async placeWager(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ message: 'Authentication required' });
        return;
      }

      const { eventId, selectedOption, amount } = req.body;

      // Validation
      if (!eventId || !selectedOption || amount === undefined) {
        res.status(400).json({
          message: 'eventId, selectedOption, and amount are required',
        });
        return;
      }

      if (typeof amount !== 'number' || amount <= 0) {
        res.status(400).json({ message: 'amount must be a positive number' });
        return;
      }

      const wager = await placeEventWager(userId, eventId, selectedOption, amount);

      res.status(201).json({
        message: 'Wager placed successfully',
        wager: {
          id: wager._id,
          event: wager.event,
          selectedOption: wager.selectedOption,
          amount: wager.amount,
          odds: wager.odds,
          potentialPayout: wager.potentialPayout,
          createdAt: wager.createdAt,
        },
      });
    } catch (error) {
      if (error instanceof Error) {
        // Handle business logic errors
        if (
          error.message.includes('not found') ||
          error.message.includes('closed') ||
          error.message.includes('deadline') ||
          error.message.includes('Invalid option') ||
          error.message.includes('Insufficient balance')
        ) {
          res.status(400).json({ message: error.message });
          return;
        }
      }
      next(error);
    }
  }

  /**
   * Get wagers for a specific event.
   * GET /api/event-wagers/event/:eventId
   * @access Public
   */
  async getEventWagers(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { eventId } = req.params;

      const wagers = await getEventWagers(eventId);

      res.json(
        wagers.map((w) => ({
          id: w._id,
          user: {
            id: (w.user as any)._id,
            username: (w.user as any).username,
          },
          selectedOption: w.selectedOption,
          amount: w.amount,
          odds: w.odds,
          potentialPayout: w.potentialPayout,
          settled: w.settled,
          won: w.won,
          actualPayout: w.actualPayout,
          createdAt: w.createdAt,
        }))
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get statistics for an event's wagers.
   * GET /api/event-wagers/event/:eventId/stats
   * @access Public
   */
  async getEventStats(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { eventId } = req.params;

      const stats = await getEventWagerStats(eventId);

      res.json(stats);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get authenticated user's wagers.
   * GET /api/event-wagers/my-wagers
   * @access Private (authenticated users)
   */
  async getMyWagers(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ message: 'Authentication required' });
        return;
      }

      const { settled } = req.query;

      const wagers = await getUserEventWagers(userId, {
        settled: settled === 'true' ? true : settled === 'false' ? false : undefined,
      });

      res.json(
        wagers.map((w) => ({
          id: w._id,
          event: {
            id: (w.event as any)._id,
            title: (w.event as any).title,
            status: (w.event as any).status,
            winningOption: (w.event as any).winningOption,
            resolvedAt: (w.event as any).resolvedAt,
          },
          selectedOption: w.selectedOption,
          amount: w.amount,
          odds: w.odds,
          potentialPayout: w.potentialPayout,
          settled: w.settled,
          won: w.won,
          actualPayout: w.actualPayout,
          settledAt: w.settledAt,
          createdAt: w.createdAt,
        }))
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get a specific wager by ID.
   * GET /api/event-wagers/:id
   * @access Public
   */
  async getWager(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const wager = await getEventWagerById(id);

      if (!wager) {
        res.status(404).json({ message: 'Wager not found' });
        return;
      }

      res.json({
        id: wager._id,
        event: {
          id: (wager.event as any)._id,
          title: (wager.event as any).title,
          status: (wager.event as any).status,
          winningOption: (wager.event as any).winningOption,
          resultOptions: (wager.event as any).resultOptions,
        },
        user: {
          id: (wager.user as any)._id,
          username: (wager.user as any).username,
        },
        selectedOption: wager.selectedOption,
        amount: wager.amount,
        odds: wager.odds,
        potentialPayout: wager.potentialPayout,
        settled: wager.settled,
        won: wager.won,
        actualPayout: wager.actualPayout,
        settledAt: wager.settledAt,
        createdAt: wager.createdAt,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Settle an event (resolve and distribute payouts).
   * POST /api/event-wagers/settle/:eventId
   * @access Private (curators and admins only)
   */
  async settleEventWagers(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const curatorId = req.user?.userId;
      if (!curatorId) {
        res.status(401).json({ message: 'Authentication required' });
        return;
      }

      const { eventId } = req.params;
      const { winningOption, evidenceId, rationale } = req.body;

      if (!winningOption) {
        res.status(400).json({ message: 'winningOption is required' });
        return;
      }

      const result = await settleEvent(eventId, winningOption, curatorId, evidenceId, rationale);

      res.json({
        message: 'Event settled successfully',
        event: {
          id: result.event._id,
          title: result.event.title,
          status: result.event.status,
          winningOption: result.event.winningOption,
          resolvedAt: result.event.resolvedAt,
          resolvedBy: result.event.resolvedBy,
          resolutionRationale: result.event.resolutionRationale,
          evidenceUsed: result.event.evidenceUsed,
          curatorCommission: result.event.curatorCommission,
        },
        settlement: {
          totalWagers: result.totalWagers,
          totalPool: result.totalPool,
          curatorCommission: result.curatorCommission,
          distributionPool: result.distributionPool,
          winnersCount: result.winnersCount,
          winnersPool: result.winnersPool,
          totalPayout: result.totalPayout,
        },
      });
    } catch (error) {
      if (error instanceof Error) {
        if (
          error.message.includes('not found') ||
          error.message.includes('already resolved') ||
          error.message.includes('cancelled') ||
          error.message.includes('Invalid winning option')
        ) {
          res.status(400).json({ message: error.message });
          return;
        }
      }
      next(error);
    }
  }
}
