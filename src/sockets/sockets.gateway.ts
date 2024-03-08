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

      // Get the adapter associated with the server
      const adapter = this.server.of('/').adapter;

      // Create a Map to store the room name and the number of clients in that room
      const roomClientsCount = new Map<string, number>();

      // Iterate over all rooms and count the number of clients in each room
      adapter.rooms.forEach((value: Set<string>, key: string) => {
        roomClientsCount.set(key, value.size);
      });

      // Log the room names and the number of clients in each room
      roomClientsCount.forEach((count, roomName) => {
        console.log(`Room: ${roomName}, Clients: ${count}`);
      });
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
