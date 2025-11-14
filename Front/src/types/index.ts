export type UserRole = 'user' | 'curator' | 'admin';

export type CuratorStatus = 'none' | 'pending' | 'approved' | 'rejected';

export interface User {
  id: string;
  username: string;
  email: string;
  balance?: number;
  role?: UserRole;
  curatorStatus?: CuratorStatus;
  isBanned?: boolean;
  bannedAt?: string;
  banReason?: string;
  avatar?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
}

export interface Bet {
  id: string;
  creator: string;
  question: string;
  totalForAmount: number;
  totalAgainstAmount: number;
  status: 'open' | 'settled' | 'cancelled';
  result?: 'for' | 'against';
  settledAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBetData {
  creator: string;
  question: string;
}

export interface Wager {
  id: string;
  bet: string;
  user: string;
  side: 'for' | 'against';
  amount: number;
  odds: number;
  payout?: number;
  createdAt: string;
}

export interface PlaceWagerData {
  betId: string;
  userId: string;
  side: 'for' | 'against';
  amount: number;
}

export type EventCategory = 'Deportes' | 'Política' | 'Entretenimiento' | 'Economía' | 'Otros';

export type EventStatus = 'open' | 'closed' | 'resolved' | 'cancelled';

export type EvidencePhase = 'none' | 'creator' | 'public';

export interface Event {
  id: string;
  creator: string;
  title: string;
  description: string;
  category: EventCategory;
  bettingDeadline: string;
  evidenceDeadline?: string;
  evidenceSubmissionPhase?: EvidencePhase;
  expectedResolutionDate: string;
  resultOptions: string[];
  status: EventStatus;
  totalBets?: number;
  winningOption?: string;
  resolvedAt?: string;
  resolvedBy?: string;
  resolutionRationale?: string;
  evidenceUsed?: string;
  curatorCommission?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEventData {
  title: string;
  description: string;
  category: EventCategory;
  bettingDeadline: Date;
  expectedResolutionDate: Date;
  resultOptions: string[];
}

export type EvidenceType = 'link' | 'image' | 'document' | 'video' | 'text';

export type SubmitterRole = 'creator' | 'public' | 'curator';

export interface Evidence {
  id: string;
  event: string;
  submittedBy: {
    id: string;
    username: string;
    email: string;
  };
  submitterRole: SubmitterRole;
  evidenceType: EvidenceType;
  evidenceUrl?: string;
  content?: string;
  description: string;
  supportedOption: string;
  likes?: string[];
  likesCount?: number;
  createdAt: string;
}

export interface CreateEvidenceData {
  evidenceType: EvidenceType;
  evidenceUrl?: string;
  content?: string;
  description: string;
  supportedOption: string;
}

export interface ResolveEventData {
  winningOption: string;
  evidenceId?: string;
  rationale?: string;
}

// Admin interfaces
export interface BanUserData {
  reason?: string;
}

export interface ChangeRoleData {
  role: UserRole;
}

export interface UpdateEventDatesData {
  bettingDeadline: Date;
  expectedResolutionDate: Date;
}

export interface BannedUser extends User {
  bannedBy?: {
    id: string;
    username: string;
    email: string;
  };
}

export interface UserStatistics {
  totalBets: number;
  wonBets: number;
  lostBets: number;
  activeBets: number;
  successRate: number;
}

export interface UserProfile {
  profile: User;
  statistics: UserStatistics;
}

export interface UpdateProfileData {
  username?: string;
  avatar?: string;
}

// Event search and pagination interfaces
export interface EventSearchParams {
  q?: string;
  category?: EventCategory;
  status?: EventStatus;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: 'recent' | 'closing_soon' | 'most_bets';
  page?: number;
  limit?: number;
}

export interface PaginationInfo {
  total: number;
  page: number;
  totalPages: number;
  hasMore: boolean;
  limit: number;
}

export interface EventSearchResult {
  events: Event[];
  pagination: PaginationInfo;
}

// Transaction interfaces
export type TransactionType = 'deposit' | 'withdraw' | 'block' | 'release' | 'win' | 'loss' | 'commission';

export interface Transaction {
  id: string;
  user: string;
  wallet: string;
  type: TransactionType;
  amount: number;
  balanceAfter: number;
  blockedBalanceAfter?: number;
  description: string;
  relatedEvent?: {
    id: string;
    title: string;
  };
  relatedWager?: {
    id: string;
  };
  relatedBet?: {
    id: string;
    question: string;
  };
  metadata?: any;
  createdAt: string;
  updatedAt: string;
}

export interface TransactionFilters {
  type?: TransactionType;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export interface TransactionSearchResult {
  transactions: Transaction[];
  pagination: PaginationInfo;
}
