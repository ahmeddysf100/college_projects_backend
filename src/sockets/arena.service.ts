import { Injectable } from '@nestjs/common';
import { CreateArenaDto } from './dto/create-socket.dto';
import { UpdateSocketDto } from './dto/update-socket.dto';
import { nanoid } from 'nanoid';
import { PrismaService } from 'src/prisma/prisma.service';
// import { WebSocketServer } from '@nestjs/websockets';
// import { Server } from 'socket.io';
@Injectable()
export class ArenaService {
  constructor(private readonly prisma: PrismaService) {}
  //   @WebSocketServer()
  //   server: Server;

  async create(createArenaDto: CreateArenaDto) {
    const arenaId = nanoid(6);

    console.log(arenaId);
    try {
      const res = await this.prisma.arena.create({
        data: {
          arenaQear: createArenaDto.arenaQear,
          roundTime: createArenaDto.roundTime,
          numOfPlayers: createArenaDto.numOfPlayers,
          author: createArenaDto.author,
          arenaId: arenaId,
        },
      });
      return res;
    } catch (error) {
      return error;
    }
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
