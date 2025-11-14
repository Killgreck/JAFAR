import api from './api';
import type { Event } from '../types';

export const curatorService = {
  /**
   * Get events ready for curation (curator/admin only).
   */
  async getEventsForCuration(): Promise<{ events: Event[]; count: number }> {
    const response = await api.get('/events/curation/ready');
    return response.data;
  },

  /**
   * Resolve an event (curator/admin only).
   */
  async resolveEvent(
    eventId: string,
    data: {
      winningOption: string;
      evidenceId?: string;
      rationale?: string;
    }
  ): Promise<{ event: Event }> {
    const response = await api.post(`/events/${eventId}/resolve`, data);
    return response.data;
  },
};
