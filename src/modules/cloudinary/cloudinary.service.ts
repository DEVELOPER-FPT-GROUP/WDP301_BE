import { Injectable } from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { MulterFile } from 'src/common/types/multer-file.type';

@Injectable()
export class CloudinaryService {
  /**
   * 📌 Uploads an image to Cloudinary and returns the upload response
   */
  async uploadImage(file: MulterFile): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: 'uploads' },
        (error, result) => {
          if (error || !result) {
            return reject(new Error(`Cloudinary upload failed: ${error?.message || 'Unknown error'}`));
          }
          resolve(result);
        }
      );
      uploadStream.end(file.buffer);
    });
  }

  /**
   * 📌 Deletes an image from Cloudinary using its public ID
   */
  async deleteImage(publicId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      cloudinary.uploader.destroy(publicId, (error, result) => {
        if (error) {
          return reject(new Error(`Cloudinary deletion failed: ${error.message}`));
        }
        if (result.result !== 'ok') {
          return reject(new Error(`Failed to delete media from Cloudinary: ${result.result}`));
        }
        resolve();
      });
    });
  }

  /**
   * 📌 Extracts the Cloudinary public ID from the media URL
   * Example URL: https://res.cloudinary.com/demo/image/upload/v123456789/uploads/media_abc123.jpg
   * Extracted public ID: uploads/media_abc123
   */
  extractPublicId(url: string): string {
    const parts = url.split('/');
    const fileName = parts[parts.length - 1]; // Example: media_abc123.jpg
    return `uploads/${fileName.split('.')[0]}`; // Extracted public ID
  }
}
