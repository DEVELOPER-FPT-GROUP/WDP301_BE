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
  ParentChildRelationshipsService,
} from '../../parent-child-relationships/service/parent-child-relationships.service';
import { RelationshipTypesService } from '../../relationship-types/service/relationship-types.service';
import {
  CreateParentChildRelationshipDto,
} from '../../parent-child-relationships/dto/request/create-parent-child-relationship.dto';
import { SpouseDTO } from '../dto/response/spouse.dto';
import { ParentDTO } from '../dto/response/parent.dto';
import {
  ParentChildRelationshipDTO,
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
  // async findMembersInFamily(familyId: string): Promise<MemberDTO[]> {
  //   // Fetch the family by ID
  //   const family = await this.familiesService.getFamilyById(familyId);
  //   if (!family) return [];
  //
  //   // Fetch all members in the given family
  //   const members = await this.membersRepository.findMembersInFamily(familyId);
  //   if (!members.length) return [];
  //
  //   // Convert members to DTOs and extract member IDs
  //   const memberDTOs = members.map(member => MemberDTO.map(member));
  //   const memberIds = memberDTOs.map(member => member.memberId);
  //
  //   const marriages = await this.marriagesService.getAllSpouses(memberIds);
  //   const childRelations = await this.parentChildRelationshipsService.findByChildIds(memberIds);
  //
  //   // Create lookup maps
  //   const spouseMap = await this.createSpouseMap(marriages);  // This will return an array of SpouseDTOs
  //   const parentMap = await this.createParentMap(childRelations);
  //
  //   // Assign spouse, children, and parent data
  //   return memberDTOs.map(memberDTO => {
  //     // Assign an array of spouses to the memberDTO
  //     memberDTO.spouses = spouseMap.get(memberDTO.memberId);
  //     memberDTO.parent = parentMap.get(memberDTO.memberId);
  //     return memberDTO;
  //   });
  // }

  async findMembersInFamily(familyId: string): Promise<any> {
    const family = await this.familiesService.getFamilyById(familyId);
    if (!family) return null;

    const members = await this.membersRepository.findMembersInFamily(familyId);
    if (!members.length) return null;

    const memberMap = new Map<string, any>();
    const memberIds = members.map(m => String(m._id));

    const marriages = await this.marriagesService.getAllSpouses(memberIds);
    const parentChildRelations = await this.parentChildRelationshipsService.findByChildIds(memberIds);

    // Create spouse map (handling multiple partners)
    const spouseMap = new Map<string, { id: string, name: string, gender: string, isSingle: boolean, isAlive: boolean, dateOfBirth: string, dateOfDeath: string | null, deleted?: boolean }[]>();
    marriages.forEach(({ husbandId, wifeId }) => {
      const husband = members.find(m => String(m._id) === String(husbandId));
      const wife = members.find(m => String(m._id) === String(wifeId));

      if (husband && wife) {
        if (!spouseMap.has(String(husbandId))) spouseMap.set(String(husbandId), []);
        if (!spouseMap.has(String(wifeId))) spouseMap.set(String(wifeId), []);

        spouseMap.get(String(husbandId))!.push({
          id: String(wifeId),
          name: `${wife.firstName} ${wife.middleName || ''} ${wife.lastName}`.trim(),
          gender: wife.gender,
          isSingle: wife.isSingle,
          isAlive: wife.isAlive,
          dateOfBirth: wife.dateOfBirth ? new Date(wife.dateOfBirth).toISOString() : '',
          dateOfDeath: wife.dateOfDeath ? new Date(wife.dateOfDeath).toISOString() : '',
          deleted: wife.isDeleted
        });

        spouseMap.get(String(wifeId))!.push({
          id: String(husbandId),
          name: `${husband.firstName} ${husband.middleName || ''} ${husband.lastName}`.trim(),
          gender: husband.gender,
          isSingle: husband.isSingle,
          isAlive: husband.isAlive,
          dateOfBirth: husband.dateOfBirth ? new Date(husband.dateOfBirth).toISOString() : '',
          dateOfDeath: husband.dateOfDeath ? new Date(husband.dateOfDeath).toISOString() : '',
          deleted: husband.isDeleted
        });
      }
    });

    // Create children map linked to both parents
    const childParentMap = new Map<string, string[]>(); // Tracks child-to-parents mapping
    const childrenMap = new Map<string, any[]>();

    // Store birthOrder information from parentChildRelations
    const birthOrderMap = new Map<string, number>();

    parentChildRelations.forEach(({ parentId, childId, birthOrder }) => {
      const child = members.find(m => String(m._id) === String(childId));
      if (child) {
        const parentKey = String(parentId);
        if (!childrenMap.has(parentKey)) {
          childrenMap.set(parentKey, []);
        }

        childrenMap.get(parentKey)!.push({
          id: String(childId),
          name: `${child.firstName} ${child.middleName || ''} ${child.lastName}`.trim(),
          generation: child.generation,
          gender: child.gender,
          isSingle: child.isSingle,
          isAlive: child.isAlive,
          dateOfBirth: child.dateOfBirth ? new Date(child.dateOfBirth).toISOString() : '',
          dateOfDeath: child.dateOfDeath ? new Date(child.dateOfDeath).toISOString() : '',
          birthOrder: birthOrder || 0 // Default birthOrder to 0 if missing
        });

        // Store birth order
        birthOrderMap.set(String(childId), birthOrder || 0);

        // Track child-parent relationships
        if (!childParentMap.has(String(childId))) {
          childParentMap.set(String(childId), []);
        }
        childParentMap.get(String(childId))!.push(parentKey);
      }
    });

    // **Sort children by birthOrder**
    childrenMap.forEach((children, parentId) => {
      children.sort((a, b) => (a.birthOrder - b.birthOrder));
    });

    // Create member data structure
    members.forEach(member => {
      if (member.isDeleted) return;

      const memberData = {
        id: String(member._id),
        name: `${member.firstName} ${member.middleName || ''} ${member.lastName}`.trim(),
        gender: member.gender,
        isSingle: member.isSingle,
        isAlive: member.isAlive,
        dateOfBirth: member.dateOfBirth ? new Date(member.dateOfBirth).toISOString() : '',
        dateOfDeath: member.dateOfDeath ? new Date(member.dateOfDeath).toISOString() : '',
        generation: member.generation,
        relationships: [] as Array<{
          partner?: { id: string, name: string, gender: string, isSingle: boolean, isAlive: boolean, dateOfBirth: string, dateOfDeath: string | null },
          isMarried?: boolean,
          children?: { id: string, name: string, generation: number, gender: string, isSingle: boolean, isAlive: boolean, dateOfBirth: string, dateOfDeath: string | null, birthOrder: number }[]
        }>
      };

      let hasVisiblePartner = false;
      if (spouseMap.has(memberData.id)) {
        spouseMap.get(memberData.id)!.forEach(spouse => {
          let sharedChildren = (childrenMap.get(memberData.id) || []).filter(child =>
            childParentMap.has(child.id) &&
            childParentMap.get(child.id)!.includes(spouse.id)
          );

          // Attach birthOrder from birthOrderMap
          sharedChildren = sharedChildren.map(child => ({
            ...child,
            birthOrder: birthOrderMap.get(child.id) || 0
          }));

          // Sort children by birthOrder before adding to relationships
          sharedChildren.sort((a, b) => a.birthOrder - b.birthOrder);

          if (!spouse.deleted) {
            hasVisiblePartner = true;
            memberData.relationships.push({
              partner: spouse,
              isMarried: true,
              children: sharedChildren.length ? sharedChildren : undefined
            });
          } else if (sharedChildren.length > 0) {
            // Partner is deleted, but children should remain in a separate object
            memberData.relationships.push({
              children: sharedChildren
            });
          }
        });
      }

      // Remove "isMarried" if all partners are deleted
      if (!hasVisiblePartner) {
        memberData.relationships.forEach(rel => {
          delete rel.isMarried;
        });
      }

      memberMap.set(memberData.id, memberData);
    });

    const rootMember = members.find(m => m.generation === 0 && !m.isDeleted);
    if (!rootMember) return null;

    const visited = new Set<string>();

    function constructHierarchy(memberId: string): any {
      if (visited.has(memberId)) return null;
      visited.add(memberId);

      const memberData = memberMap.get(memberId);
      if (!memberData) return null;

      memberData.relationships = memberData.relationships.map(rel => {
        if (rel.partner) {
          rel.partner = {
            id: rel.partner.id,
            name: rel.partner.name,
            gender: rel.partner.gender,
            isSingle: rel.partner.isSingle,
            isAlive: rel.partner.isAlive,
            dateOfBirth: rel.partner.dateOfBirth,
            dateOfDeath: rel.partner.dateOfDeath
          };
        }
        if (rel.children) {
          rel.children = rel.children
            .map(child => ({
              ...constructHierarchy(child.id),
              birthOrder: birthOrderMap.get(child.id) || 0
            }))
            .sort((a, b) => a.birthOrder - b.birthOrder)
            .filter(Boolean);
        }
        return rel;
      }).filter(Boolean);

      return memberData;
    }

    return constructHierarchy(String(rootMember._id));
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
    const { parentId, parentSpouseId, dateOfBirth } = createChildDto;

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

    // Fetch all siblings (children of the same parents)
    let siblings = await this.parentChildRelationshipsService.findByParentIds([parentId]);

    if (parentSpouseId) {
      const spouseChildren = await this.parentChildRelationshipsService.findByParentIds([parentSpouseId]);
      siblings = siblings.concat(spouseChildren);
    }

    // Remove duplicates in case both parents were queried
    const siblingIds = new Set(siblings.map(s => s.childId));
    siblings = siblings.filter(s => siblingIds.has(s.childId));

    // Retrieve full sibling details (including dateOfBirth)
    const siblingMembers = await this.membersRepository.findByIds([...siblingIds]);

    // Sort siblings by `dateOfBirth`
    siblingMembers.sort((a, b) => {
      const dateA = new Date(a.dateOfBirth).getTime();
      const dateB = new Date(b.dateOfBirth).getTime();
      return dateA - dateB;
    });

    // Find the correct birth order for the new child
    let birthOrder = 1;
    if (dateOfBirth) {
      const childBirthTime = new Date(dateOfBirth).getTime();
      birthOrder = siblingMembers.filter(sibling => new Date(sibling.dateOfBirth || '9999-12-31').getTime() < childBirthTime).length + 1;
    } else {
      // If dateOfBirth is missing, assign as the last born
      birthOrder = siblingMembers.length + 1;
    }

    // Create new child
    const createMemberDto = this.buildCreateChildMemberDto(parent, createChildDto);
    const child = await this.createMember(createMemberDto);
    if (!child) return null;

    // Store parent-child relationships with generated birthOrder
    if (parentSpouse) {
      await this.createParentChildRelationships(parent, parentSpouse, child, birthOrder);
    } else {
      await this.createSingleParentChildRelationship(parent, child, birthOrder);
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

  private async createSpouseMap(marriages: MarriageDTO[]): Promise<Map<string, SpouseDTO[]>> {
    const spouseMap = new Map<string, SpouseDTO[]>();

    // Tập hợp tất cả các ID cần lấy thông tin thành viên
    const memberIds = new Set<string>();
    marriages.forEach(({ husbandId, wifeId }) => {
      if (husbandId) memberIds.add(husbandId);
      if (wifeId) memberIds.add(wifeId);
    });

    // Lấy thông tin thành viên từ repository
    const members = await this.membersRepository.findByIds(Array.from(memberIds));
    const memberMap = new Map<string, MemberDTO>(members.map(member => [String(member._id), MemberDTO.map(member)]));

    // Lấy danh sách con theo parentId
    const childrenMap = await this.parentChildRelationshipsService.findChildrenByParentsId(Array.from(memberIds));

    // Xây dựng spouse map
    marriages.forEach(({ husbandId, wifeId }) => {
      if (!husbandId || !wifeId) return; // Bỏ qua nếu thiếu ID

      const husband = memberMap.get(husbandId);
      const wife = memberMap.get(wifeId);

      if (!husband || !wife) return; // Bỏ qua nếu không tìm thấy thông tin spouse

      // Thêm wife vào danh sách spouse của husband
      if (!spouseMap.has(husbandId)) spouseMap.set(husbandId, []);
      spouseMap.get(husbandId)!.push({
        wife,
        children: childrenMap.get(husbandId) || []  // Luôn trả về mảng
      });

      // Thêm husband vào danh sách spouse của wife
      if (!spouseMap.has(wifeId)) spouseMap.set(wifeId, []);
      spouseMap.get(wifeId)!.push({
        husband,
        children: childrenMap.get(wifeId) || []  // Luôn trả về mảng
      });
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
      // Lấy thông tin thành viên cha/mẹ từ ID
      const parent = await this.membersRepository.findById(relation.parentId);
      if (!parent) continue;

      // Tạo DTO cho parent
      const parentDTOObject = MemberDTO.map(parent);

      // Nếu chưa có ParentDTO cho childId, khởi tạo nó
      if (!parentMap.has(relation.childId)) {
        parentMap.set(relation.childId, new ParentDTO());
      }

      // Lấy ParentDTO của child
      const parentDTO = parentMap.get(relation.childId)!;

      // Lấy thông tin spouse để xác định cha/mẹ
      const spouse = await this.marriagesService.getSpouse(relation.parentId);
      if (!spouse) {
        // Nếu không có spouse, chỉ có 1 phụ huynh
        if (parent.gender === 'MALE') {
          parentDTO.father = parentDTOObject;
        } else {
          parentDTO.mother = parentDTOObject;
        }
        continue;
      }

      // Xác định cha/mẹ dựa trên spouse data
      const spouseData = await this.membersRepository.findById(
        spouse.husbandId === relation.parentId ? spouse.wifeId : spouse.husbandId
      );

      if (spouseData) {
        const spouseDTO = MemberDTO.map(spouseData);
        if (parent.gender === 'MALE') {
          parentDTO.father = parentDTOObject;
          parentDTO.mother = spouseDTO;
        } else {
          parentDTO.mother = parentDTOObject;
          parentDTO.father = spouseDTO;
        }
      } else {
        // Nếu không tìm thấy spouse, chỉ có 1 phụ huynh
        if (parent.gender === 'MALE') {
          parentDTO.father = parentDTOObject;
        } else {
          parentDTO.mother = parentDTOObject;
        }
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

    return createdMember;
  }

  /**
   * Retrieves a member by their unique ID, including spouse and parent details.
   * @param id - The unique identifier of the member.
   * @returns The member DTO with spouse and parent information.
   */
  async getMemberDetails(id: string): Promise<MemberDTO> {
    // Lấy thông tin thành viên từ repository
    const member = await this.membersRepository.findById(id);
    if (!member) {
      throw new NotFoundException('Member not found');
    }

    // Chuyển đổi sang DTO
    const memberDTO = MemberDTO.map(member);

    // Lấy danh sách thành viên (chỉ 1 người)
    const memberIds = [memberDTO.memberId];

    // Lấy dữ liệu hôn nhân (hôn phối)
    const marriages = await this.marriagesService.getAllSpouses(memberIds);

    // Tạo map lookup cho spouse
    const spouseMap = await this.createSpouseMap(marriages);
    memberDTO.spouses = spouseMap.get(memberDTO.memberId) || [];

    // Lấy quan hệ cha mẹ - con cái
    const childRelations = await this.parentChildRelationshipsService.findByChildIds(memberIds);

    // Tạo map lookup cho parent
    const parentMap = await this.createParentMap(childRelations);
    memberDTO.parent = parentMap.get(memberDTO.memberId);

    return memberDTO;
  }

  async searchMembers(familyId: string, searchDto: SearchMemberDto): Promise<PaginationDTO<MemberDTO>> {
    const { page = 1, limit = 10 } = searchDto;
    const filters: any = {};

    if (searchDto.search) {
      filters.$or = [
        { firstName: new RegExp(searchDto.search, 'i') },
        { middleName: new RegExp(searchDto.search, 'i') },
        { lastName: new RegExp(searchDto.search, 'i') }
      ];
    }

    if (searchDto.email) {
      filters.email = new RegExp(searchDto.email, 'i');
    }

    if (searchDto.isAlive !== undefined) {
      filters.isAlive = searchDto.isAlive;
    }

    if (searchDto.gender) {
      filters.gender = searchDto.gender;
    }

    filters.familyId = searchDto.familyId;
    const { members, total } = await this.membersRepository.findByFilters(filters, page, limit);
    const memberDTOs = members.map(member => MemberDTO.map(member));

    return PaginationDTO.create(memberDTOs, total, page, limit);
  }

  /**
   * Soft deletes a member by updating the isDeleted field to true.
   * @param id - The unique identifier of the member.
   * @returns True if update was successful, otherwise throws a NotFoundException.
   */
  async removeMember(id: string): Promise<MemberDTO> {
    // Update the isDeleted field to true for the member with the given id
    const result = await this.membersRepository.update(id, { isDeleted: true });

    if (!result) {
      throw new NotFoundException('Member not found');
    }

    return MemberDTO.map(result);
  }

}
