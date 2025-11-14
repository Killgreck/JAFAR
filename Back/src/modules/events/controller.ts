import { Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import {
  createEvent,
  getEventById,
  listEvents,
  searchEvents,
  updateEventStatus,
  resolveEvent,
  cancelEventWithRefund,
  updateEventDates,
  getEventsReadyForCuration,
  EventValidationError,
} from './service';
import { AuthenticatedRequest } from '../../middleware/auth';
import type { EventDocument } from './model';
import { VALID_CATEGORIES, EventCategory, EventStatus } from './model';

/**
 * Sanitizes an event document for client-side consumption.
 *
 * @param event The event document to sanitize
 * @returns A sanitized event object
 */
function sanitizeEvent(event: EventDocument) {
  const sanitized: any = {
    id: event._id.toString(),
    creator: event.creator.toString(),
    title: event.title,
    description: event.description,
    category: event.category,
    bettingDeadline: event.bettingDeadline,
    expectedResolutionDate: event.expectedResolutionDate,
    resultOptions: event.resultOptions,
    status: event.status,
    totalBets: event.totalBets ?? 0,
    createdAt: event.createdAt,
    updatedAt: event.updatedAt,
  };

  if (event.evidenceDeadline) {
    sanitized.evidenceDeadline = event.evidenceDeadline;
  }

  if (event.evidenceSubmissionPhase) {
    sanitized.evidenceSubmissionPhase = event.evidenceSubmissionPhase;
  }

  if (event.winningOption) {
    sanitized.winningOption = event.winningOption;
  }

  if (event.resolvedAt) {
    sanitized.resolvedAt = event.resolvedAt;
  }

  if (event.resolvedBy) {
    sanitized.resolvedBy = event.resolvedBy;
  }

  if (event.resolutionRationale) {
    sanitized.resolutionRationale = event.resolutionRationale;
  }

  if (event.curatorCommission) {
    sanitized.curatorCommission = event.curatorCommission;
  }

  return sanitized;
}

/**
 * Checks if a value is a valid Mongoose ObjectId.
 *
 * @param value The value to check
 * @returns True if the value is a valid ObjectId, false otherwise
 */
function isValidObjectId(value: unknown): value is string {
  return typeof value === 'string' && mongoose.Types.ObjectId.isValid(value);
}

/**
 * Controller for handling event-related requests.
 */
export class EventController {
  /**
   * Creates a new event.
   *
   * @param req The authenticated request object
   * @param res The response object
   * @param next The next middleware function
   */
  async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { title, description, category, bettingDeadline, expectedResolutionDate, resultOptions } = req.body;

      // Validate required fields
      if (!title || typeof title !== 'string') {
        res.status(400).json({ message: 'Title is required and must be a string' });
        return;
      }

      if (!description || typeof description !== 'string') {
        res.status(400).json({ message: 'Description is required and must be a string' });
        return;
      }

      if (!category || !VALID_CATEGORIES.includes(category as EventCategory)) {
        res.status(400).json({
          message: `Category must be one of: ${VALID_CATEGORIES.join(', ')}`,
        });
        return;
      }

      if (!bettingDeadline) {
        res.status(400).json({ message: 'Betting deadline is required' });
        return;
      }

      if (!expectedResolutionDate) {
        res.status(400).json({ message: 'Expected resolution date is required' });
        return;
      }

      if (!resultOptions || !Array.isArray(resultOptions)) {
        res.status(400).json({ message: 'Result options must be an array' });
        return;
      }

      // Convert date strings to Date objects
      const bettingDeadlineDate = new Date(bettingDeadline);
      const expectedResolutionDateDate = new Date(expectedResolutionDate);

      // Validate dates are valid
      if (isNaN(bettingDeadlineDate.getTime())) {
        res.status(400).json({ message: 'Invalid betting deadline date format' });
        return;
      }

      if (isNaN(expectedResolutionDateDate.getTime())) {
        res.status(400).json({ message: 'Invalid expected resolution date format' });
        return;
      }

      // Get user ID from authenticated request
      const creatorId = req.user!.userId;

      // Create event
      const event = await createEvent({
        creator: creatorId,
        title,
        description,
        category: category as EventCategory,
        bettingDeadline: bettingDeadlineDate,
        expectedResolutionDate: expectedResolutionDateDate,
        resultOptions,
      });

      res.status(201).json(sanitizeEvent(event));
    } catch (error) {
      if (error instanceof EventValidationError) {
        res.status(error.status).json({ message: error.message });
        return;
      }
      next(error);
    }
  }

  /**
   * Retrieves an event by ID.
   *
   * @param req The request object
   * @param res The response object
   * @param next The next middleware function
   */
  async getById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      if (!isValidObjectId(id)) {
        res.status(400).json({ message: 'Invalid event ID' });
        return;
      }

      const event = await getEventById(id);

      if (!event) {
        res.status(404).json({ message: 'Event not found' });
        return;
      }

      res.json(sanitizeEvent(event));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Lists events with optional filters.
   *
   * @param req The request object
   * @param res The response object
   * @param next The next middleware function
   */
  async list(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { category, status, creator } = req.query;

      const filters: any = {};

      if (category && typeof category === 'string') {
        if (VALID_CATEGORIES.includes(category as EventCategory)) {
          filters.category = category;
        } else {
          res.status(400).json({
            message: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(', ')}`,
          });
          return;
        }
      }

      if (status && typeof status === 'string') {
        filters.status = status as EventStatus;
      }

      if (creator && typeof creator === 'string') {
        if (!isValidObjectId(creator)) {
          res.status(400).json({ message: 'Invalid creator ID' });
          return;
        }
        filters.creator = creator;
      }

      const events = await listEvents(filters);

      res.json(events.map(sanitizeEvent));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Searches and filters events with pagination.
   * New endpoint with full search capabilities.
   *
   * @param req The request object
   * @param res The response object
   * @param next The next middleware function
   */
  async search(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const {
        q,
        search,
        category,
        status,
        dateFrom,
        dateTo,
        sortBy,
        page,
        limit,
      } = req.query;

      // Accept both 'q' and 'search' for search text
      const searchText = (q || search) as string | undefined;

      // Validate category
      if (category && typeof category === 'string') {
        if (!VALID_CATEGORIES.includes(category as EventCategory)) {
          res.status(400).json({
            message: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(', ')}`,
          });
          return;
        }
      }

      // Validate sortBy
      const validSortOptions = ['recent', 'closing_soon', 'most_bets'];
      if (sortBy && typeof sortBy === 'string' && !validSortOptions.includes(sortBy)) {
        res.status(400).json({
          message: `Invalid sortBy. Must be one of: ${validSortOptions.join(', ')}`,
        });
        return;
      }

      // Parse dates
      let dateFromParsed: Date | undefined;
      let dateToParsed: Date | undefined;

      if (dateFrom && typeof dateFrom === 'string') {
        dateFromParsed = new Date(dateFrom);
        if (isNaN(dateFromParsed.getTime())) {
          res.status(400).json({ message: 'Invalid dateFrom format' });
          return;
        }
      }

      if (dateTo && typeof dateTo === 'string') {
        dateToParsed = new Date(dateTo);
        if (isNaN(dateToParsed.getTime())) {
          res.status(400).json({ message: 'Invalid dateTo format' });
          return;
        }
      }

      // Parse pagination
      const pageNum = page ? parseInt(page as string, 10) : 1;
      const limitNum = limit ? parseInt(limit as string, 10) : 20;

      if (isNaN(pageNum) || pageNum < 1) {
        res.status(400).json({ message: 'Invalid page number' });
        return;
      }

      if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
        res.status(400).json({ message: 'Invalid limit (must be between 1 and 100)' });
        return;
      }

      // Search events
      const result = await searchEvents({
        searchText,
        category: category as EventCategory | undefined,
        status: status as EventStatus | undefined,
        dateFrom: dateFromParsed,
        dateTo: dateToParsed,
        sortBy: sortBy as 'recent' | 'closing_soon' | 'most_bets' | undefined,
        page: pageNum,
        limit: limitNum,
      });

      res.json({
        events: result.events.map(sanitizeEvent),
        pagination: {
          total: result.total,
          page: result.page,
          totalPages: result.totalPages,
          hasMore: result.hasMore,
          limit: limitNum,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Updates the status of an event.
   *
   * @param req The authenticated request object
   * @param res The response object
   * @param next The next middleware function
   */
  async updateStatus(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!isValidObjectId(id)) {
        res.status(400).json({ message: 'Invalid event ID' });
        return;
      }

      if (!status || typeof status !== 'string') {
        res.status(400).json({ message: 'Status is required' });
        return;
      }

      const event = await updateEventStatus(id, status as EventStatus);

      if (!event) {
        res.status(404).json({ message: 'Event not found' });
        return;
      }

      res.json(sanitizeEvent(event));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Resolves an event with a winning option.
   *
   * @param req The authenticated request object
   * @param res The response object
   * @param next The next middleware function
   */
  async resolve(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { winningOption } = req.body;

      if (!isValidObjectId(id)) {
        res.status(400).json({ message: 'Invalid event ID' });
        return;
      }

      if (!winningOption || typeof winningOption !== 'string') {
        res.status(400).json({ message: 'Winning option is required' });
        return;
      }

      const event = await resolveEvent(id, winningOption);

      if (!event) {
        res.status(404).json({ message: 'Event not found' });
        return;
      }

      res.json(sanitizeEvent(event));
    } catch (error) {
      if (error instanceof EventValidationError) {
        res.status(error.status).json({ message: error.message });
        return;
      }
      next(error);
    }
  }

  /**
   * Cancels an event and refunds all wagers (admin only).
   *
   * @param req The authenticated request object
   * @param res The response object
   * @param next The next middleware function
   */
  async cancel(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const adminId = req.user!.userId;

      if (!isValidObjectId(id)) {
        res.status(400).json({ message: 'Invalid event ID' });
        return;
      }

      const event = await cancelEventWithRefund(id, adminId);

      if (!event) {
        res.status(404).json({ message: 'Event not found' });
        return;
      }

      res.json({
        message: 'Event cancelled successfully and all wagers refunded',
        event: sanitizeEvent(event),
      });
    } catch (error) {
      if (error instanceof EventValidationError) {
        res.status(error.status).json({ message: error.message });
        return;
      }
      next(error);
    }
  }

  /**
   * Updates the dates of an event (admin only).
   *
   * @param req The authenticated request object
   * @param res The response object
   * @param next The next middleware function
   */
  async updateDates(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { bettingDeadline, expectedResolutionDate } = req.body;

      if (!isValidObjectId(id)) {
        res.status(400).json({ message: 'Invalid event ID' });
        return;
      }

      if (!bettingDeadline) {
        res.status(400).json({ message: 'Betting deadline is required' });
        return;
      }

      if (!expectedResolutionDate) {
        res.status(400).json({ message: 'Expected resolution date is required' });
        return;
      }

      // Convert date strings to Date objects
      const bettingDeadlineDate = new Date(bettingDeadline);
      const expectedResolutionDateDate = new Date(expectedResolutionDate);

      // Validate dates are valid
      if (isNaN(bettingDeadlineDate.getTime())) {
        res.status(400).json({ message: 'Invalid betting deadline date format' });
        return;
      }

      if (isNaN(expectedResolutionDateDate.getTime())) {
        res.status(400).json({ message: 'Invalid expected resolution date format' });
        return;
      }

      const event = await updateEventDates(id, bettingDeadlineDate, expectedResolutionDateDate);

      if (!event) {
        res.status(404).json({ message: 'Event not found' });
        return;
      }

      res.json({
        message: 'Event dates updated successfully',
        event: sanitizeEvent(event),
      });
    } catch (error) {
      if (error instanceof EventValidationError) {
        res.status(error.status).json({ message: error.message });
        return;
      }
      next(error);
    }
  }

  /**
   * Gets events ready for curation (curator only).
   *
   * @param req The authenticated request object
   * @param res The response object
   * @param next The next middleware function
   */
  async getEventsForCuration(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const events = await getEventsReadyForCuration();

      res.json({
        events: events.map(sanitizeEvent),
        count: events.length,
      });
    } catch (error) {
      next(error);
    }
  }
}
