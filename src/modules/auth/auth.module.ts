import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import {AuthService} from "./service/auth.service";
import {JwtStrategy} from "./strategy/jwt.strategy";
import {AuthController} from "./controller/auth.controller";
import {LocalStrategy} from "./strategy/local.strategy";
import { AccountsModule } from '../accounts/accounts.module';


@Module({
  imports: [
    PassportModule,
    AccountsModule,
    JwtModule.register({
      secret: 'secret',
      signOptions: { expiresIn: '1h' },
    }),
  ],
  providers: [AuthService, JwtStrategy, LocalStrategy],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
