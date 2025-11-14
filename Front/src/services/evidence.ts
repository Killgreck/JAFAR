import api from './api';
import type { Evidence, CreateEvidenceData } from '../types';

export const evidenceService = {
  /**
   * Submit evidence for an event
   */
  async submitEvidence(eventId: string, data: CreateEvidenceData): Promise<Evidence> {
    const response = await api.post<{ evidence: Evidence }>(`/events/${eventId}/evidence`, data);
    return response.data.evidence;
  },

  /**
   * Get all evidence for an event
   */
  async getEventEvidence(eventId: string): Promise<{
    evidence: Evidence[];
    counts: { creator: number; public: number };
    total: number;
  }> {
    const response = await api.get<{
      evidence: Evidence[];
      counts: { creator: number; public: number };
      total: number;
    }>(`/events/${eventId}/evidence`);
    return response.data;
  },

  /**
   * Get a specific evidence by ID
   */
  async getEvidenceById(evidenceId: string): Promise<Evidence> {
    const response = await api.get<{ evidence: Evidence }>(`/evidence/${evidenceId}`);
    return response.data.evidence;
  },

  /**
   * Like an evidence
   */
  async likeEvidence(eventId: string, evidenceId: string): Promise<{ message: string; likesCount: number }> {
    const response = await api.post(`/events/${eventId}/evidence/${evidenceId}/like`);
    return response.data;
  },

  /**
   * Unlike an evidence
   */
  async unlikeEvidence(eventId: string, evidenceId: string): Promise<{ message: string; likesCount: number }> {
    const response = await api.delete(`/events/${eventId}/evidence/${evidenceId}/like`);
    return response.data;
  },
};
