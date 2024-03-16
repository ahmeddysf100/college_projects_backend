import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Logger,
} from '@nestjs/common';
import { ArenaService } from '../arena.service';
import { JwtService } from '@nestjs/jwt';
import { WsUnauthorizedException } from 'src/exceptions/ws-exceptions';
import { SocketWithAuth, AuthPayload } from '../types/types';

@Injectable()
export class GatewayAdminGuard implements CanActivate {
  private readonly logger = new Logger(GatewayAdminGuard.name);
  constructor(
    private readonly arenaService: ArenaService,
    private readonly jwtService: JwtService,
  ) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    // regular `Socket` from socket.io is probably sufficient
    const socket: SocketWithAuth = context.switchToWs().getClient();

    // for testing support, fallback to token header
    const token =
      socket.handshake.auth.token || socket.handshake.headers['token'];

    if (!token) {
      this.logger.error('No authorization token provided');

      throw new WsUnauthorizedException('No token provided');
    }

    try {
      const payload = this.jwtService.verify<AuthPayload & { sub: string }>(
        token,
      );

      this.logger.debug(`Validating admin using token payload:`, payload);

      const { sub, arenaId } = payload;

      const arena = await this.arenaService.getArena(arenaId);
      if (sub !== arena.adminId) {
        this.logger.fatal(`admin:${arena.adminId} !== user:${sub}`);
        throw new WsUnauthorizedException('Admin privileges required');
      } else {
        this.logger.warn(`admin:${arena.adminId} === user:${sub}`);
      }

      return true;
    } catch {
      throw new WsUnauthorizedException('Admin privileges required');
    }
  }
}
