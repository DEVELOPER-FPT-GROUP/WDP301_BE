import { MediaResponseDto } from '../../../media/dto/response/media-response.dto';

export class RelationshipDTO {
  partner?: {
    id: string;
    name: string;
    gender: string;
    isSingle: boolean;
    isAlive: boolean;
    media: MediaResponseDto[];
    dateOfBirth: string;
    dateOfDeath: string | null;
  };
  isMarried?: boolean;
  children?: {
    id: string;
    name: string;
    generation: number;
    gender: string;
    isSingle: boolean;
    isAlive: boolean;
    media: MediaResponseDto[];
    dateOfBirth: string;
    dateOfDeath: string | null;
    birthOrder: number;
  }[];
}
