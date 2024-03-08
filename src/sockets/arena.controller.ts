import { Body, Controller, Post } from '@nestjs/common';
import { CreateArenaDto } from './dto/create-socket.dto';
import { ArenaService } from './arena.service';

@Controller('arena')
export class SocketsController {
  constructor(private readonly arenaService: ArenaService) {}

  @Post()
  async create(@Body() data: CreateArenaDto) {
    const res = await this.arenaService.create(data);
    return res;
  }
}
