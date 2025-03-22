import { CreateBranchDto } from '../dto/request/create-branch.dto';
import { UpdateBranchDto } from '../dto/request/update-branch.dto';
import { BranchResponseDto } from '../dto/response/branch.dto';

export interface IBranchService {
  createBranch(dto: CreateBranchDto): Promise<BranchResponseDto>;
  getAllBranches(): Promise<BranchResponseDto[]>;
  getBranchById(id: string): Promise<BranchResponseDto>;
  updateBranch(id: string, dto: UpdateBranchDto): Promise<BranchResponseDto>;
  deleteBranch(id: string): Promise<BranchResponseDto>;
}
