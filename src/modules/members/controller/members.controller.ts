import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  ClassSerializerInterceptor,
  UseGuards,
  Request,
  Query,
  Put,
  UploadedFile,
  BadRequestException,
  UploadedFiles,
  ParseFilePipeBuilder,
  HttpStatus,
} from '@nestjs/common';
import { MembersService } from '../service/members.service';
import { CreateMemberDto } from '../dto/request/create-member.dto';
import { UpdateMemberDto } from '../dto/request/update-member.dto';
import { MemberDTO } from '../dto/response/member.dto';
import { ResponseDTO } from '../../../utils/response.dto';
import { CreateSpouseDto } from '../dto/request/create-spouse.dto';
import { CreateChildDto } from '../dto/request/create-child.dto';
import { LoggingInterceptor } from 'src/common/interceptors/logging.interceptor';
import { JwtAuthGuard } from '../../auth/guard/jwt-auth.guard';
import { RolesGuard } from '../../auth/guard/roles.guard';
import { Roles } from '../../auth/decorator/roles.decorator';
import {
  FileFieldsInterceptor,
  FileInterceptor,
} from '@nestjs/platform-express';
import { MulterFile } from 'src/common/types/multer-file.type';
import { FaceDetectionService } from 'src/modules/ai-face-detection/service/face-detection.service';
import { PaginationDTO } from '../../../utils/pagination.dto';
import { SearchMemberDto } from '../dto/request/search-member.dto';
// Adjust the path if necessary
import { winstonLogger as logger } from 'src/common/winston-logger';
import { console } from 'inspector';
import { AccountsService } from 'src/modules/accounts/service/accounts.service';
import { UpdateAccountDto } from 'src/modules/accounts/dto/request/update-account.dto';

@Controller('members')
@UseInterceptors(ClassSerializerInterceptor, LoggingInterceptor) // Enable auto-serialization
export class MembersController {
  constructor(
    private readonly membersService: MembersService,
    private readonly accountsService: AccountsService,
    private readonly faceDetectionService: FaceDetectionService,
  ) {}

  @Post()
  @UseInterceptors(FileFieldsInterceptor([{ name: 'files', maxCount: 10 }]))
  async create(
    @Body() createMemberDto: CreateMemberDto,
    @UploadedFiles(
      new ParseFilePipeBuilder().build({
        errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        fileIsRequired: false, // Files are optional
      }),
    )
    files: { files?: MulterFile[] },
  ): Promise<ResponseDTO<MemberDTO>> {
    const result = await this.membersService.createRootMember(
      createMemberDto,
      files?.files || [],
    );
    return ResponseDTO.success(result, 'Member created successfully');
  }

  @Get('family/:familyId/search')
  async searchMembers(
    @Param('familyId') familyId: string,
    @Query() searchDto: SearchMemberDto,
  ): Promise<ResponseDTO<PaginationDTO<MemberDTO>>> {
    logger.http(
      `Received GET request to search members for Family ID: ${familyId}`,
    );
    const result = await this.membersService.searchMembers(familyId, searchDto);
    return ResponseDTO.success(result, 'Members retrieved successfully');
  }

  @Get('family/:familyId/search/all')
  async searchAllMembers(
    @Param('familyId') familyId: string,
    @Query() searchDto: SearchMemberDto,
  ): Promise<ResponseDTO<MemberDTO[]>> {
    logger.http(
      `Received GET request to search members for Family ID: ${familyId}`,
    );
    const result = await this.membersService.searchMembersWithoutPagination(
      familyId,
      searchDto,
    );
    return ResponseDTO.success(result, 'Members retrieved successfully');
  }

  @Get()
  async findAll(): Promise<ResponseDTO<MemberDTO[]>> {
    const result = await this.membersService.findAllMembers();
    return ResponseDTO.success(result, 'All members retrieved successfully');
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<ResponseDTO<MemberDTO>> {
    const result = await this.membersService.getMemberById(id);
    return ResponseDTO.success(result, 'Member retrieved successfully');
  }

  @Put('/update/:id')
  @UseInterceptors(FileFieldsInterceptor([{ name: 'files', maxCount: 10 }]))
  async update(
    @Param('id') id: string,
    @Body() updateMemberDto: UpdateMemberDto,
    @UploadedFiles(
      new ParseFilePipeBuilder().build({
        errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        fileIsRequired: false, // Files are optional
      }),
    )
    files: { files?: MulterFile[] },
  ): Promise<ResponseDTO<MemberDTO>> {
    const result = await this.membersService.updateMember(
      id,
      updateMemberDto,
      files?.files || [],
    );
    return ResponseDTO.success(result, 'Member updated successfully');
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<ResponseDTO<boolean>> {
    await this.membersService.deleteMember(id);
    return ResponseDTO.success(true, 'Member deleted successfully');
  }

  // @UseGuards(JwtAuthGuard)
  // @Roles('admin')
  @Get('/get-members-in-family/:familyId')
  async findMembersByFamilyId(
    @Param('familyId') familyId: string,
  ): Promise<ResponseDTO<MemberDTO[]>> {
    const members = await this.membersService.findMembersInFamily(familyId);
    return ResponseDTO.success(members, 'Members retrieved successfully');
  }

  @Post('/add-spouse')
  @UseInterceptors(FileFieldsInterceptor([{ name: 'files', maxCount: 10 }]))
  async createSpouse(
    @Body() createSpouseDto: CreateSpouseDto,
    @UploadedFiles(
      new ParseFilePipeBuilder().build({
        errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        fileIsRequired: false, // Files are optional
      }),
    )
    files: { files?: MulterFile[] },
  ): Promise<ResponseDTO<MemberDTO | null>> {
    const result = await this.membersService.createSpouse(
      createSpouseDto,
      files?.files || [],
    );
    return ResponseDTO.success(result, 'Spouse created successfully');
  }

  @Post('/add-child')
  @UseInterceptors(FileFieldsInterceptor([{ name: 'files', maxCount: 10 }]))
  async createChild(
    @Body() createChildDto: CreateChildDto,
    @UploadedFiles(
      new ParseFilePipeBuilder().build({
        errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        fileIsRequired: false, // Files are optional
      }),
    )
    files: { files?: MulterFile[] },
  ): Promise<ResponseDTO<MemberDTO | null>> {
    const result = await this.membersService.createChild(
      createChildDto,
      files?.files || [],
    );
    return ResponseDTO.success(result, 'Child created successfully');
  }

  @Post('/create-family-leader')
  @UseInterceptors(FileFieldsInterceptor([{ name: 'files', maxCount: 10 }]))
  async createFamilyLeader(
    @Body() createMemberDto: CreateMemberDto,
    @Body('username') username: string,
    @UploadedFiles(
      new ParseFilePipeBuilder().build({
        errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        fileIsRequired: false, // Files are optional
      }),
    )
    files: { files?: MulterFile[] },
  ): Promise<ResponseDTO<MemberDTO>> {
    const result = await this.membersService.createFamilyLeader(
      createMemberDto,
      files?.files || [],
    );

    const account = await this.accountsService.getAccountByUsername(username);
    const updateAccountDto: UpdateAccountDto = {
      accountId: account.accountId,
      memberId: result.memberId,
    }; // Adjust properties as per UpdateAccountDto definition
    await this.accountsService.updateAccount(
      updateAccountDto.accountId,
      updateAccountDto,
    ); // Pass the correct object
    return ResponseDTO.success(result, 'Family leader created successfully');
  }

  @Get('/get-member-details/:id')
  async getMemberDetails(
    @Param('id') id: string,
  ): Promise<ResponseDTO<MemberDTO>> {
    const result = await this.membersService.getMemberDetails(id);
    return ResponseDTO.success(result, 'Member retrieved successfully');
  }

  // @Post('avatar')
  // @UseInterceptors(FileInterceptor('file'))
  // async testFaceDetection(@UploadedFile() file: MulterFile) {
  //   if (!file) {
  //     throw new BadRequestException('No file uploaded');
  //   }

  //   // Perform face detection
  //   const result = await this.faceDetectionService.detectAndCropFaces(file);

  //   return result;
  // }

  @Put('/delete/:id')
  async removeMember(@Param('id') id: string): Promise<ResponseDTO<MemberDTO>> {
    const result = await this.membersService.removeMember(id);
    return ResponseDTO.success(result, 'Member deleted successfully');
  }
}
