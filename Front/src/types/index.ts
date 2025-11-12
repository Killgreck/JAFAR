export interface User {
  id: string;
  username: string;
  email: string;
  balance?: number;
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
