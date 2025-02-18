export class MediaResponseDto {
    mediaId: string;
    ownerId: string;
    ownerType: string;
    url: string;
    fileName: string;
    caption?: string;
    mimeType: string;
    size: number;
    createdAt: Date;
    updatedAt: Date;
  }
  