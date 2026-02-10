/**
 * API Client
 *
 * HTTP client wrapper with interceptors for authentication,
 * error handling, and request/response transformation.
 *
 * TODO: Replace mock implementation with real API calls when backend is ready.
 */

import { config } from '@/src/config';
import { ApiError, ApiResponse, PaginationMeta } from '@/src/shared/types';

// Request configuration
interface RequestConfig {
  headers?: Record<string, string>;
  params?: Record<string, string | number | boolean | undefined>;
  timeout?: number;
}

// API client singleton
class ApiClient {
  private baseUrl: string;
  private defaultTimeout: number;
  private authToken: string | null = null;

  constructor() {
    this.baseUrl = config.API_BASE_URL;
    this.defaultTimeout = 30000;
  }

  // Set auth token (call after login)
  setAuthToken(token: string | null): void {
    this.authToken = token;
  }

  // Build headers
  private getHeaders(customHeaders?: Record<string, string>): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...customHeaders,
    };

    if (this.authToken) {
      headers.Authorization = `Bearer ${this.authToken}`;
    }

    return headers;
  }

  // Build URL with query params
  private buildUrl(
    endpoint: string,
    params?: Record<string, string | number | boolean | undefined>
  ): string {
    const url = new URL(endpoint, this.baseUrl);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    return url.toString();
  }

  // Handle API errors
  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error: ApiError = {
        code: `HTTP_${response.status}`,
        message: errorData.message || `Request failed with status ${response.status}`,
        details: errorData.details,
      };
      throw error;
    }

    const data = await response.json();
    return data;
  }

  // GET request
  async get<T>(endpoint: string, config?: RequestConfig): Promise<ApiResponse<T>> {
    const url = this.buildUrl(endpoint, config?.params);

    const response = await fetch(url, {
      method: 'GET',
      headers: this.getHeaders(config?.headers),
      signal: AbortSignal.timeout(config?.timeout || this.defaultTimeout),
    });

    return this.handleResponse<T>(response);
  }

  // POST request
  async post<T>(
    endpoint: string,
    body?: unknown,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    const url = this.buildUrl(endpoint, config?.params);

    const response = await fetch(url, {
      method: 'POST',
      headers: this.getHeaders(config?.headers),
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(config?.timeout || this.defaultTimeout),
    });

    return this.handleResponse<T>(response);
  }

  // PUT request
  async put<T>(
    endpoint: string,
    body?: unknown,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    const url = this.buildUrl(endpoint, config?.params);

    const response = await fetch(url, {
      method: 'PUT',
      headers: this.getHeaders(config?.headers),
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(config?.timeout || this.defaultTimeout),
    });

    return this.handleResponse<T>(response);
  }

  // DELETE request
  async delete<T>(endpoint: string, config?: RequestConfig): Promise<ApiResponse<T>> {
    const url = this.buildUrl(endpoint, config?.params);

    const response = await fetch(url, {
      method: 'DELETE',
      headers: this.getHeaders(config?.headers),
      signal: AbortSignal.timeout(config?.timeout || this.defaultTimeout),
    });

    return this.handleResponse<T>(response);
  }

  // PATCH request
  async patch<T>(
    endpoint: string,
    body?: unknown,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    const url = this.buildUrl(endpoint, config?.params);

    const response = await fetch(url, {
      method: 'PATCH',
      headers: this.getHeaders(config?.headers),
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(config?.timeout || this.defaultTimeout),
    });

    return this.handleResponse<T>(response);
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Helper to create pagination meta
export const createPaginationMeta = (
  page: number,
  limit: number,
  total: number
): PaginationMeta => ({
  currentPage: page,
  totalPages: Math.ceil(total / limit),
  totalItems: total,
  itemsPerPage: limit,
  hasNextPage: page * limit < total,
  hasPreviousPage: page > 1,
});

// Helper to simulate network delay (for mock services)
export const simulateDelay = (ms: number = config.MOCK_DELAY_MS): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));
