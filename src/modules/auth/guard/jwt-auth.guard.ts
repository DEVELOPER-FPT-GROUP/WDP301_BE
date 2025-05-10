import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err, user, info, context: ExecutionContext) {
    if (err || !user) {
      console.log('JWT Error:', info?.message || err?.message);

      throw new UnauthorizedException('Invalid Token');
    }
    return user;
  }
}
