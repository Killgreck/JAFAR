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
  opponent?: string;
  description: string;
  amount: number;
  creatorSide: 'for' | 'against';
  status: 'open' | 'accepted' | 'settled' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

export interface CreateBetData {
  creator: string;
  description: string;
  amount: number;
  creatorSide: 'for' | 'against';
  opponent?: string;
}
