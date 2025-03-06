import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
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
import { CreateMemberDto } from '../../members/dto/request/create-member.dto';
import { FamiliesService } from '../../families/service/families.service';
import { Gender } from 'src/utils/enum';

@Injectable()
export class AuthService implements IAuthService {
  private usedRefreshTokens = new Set<string>(); // Track used refresh tokens (Prevents replay attacks)
  private usedAccessTokens = new Set<string>(); // Track used access tokens (Prevents reuse)

  constructor(
    private jwtService: JwtService,
    private accountsRepository: AccountsRepository,
    private memberService: MembersService,
    private familiesService: FamiliesService,
  ) {}

  async validateUser(
    username: string,
    password: string,
  ): Promise<AccountResponseDto | null> {
    const account = await this.accountsRepository.findByUsername(username);
    if (account && (await bcrypt.compare(password, account.passwordHash))) {
      return AccountMapper.toResponseDto(account);
    }
    return null;
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const account = await this.accountsRepository.findByUsername(
      loginDto.username,
    );
    if (
      !account ||
      !(await bcrypt.compare(loginDto.password, account.passwordHash))
    ) {
      throw new NotFoundException('Your username or password is incorrect');
    }

    const accessToken = await this.generateToken(account, '15m');
    const refreshToken = await this.generateToken(account, '7d');

    // Store refresh token in database
    await this.accountsRepository.updateRefreshToken(
      String(account.memberId),
      refreshToken,
    );

    return new AuthResponseDto(accessToken);
  }

  private async generateToken(account: Account, ttl: string): Promise<string> {
    const jti = crypto.randomUUID(); // Unique token ID
    const member = await this.memberService.getMemberById(
      String(account.memberId),
    );

    const payload = {
      username: account.username,
      memberId: account.memberId,
      familyId: member.familyId,
      jti,
      role: account.isAdmin ? 'admin' : 'member',
    };

    return this.jwtService.sign(payload, { expiresIn: ttl });
  }

  async refreshToken(
    refreshTokenDto: RefreshTokenDto,
  ): Promise<AuthResponseDto> {
    const { refreshToken } = refreshTokenDto;

    let payload;
    try {
      payload = this.jwtService.verify(refreshToken);
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const account =
      await this.accountsRepository.findByRefreshToken(refreshToken);
    if (!account) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Generate new access token with role and familyId
    const accessToken = await this.generateToken(account, '15m');

    return new AuthResponseDto(accessToken);
  }

  async logout(logoutDto: LogoutDto): Promise<void> {
    const account = await this.accountsRepository.findByMemberId(
      logoutDto.memberId,
    );

    if (!account) {
      throw new NotFoundException('User not found');
    }

    // Clear the refresh token
    await this.accountsRepository.updateRefreshToken(logoutDto.memberId, null);
  }

  async register(registerDto: RegisterDto): Promise<MemberDTO> {
    console.log('Registering new member as family leader:', registerDto);

    const createFamilyDto: CreateFamilyDto = {
      familyName: registerDto.familyName,
    };

    const createdFamily =
      await this.familiesService.createFamily(createFamilyDto);

    const createMemberDto: CreateMemberDto = {
      ...registerDto,
      firstName: 'admin',
      lastName: 'admin',
      gender: Gender.MALE,
      generation: 0,
      familyId: createdFamily.familyId,
    };

    const createdMember =
      await this.memberService.createFamilyLeader(createMemberDto);
    if (!createdMember) {
      throw new Error('Failed to register');
    }

    return createdMember;
  }
}
