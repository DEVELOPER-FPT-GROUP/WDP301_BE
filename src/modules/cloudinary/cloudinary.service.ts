import { BadRequestException, Injectable } from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { MulterFile } from 'src/common/types/multer-file.type';

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
            resource_type: 'auto' // Tự động phát hiện loại file
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
           // Kiểm tra xem base64 có prefix data:image hay không
           const base64PrefixRegex = /^data:image\/(png|jpeg|jpg);base64,/;
           let finalBase64 = base64;

           // Nếu không có prefix, thêm vào
           if (!base64PrefixRegex.test(base64)) {
               // Kiểm tra xem base64 có hợp lệ không
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
                       resource_type: 'image'
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



}
