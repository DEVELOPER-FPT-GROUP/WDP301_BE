import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FacialSearchService, FacialSearchOptions } from '../service/facial-search.service';
import { MulterFile } from 'src/common/types/multer-file.type';
import { winstonLogger as logger } from 'src/common/winston-logger';

@Controller('facial-search')
export class FacialSearchController {
  constructor(private readonly facialSearchService: FacialSearchService) {}

  /**
   * Search for similar faces with advanced options
   */
  @Post('search')
  @UseInterceptors(FileInterceptor('file'))
  async searchFaces(
    @UploadedFile() file: MulterFile,
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

    logger.info(`Received facial search request with options:`, {
      similarityThreshold,
      maxResults,
      includeDetails,
      filterGender,
      filterAgeMin,
      filterAgeMax,
      sortBy,
    });

    // Validate input parameters
    const threshold = similarityThreshold ? parseFloat(similarityThreshold.toString()) : undefined;
    const limit = maxResults ? parseInt(maxResults.toString(), 10) : undefined;

    if (threshold !== undefined && (isNaN(threshold) || threshold < 0 || threshold > 1)) {
      throw new BadRequestException('similarityThreshold must be a number between 0 and 1');
    }

    if (limit !== undefined && (isNaN(limit) || limit < 1)) {
      throw new BadRequestException('maxResults must be a positive number');
    }

    // const filterAgeRange = filterAgeMin !== undefined && filterAgeMax !== undefined
    //   ? [parseInt(filterAgeMin.toString(), 10), parseInt(filterAgeMax.toString(), 10)]
    //   : undefined;

    // Construct search options object
    const searchOptions: FacialSearchOptions = {
      similarityThreshold: threshold,
      maxResults: limit,
      includeDetails: includeDetails !== undefined ? includeDetails : true,
      filterGender,
      // filterAgeRange,
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
    @Query('similarityThreshold') similarityThreshold?: number
  ) {
    const threshold = similarityThreshold ? parseFloat(similarityThreshold.toString()) : 0.8;

    if (isNaN(threshold) || threshold < 0 || threshold > 1) {
      throw new BadRequestException('similarityThreshold must be a number between 0 and 1');
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
    @Query('memberId') memberId: string
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
