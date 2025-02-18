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
import { CreateChildDto } from '../dto/request/create-child.dto';
import {
  ParentChildRelationshipsService
} from '../../parent-child-relationships/service/parent-child-relationships.service';
import { RelationshipTypesService } from '../../relationship-types/service/relationship-types.service';
import {
  CreateParentChildRelationshipDto
} from '../../parent-child-relationships/dto/request/create-parent-child-relationship.dto';
import { SpouseDTO } from '../dto/response/spouse.dto';
import { ParentDTO } from '../dto/response/parent.dto';
import { MarriagesRepository } from '../../marriages/repository/marriages.repository';
import {
  ParentChildRelationshipDTO
} from '../../parent-child-relationships/dto/response/parent-child-relationship.dto';
import { MarriageDTO } from '../../marriages/dto/response/marriage.dto';

@Injectable()
export class MembersService implements IMembersService {
  constructor(
    private readonly membersRepository: MembersRepository,
    private readonly familiesService: FamiliesService,
    private readonly marriagesService: MarriagesService,
    private readonly parentChildRelationshipsService: ParentChildRelationshipsService,
    private readonly relationshipTypeService: RelationshipTypesService,
    private readonly marriagesRepository: MarriagesRepository,
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

  async updateMember(id: string, updateData: UpdateMemberDto): Promise<MemberDTO> {
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

    // Convert members to DTOs and extract member IDs
    const memberDTOs = members.map(member => MemberDTO.map(member));
    const memberIds = memberDTOs.map(member => member.memberId);

    const marriages = await this.marriagesService.getAllSpouses(memberIds);
    const parentRelations = await this.parentChildRelationshipsService.findByParentIds(memberIds);
    const childRelations = await this.parentChildRelationshipsService.findByChildIds(memberIds);

    // Create lookup maps
    const spouseMap = this.createSpouseMap(marriages);
    const childrenMap = this.createChildrenMap(parentRelations);
    const parentMap = await this.createParentMap(childRelations);

    // Assign spouse, children, and parent data
    return memberDTOs.map(memberDTO => {
      memberDTO.spouse = spouseMap.get(memberDTO.memberId);
      memberDTO.children = childrenMap.get(memberDTO.memberId);
      memberDTO.parent = parentMap.get(memberDTO.memberId);
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

      if(spouse) {
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
      }
      return spouse;
    }
    return null;
  }

  async createChild(createChildDto: CreateChildDto): Promise<MemberDTO | null> {
    const member = await this.getMemberById(createChildDto.memberId);
    const spouse = await this.marriagesService.getSpouse(member.memberId);

    if(member && spouse) {
      let createMemberDto = new CreateMemberDto();
      Object.assign(createMemberDto, {
        familyId: member.familyId,
        firstName: createChildDto.firstName,
        middleName: createChildDto.middleName,
        lastName: createChildDto.lastName,
        dateOfBirth: createChildDto.dateOfBirth,
        placeOfBirth: createChildDto.placeOfBirth,
        placeOfDeath: createChildDto.placeOfDeath,
        dateOfDeath: createChildDto.dateOfDeath,
        isAlive: createChildDto.isAlive,
        generation: member.generation + 1,
        shortSummary: createChildDto.shortSummary,
        gender: createChildDto.gender
      });

      const child = await this.createMember(createMemberDto);

      if(child) {
        // Create Parent Child Relationship
        const relationshipType = await this.relationshipTypeService.getRelationshipTypeByName(
          member.gender === Gender.MALE ? "Father" : "Mother"
        );

        let createParentChildRelationshipDto
          = new CreateParentChildRelationshipDto();
        Object.assign(createParentChildRelationshipDto, {
          parentId: member.memberId,
          childId: child.memberId,
          relaTypeId: relationshipType.relaTypeId,
          birthOrder: createChildDto.birthOrder
        });

        await this.parentChildRelationshipsService
          .createRelationship(createParentChildRelationshipDto);

        // Create Spouse Child Relationship
        const spouseRelationshipType = await this.relationshipTypeService.getRelationshipTypeByName(
          spouse.wifeId ? "Father" : "Mother"
        );

        const createSpouseChildRelationshipDto = new CreateParentChildRelationshipDto();
        Object.assign(createSpouseChildRelationshipDto, {
          parentId: spouse.wifeId ? spouse.wifeId : spouse.husbandId,
          childId: child.memberId,
          relaTypeId: spouseRelationshipType?.relaTypeId,
          birthOrder: createChildDto.birthOrder
        });

        await this.parentChildRelationshipsService.createRelationship(createSpouseChildRelationshipDto);
      }

      return child;
    }

    return null;
  }

  private createSpouseMap(marriages: MarriageDTO[]): Map<string, SpouseDTO> {
    const spouseMap = new Map<string, SpouseDTO>();
    marriages.forEach(marriage => {
      spouseMap.set(marriage.husbandId, { wifeId: marriage.wifeId });
      spouseMap.set(marriage.wifeId, { husbandId: marriage.husbandId });
    });
    return spouseMap;
  }

  private createChildrenMap(parentRelations: ParentChildRelationshipDTO[]): Map<string, string[]> {
    const childrenMap = new Map<string, string[]>();
    parentRelations.forEach(relation => {
      if (!childrenMap.has(relation.parentId)) {
        childrenMap.set(relation.parentId, []);
      }
      childrenMap.get(relation.parentId)!.push(relation.childId);
    });
    return childrenMap;
  }

  private async createParentMap(childRelations: ParentChildRelationshipDTO[]): Promise<Map<string, ParentDTO>> {
    const parentMap = new Map<string, ParentDTO>();
    for (const relation of childRelations) {
      const spouse = await this.marriagesService.getSpouse(relation.parentId);
      if (!spouse) continue;

      if (!parentMap.has(relation.childId)) {
        parentMap.set(relation.childId, new ParentDTO());
      }

      const parentDTO = parentMap.get(relation.childId)!;
      if (spouse.wifeId) {
        parentDTO.fatherId = spouse.husbandId;
        parentDTO.motherId = relation.parentId;
      } else if (spouse.husbandId) {
        parentDTO.fatherId = relation.parentId;
        parentDTO.motherId = spouse.wifeId;
      }
    }
    return parentMap;
  }

}
