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
    gdrive_allowed?: boolean;
  };
}

export interface ProfileResponse {
  id: string;
  email: string;
  name: string;
  picture?: string;
  gdrive_allowed: boolean;
}

export interface AnalyzeResponse {
  food_name: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
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

  async requestDrivePermission(token: string): Promise<InitiateAuthResponse> {
    return this.request<InitiateAuthResponse>('/auth/request-drive-permission', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  async getProfile(token: string): Promise<ProfileResponse> {
    return this.request<ProfileResponse>('/auth/profile', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  async analyzeDietImage(imageUri: string): Promise<AnalyzeResponse> {
    const url = `${this.baseUrl}/diet/analyze`;

    try {
      // Create form data
      const formData = new FormData();

      // Extract filename and extension from URI
      // Decode URI to handle special characters and spaces
      const decodedUri = decodeURIComponent(imageUri);
      const originalFilename = decodedUri.split('/').pop() || 'image.jpg';

      // Sanitize filename - replace spaces and special chars with underscores
      const sanitizedFilename = originalFilename.replace(/[^a-zA-Z0-9._-]/g, '_');

      const extension = sanitizedFilename.split('.').pop()?.toLowerCase() || 'jpg';

      // Determine mime type based on extension
      let mimeType = 'image/jpeg';
      if (extension === 'png') {
        mimeType = 'image/png';
      } else if (extension === 'jpg' || extension === 'jpeg') {
        mimeType = 'image/jpeg';
      } else if (extension === 'webp') {
        mimeType = 'image/webp';
      } else if (extension === 'gif') {
        mimeType = 'image/gif';
      }

      console.log('Uploading image:', {
        originalUri: imageUri,
        decodedUri: decodedUri,
        originalFilename: originalFilename,
        sanitizedFilename: sanitizedFilename,
        type: mimeType
      });

      // Different handling for web vs native
      // On web, we need to fetch the blob and create a File object
      // On native, we use the uri format
      const isWeb = typeof window !== 'undefined' && typeof window.document !== 'undefined';

      if (isWeb) {
        // Web: Fetch the image as a blob and create a File object
        console.log('Web platform detected, fetching blob...');
        const response = await fetch(imageUri);
        const blob = await response.blob();
        console.log('Blob fetched:', blob.size, 'bytes, type:', blob.type);

        // Create a File object from the blob
        const file = new File([blob], sanitizedFilename, { type: mimeType });
        formData.append('image', file);
      } else {
        // Native: Use the uri format
        console.log('Native platform detected, using uri format');
        formData.append('image', {
          uri: imageUri,
          type: mimeType,
          name: sanitizedFilename,
        } as any);
      }

      console.log('FormData created, sending request to:', url);

      // IMPORTANT: Don't set Content-Type header manually
      // Let fetch automatically set it with the correct boundary
      const response = await fetch(url, {
        method: 'POST',
        body: formData,
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API error response:', errorText);
        let error;
        try {
          error = JSON.parse(errorText);
        } catch {
          error = { message: response.statusText };
        }
        throw new Error(error.message || 'Failed to analyze image');
      }

      const result = await response.json();
      console.log('API success response:', result);
      return result;
    } catch (error) {
      console.error('Diet image analysis failed:', error);
      throw error;
    }
  }
}

export const apiService = new ApiService(API_URL);
