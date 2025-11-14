import api from './api';
import type { Event, CreateEventData, ResolveEventData, PaginationMeta } from '../types';
import type { Event, CreateEventData, ResolveEventData, EventSearchParams, EventSearchResult } from '../types';

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

  async listPaginated(params?: {
    search?: string;
    category?: string;
    status?: string;
    creator?: string;
    dateFrom?: string;
    dateTo?: string;
    sortBy?: string;
    page?: number;
    limit?: number;
  }): Promise<{ events: Event[]; pagination: PaginationMeta }> {
    const urlParams = new URLSearchParams();

    if (params?.search) urlParams.append('search', params.search);
    if (params?.category) urlParams.append('category', params.category);
    if (params?.status) urlParams.append('status', params.status);
    if (params?.creator) urlParams.append('creator', params.creator);
    if (params?.dateFrom) urlParams.append('dateFrom', params.dateFrom);
    if (params?.dateTo) urlParams.append('dateTo', params.dateTo);
    if (params?.sortBy) urlParams.append('sortBy', params.sortBy);
    if (params?.page) urlParams.append('page', params.page.toString());
    if (params?.limit) urlParams.append('limit', params.limit.toString());

    const queryString = urlParams.toString();
    const url = queryString ? `/events?${queryString}` : '/events';

    const response = await api.get<{ events: Event[]; pagination: PaginationMeta }>(url);
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

  async search(params: EventSearchParams = {}): Promise<EventSearchResult> {
    const urlParams = new URLSearchParams();

    if (params.q) urlParams.append('q', params.q);
    if (params.category) urlParams.append('category', params.category);
    if (params.status) urlParams.append('status', params.status);
    if (params.dateFrom) urlParams.append('dateFrom', params.dateFrom);
    if (params.dateTo) urlParams.append('dateTo', params.dateTo);
    if (params.sortBy) urlParams.append('sortBy', params.sortBy);
    if (params.page !== undefined) urlParams.append('page', params.page.toString());
    if (params.limit !== undefined) urlParams.append('limit', params.limit.toString());

    const queryString = urlParams.toString();
    const url = queryString ? `/events/search?${queryString}` : '/events/search';

    const response = await api.get<EventSearchResult>(url);
    return response.data;
  },
};
