import api from './api';
import type { User, BanUserData, ChangeRoleData, BannedUser, UpdateEventDatesData, Event } from '../types';

export const adminService = {
  // User Management
  async searchUsers(query: string): Promise<{ users: User[]; count: number }> {
    const response = await api.get(`/users/search?q=${encodeURIComponent(query)}`);
    return response.data;
  },

  async getBannedUsers(): Promise<{ users: BannedUser[]; count: number }> {
    const response = await api.get('/users/banned');
    return response.data;
  },

  async banUser(userId: string, data?: BanUserData): Promise<{ message: string; user: User }> {
    const response = await api.post(`/users/${userId}/ban`, data || {});
    return response.data;
  },

  async unbanUser(userId: string): Promise<{ message: string; user: User }> {
    const response = await api.post(`/users/${userId}/unban`);
    return response.data;
  },

  async changeUserRole(userId: string, data: ChangeRoleData): Promise<{ message: string; user: User }> {
    const response = await api.patch(`/users/${userId}/role`, data);
    return response.data;
  },

  // Event Management
  async cancelEvent(eventId: string): Promise<{ message: string; event: Event }> {
    const response = await api.post(`/events/${eventId}/cancel`);
    return response.data;
  },

  async updateEventDates(eventId: string, data: UpdateEventDatesData): Promise<{ message: string; event: Event }> {
    const response = await api.patch(`/events/${eventId}/dates`, {
      bettingDeadline: data.bettingDeadline.toISOString(),
      expectedResolutionDate: data.expectedResolutionDate.toISOString(),
    });
    return response.data;
  },
};
