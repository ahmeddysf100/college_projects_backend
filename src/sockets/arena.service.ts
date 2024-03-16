import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Arena } from 'shared/arena-types';
import { createArenaID, createUserID } from './ids';
import { AddParticipantFields, RejoinArenaFields } from './types/types';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { Redis } from 'ioredis';
import { CreateArenaDto, JoinArenaDto } from './dto/create-socket.dto';
import { ArenaRepository } from './arena.repository';

@Injectable()
export class ArenaService {
  private readonly logger = new Logger(ArenaService.name);
  constructor(
    private readonly jwtService: JwtService,
    @InjectRedis() private readonly redis: Redis,
    private readonly arenaRepository: ArenaRepository,
  ) {}
  async createArena(createArenaDto: CreateArenaDto) {
    const arenaId = createArenaID();
    const userId = createUserID();

    const createdArena = await this.arenaRepository.createArena(
      createArenaDto,
      arenaId,
      userId,
    );

    this.logger.debug(
      `Creating token string for arenaID: ${createdArena.id} and userID: ${userId}`,
    );

    const signedString = this.jwtService.sign(
      {
        arenaId: createdArena.id,
        name: createArenaDto.author,
      },
      {
        subject: userId,
      },
    );

    return {
      arena: createdArena,
      accessToken: signedString,
    };
  }

  async joinArena(fields: JoinArenaDto) {
    const userId = createUserID();

    this.logger.debug(
      `Fetching Arena with ID: ${fields.arenaId} for user with ID: ${userId}`,
    );

    const joinedArena = await this.arenaRepository.getArena(fields.arenaId);

    this.logger.debug(
      `Creating token string for ArenaID: ${joinedArena.id} and userID: ${userId}`,
    );

    const signedString = this.jwtService.sign(
      {
        arenaId: joinedArena.id,
        name: fields.name,
      },
      {
        subject: userId,
      },
    );

    return {
      arena: joinedArena,
      accessToken: signedString,
    };
  }

  async getArena(arenaId: string): Promise<Arena> {
    return this.arenaRepository.getArena(arenaId);
  }

  async rejoinArena(fields: RejoinArenaFields) {
    this.logger.debug(
      `Rejoining Arena with ID: ${fields.arenaId} for user with ID: ${fields.userId} with name: ${fields.name}`,
    );

    const joinedArena = await this.arenaRepository.addParticipant(fields);

    return joinedArena;
  }

  async addParticipant(addParticipant: AddParticipantFields): Promise<Arena> {
    return this.arenaRepository.addParticipant(addParticipant);
  }

  async removeParticipant(
    arenaId: string,
    userId: string,
  ): Promise<Arena | void> {
    const poll = await this.arenaRepository.getArena(arenaId);

    // if arena did not start you can remove players
    if (!poll.hasStarted) {
      const updatedPoll = await this.arenaRepository.removeParticipant(
        arenaId,
        userId,
      );
      return updatedPoll;
    }
  }
}
