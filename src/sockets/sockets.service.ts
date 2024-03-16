import { Injectable } from '@nestjs/common';
import { CreateSocketDto } from './dto/create-socket.dto';
import { UpdateSocketDto } from './dto/update-socket.dto';
import { WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';
@Injectable()
export class SocketsService {
  @WebSocketServer()
  server: Server;

  create(createSocketDto: CreateSocketDto) {
    console.log(createSocketDto);
  }

  findAll() {
    return `This action returns all sockets`;
  }

  findOne(id: number) {
    return `This action returns a #${id} socket`;
  }

  update(id: number, updateSocketDto: UpdateSocketDto) {
    return `This action updates a #${id} socket`;
  }

  remove(id: number) {
    return `This action removes a #${id} socket`;
  }
}
