import { Injectable, NotFoundException } from '@nestjs/common';
import { IMembersService } from './members.service.interface';
import { CreateMemberDto } from '../dto/request/create-member.dto';
import { MemberDTO } from '../dto/response/member.dto';
import { MembersRepository } from '../repository/members.repository';
import { Promise } from 'mongoose';
import { UpdateMemberDto } from '../dto/request/update-member.dto';
import { FamiliesService } from '../../families/service/families.service';
import { MarriagesService } from '../../marriages/service/marriages.service';
import * as console from 'console';
import { CreateMarriageDto } from '../../marriages/dto/request/create-marriage.dto';
import { Gender } from '../../../utils/enum';
import { CreateSpouseDto } from '../dto/request/create-spouse.dto';

@Injectable()
export class MembersService implements IMembersService {
  constructor(
    private readonly membersRepository: MembersRepository,
    private readonly familiesService: FamiliesService,
    private readonly marriagesService: MarriagesService,
  ) {}

  async createMember(createMemberDto: CreateMemberDto): Promise<MemberDTO> {
    console.log('createMemberDto:', createMemberDto);
    const createdMember = await this.membersRepository.create(createMemberDto);
    return MemberDTO.map(createdMember);
  }

  async getMemberById(id: string): Promise<MemberDTO> {
    const member = await this.membersRepository.findById(id);
    if (!member) {
      throw new NotFoundException('Member not found');
    }
    return MemberDTO.map(member);
  }

  async findAllMembers(): Promise<MemberDTO[]> {
    const members = await this.membersRepository.findAll();
    return members.map(member => MemberDTO.map(member));
  }

  async updateMember(id: string, updateData: Partial<UpdateMemberDto>): Promise<MemberDTO> {
    const updatedMember = await this.membersRepository.update(id, updateData);
    if (!updatedMember) {
      throw new NotFoundException('Member not found');
    }
    return MemberDTO.map(updatedMember);
  }

  async deleteMember(id: string): Promise<boolean> {
    const isDeleted = await this.membersRepository.delete(id);
    if (!isDeleted) {
      throw new NotFoundException('Member not found');
    }
    return true;
  }

  async findMembersInFamily(familyId: string): Promise<MemberDTO[]> {
    // Fetch the family by ID
    const family = await this.familiesService.getFamilyById(familyId);
    if (!family) return [];

    // Fetch all members in the given family
    const members = await this.membersRepository.findMembersInFamily(familyId);
    if (!members.length) return [];

    // Convert to DTOs
    const memberDTOs = members.map(member => MemberDTO.map(member));

    // Extract all member IDs
    const memberIds = memberDTOs.map(member => member.memberId);

    // Fetch all marriages involving these members in **one batch query**
    const marriages = await this.marriagesService.getAllSpouses(memberIds);

    // Create a **spouse lookup map**
    const spouseMap = new Map<string, { wifeId?: string; husbandId?: string }>();

    marriages.forEach(marriage => {
      spouseMap.set(marriage.husbandId, { wifeId: marriage.wifeId });
      spouseMap.set(marriage.wifeId, { husbandId: marriage.husbandId });
    });

    // Update each memberDTO with spouse information
    return memberDTOs.map(memberDTO => {
      const spouseInfo = spouseMap.get(memberDTO.memberId);

      memberDTO.wifeId = spouseInfo?.wifeId;
      memberDTO.husbandId = spouseInfo?.husbandId;

      return memberDTO;
    });
  }

  async createSpouse(createSpouseDto: CreateSpouseDto): Promise<MemberDTO | null> {
    const member = await this.getMemberById(createSpouseDto.memberId);
    if(member) {
      let createMemberDto = new CreateMemberDto();
      Object.assign(createMemberDto, {
        familyId: member.familyId,
        firstName: createSpouseDto.firstName,
        middleName: createSpouseDto.middleName,
        lastName: createSpouseDto.lastName,
        dateOfBirth: createSpouseDto.dateOfBirth,
        placeOfBirth: createSpouseDto.placeOfBirth,
        placeOfDeath: createSpouseDto.placeOfDeath,
        dateOfDeath: createSpouseDto.dateOfDeath,
        isAlive: createSpouseDto.isAlive,
        generation: member.generation,
        shortSummary: createSpouseDto.shortSummary,
      });

      const spouse = await this.createMember(createMemberDto);

      let createMarriageDto = new CreateMarriageDto();
      if(member.gender === Gender.MALE) {
        createMarriageDto.husbandId = member.memberId;
        createMarriageDto.wifeId = spouse.memberId;
        createMemberDto.gender = Gender.FEMALE;
      } else if(member.gender === Gender.FEMALE) {
        createMarriageDto.husbandId = spouse.memberId;
        createMarriageDto.wifeId = member.memberId;
        createMemberDto.gender = Gender.MALE;
      }

      const marriage = await this.marriagesService.createMarriage(createMarriageDto);
      console.log("marriage: ", marriage);

      return spouse;
    }
    return null;
  }

}
