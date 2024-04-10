import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { createArenaID, createNominationID, createUserID } from './ids';
import {
  AddNominationFields,
  AddParticipantFields,
  RejoinArenaFields,
} from './types/types';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { Redis } from 'ioredis';
import { CreateArenaDto, JoinArenaDto } from './dto/create-socket.dto';
import { ArenaRepository } from './arena.repository';
import {
  AddParticipant,
  AddParticipantWithGear,
  Arena,
} from './types/createArena';

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
        name: createArenaDto.adminName,
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

    if (joinedArena === null) {
      this.logger.error(`arena with ID:${fields.arenaId} NOT FOUND`);
      throw new NotFoundException(`arena with ID:${fields.arenaId} NOT FOUND`);
    }

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

  async addParticipant(
    addParticipant: AddParticipantFields,
  ): Promise<AddParticipant | string | AddParticipantWithGear> {
    return this.arenaRepository.addParticipant(addParticipant);
  }

  async removeParticipant(
    arenaId: string,
    userId: string,
    name: string,
  ): Promise<AddParticipant> {
    //if there is difrence in promise of sevice and promise of reposatory the diffrense will be deleted
    // const poll = await this.arenaRepository.getArena(arenaId);

    // if arena did not start you can remove players
    // if (!poll.hasStarted) {
    const updatedPoll = await this.arenaRepository.removeParticipant(
      arenaId,
      userId,
      name,
    );
    return updatedPoll;
    // }
  }

  async addNomination({
    arenaId,
    userId,
    Q_id,
    text,
    name,
  }: AddNominationFields): Promise<AddParticipantWithGear | void> {
    const options = {
      timeZone: 'Asia/Baghdad',
      hour12: true,
      hour: '2-digit' as const,
      minute: '2-digit' as const,
      year: 'numeric' as const, // Add year
      month: 'long' as const, // Add month
      day: '2-digit' as const, // Add day
    };
    const timeInIraq = new Date().toLocaleDateString('en-US', options);
    this.logger.error(timeInIraq);
    return this.arenaRepository.addNomination({
      arenaId,
      nominationId: createNominationID(),
      nomination: {
        userId,
        Q_id,
        text,
        name,
        time: timeInIraq,
      },
    });
  }

  async removeNomination(
    arenaId: string,
    nominationId: string,
  ): Promise<Arena> {
    return this.arenaRepository.removeNomination(arenaId, nominationId);
  }

  async startArena(
    arenaId: string,
    adminName: string,
  ): Promise<AddParticipantWithGear> {
    return this.arenaRepository.startArena(arenaId, adminName);
  }

  async computeResults(arenaId: string): Promise<any> {
    const req = await this.arenaRepository.getResult(arenaId);

    return req;
  }
}
