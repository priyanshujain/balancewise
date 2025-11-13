import { API_URL } from '@/config/env';

export interface InitiateAuthResponse {
  authUrl: string;
  state: string;
}

export interface PollAuthRequest {
  state: string;
}

export interface PollAuthResponse {
  authenticated: boolean;
  token?: string;
  user?: {
    id: string;
    email: string;
    name: string;
    picture?: string;
  };
}

class ApiService {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(error.message || 'Request failed');
      }

      return response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  async initiateAuth(): Promise<InitiateAuthResponse> {
    return this.request<InitiateAuthResponse>('/auth/initiate', {
      method: 'POST',
    });
  }

  async pollAuth(state: string): Promise<PollAuthResponse> {
    return this.request<PollAuthResponse>('/auth/poll', {
      method: 'POST',
      body: JSON.stringify({ state }),
    });
  }

  async verifyToken(token: string): Promise<{ valid: boolean; user?: any }> {
    return this.request('/auth/verify', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }
}

export const apiService = new ApiService(API_URL);