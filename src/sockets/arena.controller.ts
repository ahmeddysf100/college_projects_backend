import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
// import { CreateArenaDto, JoinPollDto } from './dto/create-socket.dto';
import { ArenaService } from './arena.service';
import { RequestWithAuth } from './types/types';
import { ControllerAuthGuard } from './guard/controller-auth.guard';
import { CreateArenaDto, JoinArenaDto } from './dto/create-socket.dto';

@Controller('arena')
export class SocketsController {
  constructor(private readonly arenaService: ArenaService) {}

  @Post()
  async create(@Body() createArenaDto: CreateArenaDto) {
    const result = await this.arenaService.createArena(createArenaDto);

    return result;
  }

  @Post('/join')
  async join(@Body() joinArenaDto: JoinArenaDto) {
    const result = await this.arenaService.joinArena(joinArenaDto);

    return result;
  }

  @UseGuards(ControllerAuthGuard)
  @Post('/rejoin')
  async rejoin(@Req() request: RequestWithAuth) {
    const { userId, arenaId, name } = request;
    const result = await this.arenaService.rejoinArena({
      arenaId,
      name,
      userId,
    });

    return result;
  }
}
