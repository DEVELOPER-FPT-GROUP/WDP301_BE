import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
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
import { PaginationDTO } from '../../../utils/pagination.dto';
import { SearchMemberDto } from '../dto/request/search-member.dto';
import { AccountsRepository } from '../../accounts/repository/accounts.repository';

@Injectable()
export class MembersService implements IMembersService {
  constructor(
    private readonly membersRepository: MembersRepository,
    private readonly familiesService: FamiliesService,
    private readonly marriagesService: MarriagesService,
    private readonly parentChildRelationshipsService: ParentChildRelationshipsService,
    private readonly relationshipTypeService: RelationshipTypesService,
    private readonly accountsService: AccountsService,
    private readonly accountsRepository: AccountsRepository
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

    // If the spouse is alive, create an account
    if (spouse.isAlive) {
      await this.createSpouseAccount(spouse);
    }

    return spouse;
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
    const { parentId, parentSpouseId } = createChildDto;

    if (parentId === parentSpouseId) {
      throw new NotFoundException('Parent and spouse cannot be the same person');
    }

    const parent = await this.getMemberById(parentId);
    if (!parent) {
      throw new NotFoundException('Parent not found');
    }

    let parentSpouse: MemberDTO | null = null;

    if (parentSpouseId) {
      const parentSpouses = await this.marriagesService.getAllSpouses([parent.memberId]);

      const isValidSpouse = parentSpouses.some(
        (spouse) => spouse.husbandId === parentSpouseId || spouse.wifeId === parentSpouseId
      );

      if (!isValidSpouse) {
        throw new NotFoundException('Spouse is not valid for this parent');
      }

      parentSpouse = await this.getMemberById(parentSpouseId);
      if (!parentSpouse) {
        throw new NotFoundException('Spouse not found');
      }
    }

    const createMemberDto = this.buildCreateChildMemberDto(parent, createChildDto);
    const child = await this.createMember(createMemberDto);
    if (!child) return null;

    if (parentSpouse) {
      await this.createParentChildRelationships(parent, parentSpouse, child, createChildDto.birthOrder);
    } else {
      await this.createSingleParentChildRelationship(parent, child, createChildDto.birthOrder);
    }

    if (child.isAlive) {
      await this.createChildAccount(child);
    }

    return child;
  }


  private buildCreateChildMemberDto(parent: MemberDTO, createChildDto: CreateChildDto): CreateMemberDto {
    return Object.assign(new CreateMemberDto(), {
      familyId: parent.familyId,
      firstName: createChildDto.firstName,
      middleName: createChildDto.middleName,
      lastName: createChildDto.lastName,
      dateOfBirth: createChildDto.dateOfBirth,
      placeOfBirth: createChildDto.placeOfBirth,
      placeOfDeath: createChildDto.placeOfDeath,
      dateOfDeath: createChildDto.dateOfDeath,
      isAlive: createChildDto.isAlive,
      generation: parent.generation + 1, // Increase generation level
      shortSummary: createChildDto.shortSummary,
      gender: createChildDto.gender
    });
  }

  /**
   * Creates parent-child relationships for a child with both parents.
   *
   * @param parent - The primary parent (father or mother).
   * @param parentSpouse - The spouse of the primary parent.
   * @param child - The newly created child.
   * @param birthOrder - The birth order of the child.
   */
  private async createParentChildRelationships(
    parent: MemberDTO,
    parentSpouse: MemberDTO,
    child: MemberDTO,
    birthOrder: number
  ): Promise<void> {
    const parentRelationType = await this.relationshipTypeService.getRelationshipTypeByName(
      parent.gender === Gender.MALE ? RELATIONSHIP_TYPES.FATHER : RELATIONSHIP_TYPES.MOTHER
    );

    const spouseRelationType = await this.relationshipTypeService.getRelationshipTypeByName(
      parentSpouse.gender === Gender.MALE ? RELATIONSHIP_TYPES.FATHER : RELATIONSHIP_TYPES.MOTHER
    );

    if (!parentRelationType || !spouseRelationType) return;

    const parentRelationship = this.buildParentChildRelationship(
      parent.memberId,
      child.memberId,
      parentRelationType.relaTypeId,
      birthOrder
    );

    const spouseRelationship = this.buildParentChildRelationship(
      parentSpouse.memberId,
      child.memberId,
      spouseRelationType.relaTypeId,
      birthOrder
    );

    await this.parentChildRelationshipsService.createRelationship(parentRelationship);
    await this.parentChildRelationshipsService.createRelationship(spouseRelationship);
  }

  /**
   * Constructs a parent-child relationship DTO.
   *
   * @param parentId - The unique identifier of the parent.
   * @param childId - The unique identifier of the child.
   * @param relaTypeId - The relationship type (father/mother).
   * @param birthOrder - The birth order of the child.
   * @returns A new CreateParentChildRelationshipDto object.
   */
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
   * Creates a parent-child relationship for a child with a single parent.
   *
   * @param parent - The sole parent (either a father or mother).
   * @param child - The newly created child.
   * @param birthOrder - The birth order of the child.
   */
  private async createSingleParentChildRelationship(
    parent: MemberDTO,
    child: MemberDTO,
    birthOrder: number
  ): Promise<void> {
    const parentRelationType = await this.relationshipTypeService.getRelationshipTypeByName(
      parent.gender === Gender.MALE ? RELATIONSHIP_TYPES.FATHER : RELATIONSHIP_TYPES.MOTHER
    );

    if (!parentRelationType) return;

    const parentRelationship = this.buildParentChildRelationship(
      parent.memberId,
      child.memberId,
      parentRelationType.relaTypeId,
      birthOrder
    );

    await this.parentChildRelationshipsService.createRelationship(parentRelationship);
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

    for (const relation of childRelations) {
      // Retrieve the spouse (other parent) of the given parent ID
      const spouse = await this.marriagesService.getSpouse(relation.parentId);
      if (!spouse) continue;

      // Initialize a ParentDTO object if the child is not already in the map
      if (!parentMap.has(relation.childId)) {
        parentMap.set(relation.childId, new ParentDTO());
      }

      // Retrieve the existing ParentDTO for the child
      const parentDTO = parentMap.get(relation.childId)!;

      // Determine father and mother based on spouse data
      if (spouse.husbandId && spouse.wifeId) {
        // Both husband and wife exist in the spouse data
        parentDTO.fatherId = spouse.husbandId;
        parentDTO.motherId = spouse.wifeId;
      } else if (spouse.husbandId === relation.parentId) {
        // If the given parent is the husband, assign wife as mother
        parentDTO.fatherId = relation.parentId;
        parentDTO.motherId = spouse.wifeId;
      } else if (spouse.wifeId === relation.parentId) {
        // If the given parent is the wife, assign husband as father
        parentDTO.motherId = relation.parentId;
        parentDTO.fatherId = spouse.husbandId;
      }
    }

    return parentMap;
  }

  async createFamilyLeader(createMemberDto: CreateMemberDto): Promise<MemberDTO> {
    console.log('Creating Family Leader:', createMemberDto);

    const createdMember = await this.createMember(createMemberDto);
    if (!createdMember) {
      throw new Error('Failed to create family leader');
    }

    if (createdMember.isAlive) {
      await this.createFamilyLeaderAccount(createdMember, createMemberDto);
    }

    return createdMember;
  }

  private async createFamilyLeaderAccount(member: MemberDTO, createMemberDto: CreateMemberDto): Promise<void> {
    if (!createMemberDto.username) {
      throw new NotFoundException('Username is required');
    }

    const account = await this.accountsRepository.existsByUsername(createMemberDto.username);

    if (account) {
      throw new ConflictException('Username already exists');
    }

    const createAccountDto = Object.assign(new CreateAccountDto(), {
      memberId: member.memberId,
      username: createMemberDto.username,
      passwordHash: createMemberDto.password,
      email: createMemberDto.email,
      isAdmin: true,
    });

    await this.accountsService.createAccount(createAccountDto);
  }

  /**
   * Retrieves a member by their unique ID, including spouse and parent details.
   * @param id - The unique identifier of the member.
   * @returns The member DTO with spouse and parent information.
   */
  async getMemberDetails(id: string): Promise<MemberDTO> {
    const member = await this.membersRepository.findById(id);
    if (!member) {
      throw new NotFoundException('Member not found');
    }
    // Convert member to DTO
    const memberDTO = MemberDTO.map(member);

    // Fetch spouse details
    const spouse = await this.marriagesService.getSpouse(memberDTO.memberId);
    if (spouse) {
      memberDTO.spouse =
        memberDTO.gender === Gender.MALE
          ? { wifeId: spouse.wifeId }
          : { husbandId: spouse.husbandId };
    }

    // Fetch parent-child relationships
    const childRelations = await this.parentChildRelationshipsService.findByChildIds([memberDTO.memberId]);
    const parentMap = await this.createParentMap(childRelations);

    // Assign parent details if available
    if (parentMap.has(memberDTO.memberId)) {
      memberDTO.parent = parentMap.get(memberDTO.memberId);
    }

    return memberDTO;
  }

  async searchMembers(
    familyId: string,
    searchDto: SearchMemberDto
  ): Promise<PaginationDTO<MemberDTO>> {
    const { page = 1, limit = 10, search, email, isAlive, gender } = searchDto;
  
    const filters: any = { familyId }; // ✅ Ensure familyId is always applied
  
    if (search) {
      const regex = new RegExp(search, 'i');
      filters.$or = [
        { firstName: regex },
        { middleName: regex },
        { lastName: regex }
      ];
    }
  
    if (email) {
      filters.email = new RegExp(email, 'i');
    }
  
    if (isAlive !== undefined) {
      filters.isAlive = isAlive;
    }
  
    if (gender) {
      filters.gender = gender;
    }
  
    const { members, total } = await this.membersRepository.findByFilters(filters, page, limit);
  
    // ✅ Return early if no members are found
    if (members.length === 0) {
      return PaginationDTO.create([], 0, page, limit);
    }
  
    // ✅ Map member entities to DTOs
    const memberDTOs = members.map((member) => MemberDTO.map(member));
  
    return PaginationDTO.create(memberDTOs, total, page, limit);
  }
  
}
