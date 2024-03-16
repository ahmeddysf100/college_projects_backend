import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { SocketsService } from './sockets.service';
import { CreateSocketDto, NominationDto } from './dto/create-socket.dto';
import { UpdateSocketDto } from './dto/update-socket.dto';
import { Namespace, Server, Socket } from 'socket.io';
import { Logger, UseFilters, UseGuards } from '@nestjs/common';
import { SocketWithAuth } from './types/types';
import { WsCatchAllFilter } from 'src/exceptions/ws-catch-all-filter';
import { ArenaService } from './arena.service';
import { GatewayAdminGuard } from './guard/gateway.Admin.guard';
import { ArenaRepository } from './arena.repository';
@UseFilters(new WsCatchAllFilter())
@WebSocketGateway({
  namespace: 'arena',
  // cors: {
  //   origin: '*',
  //   allowedHeaders: ['*'], //need allow headers to make browser can access to server or delete this line and use transport:['websocket'] in client connect opt
  //   // credentials: true,
  // },
})
// OnModuleInit,
export class SocketsGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit
{
  private readonly logger = new Logger(SocketsGateway.name);
  constructor(
    private readonly socketsService: SocketsService,
    private readonly arenaService: ArenaService,
    private readonly arenaRepository: ArenaRepository,
  ) {}

  @WebSocketServer() io: Namespace; //get server istance for only arena gateway
  // server: Server;

  // Gateway initialized (provided in module and instantiated)
  afterInit(): void {
    this.logger.log(`Websocket Gateway initialized.`);
  }

  async handleConnection(client: SocketWithAuth, ...args: any[]) {
    const sockets = this.io.sockets;
    this.logger.debug(
      `Socket connected with userName: ${client.name}, arenaId: ${client.arenaId}`,
    );

    this.logger.log(`WS Client with id: ${client.id} connected!`);
    this.logger.debug(
      `Number of connected sockets in ${this.io.name}: ${sockets.size}`,
    );

    const roomName = client.arenaId;
    await client.join(roomName);

    const connectedClients = this.io.adapter.rooms?.get(roomName)?.size ?? 0;

    this.logger.debug(
      `userId: ${client.userId} joined room with name: ${roomName}`,
    );
    this.logger.debug(
      `Total clients connected to room '${roomName}': ${connectedClients}`,
    );

    const updateArena = await this.arenaService.addParticipant({
      arenaId: client.arenaId,
      userId: client.userId,
      name: client.name,
    });

    this.io.to(roomName).emit('arena_updated', updateArena);
  }

  async handleDisconnect(client: SocketWithAuth) {
    const sockets = this.io.sockets;

    const { arenaId, userId } = client;
    const updatedArena = await this.arenaService.removeParticipant(
      arenaId,
      userId,
    );

    const roomName = client.arenaId;
    const clientCount = this.io.adapter.rooms?.get(roomName)?.size ?? 0;

    this.logger.log(`Disconnected socket id: ${client.id}`);
    this.logger.debug(`Number of connected sockets: ${sockets.size}`);
    this.logger.debug(
      `Total clients connected to room '${roomName}': ${clientCount}`,
    );

    // updatedPoll could be undefined if the the poll already started
    // in this case, the socket is disconnect, but no the poll state

    if (updatedArena) {
      this.io.to(arenaId).emit('arena_updated', updatedArena);
    }
  }

  @UseGuards(GatewayAdminGuard)
  @SubscribeMessage('remove_participant')
  async remove_participant(
    @MessageBody('id') id: string,
    @ConnectedSocket() client: SocketWithAuth,
  ) {
    this.logger.debug(
      `Attempting to remove participant ID: ${id} and name: ${client.name} from poll ${client.arenaId}`,
    );

    const updateArena = await this.arenaService.removeParticipant(
      client.arenaId,
      id,
    );

    console.log('aaaaaaaaaaaaaaaaaaaa', client.arenaId);
    if (updateArena) {
      this.io.to(client.arenaId).emit('arena_updated', updateArena);
    }
  }

  @SubscribeMessage('test')
  async test() {
    throw new Error('aaaaaaa');
  }

  @SubscribeMessage('nominate')
  async nominate(
    @MessageBody() nomination: NominationDto,
    @ConnectedSocket() client: SocketWithAuth,
  ): Promise<void> {
    this.logger.debug(
      `Attempting to add nomination for user ${client.userId} to poll ${client.arenaId}\n${nomination.text}`,
    );

    const updatedPoll = await this.arenaService.addNomination({
      arenaId: client.arenaId,
      userId: client.userId,
      Q_id: nomination.Q_id,
      text: nomination.text,
      name: client.name,
    });

    this.io.to(client.arenaId).emit('arena_updated', updatedPoll);
  }

  @SubscribeMessage('aaa')
  async findOne(
    @MessageBody() id: any,
    @ConnectedSocket() client: SocketWithAuth,
  ) {
    console.log(id);
    const req = await this.arenaRepository.getAnswers(id.id);

    this.io.to(client.arenaId).emit('arena_updated', req);
  }

  @SubscribeMessage('updateSocket')
  update(@MessageBody() updateSocketDto: UpdateSocketDto) {
    return this.socketsService.update(updateSocketDto.id, updateSocketDto);
  }

  @SubscribeMessage('removeSocket')
  remove(@MessageBody() id: number) {
    return this.socketsService.remove(id);
  }
}
