/**
 * API Response Types
 *
 * These types mirror the expected API response structure.
 * Mock data and real APIs should conform to these types.
 */

// Base API response wrapper
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  meta?: PaginationMeta;
}

export interface PaginationMeta {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, string[]>;
}

// Pagination request params
export interface PaginationParams {
  page?: number;
  limit?: number;
  cursor?: string;
}
