// face-cache.service.ts
import { Injectable } from '@nestjs/common';

@Injectable()
export class FaceCacheService {
  private cache: Map<string, Buffer> = new Map();

  set(faceId: string, buffer: Buffer) {
    this.cache.set(faceId, buffer);
  }

  get(faceId: string): Buffer | undefined {
    return this.cache.get(faceId);
  }

  delete(faceId: string) {
    this.cache.delete(faceId);
  }
}
