import { BadRequestException, Injectable } from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { MulterFile } from 'src/common/types/multer-file.type';
import { winstonLogger as logger } from 'src/common/winston-logger';
@Injectable()
export class CloudinaryService {
  /**
   * 📌 Uploads a file to Cloudinary and returns the upload response
   */
  async uploadFile(file: MulterFile): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { 
          folder: 'uploads',
          resource_type: 'auto', // Auto-detect file type
        },
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
   * 📌 Deletes multiple images from Cloudinary using their public IDs
   */
  async deleteMultipleFiles(publicIds: string[]): Promise<void> {
    if (!publicIds || publicIds.length === 0) {
      return; // Nothing to delete
    }

    try {
      // Use Promise.all for parallel deletions with destroy
      await Promise.all(publicIds.map(publicId => this.deleteImage(publicId)));
    } catch (error) {
      throw new BadRequestException(`Failed to delete multiple files from Cloudinary: ${error.message}`);
    }
  }

  /**
   * 📌 Alternative bulk deletion using Cloudinary Admin API (optional)
   * Requires Admin API credentials configured
   */
  async deleteMultipleFilesBulk(publicIds: string[]): Promise<void> {
    if (!publicIds || publicIds.length === 0) {
      return; // Nothing to delete
    }

    try {
      const result = await cloudinary.api.delete_resources(publicIds, {
        resource_type: 'image', // Adjust if you support other types
      });
      if (!result.deleted) {
        throw new Error('Bulk deletion failed');
      }
      const failedDeletions = Object.entries(result.deleted).filter(([_, status]) => status !== 'deleted');
      if (failedDeletions.length > 0) {
        throw new Error(`Some files failed to delete: ${JSON.stringify(failedDeletions)}`);
      }
    } catch (error) {
      throw new BadRequestException(`Bulk deletion from Cloudinary failed: ${error.message}`);
    }
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

  /**
   * 📌 Uploads a base64 image to Cloudinary and returns the upload response
   */
  async uploadBase64(base64: string): Promise<UploadApiResponse> {
    if (!base64) {
      throw new BadRequestException('Base64 string is undefined or empty');
    }

    try {
      const base64PrefixRegex = /^data:image\/(png|jpeg|jpg);base64,/;
      let finalBase64 = base64;

      if (!base64PrefixRegex.test(base64)) {
        try {
          Buffer.from(base64, 'base64');
        } catch (error) {
          throw new BadRequestException('Invalid base64 string format');
        }
        finalBase64 = `data:image/png;base64,${base64}`;
      }

      return new Promise((resolve, reject) => {
        cloudinary.uploader.upload(
          finalBase64,
          {
            folder: 'uploads',
            allowed_formats: ['png', 'jpg', 'jpeg'],
            resource_type: 'image',
          },
          (error, result) => {
            if (error) {
              return reject(new Error(`Cloudinary base64 upload failed: ${error.message}`));
            }
            if (!result) {
              return reject(new Error('Upload failed: No result returned from Cloudinary'));
            }
            resolve(result);
          }
        );
      });
    } catch (error) {
      throw new BadRequestException(`Failed to upload base64 image: ${error.message}`);
    }
  }

  async getExistingFile(faceId: string): Promise<{ url: string; size: number; format: string } | null> {
    try {
      logger.http(`🔍 Retrieving existing file for faceId: ${faceId}`);
  
      const cloudinary = await import('cloudinary').then((pkg) => pkg.v2);
  
      const response = await cloudinary.api.resource(faceId, {
        resource_type: 'image',
      });
  
      if (!response || !response.secure_url) {
        logger.warn(`⚠️ File with faceId: ${faceId} not found in Cloudinary`);
        return null;
      }
  
      logger.info(`✅ Successfully retrieved file for faceId: ${faceId}`);
  
      return {
        url: response.secure_url,
        size: response.bytes,
        format: response.format,
      };
    } catch (error) {
      if (error.http_code === 404) {
        logger.warn(`⚠️ Cloudinary file not found for faceId: ${faceId}`);
        return null;
      }
      logger.error(`❌ Error retrieving file from Cloudinary: ${error.message}`);
      throw new BadRequestException(`Failed to retrieve file from Cloudinary: ${error.message}`);
    }
  }
  
  async deleteMultipleFilesByFaceIds(faceIds: string[]): Promise<void> {
    if (!faceIds || faceIds.length === 0) {
      logger.warn('⚠️ No faceIds provided for deletion.');
      return;
    }
  
    try {
      logger.http(`🗑️ Deleting ${faceIds.length} files from Cloudinary`);
  
      const cloudinary = await import('cloudinary').then((pkg) => pkg.v2);
  
      // Call Cloudinary API to delete multiple files
      const deleteResults = await cloudinary.api.delete_resources(faceIds, {
        resource_type: 'image',
      });
  
      logger.info(`✅ Successfully deleted ${Object.keys(deleteResults.deleted).length} files from Cloudinary.`);
    } catch (error) {
      logger.error(`❌ Error deleting files from Cloudinary: ${error.message}`);
      throw new BadRequestException(`Failed to delete files from Cloudinary: ${error.message}`);
    }
  }
  

}