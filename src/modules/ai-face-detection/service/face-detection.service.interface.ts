import { MulterFile } from 'src/common/types/multer-file.type';

export interface FaceDetectionResult {
  success: boolean;
  faceBuffer?: Buffer;
  message?: string;
}

export interface IFaceDetectionService {
  detectAndCropFace(file: MulterFile): Promise<FaceDetectionResult>;
}
