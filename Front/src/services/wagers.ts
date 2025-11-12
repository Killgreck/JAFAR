import api from './api';
import type { Wager, PlaceWagerData } from '../types';

export const wagersService = {
  async placeWager(data: PlaceWagerData): Promise<Wager> {
    const response = await api.post<Wager>('/wagers', data);
    return response.data;
  },

  async getByBet(betId: string): Promise<Wager[]> {
    const response = await api.get<Wager[]>(`/wagers/bet/${betId}`);
    return response.data;
  },

  async getByUser(userId: string): Promise<Wager[]> {
    const response = await api.get<Wager[]>(`/wagers/user/${userId}`);
    return response.data;
  },
};
