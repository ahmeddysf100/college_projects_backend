import { Module } from '@nestjs/common';
import { SocketsService } from './sockets.service';
import { SocketsGateway } from './sockets.gateway';
import { SocketsController } from './arena.controller';
import { ArenaService } from './arena.service';

@Module({
  controllers: [SocketsController],
  providers: [SocketsGateway, SocketsService, ArenaService],
  exports: [SocketsGateway],
})
export class SocketsModule {}
