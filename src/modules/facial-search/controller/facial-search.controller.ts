import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  UseGuards,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FacialSearchService} from '../service/facial-search.service';
import { MulterFile } from 'src/common/types/multer-file.type';
import { winstonLogger as logger } from 'src/common/winston-logger';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { FacialSearchOptions } from '../dto/request/facial-search-options.dto';
import { JwtAuthGuard } from 'src/modules/auth/guard/jwt-auth.guard';

@Controller('facial-search')
export class FacialSearchController {
  constructor(private readonly facialSearchService: FacialSearchService) {}

  /**
   * Search for similar faces within user's family
   */
  @UseGuards(JwtAuthGuard)
  @Post('search')
  @UseInterceptors(FileInterceptor('file'))
  async searchFaces(
    @UploadedFile() file: MulterFile,
    @CurrentUser() user: any,
    @Query('similarityThreshold') similarityThreshold?: number,
    @Query('maxResults') maxResults?: number,
    @Query('includeDetails') includeDetails?: boolean,
    @Query('filterGender') filterGender?: string,
    @Query('filterAgeMin') filterAgeMin?: number,
    @Query('filterAgeMax') filterAgeMax?: number,
    @Query('sortBy') sortBy?: 'similarity' | 'recent' | 'name',
  ) {
    if (!file) {
      throw new BadRequestException('Image file is required');
    }

    const familyId = user?.familyId;
    if (!familyId) {
      throw new BadRequestException('User is not associated with any family');
    }

    logger.info(`Received facial search request`, {
      familyId,
      similarityThreshold,
      maxResults,
      includeDetails,
      filterGender,
      filterAgeMin,
      filterAgeMax,
      sortBy,
      userId: user?.sub,
    });

    const threshold = similarityThreshold
      ? parseFloat(similarityThreshold.toString())
      : undefined;
    const limit = maxResults ? parseInt(maxResults.toString(), 10) : undefined;

    if (
      threshold !== undefined &&
      (isNaN(threshold) || threshold < 0 || threshold > 1)
    ) {
      throw new BadRequestException(
        'similarityThreshold must be a number between 0 and 1',
      );
    }

    if (limit !== undefined && (isNaN(limit) || limit < 1)) {
      throw new BadRequestException('maxResults must be a positive number');
    }

    const searchOptions: FacialSearchOptions = {
      familyId, // Scoped by JWT
      similarityThreshold: threshold,
      maxResults: limit,
      includeDetails: includeDetails !== undefined ? includeDetails : true,
      filterGender,
      sortBy: sortBy || 'similarity',
    };

    return this.facialSearchService.searchFacesByImage(file, searchOptions);
  }

  /**
   * Generate face embeddings for all members
   */
  @Post('generate-embeddings')
  async generateEmbeddings() {
    logger.info('Received request to generate face embeddings for all members');
    return this.facialSearchService.generateEmbeddingsForAllMembers();
  }

  /**
   * Find duplicate faces in the system
   */
  @Post('find-duplicates')
  async findDuplicateFaces(
    @Query('similarityThreshold') similarityThreshold?: number,
  ) {
    const threshold = similarityThreshold
      ? parseFloat(similarityThreshold.toString())
      : 0.8;

    if (isNaN(threshold) || threshold < 0 || threshold > 1) {
      throw new BadRequestException(
        'similarityThreshold must be a number between 0 and 1',
      );
    }

    return this.facialSearchService.findDuplicateFaces(threshold);
  }

  /**
   * Verify if a given image matches a specific member
   */
  @Post('verify')
  @UseInterceptors(FileInterceptor('file'))
  async verifyFace(
    @UploadedFile() file: MulterFile,
    @Query('memberId') memberId: string,
  ) {
    if (!file) {
      throw new BadRequestException('Image file is required');
    }

    if (!memberId) {
      throw new BadRequestException('memberId is required');
    }

    return this.facialSearchService.verifyFaceAgainstMemberId(file, memberId);
  }
}
