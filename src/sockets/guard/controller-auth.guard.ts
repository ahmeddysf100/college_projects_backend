import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { RequestWithAuth } from '../types/types';

@Injectable()
export class ControllerAuthGuard implements CanActivate {
  private readonly logger = new Logger(ControllerAuthGuard.name);
  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean | Promise<boolean> {
    const request: RequestWithAuth = context.switchToHttp().getRequest();

    this.logger.debug(`Checking for auth token on request body`, request.body);

    const { accessToken } = request.body;

    try {
      const payload = this.jwtService.verify(accessToken);
      console.log(payload);
      // append user and poll to socket
      request.userId = payload.sub;
      request.arenaId = payload.arenaId;
      request.name = payload.name;
      return true;
    } catch {
      throw new ForbiddenException('Invalid authorization token');
    }
  }
}
