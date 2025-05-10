import { Inject, Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class FirebaseStorageService {
  private storageBucket: admin.storage.Storage;

  constructor(@Inject('FIREBASE_APP') private firebaseApp: admin.app.App) {
    this.storageBucket = this.firebaseApp.storage();
  }

  /**
   * 📤 Upload file lên Firebase Storage
   */
  async uploadFile(file: Express.Multer.File, folder: string = 'media'): Promise<string> {
    const fileId = uuidv4();
    const fileExtension = file.originalname.split('.').pop();
    const fileName = `${folder}/${fileId}.${fileExtension}`;

    const fileUpload = this.storageBucket.bucket().file(fileName);
    await fileUpload.save(file.buffer, {
      metadata: { contentType: file.mimetype },
    });

    const [url] = await fileUpload.getSignedUrl({
      action: 'read',
      expires: '03-01-2030', // URL công khai đến năm 2030
    });

    return url;
  }

  /**
   * 🗑 Xóa file khỏi Firebase Storage
   */
  async deleteFile(fileUrl: string): Promise<void> {
    const fileName = decodeURIComponent(new URL(fileUrl).pathname.split('/').pop() || '');
    const file = this.storageBucket.bucket().file(`media/${fileName}`);

    await file.delete();
  }
}
