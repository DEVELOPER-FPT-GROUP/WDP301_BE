import mongoose from 'mongoose';
import { Branch } from '../schema/branch.schema';
import { CreateBranchDto } from '../dto/request/create-branch.dto';
import { UpdateBranchDto } from '../dto/request/update-branch.dto';
import { BranchResponseDto } from '../dto/response/branch.dto';

export class BranchMapper {
  static toEntity(dto: CreateBranchDto): Branch {
    return {
      _id: new mongoose.Types.ObjectId(),
      familyId: new mongoose.Types.ObjectId(dto.familyId),
      parentBranchId: dto.parentBranchId ? new mongoose.Types.ObjectId(dto.parentBranchId) : undefined,
      headAccountId: dto.headAccountId ? new mongoose.Types.ObjectId(dto.headAccountId) : undefined,
      branchName: dto.branchName,
      branchLevel: dto.branchLevel ?? 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Branch;
  }

  static toUpdateEntity(dto: UpdateBranchDto): Partial<Branch> {
    const updateData: Partial<Branch> = {};

    if (dto.branchName) updateData.branchName = dto.branchName;
    if (dto.branchLevel !== undefined) updateData.branchLevel = dto.branchLevel;
    if (dto.parentBranchId) updateData.parentBranchId = new mongoose.Types.ObjectId(dto.parentBranchId);
    if (dto.headAccountId) updateData.headAccountId = new mongoose.Types.ObjectId(dto.headAccountId);

    updateData.updatedAt = new Date();
    return updateData;
  }

  static toResponseDto(branch: Branch): BranchResponseDto {
    return {
      branchId: branch._id.toString(),
      familyId: branch.familyId.toString(),
      parentBranchId: branch.parentBranchId?.toString(),
      headAccountId: branch.headAccountId?.toString(),
      branchName: branch.branchName,
      branchLevel: branch.branchLevel,
      createdAt: branch.createdAt,
      updatedAt: branch.updatedAt,
    };
  }
}
