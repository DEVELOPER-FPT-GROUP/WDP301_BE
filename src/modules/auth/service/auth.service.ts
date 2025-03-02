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

@Injectable()
export class AuthService implements IAuthService {
    private usedRefreshTokens = new Set<string>(); // Track used refresh tokens (Prevents replay attacks)
    private usedAccessTokens = new Set<string>(); // Track used access tokens (Prevents reuse)

    constructor(
      private jwtService: JwtService,
      private accountsRepository: AccountsRepository,
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

        // Generate tokens
        const accessToken = await this.generateToken(account, '15m');
        const refreshToken = await this.generateToken(account, '7d');

        // Store refresh token in database
        await this.accountsRepository.updateRefreshToken(String(account.memberId), refreshToken);

        // Return AuthResponseDto with only the access token
        return new AuthResponseDto(accessToken);
    }


    private async generateToken(account: any, ttl: string): Promise<string> {
        const jti = crypto.randomUUID(); // Unique token ID
        const payload = { username: account.username, sub: account.memberId, jti };

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

        // Generate new access token (TTL can be customized)
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

}
