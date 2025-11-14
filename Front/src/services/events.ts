import api from './api';
import type { Event, CreateEventData, ResolveEventData } from '../types';

export const eventsService = {
  async list(filters?: { category?: string; status?: string; creator?: string }): Promise<Event[]> {
    const params = new URLSearchParams();
    if (filters?.category) params.append('category', filters.category);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.creator) params.append('creator', filters.creator);

    const queryString = params.toString();
    const url = queryString ? `/events?${queryString}` : '/events';

    const response = await api.get<Event[]>(url);
    return response.data;
  },

  async getById(id: string): Promise<Event> {
    const response = await api.get<Event>(`/events/${id}`);
    return response.data;
  },

  async create(data: CreateEventData): Promise<Event> {
    const response = await api.post<Event>('/events', data);
    return response.data;
  },

  async updateStatus(id: string, status: string): Promise<Event> {
    const response = await api.put<Event>(`/events/${id}/status`, { status });
    return response.data;
  },

  async resolve(id: string, data: ResolveEventData): Promise<Event> {
    const response = await api.post<Event>(`/events/${id}/resolve`, data);
    return response.data;
  },
};
