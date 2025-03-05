import {
  Controller, Get, Post, Put, Delete, Param, Body, UseInterceptors,
  UploadedFiles,
  ParseFilePipeBuilder,
  HttpStatus,
  Query
} from '@nestjs/common';
import { LoggingInterceptor } from 'src/common/interceptors/logging.interceptor';

import { winstonLogger as logger } from 'src/common/winston-logger';
import { FamilyHistoryRecordService } from '../service/family-history-records.service';
import { CreateFamilyHistoryRecordDto } from '../dto/request/create-family-history-record.dto';
import { FamilyHistoryRecordResponseDto } from '../dto/response/family-history-records.dto';
import { UpdateFamilyHistoryRecordDto } from '../dto/request/update-family-history-record.dto';
import { ResponseDTO } from 'src/utils/response.dto';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { MulterFile } from 'src/common/types/multer-file.type';
import { PaginationDTO } from 'src/utils/pagination.dto';
import { SearchFamilyHistoryRecordDto } from '../dto/request/search-family-history-record.dto';

@UseInterceptors(LoggingInterceptor) // ✅ Apply logging interceptor
@Controller('family-history')
export class FamilyHistoryRecordController {
  constructor(private readonly recordService: FamilyHistoryRecordService) { }

  /**
   *  Create a new Family History Record
   */
  /**
   * Create a new Family History Record with file uploads
   */
  @Post()
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'files', maxCount: 10 } // Cho phép tối đa 10 files
  ]))
  async createRecord(
    @Body() dto: CreateFamilyHistoryRecordDto,
    @UploadedFiles(
      new ParseFilePipeBuilder()
        // .addFileTypeValidator({
        //   fileType: /(jpg|jpeg|png)$/,
        // })
        // .addMaxSizeValidator({
        //   maxSize: 5 * 1024 * 1024 // 5MB
        // })
        .build({
          errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
          fileIsRequired: false, // Files không bắt buộc
        })
    ) files: { files?: MulterFile[] }
  ): Promise<ResponseDTO<FamilyHistoryRecordResponseDto>> {
    logger.http(`Received POST request to create a family history record for Family ID: ${dto.familyId}`);

    const result = await this.recordService.createRecord(dto, files?.files || []);
    return ResponseDTO.success(result, 'Family History Record created successfully');
  }

  // /**
  //  *  Get all Family History Records
  //  */
  // @Get()
  // async getAllRecords(): Promise<ResponseDTO<FamilyHistoryRecordResponseDto[]>> {
  //   logger.http(`Received GET request to fetch all family history records`);
  //   const result = await this.recordService.getAllRecords();
  //   return ResponseDTO.success(result, 'Family History Records fetched successfully');
  // }

  /**
   *  Get a Family History Record by ID
   */
  @Get(':id')
  async getRecordById(@Param('id') id: string): Promise<ResponseDTO<FamilyHistoryRecordResponseDto>> {
    logger.http(`Received GET request to fetch family history record with ID: ${id}`);
    const result = await this.recordService.getRecordById(id);
    return ResponseDTO.success(result, `Family History Record with ID ${id} retrieved successfully`);
  }

  /**
   *  Get Family History Records by Family ID
   */
  @Get('family/:familyId')
  async getRecordsByFamilyId(@Param('familyId') familyId: string): Promise<ResponseDTO<FamilyHistoryRecordResponseDto[]>> {
    logger.http(`Received GET request to fetch sorted history records for Family ID: ${familyId}`);
    const result = await this.recordService.getRecordsByFamilyId(familyId);
    return ResponseDTO.success(result, `Family History Records for Family ID ${familyId} fetched successfully`);

  }


  /**
    * Update a Family History Record by ID with file uploads
    */
  @Put(':id')
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'files', maxCount: 10 } // Cho phép tối đa 10 files
  ]))
  async updateRecord(
    @Param('id') id: string,
    @Body() dto: UpdateFamilyHistoryRecordDto,
    @UploadedFiles(
      new ParseFilePipeBuilder()
        //  .addFileTypeValidator({
        //    fileType: /(jpg|jpeg|png)$/,
        //  })
        //  .addMaxSizeValidator({
        //    maxSize: 5 * 1024 * 1024 // 5MB
        //  })
        .build({
          errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
          fileIsRequired: false, // Files không bắt buộc
        })
    ) files: { files?: MulterFile[] }
  ): Promise<ResponseDTO<FamilyHistoryRecordResponseDto>> {
    logger.http(`Received PUT request to update family history record with ID: ${id}`);

    const result = await this.recordService.updateRecord(id, dto, files?.files || []);
    return ResponseDTO.success(result, `Family History Record with ID ${id} updated successfully`);
  }

  /**
   *  Delete a Family History Record by ID
   */
  @Delete(':id')
  async deleteRecord(@Param('id') id: string): Promise<ResponseDTO<FamilyHistoryRecordResponseDto>> {
    logger.http(`Received DELETE request to remove family history record with ID: ${id}`);
    const result = await this.recordService.deleteRecord(id);
    return ResponseDTO.success(result, `Family History Record with ID ${id} deleted successfully`);
  }

  @Get('family/:familyId/search')
  async searchRecordsByFamilyId(
    @Param('familyId') familyId: string,
    @Query() searchDto: SearchFamilyHistoryRecordDto
  ): Promise<ResponseDTO<PaginationDTO<FamilyHistoryRecordResponseDto>>> {
    logger.http(`Received GET request to search family history records for Family ID: ${familyId}`);
    const result = await this.recordService.searchRecordsByFamilyId(familyId, searchDto);
    return ResponseDTO.success(result, 'Family History Records retrieved successfully');
  }
}
