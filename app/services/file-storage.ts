import { File, Directory, Paths } from 'expo-file-system';

const IMAGES_DIR_NAME = 'diet-images';

export const fileStorage = {
  ensureDirectoryExists(): void {
    const dir = new Directory(Paths.document, IMAGES_DIR_NAME);
    if (!dir.exists) {
      dir.create({ intermediates: true });
    }
  },

  async saveImagePermanently(tempUri: string, filename: string): Promise<string> {
    this.ensureDirectoryExists();

    const sourceFile = new File(tempUri);
    const targetFile = new File(Paths.document, `${IMAGES_DIR_NAME}/${filename}`);

    sourceFile.copy(targetFile);

    return targetFile.uri;
  },

  deleteImage(uri: string): void {
    try {
      const file = new File(uri);
      if (file.exists) {
        file.delete();
      }
    } catch (error) {
      console.error('Error deleting image:', error);
    }
  },

  getImageUri(filename: string): string {
    const file = new File(Paths.document, `${IMAGES_DIR_NAME}/${filename}`);
    return file.uri;
  },

  fileExists(uri: string): boolean {
    try {
      const file = new File(uri);
      return file.exists;
    } catch {
      return false;
    }
  },
};
