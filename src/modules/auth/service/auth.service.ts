import { Injectable, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { AccountResponseDto } from '../../accounts/dto/response/account.dto';
import { AccountsRepository } from '../../accounts/repository/accounts.repository';
import { AccountMapper } from '../../accounts/mapper/account.mapper';
import { LoginDto } from '../dto/request/login.dto';
import { IAuthService } from './auth.service.interface';
import { RefreshTokenDto } from '../dto/request/refreshToken.dto';
import { AuthResponseDto } from '../dto/response/auth.dto';
import { LogoutDto } from '../dto/request/logout.dto';
import { Account } from '../../accounts/schema/account.schema';
import { MembersService } from '../../members/service/members.service';
import { RegisterDto } from '../dto/request/register.dto';
import { MemberDTO } from '../../members/dto/response/member.dto';
import { CreateFamilyDto } from '../../families/dto/request/create-family.dto';
import { FamiliesService } from '../../families/service/families.service';
import { AccountsService } from '../../accounts/service/accounts.service';
import { CreateAccountDto } from '../../accounts/dto/request/create-account.dto';
import { Role } from '../../../utils/enum';
import { FamiliesRepository } from '../../families/repository/families.repository';

@Injectable()
export class AuthService implements IAuthService {
    private usedRefreshTokens = new Set<string>(); // Track used refresh tokens (Prevents replay attacks)
    private usedAccessTokens = new Set<string>(); // Track used access tokens (Prevents reuse)

    constructor(
      private jwtService: JwtService,
      private accountsRepository: AccountsRepository,
      private memberService: MembersService,
      private familiesService: FamiliesService,
      private accountsService: AccountsService,
      private familiesRepository: FamiliesRepository
    ) {}

    async validateUser(username: string, password: string): Promise<AccountResponseDto | null> {
        const account = await this.accountsRepository.findByUsername(username);
        if (account && (await bcrypt.compare(password, account.passwordHash))) {
            return AccountMapper.toResponseDto(account);
        }
        return null;
    }

    async login(loginDto: LoginDto): Promise<AuthResponseDto> {
        const account = await this.accountsRepository.findByUsername(loginDto.username);

        if (!account || !(await bcrypt.compare(loginDto.password, account.passwordHash))) {
            throw new NotFoundException('Your username or password is incorrect');
        }

        const accessToken = await this.generateToken(account, '15m');
        const refreshToken = await this.generateToken(account, '7d');

        // Store refresh token in database
        await this.accountsRepository.updateRefreshToken(String(account._id), refreshToken);

        return new AuthResponseDto(accessToken);
    }

    private async generateToken(account: Account, ttl: string): Promise<string> {
        const jti = crypto.randomUUID(); // Unique token ID
        const family = await this.familiesRepository.findByAdminAccountId(String(account._id));

        const payload = {
            username: account.username,
            memberId: account.memberId ? account.memberId : null,
            familyId: family ? String(family._id) : null,
            jti,
            role: account.role,
        };

        return this.jwtService.sign(payload, { expiresIn: ttl });
    }

    async refreshToken(refreshTokenDto: RefreshTokenDto): Promise<AuthResponseDto> {
        const { refreshToken } = refreshTokenDto;

        let payload;
        try {
            payload = this.jwtService.verify(refreshToken);
        } catch (error) {
            throw new UnauthorizedException('Invalid or expired refresh token');
        }

        const account = await this.accountsRepository.findByRefreshToken(refreshToken);
        if (!account) {
            throw new UnauthorizedException('Invalid refresh token');
        }

        // Generate new access token with role and familyId
        const accessToken = await this.generateToken(account, '15m');

        return new AuthResponseDto(accessToken);
    }

    async logout(logoutDto: LogoutDto): Promise<void> {
        const account = await this.accountsRepository.findByMemberId(logoutDto.memberId);

        if (!account) {
            throw new NotFoundException('User not found');
        }

        // Clear the refresh token
        await this.accountsRepository.updateRefreshToken(logoutDto.memberId, null);
    }

    async register(registerDto: RegisterDto): Promise<void> {
        console.log('Registering new member as family leader:', registerDto);

        const createAccountDto: CreateAccountDto = {
            memberId: registerDto.memberId || '',
            username: registerDto.username,
            passwordHash: registerDto.password,
            email: registerDto.email || '',
            role: Role.FAMILY_LEADER
        }

        const account = await this.accountsService.createFamilyLeaderAccount(createAccountDto);

        const createFamilyDto: CreateFamilyDto = {
            familyName: registerDto.familyName,
            adminAccountId: account.accountId
        };

        await this.familiesService.createFamily(createFamilyDto);
    }

}
