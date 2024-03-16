import { Module } from '@nestjs/common';
import { SocketsService } from './sockets.service';
import { SocketsGateway } from './sockets.gateway';
import { SocketsController } from './arena.controller';
import { GatewayAdminGuard } from './guard/gateway.Admin.guard';
import { JwtModule } from '@nestjs/jwt';
import { ArenaService } from './arena.service';
import { ArenaRepository } from './arena.repository';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWTSECRET, // Ensure that this environment variable is set
      signOptions: { expiresIn: '2h' }, // Adjust options as needed
    }),
  ],
  controllers: [SocketsController],
  providers: [
    SocketsGateway,
    SocketsService,
    ArenaService,
    GatewayAdminGuard,
    ArenaRepository,
  ],
  exports: [SocketsGateway],
})
export class SocketsModule {}
