import { API_URL } from '@/config/env';
import type { GoogleDriveToken } from '@/types/sync';

interface TokenCache {
  accessToken: string;
  expiresAt: Date;
}

let tokenCache: TokenCache | null = null;

const TOKEN_REFRESH_BUFFER_MS = 5 * 60 * 1000;

export class GoogleDriveTokenManager {
  private jwtToken: string | null = null;

  constructor(jwtToken?: string) {
    this.jwtToken = jwtToken || null;
  }

  setJwtToken(token: string): void {
    this.jwtToken = token;
  }

  async getAccessToken(): Promise<string> {
    if (!this.jwtToken) {
      throw new Error('No JWT token available. User must be logged in.');
    }

    if (tokenCache && this.isTokenValid(tokenCache)) {
      return tokenCache.accessToken;
    }

    return this.fetchFreshToken();
  }

  private isTokenValid(cache: TokenCache): boolean {
    const now = new Date();
    const expiryWithBuffer = new Date(cache.expiresAt.getTime() - TOKEN_REFRESH_BUFFER_MS);
    return now < expiryWithBuffer;
  }

  private async fetchFreshToken(): Promise<string> {
    if (!this.jwtToken) {
      throw new Error('No JWT token available');
    }

    try {
      const response = await fetch(`${API_URL}/auth/google-token`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.jwtToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.error('Token fetch failed:', {
          status: response.status,
          statusText: response.statusText,
          url: response.url,
        });

        if (response.status === 401) {
          throw new Error('Google Drive permission not granted or expired');
        }

        const errorText = await response.text();
        let errorMessage = response.statusText;

        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.message || errorJson.error || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }

        console.error('Server error response:', errorMessage);
        throw new Error(`Failed to get Google Drive token: ${errorMessage}`);
      }

      const data: GoogleDriveToken = await response.json();

      tokenCache = {
        accessToken: data.access_token,
        expiresAt: new Date(data.expires_at),
      };

      return data.access_token;
    } catch (error) {
      console.error('Failed to fetch Google Drive token:', error);
      throw error;
    }
  }

  clearCache(): void {
    tokenCache = null;
  }
}

export const googleDriveTokenManager = new GoogleDriveTokenManager();
