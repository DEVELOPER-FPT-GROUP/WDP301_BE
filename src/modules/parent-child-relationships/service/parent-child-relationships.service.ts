import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateParentChildRelationshipDto } from '../dto/request/create-parent-child-relationship.dto';
import { ParentChildRelationshipDTO } from '../dto/response/parent-child-relationship.dto';
import { UpdateParentChildRelationshipDto } from '../dto/request/update-parent-child-relationship.dto';
import { ParentChildRelationshipsRepository } from '../repository/parent-child-relationships.repository';
import { IParentChildRelationshipsService } from './parent-child-relationships.service.interface';
import { Promise } from 'mongoose';
import { MembersRepository } from '../../members/repository/members.repository';
import { ChildDTO } from '../../members/dto/response/child.dto';
import { MemberDTO } from '../../members/dto/response/member.dto';

@Injectable()
export class ParentChildRelationshipsService implements IParentChildRelationshipsService {
  constructor(
    private readonly parentChildRelationshipsRepository: ParentChildRelationshipsRepository,
    private readonly membersRepository: MembersRepository
  ) {}

  async createRelationship(dto: CreateParentChildRelationshipDto): Promise<ParentChildRelationshipDTO> {
    const createdRelationship = await this.parentChildRelationshipsRepository.create(dto);
    return ParentChildRelationshipDTO.map(createdRelationship);
  }

  async getRelationshipById(id: string): Promise<ParentChildRelationshipDTO> {
    const relationship = await this.parentChildRelationshipsRepository.findById(id);
    if (!relationship) {
      throw new NotFoundException('Relationship not found');
    }
    return ParentChildRelationshipDTO.map(relationship);
  }

  async findAllRelationships(): Promise<ParentChildRelationshipDTO[]> {
    const relationships = await this.parentChildRelationshipsRepository.findAll();
    return relationships.map(relationship => ParentChildRelationshipDTO.map(relationship));
  }

  async updateRelationship(id: string, updateData: UpdateParentChildRelationshipDto): Promise<ParentChildRelationshipDTO> {
    const updatedRelationship = await this.parentChildRelationshipsRepository.update(id, updateData);
    if (!updatedRelationship) {
      throw new NotFoundException('Relationship not found');
    }
    return ParentChildRelationshipDTO.map(updatedRelationship);
  }

  async deleteRelationship(id: string): Promise<boolean> {
    const isDeleted = await this.parentChildRelationshipsRepository.delete(id);
    if (!isDeleted) {
      throw new NotFoundException('Relationship not found');
    }
    return true;
  }

  async findByChildIds(childIds: string[]): Promise<ParentChildRelationshipDTO[]> {
    if (!childIds.length)
      return Promise.resolve([]);

    return this.parentChildRelationshipsRepository
      .findByChildIds(childIds)
      .then(relationships => relationships.map(relationship => ParentChildRelationshipDTO.map(relationship)));
  }

  async findByParentIds(parentIds: string[]): Promise<ParentChildRelationshipDTO[]> {
    if (!parentIds.length)
      return Promise.resolve([]);

    return this.parentChildRelationshipsRepository
      .findByParentIds(parentIds)
      .then(relationships => relationships.map(relationship => ParentChildRelationshipDTO.map(relationship)));
  }

  async findChildrenByParentsId(parentsId: string[]): Promise<Map<string, ChildDTO[]>> {
    if (!parentsId.length) return new Map();

    // Lấy quan hệ cha-con từ repository
    const parentChildRelations = await this.parentChildRelationshipsRepository.findChildrenByParentsId(parentsId);

    // Tập hợp tất cả ID của con cái để lấy thông tin thành viên trong 1 lần
    const childIds = parentChildRelations.map(relation => String(relation.childId));
    const children = await this.membersRepository.findByIds(childIds);

    // Tạo một Map để dễ truy vấn MemberDTO từ childId
    const memberMap = new Map<string, MemberDTO>(children.map(child => [String(child._id), MemberDTO.map(child)]));

    // Tạo Map kết quả
    const childrenMap = new Map<string, ChildDTO[]>();

    for (const relation of parentChildRelations) {
      const { parentId, childId, birthOrder } = relation;

      // Nếu parent chưa có trong map, khởi tạo danh sách trống
      if (!childrenMap.has(String(parentId))) {
        childrenMap.set(String(parentId), []);
      }

      // Lấy thông tin child từ map (tránh gọi findById từng cái một)
      const childMember = memberMap.get(String(childId));
      if (!childMember) continue; // Nếu không tìm thấy, bỏ qua

      // Thêm vào danh sách con của parent
      childrenMap.get(String(parentId))!.push(new ChildDTO({
        child: childMember,
        birthOrder
      }));
    }

    return childrenMap;
  }

}
