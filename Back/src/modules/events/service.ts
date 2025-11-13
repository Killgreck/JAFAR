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
