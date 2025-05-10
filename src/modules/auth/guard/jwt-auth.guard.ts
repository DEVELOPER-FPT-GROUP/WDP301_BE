import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { winstonLogger as logger } from 'src/common/winston-logger';
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err, user, info, context: ExecutionContext) {
    if (err || !user) {
      console.log('JWT Error:', info?.message || err?.message);
      logger.error('JWT Error:', info?.message || err?.message, {
        context: context.getClass().name,
        method: context.getHandler().name,
        userId: context.switchToHttp().getRequest().user?.sub,
      });
      throw new UnauthorizedException('Invalid Token');
    }
    return user;
  }
}
