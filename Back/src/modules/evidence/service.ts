import { EvidenceModel, EvidenceDocument, EvidenceType, SubmitterRole } from './model';
import { EventModel, EventDocument } from '../events/model';
import { Types } from 'mongoose';

/**
 * Custom error class for evidence validation errors.
 */
export class EvidenceValidationError extends Error {
  status = 400;

  constructor(message: string) {
    super(message);
    this.name = 'EvidenceValidationError';
  }
}

/**
 * Custom error class for evidence permission errors.
 */
export class EvidencePermissionError extends Error {
  status = 403;

  constructor(message: string) {
    super(message);
    this.name = 'EvidencePermissionError';
  }
}

/**
 * Interface for creating new evidence.
 */
export interface CreateEvidenceData {
  eventId: string;
  submittedBy: string;
  evidenceType: EvidenceType;
  evidenceUrl?: string;
  content?: string;
  description: string;
  supportedOption: string;
}

/**
 * Determines the current evidence submission phase for an event.
 *
 * @param event The event document
 * @returns The current submission phase (none/creator/public)
 */
export function determineEvidencePhase(event: EventDocument): 'none' | 'creator' | 'public' {
  const now = new Date();

  // If betting deadline hasn't passed, no evidence can be submitted yet
  if (now < event.bettingDeadline) {
    return 'none';
  }

  // If we're between betting deadline and evidence deadline, creator can submit
  if (now >= event.bettingDeadline && now < event.evidenceDeadline!) {
    return 'creator';
  }

  // After evidence deadline, public can submit
  if (now >= event.evidenceDeadline!) {
    return 'public';
  }

  return 'none';
}

/**
 * Validates if a user can submit evidence for an event.
 *
 * @param event The event document
 * @param userId The ID of the user trying to submit evidence
 * @returns True if the user can submit, throws error otherwise
 * @throws {EvidencePermissionError} If user doesn't have permission
 * @throws {EvidenceValidationError} If event is not in correct state
 */
export function validateEvidenceSubmission(event: EventDocument, userId: string): SubmitterRole {
  const now = new Date();

  // Check if event is already resolved or cancelled
  if (event.status === 'resolved' || event.status === 'cancelled') {
    throw new EvidenceValidationError('Cannot submit evidence for resolved or cancelled events');
  }

  // Check if betting deadline has passed
  if (now < event.bettingDeadline) {
    throw new EvidenceValidationError('Cannot submit evidence before betting deadline');
  }

  const phase = determineEvidencePhase(event);

  if (phase === 'none') {
    throw new EvidenceValidationError('Evidence submission is not available yet');
  }

  // If in creator phase, only creator can submit
  if (phase === 'creator') {
    if (event.creator.toString() !== userId) {
      throw new EvidencePermissionError('Only the event creator can submit evidence during the first 24 hours');
    }
    return 'creator';
  }

  // If in public phase, anyone except creator can submit
  if (phase === 'public') {
    if (event.creator.toString() === userId) {
      throw new EvidencePermissionError('Event creator missed the deadline to submit evidence');
    }
    return 'public';
  }

  throw new EvidenceValidationError('Invalid evidence submission phase');
}

/**
 * Creates new evidence for an event.
 *
 * @param data The data for the new evidence
 * @returns A promise that resolves to the created evidence document
 * @throws {EvidenceValidationError} If validation fails
 */
export async function createEvidence(data: CreateEvidenceData): Promise<EvidenceDocument> {
  // Fetch the event
  const event = await EventModel.findById(data.eventId);
  if (!event) {
    throw new EvidenceValidationError('Event not found');
  }

  // Validate that supported option exists in event's result options
  if (!event.resultOptions.includes(data.supportedOption)) {
    throw new EvidenceValidationError(
      `Supported option must be one of: ${event.resultOptions.join(', ')}`
    );
  }

  // Validate permission and get submitter role
  const submitterRole = validateEvidenceSubmission(event, data.submittedBy);

  // Update event's evidence phase if needed
  const currentPhase = determineEvidencePhase(event);
  if (event.evidenceSubmissionPhase !== currentPhase) {
    event.evidenceSubmissionPhase = currentPhase;
    await event.save();
  }

  // Create the evidence
  const evidence = await EvidenceModel.create({
    event: data.eventId,
    submittedBy: data.submittedBy,
    submitterRole: submitterRole,
    evidenceType: data.evidenceType,
    evidenceUrl: data.evidenceUrl,
    content: data.content,
    description: data.description,
    supportedOption: data.supportedOption,
  });

  return evidence;
}

/**
 * Retrieves all evidence for a specific event.
 *
 * @param eventId The ID of the event
 * @returns A promise that resolves to an array of evidence documents
 */
export async function getEvidenceByEventId(eventId: string): Promise<EvidenceDocument[]> {
  return EvidenceModel
    .find({ event: eventId })
    .populate('submittedBy', 'username email')
    .sort({ createdAt: 1 })
    .exec();
}

/**
 * Retrieves a specific evidence by its ID.
 *
 * @param evidenceId The ID of the evidence
 * @returns A promise that resolves to the evidence document or null if not found
 */
export async function getEvidenceById(evidenceId: string): Promise<EvidenceDocument | null> {
  return EvidenceModel
    .findById(evidenceId)
    .populate('submittedBy', 'username email')
    .populate('event')
    .exec();
}

/**
 * Counts the number of evidence submissions for an event grouped by submitter role.
 *
 * @param eventId The ID of the event
 * @returns A promise that resolves to counts by role
 */
export async function countEvidenceByRole(eventId: string): Promise<{ creator: number; public: number }> {
  const results = await EvidenceModel.aggregate([
    { $match: { event: new Types.ObjectId(eventId) } },
    { $group: { _id: '$submitterRole', count: { $sum: 1 } } },
  ]);

  const counts = { creator: 0, public: 0 };
  results.forEach((result) => {
    if (result._id === 'creator') counts.creator = result.count;
    if (result._id === 'public') counts.public = result.count;
  });

  return counts;
}
