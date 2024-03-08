import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  ConnectedSocket,
} from '@nestjs/websockets';
import { SocketsService } from './sockets.service';
import { CreateSocketDto } from './dto/create-socket.dto';
import { UpdateSocketDto } from './dto/update-socket.dto';
import { Server, Socket } from 'socket.io';
import { OnModuleInit } from '@nestjs/common';

@WebSocketGateway()
export class SocketsGateway implements OnModuleInit {
  constructor(private readonly socketsService: SocketsService) {}

  @WebSocketServer()
  server: Server;

  onModuleInit() {
    this.server.on('connection', (socket) => {
      console.log('user connect id:', socket.handshake.headers.roomid);
      socket.join(socket.handshake.headers.roomid);
      console.log(socket.rooms);
    });
  }

  @SubscribeMessage('createSocket')
  create(
    @MessageBody() createSocketDto: CreateSocketDto,
    @ConnectedSocket() client: Socket,
  ) {
    // return this.socketsService.create(createSocketDto);
    this.server.emit('onmessage', {
      from: client.id,
      content: createSocketDto,
    });
  }

  @SubscribeMessage('findAllSockets')
  findAll() {
    return this.socketsService.findAll();
  }

  @SubscribeMessage('findOneSocket')
  findOne(@MessageBody() id: number) {
    return this.socketsService.findOne(id);
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
