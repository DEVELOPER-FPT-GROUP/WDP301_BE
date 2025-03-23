import {
    Controller,
    Post,
    Body,
    UploadedFile,
    UseInterceptors,
    UseGuards,
    Get,
    Query,
    HttpCode,
    HttpStatus,
    BadRequestException,
  } from '@nestjs/common';
  import { FileInterceptor } from '@nestjs/platform-express';
  import { ApiTags, ApiOperation, ApiConsumes, ApiBody, ApiResponse } from '@nestjs/swagger';
  import { FacialSearchService } from '../service/facial-search.service';
  import { MulterFile } from 'src/common/types/multer-file.type';
  import { winstonLogger as logger } from 'src/common/winston-logger';
 
  import { Role } from 'src/utils/enum';
  
  @ApiTags('Facial Search')
  @Controller('facial-search')
//   @UseGuards(AuthGuard, RolesGuard)
  export class FacialSearchController {
    constructor(private readonly facialSearchService: FacialSearchService) {}
  
    @Post('search')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Search for similar faces using an uploaded image' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
      schema: {
        type: 'object',
        properties: {
          file: {
            type: 'string',
            format: 'binary',
            description: 'Image file containing a face to search for',
          },
          similarityThreshold: {
            type: 'number',
            description: 'Minimum similarity score (0-1) to include in results',
            default: 0.6,
          },
          maxResults: {
            type: 'number',
            description: 'Maximum number of results to return',
            default: 10,
          },
        },
      },
    })
    @ApiResponse({
      status: 200,
      description: 'Returns a list of members with similar faces',
    })
    @UseInterceptors(FileInterceptor('file'))
    async searchFaces(
      @UploadedFile() file: MulterFile,
      @Query('similarityThreshold') similarityThreshold = 0.6,
      @Query('maxResults') maxResults = 10,
    ) {
      if (!file) {
        throw new BadRequestException('Image file is required');
      }
  
      logger.info(`Received facial search request with threshold: ${similarityThreshold}, maxResults: ${maxResults}`);
      
      const threshold = parseFloat(similarityThreshold.toString());
      const limit = parseInt(maxResults.toString(), 10);
      
      if (isNaN(threshold) || threshold < 0 || threshold > 1) {
        throw new BadRequestException('similarityThreshold must be a number between 0 and 1');
      }
      
      if (isNaN(limit) || limit < 1) {
        throw new BadRequestException('maxResults must be a positive number');
      }
  
      return this.facialSearchService.searchFacesByImage(file, threshold, limit);
    }
  
    @Post('generate-embeddings')
    // @Roles(Role.ADMIN)
    @ApiOperation({ summary: 'Generate face embeddings for all existing members (admin only)' })
    @ApiResponse({
      status: 200,
      description: 'Returns the count of successfully generated and failed embeddings',
    })
    async generateEmbeddings() {
      logger.info('Received request to generate face embeddings for all members');
      return this.facialSearchService.generateEmbeddingsForAllMembers();
    }
  }