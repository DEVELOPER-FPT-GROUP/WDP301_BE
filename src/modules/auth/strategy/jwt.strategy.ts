import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AccountsRepository } from '../../accounts/repository/accounts.repository';
import { AccountMapper } from '../../accounts/mapper/account.mapper';
import { AuthService } from '../service/auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
    constructor(
      private readonly configService: ConfigService,
      private readonly accountsRepository: AccountsRepository,
      private readonly authService: AuthService
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.get<string>('JWT_SECRET'),
        } as any);
    }

    async validate(payload: any) {
        if (!payload?.sub || !payload?.username) {
            throw new UnauthorizedException('Invalid Token');
        }

        // Fetch the account from the database using the memberId (sub)
        const account = await this.accountsRepository.findByMemberId(payload.sub);
        if (!account || account.username !== payload.username) {
            throw new UnauthorizedException('Invalid Token');
        }

        return AccountMapper.toResponseDto(account);
    }
}
