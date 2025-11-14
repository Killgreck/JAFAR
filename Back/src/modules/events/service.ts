import { EventModel, EventDocument, EventCategory, EventStatus } from './model';

/**
 * Custom error class for event validation errors.
 */
export class EventValidationError extends Error {
  status = 400;

  constructor(message: string) {
    super(message);
    this.name = 'EventValidationError';
  }
}

/**
 * Interface for creating a new event.
 */
export interface CreateEventData {
  creator: string;
  title: string;
  description: string;
  category: EventCategory;
  bettingDeadline: Date;
  expectedResolutionDate: Date;
  resultOptions: string[];
}

/**
 * Interface for filtering events.
 */
export interface EventFilters {
  category?: EventCategory;
  status?: EventStatus;
  creator?: string;
}

/**
 * Validates event dates according to business rules.
 *
 * @param bettingDeadline The deadline for placing bets
 * @param expectedResolutionDate The expected resolution date
 * @throws {EventValidationError} If dates are invalid
 */
export function validateEventDates(
  bettingDeadline: Date,
  expectedResolutionDate: Date
): void {
  const now = new Date();
  const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

  if (bettingDeadline < oneHourFromNow) {
    throw new EventValidationError('Betting deadline must be at least 1 hour from now');
  }

  if (expectedResolutionDate <= bettingDeadline) {
    throw new EventValidationError('Expected resolution date must be after betting deadline');
  }
}

/**
 * Creates a new event in the database.
 *
 * @param data The data for the new event
 * @returns A promise that resolves to the created event document
 * @throws {EventValidationError} If validation fails
 */
export async function createEvent(data: CreateEventData): Promise<EventDocument> {
  // Validate dates before attempting to create
  validateEventDates(data.bettingDeadline, data.expectedResolutionDate);

  // Additional validation: check result options
  if (!data.resultOptions || data.resultOptions.length < 2 || data.resultOptions.length > 10) {
    throw new EventValidationError('Result options must contain between 2 and 10 options');
  }

  // Create the event
  const event = await EventModel.create({
    creator: data.creator,
    title: data.title,
    description: data.description,
    category: data.category,
    bettingDeadline: data.bettingDeadline,
    expectedResolutionDate: data.expectedResolutionDate,
    resultOptions: data.resultOptions,
    status: 'open',
  });

  return event;
}

/**
 * Retrieves an event by its ID.
 *
 * @param id The ID of the event to retrieve
 * @returns A promise that resolves to the event document or null if not found
 */
export async function getEventById(id: string): Promise<EventDocument | null> {
  return EventModel.findById(id).exec();
}

/**
 * Retrieves a list of events with optional filters.
 *
 * @param filters Optional filters for category, status, or creator
 * @returns A promise that resolves to an array of event documents
 */
export async function listEvents(filters?: EventFilters): Promise<EventDocument[]> {
  const query: any = {};

  if (filters?.category) {
    query.category = filters.category;
  }

  if (filters?.status) {
    query.status = filters.status;
  }

  if (filters?.creator) {
    query.creator = filters.creator;
  }

  return EventModel.find(query)
    .sort({ createdAt: -1 })
    .exec();
}

/**
 * Updates the status of an event.
 *
 * @param id The ID of the event to update
 * @param status The new status
 * @returns A promise that resolves to the updated event or null if not found
 */
export async function updateEventStatus(
  id: string,
  status: EventStatus
): Promise<EventDocument | null> {
  return EventModel.findByIdAndUpdate(
    id,
    { $set: { status } },
    { new: true }
  ).exec();
}

/**
 * Resolves an event with a winning option.
 *
 * @param id The ID of the event to resolve
 * @param winningOption The winning option
 * @returns A promise that resolves to the updated event or null if not found
 * @throws {EventValidationError} If the winning option is invalid
 */
export async function resolveEvent(
  id: string,
  winningOption: string
): Promise<EventDocument | null> {
  const event = await EventModel.findById(id).exec();

  if (!event) {
    return null;
  }

  if (!event.resultOptions.includes(winningOption)) {
    throw new EventValidationError('Winning option must be one of the result options');
  }

  event.status = 'resolved';
  event.winningOption = winningOption;
  event.resolvedAt = new Date();

  await event.save();

  return event;
}

/**
 * Updates the evidence submission phase for an event based on current time.
 *
 * @param event The event document to update
 * @returns The updated event document
 */
export async function updateEvidencePhase(event: EventDocument): Promise<EventDocument> {
  const now = new Date();
  let newPhase: 'none' | 'creator' | 'public' = 'none';

  // Determine the correct phase based on time
  if (now < event.bettingDeadline) {
    newPhase = 'none';
  } else if (now >= event.bettingDeadline && now < event.evidenceDeadline!) {
    newPhase = 'creator';
  } else if (now >= event.evidenceDeadline!) {
    newPhase = 'public';
  }

  // Update if phase has changed
  if (event.evidenceSubmissionPhase !== newPhase) {
    event.evidenceSubmissionPhase = newPhase;
    await event.save();
  }

  return event;
}

/**
 * Gets events that are ready for curation (closed status with evidence).
 * These are events past the evidence deadline with public evidence submitted.
 *
 * @returns A promise that resolves to an array of events ready for curation
 */
export async function getEventsReadyForCuration(): Promise<EventDocument[]> {
  const now = new Date();

  // Events where:
  // 1. Evidence deadline has passed
  // 2. Status is 'closed' (betting finished but not resolved)
  // 3. Has at least some evidence
  const events = await EventModel.find({
    evidenceDeadline: { $lt: now },
    status: { $in: ['open', 'closed'] },
  })
    .populate('creator', 'username email')
    .sort({ evidenceDeadline: 1 })
    .exec();

  // Update phases for all these events
  for (const event of events) {
    await updateEvidencePhase(event);
    // Auto-close events that are still open
    if (event.status === 'open' && now >= event.bettingDeadline) {
      event.status = 'closed';
      await event.save();
    }
  }

  return events;
}

/**
 * Cancels an event and refunds all wagers.
 * This function:
 * 1. Finds all wagers for the event
 * 2. Returns the wagered amount to each user's wallet
 * 3. Marks all wagers as settled with actualPayout = amount
 * 4. Changes event status to 'cancelled'
 *
 * @param id The ID of the event to cancel
 * @param adminId The ID of the admin performing the cancellation
 * @returns A promise that resolves to the cancelled event or null if not found
 * @throws {EventValidationError} If the event cannot be cancelled
 */
export async function cancelEventWithRefund(
  id: string,
  adminId: string
): Promise<EventDocument | null> {
  const event = await EventModel.findById(id).exec();

  if (!event) {
    return null;
  }

  // Check if event is already cancelled or resolved
  if (event.status === 'cancelled') {
    throw new EventValidationError('Event is already cancelled');
  }

  if (event.status === 'resolved') {
    throw new EventValidationError('Cannot cancel a resolved event');
  }

  // Import models dynamically to avoid circular dependencies
  const { EventWagerModel } = await import('../event-wagers/model');
  const { WalletModel } = await import('../wallet/model');

  // Find all wagers for this event
  const wagers = await EventWagerModel.find({
    event: id,
    settled: false,
  }).exec();

  // Process refunds for each wager
  for (const wager of wagers) {
    // Return amount to user's wallet (balanceAvailable)
    await WalletModel.findOneAndUpdate(
      { user: wager.user },
      {
        $inc: { balanceAvailable: wager.amount },
        $set: { lastUpdated: new Date() },
      }
    ).exec();

    // Mark wager as settled with full refund
    wager.settled = true;
    wager.actualPayout = wager.amount;
    wager.settledAt = new Date();
    await wager.save();
  }

  // Update event status to cancelled
  event.status = 'cancelled';
  await event.save();

  return event;
}

/**
 * Updates the dates of an event.
 * Only allows updating dates if the event is still open.
 *
 * @param id The ID of the event to update
 * @param bettingDeadline The new betting deadline
 * @param expectedResolutionDate The new expected resolution date
 * @returns A promise that resolves to the updated event or null if not found
 * @throws {EventValidationError} If validation fails or event cannot be updated
 */
export async function updateEventDates(
  id: string,
  bettingDeadline: Date,
  expectedResolutionDate: Date
): Promise<EventDocument | null> {
  const event = await EventModel.findById(id).exec();

  if (!event) {
    return null;
  }

  // Only allow updating dates for open events
  if (event.status !== 'open') {
    throw new EventValidationError('Can only update dates for open events');
  }

  // Validate the new dates
  validateEventDates(bettingDeadline, expectedResolutionDate);

  // Update the dates
  event.bettingDeadline = bettingDeadline;
  event.expectedResolutionDate = expectedResolutionDate;

  await event.save();

  return event;
}
