import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { MarriagesService } from 'src/modules/marriages/service/marriages.service';
import { HouseholdService } from '../service/household.service';
import { HouseholdRepository } from '../repository/household.repository';
import { MembersService } from '../../members/service/members.service';
import {
  ParentChildRelationshipsService
} from '../../parent-child-relationships/service/parent-child-relationships.service';
import { AccountsService } from '../../accounts/service/accounts.service';
import { Role } from '../../../utils/enum';

@Injectable()
export class HouseholdJobService {
  private readonly logger = new Logger(HouseholdJobService.name);

  constructor(
    private readonly marriagesService: MarriagesService,
    private readonly householdService: HouseholdService,
    private readonly householdRepository: HouseholdRepository,
    private readonly membersService: MembersService,
    private readonly parentChildRelationshipsService: ParentChildRelationshipsService,
    private readonly accountsService: AccountsService,
  ) {}

  @Cron('*/5 * * * * *') // Every 5 seconds
  async handleMarriageToHousehold(): Promise<void> {
    this.logger.log('🔍 Scanning marriages for household creation...');

    const marriages = await this.marriagesService.findAllMarriages();

    for (const marriage of marriages) {
      try {
        // Skip divorced marriages or missing creator
        if (marriage.isDivorced || !marriage.createdByMemberId) continue;

        const creatorId = marriage.createdByMemberId;

        // Check if a household already exists for this member
        const existingHousehold = await this.householdRepository.findByHeadAccountId(creatorId);
        if (existingHousehold) continue;

        // Get member details
        const member = await this.membersService.getMemberById(creatorId);
        if (!member) {
          this.logger.warn(`⚠️ Member not found for ID: ${creatorId}`);
          continue;
        }

        const fullName = `${member.firstName} ${member.middleName || ''} ${member.lastName}`.trim();

        // Find parent household if available
        const parentRelations = await this.parentChildRelationshipsService.findByChildIds([creatorId]);
        const parentIds = parentRelations.map(rel => rel.parentId);

        let parentHouseholdId: string | undefined;

        for (const parentId of parentIds) {
          const parentHousehold = await this.householdRepository.findByHeadAccountId(parentId);
          if (parentHousehold) {
            parentHouseholdId = String(parentHousehold._id);
            break;
          }
        }

        // ✅ Create new household
        await this.householdService.createHousehold({
          headAccountId: creatorId,
          parentHouseholdId: parentHouseholdId || '',
          branchId: '', // Add logic for branchId if needed
          name: `Household of ${fullName}`,
        });

        // ✅ Optionally update account role to FAMILY_BRANCH
        let acc = await  this.accountsService.getAccountByMemberId(creatorId);
        if(acc) {
          let account = await this.accountsService.updateAccount(acc?.accountId, {
            ...acc,
            role: Role.FAMILY_HOUSEHOLD
          });
          console.log("Account: ", account);
        }

        this.logger.log(`✅ Created household and updated role for ${fullName} (${creatorId})`);

      } catch (error) {
        this.logger.warn(`❌ Failed to process marriage: ${error.message}`);
      }
    }
  }

}
