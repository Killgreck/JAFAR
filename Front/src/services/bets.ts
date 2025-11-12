import api from './api';
import type { Bet, CreateBetData } from '../types';

export const betsService = {
  async list(): Promise<Bet[]> {
    const response = await api.get<Bet[]>('/bets');
    return response.data;
  },

  async getById(id: string): Promise<Bet> {
    const response = await api.get<Bet>(`/bets/${id}`);
    return response.data;
  },

  async create(data: CreateBetData): Promise<Bet> {
    const response = await api.post<Bet>('/bets', data);
    return response.data;
  },

  async accept(betId: string, opponentId: string): Promise<Bet> {
    const response = await api.post<Bet>(`/bets/${betId}/accept`, { opponentId });
    return response.data;
  },
};
