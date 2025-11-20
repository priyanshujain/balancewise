import { googleDriveTokenManager } from './token-manager';
import { googleDriveFolderCache } from './folder-cache';
import { getYearMonthFolder } from '@/utils/date-helpers';
import type { GoogleDriveFolderMetadata, GoogleDriveFileMetadata, UploadResult } from '@/types/sync';
import { File } from 'expo-file-system';

const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3';
const DRIVE_UPLOAD_BASE = 'https://www.googleapis.com/upload/drive/v3';

const ROOT_FOLDER_NAME = 'BalanceWise';
const DIET_FOLDER_NAME = 'Diet';

export class GoogleDriveApi {
  async ensureFolderStructure(timestamp: number): Promise<string> {
    const yearMonth = getYearMonthFolder(timestamp);
    const cacheKey = `diet_${yearMonth}`;

    const cachedFolderId = await googleDriveFolderCache.getFolderId(cacheKey);
    if (cachedFolderId) {
      return cachedFolderId;
    }

    const accessToken = await googleDriveTokenManager.getAccessToken();

    const rootFolderId = await this.getOrCreateFolder(ROOT_FOLDER_NAME, null, accessToken);

    const dietFolderId = await this.getOrCreateFolder(DIET_FOLDER_NAME, rootFolderId, accessToken);

    const yearMonthFolderId = await this.getOrCreateFolder(yearMonth, dietFolderId, accessToken);

    await googleDriveFolderCache.setFolderId(cacheKey, yearMonthFolderId);

    return yearMonthFolderId;
  }

  private async getOrCreateFolder(
    name: string,
    parentId: string | null,
    accessToken: string
  ): Promise<string> {
    const existingFolder = await this.findFolder(name, parentId, accessToken);

    if (existingFolder) {
      return existingFolder.id;
    }

    return this.createFolder(name, parentId, accessToken);
  }

  private async findFolder(
    name: string,
    parentId: string | null,
    accessToken: string
  ): Promise<GoogleDriveFolderMetadata | null> {
    try {
      const query = parentId
        ? `name='${name}' and '${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`
        : `name='${name}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;

      const response = await fetch(
        `${DRIVE_API_BASE}/files?q=${encodeURIComponent(query)}&fields=files(id,name,mimeType)`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to search folder: ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();

      if (data.files && data.files.length > 0) {
        return data.files[0] as GoogleDriveFolderMetadata;
      }

      return null;
    } catch (error) {
      console.error('Error finding folder:', error);
      return null;
    }
  }

  private async createFolder(
    name: string,
    parentId: string | null,
    accessToken: string
  ): Promise<string> {
    const metadata: any = {
      name,
      mimeType: 'application/vnd.google-apps.folder',
    };

    if (parentId) {
      metadata.parents = [parentId];
    }

    const response = await fetch(`${DRIVE_API_BASE}/files?fields=id`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(metadata),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to create folder: ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    return data.id;
  }

  async uploadImage(fileUri: string, filename: string, folderId: string): Promise<UploadResult> {
    try {
      const accessToken = await googleDriveTokenManager.getAccessToken();

      const isWeb = typeof window !== 'undefined' && typeof window.document !== 'undefined';
      const mimeType = 'image/jpeg';
      const boundary = `----WebKitFormBoundary${Math.random().toString(36).substring(2)}`;

      const metadata = {
        name: filename,
        parents: [folderId],
        mimeType: mimeType,
      };

      let base64Data: string;
      if (isWeb) {
        const response = await fetch(fileUri);
        const blob = await response.blob();
        const arrayBuffer = await blob.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        base64Data = btoa(String.fromCharCode.apply(null, Array.from(uint8Array)));
      } else {
        const file = new File(fileUri);
        base64Data = await file.base64();
      }

      const multipartBody =
        `\r\n--${boundary}\r\n` +
        `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
        `${JSON.stringify(metadata)}\r\n` +
        `--${boundary}\r\n` +
        `Content-Type: ${mimeType}\r\n` +
        `Content-Transfer-Encoding: base64\r\n\r\n` +
        `${base64Data}\r\n` +
        `--${boundary}--`;

      const uploadResponse = await fetch(
        `${DRIVE_UPLOAD_BASE}/files?uploadType=multipart&fields=id,name`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': `multipart/related; boundary=${boundary}`,
          },
          body: multipartBody,
        }
      );

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        throw new Error(`Upload failed: ${uploadResponse.statusText} - ${errorText}`);
      }

      const data: GoogleDriveFileMetadata = await uploadResponse.json();

      return {
        success: true,
        fileId: data.id,
      };
    } catch (error: any) {
      console.error('Error uploading to Google Drive:', error);
      return {
        success: false,
        error: error.message || 'Unknown upload error',
      };
    }
  }

  async deleteFile(fileId: string): Promise<boolean> {
    try {
      const accessToken = await googleDriveTokenManager.getAccessToken();

      const response = await fetch(`${DRIVE_API_BASE}/files/${fileId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (response.status === 404) {
        console.warn(`File ${fileId} not found, considering as deleted`);
        return true;
      }

      if (!response.ok) {
        throw new Error(`Failed to delete file: ${response.statusText}`);
      }

      return true;
    } catch (error) {
      console.error('Error deleting file from Google Drive:', error);
      return false;
    }
  }

  async updateFile(
    oldFileId: string,
    newFileUri: string,
    filename: string,
    folderId: string
  ): Promise<UploadResult> {
    await this.deleteFile(oldFileId);

    return this.uploadImage(newFileUri, filename, folderId);
  }
}

export const googleDriveApi = new GoogleDriveApi();
