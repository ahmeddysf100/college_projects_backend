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
import { NominationDto, timeOutDto } from './dto/create-socket.dto';
import { UpdateSocketDto } from './dto/update-socket.dto';
import { Namespace } from 'socket.io';
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

  // async handleConnection(client: SocketWithAuth, ...args: any[]) {
  async handleConnection(client: SocketWithAuth) {
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

    this.logger.fatal(updateArena);

    if (updateArena === 'started') {
      client.emit('exception', `arena with id:${client.arenaId} has started`);
      client.disconnect(true);
    } else {
      this.io.to(roomName).emit('arena_updated', updateArena);
    }
  }

  async handleDisconnect(client: SocketWithAuth) {
    const sockets = this.io.sockets;

    const { arenaId, userId, name } = client;
    const updatedArena = await this.arenaService.removeParticipant(
      arenaId,
      userId,
      name,
    );

    const roomName = client.arenaId;
    const clientCount = this.io.adapter.rooms?.get(roomName)?.size ?? 0;

    this.logger.log(`Disconnected socket id: ${client.id}`);
    this.logger.debug(`Number of connected sockets: ${sockets.size}`);
    this.logger.debug(
      `Total clients connected to room '${roomName}': ${clientCount}`,
    );
    this.logger.fatal(updatedArena);

    if (updatedArena) {
      this.io.to(arenaId).emit('arena_updated', updatedArena);
    }
  }

  @UseGuards(GatewayAdminGuard)
  @SubscribeMessage('remove_participant')
  async remove_participant(
    @MessageBody() participant: any,
    @ConnectedSocket() client: SocketWithAuth,
  ) {
    // this.logger.debug(
    //   `Attempting to remove participant ID: ${data.id} and name: ${data.name} from arenaId: ${client.arenaId}`,
    // );

    const updateArena = await this.arenaService.removeParticipantForce(
      client.arenaId,
      participant.id,
      participant.name,
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

    const updatedArena = await this.arenaService.addNomination({
      arenaId: client.arenaId,
      userId: client.userId,
      Q_id: nomination.Q_id,
      text: nomination.text,
      name: client.name,
    });
    this.logger.warn(`your answer is: ${updatedArena}`);
    if (updatedArena) {
      this.io.to(client.arenaId).emit('arena_updated', updatedArena);
    } else {
      client.emit('exception', `YOUR ANSWER: ${nomination.text} IS WRONG`);
    }
  }

  @UseGuards(GatewayAdminGuard)
  @SubscribeMessage('remove_nomination')
  async removeNomination(
    @MessageBody('id') nominationId: string,
    @ConnectedSocket() client: SocketWithAuth,
  ): Promise<void> {
    this.logger.debug(
      `Attempting to remove nomination ${nominationId} from arena ${client.arenaId}`,
    );

    const updatedArena = await this.arenaService.removeNomination(
      client.arenaId,
      nominationId,
    );

    this.io.to(client.arenaId).emit('arena_updated', updatedArena);
  }

  @UseGuards(GatewayAdminGuard)
  @SubscribeMessage('start_arena')
  async startVote(@ConnectedSocket() client: SocketWithAuth): Promise<void> {
    this.logger.debug(`Attempting to start arena: ${client.arenaId}`);

    const updatedPoll = await this.arenaService.startArena(
      client.arenaId,
      client.name,
    );

    this.io.to(client.arenaId).emit('arena_updated', updatedPoll);
  }

  @UseGuards(GatewayAdminGuard)
  @SubscribeMessage('close_arena')
  async closePoll(@ConnectedSocket() client: SocketWithAuth): Promise<void> {
    this.logger.debug(`Closing arena: ${client.arenaId} and computing results`);

    const updatedPoll = await this.arenaService.computeResults(client.arenaId);

    this.io.to(client.arenaId).emit('arena_updated', updatedPoll);
  }

  @SubscribeMessage('time_out')
  async timeOut(
    @ConnectedSocket() client: SocketWithAuth,
    @MessageBody() timeOutDto: timeOutDto,
  ): Promise<void> {
    this.logger.debug(
      `TIME OUT for STAGE: ${timeOutDto.currentStage} , arena: ${client.arenaId} sending next question`,
    );

    const updatedArena = await this.arenaService.timeOut(
      client.arenaId,
      timeOutDto.Q_id,
      timeOutDto.currentStage,
    );

    this.io.to(client.arenaId).emit('arena_updated', updatedArena);
  }

  // @SubscribeMessage('aaa')
  // async findOne(
  //   @MessageBody() id: any,
  //   @ConnectedSocket() client: SocketWithAuth,
  // ) {
  //   console.log(id);
  //   // const req = await this.arenaRepository.getPoints(
  //   //   `.rankings.${client.userId},`,
  //   //   `arenaId:${client.arenaId}`,
  //   // );

  //   // this.io.to(client.arenaId).emit('arena_updated', req);
  // }

  @SubscribeMessage('updateSocket')
  update(@MessageBody() updateSocketDto: UpdateSocketDto) {
    return this.socketsService.update(updateSocketDto.id, updateSocketDto);
  }

  @SubscribeMessage('removeSocket')
  remove(@MessageBody() id: number) {
    return this.socketsService.remove(id);
  }
}
