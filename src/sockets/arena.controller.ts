import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
// import { CreateArenaDto, JoinPollDto } from './dto/create-socket.dto';
import { ArenaService } from './arena.service';
import { RequestWithAuth } from './types/types';
import { ControllerAuthGuard } from './guard/controller-auth.guard';
import { CreateArenaDto, JoinArenaDto } from './dto/create-socket.dto';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';

@Controller('arena')
export class SocketsController {
  constructor(private readonly arenaService: ArenaService) {}

  // @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Body() createArenaDto: CreateArenaDto) {
    const result = await this.arenaService.createArena(createArenaDto);

    return result;
  }

  // @UseGuards(JwtAuthGuard)
  @Post('/join')
  async join(@Body() joinArenaDto: JoinArenaDto) {
    // const options = {
    //   timeZone: 'Asia/Baghdad',
    //   hour12: false, // Use 24-hour format
    //   hour: '2-digit' as const,
    //   minute: '2-digit' as const,
    //   second: '2-digit' as const,
    // };

    // const timeInIraq = new Date().toLocaleTimeString('en-US', options);
    // console.log(timeInIraq);
    // const [hours, minutes, seconds] = timeInIraq.split(':').map(Number);
    // const totalSeconds = hours * 3600 + minutes * 60 + seconds;
    // console.log(totalSeconds);
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
