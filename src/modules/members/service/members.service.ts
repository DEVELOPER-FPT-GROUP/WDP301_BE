import { Injectable, NotFoundException } from '@nestjs/common';
import { IMembersService } from './members.service.interface';
import { CreateMemberDto } from '../dto/request/create-member.dto';
import { MemberDTO } from '../dto/response/member.dto';
import { MembersRepository } from '../repository/members.repository';
import { Promise } from 'mongoose';
import { UpdateMemberDto } from '../dto/request/update-member.dto';
import { FamiliesService } from '../../families/service/families.service';
import { MarriagesService } from '../../marriages/service/marriages.service';
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
import {
  ParentChildRelationshipDTO
} from '../../parent-child-relationships/dto/response/parent-child-relationship.dto';
import { MarriageDTO } from '../../marriages/dto/response/marriage.dto';
import { AccountsService } from '../../accounts/service/accounts.service';
import { CreateAccountDto } from '../../accounts/dto/request/create-account.dto';
import { DataUtils } from '../../../utils/data.utils';
import { RELATIONSHIP_TYPES } from '../../../utils/message.utils';

@Injectable()
export class MembersService implements IMembersService {
  constructor(
    private readonly membersRepository: MembersRepository,
    private readonly familiesService: FamiliesService,
    private readonly marriagesService: MarriagesService,
    private readonly parentChildRelationshipsService: ParentChildRelationshipsService,
    private readonly relationshipTypeService: RelationshipTypesService,
    private readonly accountsService: AccountsService
  ) {
  }

  /**
   * Creates a new member in the system.
   * @param createMemberDto - The data transfer object containing member details.
   * @returns The newly created member as a DTO.
   */
  async createMember(createMemberDto: CreateMemberDto): Promise<MemberDTO> {
    console.log('createMemberDto:', createMemberDto);
    const createdMember = await this.membersRepository.create(createMemberDto);
    return MemberDTO.map(createdMember);
  }

  /**
   * Retrieves a member by their unique ID.
   * @param id - The unique identifier of the member.
   * @returns The member DTO if found, otherwise throws a NotFoundException.
   */
  async getMemberById(id: string): Promise<MemberDTO> {
    const member = await this.membersRepository.findById(id);
    if (!member) {
      throw new NotFoundException('Member not found');
    }
    return MemberDTO.map(member);
  }

  /**
   * Retrieves all members from the system.
   * @returns An array of member DTOs.
   */
  async findAllMembers(): Promise<MemberDTO[]> {
    const members = await this.membersRepository.findAll();
    return members.map(member => MemberDTO.map(member));
  }

  /**
   * Updates a member's information.
   * @param id - The unique identifier of the member.
   * @param updateData - The data transfer object containing updated member details.
   * @returns The updated member DTO if found, otherwise throws a NotFoundException.
   */
  async updateMember(id: string, updateData: UpdateMemberDto): Promise<MemberDTO> {
    const updatedMember = await this.membersRepository.update(id, updateData);
    if (!updatedMember) {
      throw new NotFoundException('Member not found');
    }
    return MemberDTO.map(updatedMember);
  }

  /**
   * Deletes a member from the system.
   * @param id - The unique identifier of the member.
   * @returns True if deletion was successful, otherwise throws a NotFoundException.
   */
  async deleteMember(id: string): Promise<boolean> {
    const isDeleted = await this.membersRepository.delete(id);
    if (!isDeleted) {
      throw new NotFoundException('Member not found');
    }
    return true;
  }

  /**
   * Retrieves all members in a given family and enriches them with relationship data.
   * @param familyId - The unique identifier of the family.
   * @returns An array of MemberDTOs with spouse, parent, and children information.
   */
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

  /**
   * Creates a spouse for a given member and establishes a marriage relationship.
   * @param createSpouseDto - The DTO containing spouse details.
   * @returns The newly created spouse as a MemberDTO, or null if the member does not exist.
   */
  async createSpouse(createSpouseDto: CreateSpouseDto): Promise<MemberDTO | null> {
    const member = await this.getMemberById(createSpouseDto.memberId);
    if (!member) return null;

    // Create a MemberDto object for the spouse
    const createMemberDto = this.buildCreateSpouseMemberDto(member, createSpouseDto);
    const spouse = await this.createMember(createMemberDto);
    if (!spouse) return null;

    // Create a marriage relationship
    const createMarriageDto = this.buildCreateMarriageDto(member, spouse);
    await this.marriagesService.createMarriage(createMarriageDto);

    // Get the member's parents
    const memberParents = await this.parentChildRelationshipsService.findByChildIds([member.memberId]);

    // Add parent-child relationship to member's spouse
    await this.addSpouseAsParentInLaw(spouse, memberParents);

    // If the spouse is alive, create an account
    if (spouse.isAlive) {
      await this.createSpouseAccount(spouse);
    }

    return spouse;
  }

  /**
   * Adds the spouse as a parent-in-law for the member's parents.
   * @param spouse - The newly created spouse.
   * @param memberParents - The parents of the member.
   */
  private async addSpouseAsParentInLaw(spouse: MemberDTO, memberParents: ParentChildRelationshipDTO[]): Promise<void> {
    if (!memberParents.length) return; // Exit if the member has no parents

    for (const relation of memberParents) {
      // Determine the correct in-law relationship type
      const parentInLawType = await this.relationshipTypeService.getRelationshipTypeByName(
        relation.parentId === relation.childId
          ? RELATIONSHIP_TYPES.MOTHER_IN_LAW
          : RELATIONSHIP_TYPES.FATHER_IN_LAW
      );

      if (!parentInLawType) continue; // Skip if relationship type is not found

      // Create the parent-in-law relationship object
      const parentInLawRelationship = Object.assign(new CreateParentChildRelationshipDto(), {
        parentId: spouse.memberId,
        childId: relation.parentId,
        relaTypeId: parentInLawType.relaTypeId,
        birthOrder: relation.birthOrder // Keep birth order intact
      });

      // Insert the relationship into the database sequentially
      await this.parentChildRelationshipsService.createRelationship(parentInLawRelationship);
    }
  }

  /**
   * Builds a CreateMemberDto for the spouse.
   * @param member - The existing member who is getting a spouse.
   * @param createSpouseDto - The DTO containing spouse details.
   * @returns A CreateMemberDto for the new spouse.
   */
  private buildCreateSpouseMemberDto(member: MemberDTO, createSpouseDto: CreateSpouseDto): CreateMemberDto {
    return Object.assign(new CreateMemberDto(), {
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
      gender: member.gender === Gender.MALE ? Gender.FEMALE : Gender.MALE
    });
  }

  /**
   * Builds a CreateMarriageDto to establish a marriage relationship.
   * @param member - The existing member who is getting married.
   * @param spouse - The newly created spouse.
   * @returns A CreateMarriageDto representing the marriage.
   */
  private buildCreateMarriageDto(member: MemberDTO, spouse: MemberDTO): CreateMarriageDto {
    return Object.assign(new CreateMarriageDto(), {
      husbandId: member.gender === Gender.MALE ? member.memberId : spouse.memberId,
      wifeId: member.gender === Gender.FEMALE ? member.memberId : spouse.memberId
    });
  }

  /**
   * Creates an account for the spouse if they are alive.
   * @param spouse - The newly created spouse.
   */
  private async createSpouseAccount(spouse: MemberDTO): Promise<void> {
    const createAccountDto = Object.assign(new CreateAccountDto(), {
      memberId: spouse.memberId,
      username: DataUtils.generateUniqueUsername(
        spouse.firstName,
        spouse.middleName || '',
        spouse.lastName
      ),
      passwordHash: '123456',
    });

    await this.accountsService.createAccount(createAccountDto);
  }

  /**
   * Creates a child for a given member and establishes parent-child relationships.
   * @param createChildDto - The DTO containing child details.
   * @returns The newly created child as a MemberDTO, or null if the member or spouse does not exist.
   */
  async createChild(createChildDto: CreateChildDto): Promise<MemberDTO | null> {
    const member = await this.getMemberById(createChildDto.memberId);
    if (!member) return null;

    const spouse = await this.marriagesService.getSpouse(member.memberId);
    if (!spouse) return null;

    // Generate MemberDto for child
    const createMemberDto = this.buildCreateChildMemberDto(member, createChildDto);
    const child = await this.createMember(createMemberDto);
    if (!child) return null;

    // Generate parent-child relationship
    await this.createParentChildRelationships(member, spouse, child, createChildDto.birthOrder);

    // Create account for child
    if (child.isAlive) {
      await this.createChildAccount(child);
    }

    return child;
  }

  private buildCreateChildMemberDto(member: MemberDTO, createChildDto: CreateChildDto): CreateMemberDto {
    return Object.assign(new CreateMemberDto(), {
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
  }


  /**
   * Retrieves the parent-child relationships and creates mapping data for parent lookup.
   * @param member - The existing parent.
   * @param spouse - The spouse of the member.
   * @param child - The newly created child.
   * @param birthOrder - The birth order of the child.
   */
  private async createParentChildRelationships(
    member: MemberDTO,
    spouse: MarriageDTO,
    child: MemberDTO,
    birthOrder: number
  ): Promise<void> {
    // Determine the relationship type for the primary member (father or mother)
    const parentRelationType = await this.relationshipTypeService.getRelationshipTypeByName(
      member.gender === Gender.MALE ? RELATIONSHIP_TYPES.FATHER : RELATIONSHIP_TYPES.MOTHER
    );

    // Determine the correct spouse parent ID based on the member's gender
    const spouseId = member.gender === Gender.MALE ? spouse.wifeId : spouse.husbandId;

    // Determine the relationship type for the spouse (opposite gender)
    const spouseRelationType = await this.relationshipTypeService.getRelationshipTypeByName(
      member.gender === Gender.MALE ? RELATIONSHIP_TYPES.MOTHER : RELATIONSHIP_TYPES.FATHER
    );

    if (!parentRelationType || !spouseRelationType || !spouseId) return; // Exit if any necessary data is missing

    // Generate parent-child relationships
    const parentRelationship = this.buildParentChildRelationship(
      member.memberId,
      child.memberId,
      parentRelationType.relaTypeId,
      birthOrder
    );

    const spouseRelationship = this.buildParentChildRelationship(
      spouseId,
      child.memberId,
      spouseRelationType.relaTypeId,
      birthOrder
    );

    // Save relationships in the database
    await this.parentChildRelationshipsService.createRelationship(parentRelationship);
    await this.parentChildRelationshipsService.createRelationship(spouseRelationship);
  }

  private buildParentChildRelationship(
    parentId: string,
    childId: string,
    relaTypeId: string,
    birthOrder: number
  ): CreateParentChildRelationshipDto {
    return Object.assign(new CreateParentChildRelationshipDto(), {
      parentId,
      childId,
      relaTypeId,
      birthOrder
    });
  }

  /**
   * Creates an account for the child if they are alive.
   * This generates a unique username and assigns a default password.
   * @param child - The child member DTO.
   */
  private async createChildAccount(child: MemberDTO): Promise<void> {
    const createAccountDto = Object.assign(new CreateAccountDto(), {
      memberId: child.memberId,
      // Generates a unique username based on the child's name
      username: DataUtils.generateUniqueUsername(child.firstName, child.middleName || '', child.lastName),
      passwordHash: '123456', // Default password (should be securely managed)
    });

    // Calls the account service to create the account
    await this.accountsService.createAccount(createAccountDto);
  }

  /**
   * Creates a mapping of spouses, linking each member to their respective spouse.
   * @param marriages - An array of marriage relationships.
   * @returns A Map where keys are member IDs and values are SpouseDTO objects.
   */
  private createSpouseMap(marriages: MarriageDTO[]): Map<string, SpouseDTO> {
    const spouseMap = new Map<string, SpouseDTO>();

    marriages.forEach(marriage => {
      // Maps husband to wife
      spouseMap.set(marriage.husbandId, { wifeId: marriage.wifeId });
      // Maps wife to husband
      spouseMap.set(marriage.wifeId, { husbandId: marriage.husbandId });
    });

    return spouseMap;
  }

  /**
   * Creates a map linking each parent to their children.
   * This helps in quickly retrieving children for a given parent.
   * @param parentRelations - An array of parent-child relationships.
   * @returns A Map where keys are parent IDs and values are arrays of child IDs.
   */
  private createChildrenMap(parentRelations: ParentChildRelationshipDTO[]): Map<string, string[]> {
    const childrenMap = new Map<string, string[]>();

    parentRelations.forEach(relation => {
      // If the parent is not yet in the map, initialize an empty array for their children
      if (!childrenMap.has(relation.parentId)) {
        childrenMap.set(relation.parentId, []);
      }
      // Add the child ID to the parent's list of children
      childrenMap.get(relation.parentId)!.push(relation.childId);
    });

    return childrenMap;
  }

  /**
   * Creates a map linking each child to their parents.
   * This helps in quickly retrieving parent information for a given child.
   * @param childRelations - An array of child-parent relationships.
   * @returns A Map where keys are child IDs and values are ParentDTO objects containing parent details.
   */
  private async createParentMap(childRelations: ParentChildRelationshipDTO[]): Promise<Map<string, ParentDTO>> {
    const parentMap = new Map<string, ParentDTO>();

    // Iterate over each parent-child relationship
    for (const relation of childRelations) {
      // Retrieve the spouse (other parent) of the given parent ID
      const spouse = await this.marriagesService.getSpouse(relation.parentId);
      if (!spouse) continue; // Skip if no spouse is found

      // Initialize a ParentDTO object if the child is not already in the map
      if (!parentMap.has(relation.childId)) {
        parentMap.set(relation.childId, new ParentDTO());
      }

      // Retrieve the existing ParentDTO for the child
      const parentDTO = parentMap.get(relation.childId)!;

      // Determine father and mother based on spouse data
      if (spouse.wifeId) {
        parentDTO.fatherId = spouse.husbandId; // Husband is the father
        parentDTO.motherId = relation.parentId; // The given parent is the mother
      } else if (spouse.husbandId) {
        parentDTO.fatherId = relation.parentId; // The given parent is the father
        parentDTO.motherId = spouse.wifeId; // Wife is the mother
      }
    }

    return parentMap;
  }
}
