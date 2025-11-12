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
  title: string;
  description: string;
  amount: number;
  odds: number;
  createdBy: string;
  status: 'pending' | 'matched' | 'resolved';
  createdAt: string;
}
