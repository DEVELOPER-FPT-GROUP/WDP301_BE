import mongoose from 'mongoose';
import { Household } from '../schema/household.schema';
import { CreateHouseholdDto } from '../dto/request/create-household.dto';
import { UpdateHouseholdDto } from '../dto/request/update-household.dto';
import { HouseholdResponseDto } from '../dto/response/household.dto';

export class HouseholdMapper {
  /**
   * Convert Create DTO to Entity
   */
  static toEntity(dto: CreateHouseholdDto): Household {
    return {
      _id: new mongoose.Types.ObjectId(),
      parentHouseholdId: dto.parentHouseholdId
        ? new mongoose.Types.ObjectId(dto.parentHouseholdId)
        : undefined,
      headAccountId: dto.headAccountId
        ? new mongoose.Types.ObjectId(dto.headAccountId)
        : undefined,
      branchId: new mongoose.Types.ObjectId(dto.branchId),
      name: dto.name,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Household;
  }

  /**
   * Convert Update DTO to partial entity
   */
  static toUpdateEntity(dto: UpdateHouseholdDto): Partial<Household> {
    const updateData: Partial<Household> = {};

    if (dto.name) updateData.name = dto.name;
    if (dto.branchId) updateData.branchId = new mongoose.Types.ObjectId(dto.branchId);
    if (dto.parentHouseholdId)
      updateData.parentHouseholdId = new mongoose.Types.ObjectId(dto.parentHouseholdId);
    if (dto.headAccountId)
      updateData.headAccountId = new mongoose.Types.ObjectId(dto.headAccountId);

    updateData.updatedAt = new Date();
    return updateData;
  }

  /**
   * Convert Entity to Response DTO
   */
  static toResponseDto(entity: Household): HouseholdResponseDto {
    return {
      householdId: entity._id.toString(),
      parentHouseholdId: entity.parentHouseholdId?.toString(),
      headAccountId: entity.headAccountId?.toString(),
      branchId: entity.branchId.toString(),
      name: entity.name,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
