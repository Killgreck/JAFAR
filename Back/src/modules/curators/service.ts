import mongoose, { Types } from 'mongoose';
import { CuratorRequestModel, CuratorRequestDocument } from './model';
import { UserModel, UserDocument } from '../users/model';

/**
 * Create a new curator request for a user.
 *
 * @param userId User requesting curator status
 * @param data Application data (reason, experience)
 * @returns Created curator request
 * @throws Error if user already has a pending/approved request
 */
export async function createCuratorRequest(
  userId: string,
  data: {
    reason: string;
    experience: string;
  }
): Promise<CuratorRequestDocument> {
  // Check if user already has a request
  const existingRequest = await CuratorRequestModel.findOne({ user: userId });

  if (existingRequest) {
    if (existingRequest.status === 'pending') {
      throw new Error('You already have a pending curator request');
    }
    if (existingRequest.status === 'approved') {
      throw new Error('You are already a curator');
    }
    // If rejected, delete old request and allow new one
    await existingRequest.deleteOne();
  }

  // Create new request
  const request = await CuratorRequestModel.create({
    user: new Types.ObjectId(userId),
    reason: data.reason,
    experience: data.experience,
    status: 'pending',
  });

  // Update user curatorStatus to 'pending'
  await UserModel.findByIdAndUpdate(userId, {
    curatorStatus: 'pending',
  });

  return request;
}

/**
 * Get all curator requests with optional filtering.
 *
 * @param filter Optional filter (status)
 * @returns List of curator requests
 */
export async function listCuratorRequests(filter?: {
  status?: string;
}): Promise<CuratorRequestDocument[]> {
  const query: any = {};

  if (filter?.status) {
    query.status = filter.status;
  }

  return CuratorRequestModel.find(query)
    .populate('user', 'email username createdAt')
    .populate('reviewedBy', 'email username')
    .sort({ createdAt: -1 })
    .exec();
}

/**
 * Get a specific curator request by ID.
 *
 * @param requestId Request ID
 * @returns Curator request or null
 */
export async function getCuratorRequestById(
  requestId: string
): Promise<CuratorRequestDocument | null> {
  return CuratorRequestModel.findById(requestId)
    .populate('user', 'email username createdAt')
    .populate('reviewedBy', 'email username')
    .exec();
}

/**
 * Approve a curator request.
 * Uses MongoDB transaction to ensure atomicity.
 *
 * Process:
 * 1. Update request status to 'approved'
 * 2. Update user role to 'curator'
 * 3. Update user curatorStatus to 'approved'
 * 4. Set approval metadata
 *
 * @param requestId Request to approve
 * @param adminId Admin who is approving
 * @param notes Optional approval notes
 * @returns Updated request and user
 * @throws Error if request not found or not pending
 */
export async function approveCuratorRequest(
  requestId: string,
  adminId: string,
  notes?: string
): Promise<{ request: CuratorRequestDocument; user: UserDocument }> {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1. Get and validate request
    const request = await CuratorRequestModel.findById(requestId).session(session);
    if (!request) {
      throw new Error('Curator request not found');
    }
    if (request.status !== 'pending') {
      throw new Error(`Request status is ${request.status}, expected pending`);
    }

    // 2. Update request
    request.status = 'approved';
    request.reviewedBy = new Types.ObjectId(adminId);
    request.reviewedAt = new Date();
    if (notes) {
      request.reviewNotes = notes;
    }
    await request.save({ session });

    // 3. Update user
    const user = await UserModel.findById(request.user).session(session);
    if (!user) {
      throw new Error('User not found');
    }

    user.role = 'curator';
    user.curatorStatus = 'approved';
    user.curatorApprovedBy = new Types.ObjectId(adminId);
    user.curatorApprovedAt = new Date();
    await user.save({ session });

    // Commit transaction
    await session.commitTransaction();

    // Populate before returning
    await request.populate('user', 'email username role curatorStatus');
    await request.populate('reviewedBy', 'email username');

    return { request, user };
  } catch (error) {
    // Rollback on error
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

/**
 * Reject a curator request.
 *
 * @param requestId Request to reject
 * @param adminId Admin who is rejecting
 * @param notes Rejection reason (required)
 * @returns Updated request
 * @throws Error if request not found or not pending
 */
export async function rejectCuratorRequest(
  requestId: string,
  adminId: string,
  notes: string
): Promise<CuratorRequestDocument> {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1. Get and validate request
    const request = await CuratorRequestModel.findById(requestId).session(session);
    if (!request) {
      throw new Error('Curator request not found');
    }
    if (request.status !== 'pending') {
      throw new Error(`Request status is ${request.status}, expected pending`);
    }

    // 2. Update request
    request.status = 'rejected';
    request.reviewedBy = new Types.ObjectId(adminId);
    request.reviewedAt = new Date();
    request.reviewNotes = notes;
    await request.save({ session });

    // 3. Update user curatorStatus back to 'none' or 'rejected'
    await UserModel.findByIdAndUpdate(
      request.user,
      { curatorStatus: 'rejected' },
      { session }
    );

    await session.commitTransaction();

    // Populate before returning
    await request.populate('user', 'email username curatorStatus');
    await request.populate('reviewedBy', 'email username');

    return request;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

/**
 * Get list of all approved curators (public information).
 *
 * @returns List of curator users
 */
export async function listApprovedCurators(): Promise<UserDocument[]> {
  return UserModel.find({
    role: 'curator',
    curatorStatus: 'approved',
  })
    .select('email username curatorApprovedAt createdAt')
    .populate('curatorApprovedBy', 'username')
    .sort({ curatorApprovedAt: -1 })
    .exec();
}

/**
 * Get user's own curator request if exists.
 *
 * @param userId User ID
 * @returns Curator request or null
 */
export async function getUserCuratorRequest(
  userId: string
): Promise<CuratorRequestDocument | null> {
  return CuratorRequestModel.findOne({ user: userId })
    .populate('reviewedBy', 'username email')
    .exec();
}
