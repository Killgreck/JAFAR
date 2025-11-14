import api from './api';
import type {
  Transaction,
  TransactionFilters,
  TransactionSearchResult
} from '../types';

export const transactionsService = {
  /**
   * Get transaction history for a user with pagination and filters
   */
  async getUserTransactions(
    userId: string,
    filters?: TransactionFilters
  ): Promise<TransactionSearchResult> {
    const params = new URLSearchParams();

    if (filters?.type) params.append('type', filters.type);
    if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom);
    if (filters?.dateTo) params.append('dateTo', filters.dateTo);
    if (filters?.page !== undefined) params.append('page', filters.page.toString());
    if (filters?.limit !== undefined) params.append('limit', filters.limit.toString());

    const queryString = params.toString();
    const url = queryString
      ? `/wallet/${userId}/transactions?${queryString}`
      : `/wallet/${userId}/transactions`;

    const response = await api.get<{
      transactions: Transaction[];
      total: number;
      page: number;
      totalPages: number;
      hasMore: boolean;
      limit: number;
    }>(url);

    return {
      transactions: response.data.transactions,
      pagination: {
        total: response.data.total,
        page: response.data.page,
        totalPages: response.data.totalPages,
        hasMore: response.data.hasMore,
        limit: response.data.limit,
      },
    };
  },

  /**
   * Get transaction statistics for a user
   */
  async getTransactionStats(userId: string): Promise<{
    totalTransactions: number;
    totalDeposits: number;
    totalWithdrawals: number;
    totalWins: number;
    totalLosses: number;
    netGain: number;
  }> {
    const response = await api.get<{
      totalTransactions: number;
      totalDeposits: number;
      totalWithdrawals: number;
      totalWins: number;
      totalLosses: number;
      netGain: number;
    }>(`/wallet/${userId}/transactions/stats`);

    return response.data;
  },
};
