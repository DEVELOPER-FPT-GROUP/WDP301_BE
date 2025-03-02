import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  ClassSerializerInterceptor, UseGuards,
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

@Controller('members')
@UseInterceptors(ClassSerializerInterceptor,LoggingInterceptor) // Enable auto-serialization
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  @Post()
  async create(
    @Body() createMemberDto: CreateMemberDto,
  ): Promise<ResponseDTO<MemberDTO>> {
    const result = await this.membersService.createMember(createMemberDto);
    return ResponseDTO.success(result, 'Member created successfully');
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

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateMemberDto: UpdateMemberDto,
  ): Promise<ResponseDTO<MemberDTO>> {
    const result = await this.membersService.updateMember(id, updateMemberDto);
    return ResponseDTO.success(result, 'Member updated successfully');
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<ResponseDTO<boolean>> {
    await this.membersService.deleteMember(id);
    return ResponseDTO.success(true, 'Member deleted successfully');
  }

  @UseGuards(JwtAuthGuard)
  @Get('/get-members-in-family/:familyId')
  async findMembersByFamilyId(
    @Param('familyId') familyId: string,
  ): Promise<ResponseDTO<MemberDTO[]>> {
    const members = await this.membersService.findMembersInFamily(familyId);
    return ResponseDTO.success(members, 'Members retrieved successfully');
  }

  @Post('/add-spouse')
  async createSpouse(@Body() createSpouseDto: CreateSpouseDto): Promise<ResponseDTO<MemberDTO | null>> {
    const result = await this.membersService.createSpouse(createSpouseDto);
    return ResponseDTO.success(result, 'Spouse created successfully');
  }

  @Post('/add-child')
  async createChild(@Body() createChildDto: CreateChildDto): Promise<ResponseDTO<MemberDTO | null>> {
    const result = await this.membersService.createChild(createChildDto);
    return ResponseDTO.success(result, 'Child created successfully');
  }

  @Post('/create-family-leader')
  async createFamilyLeader(@Body() createMemberDto: CreateMemberDto): Promise<ResponseDTO<MemberDTO>> {
    const result = await this.membersService.createFamilyLeader(createMemberDto);
    return ResponseDTO.success(result, 'Family leader created successfully');
  }
}
