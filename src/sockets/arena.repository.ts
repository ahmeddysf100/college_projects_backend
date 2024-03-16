import { InjectRedis } from '@nestjs-modules/ioredis';
import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { CreateArenaDto } from './dto/create-socket.dto';
import { AddParticipantData } from './types/types';
import { Arena, ArenaQear } from 'shared';

@Injectable()
export class ArenaRepository {
  private readonly ttl: string;
  private readonly logger = new Logger(ArenaRepository.name);

  constructor(
    @InjectRedis() private readonly redis: Redis,
    configService: ConfigService,
  ) {
    this.ttl = configService.get('ARENA_DURATION');
  }

  async createArena(
    createArenaDto: CreateArenaDto,
    arenaId: string,
    userId: string,
  ) {
    const initialArena = {
      id: arenaId,
      arenaQear: createArenaDto.arenaQear,
      numOfPlayers: createArenaDto.numOfPlayers,
      participants: {},
      nominations: {},
      rankings: {},
      results: [],
      adminId: userId,
      hasStarted: false,
    };
    this.logger.log(
      `Creating new Arena: ${JSON.stringify(initialArena)} with TTL ${
        this.ttl
      }`,
    );

    const key = `arenaId:${arenaId}`;

    await this.storeAnswers(createArenaDto.arenaQear as any, arenaId);
    try {
      // Await the Redis set operation and handle errors
      // await this.redis.set(
      //   `arenaId:${arenaId}`,
      //   JSON.stringify(initialArena),
      //   'EX',
      //   this.ttl,
      // );
      await this.redis
        .multi([
          ['send_command', 'JSON.SET', key, '.', JSON.stringify(initialArena)],
          ['expire', key, this.ttl],
        ])
        .exec();
      this.logger.log(`Arena with ID ${arenaId} created successfully.`);
      return initialArena;
    } catch (e) {
      this.logger.error(
        `Failed to add Arena ${JSON.stringify(initialArena)}\n${e}`,
      );
      throw new InternalServerErrorException();
    }
  }

  async storeAnswers(questions: ArenaQear[], arenaId: string): Promise<void> {
    const answerObj = {}; // Create an object to store each answer

    for (const question of questions) {
      // Check if the question has a correct answer
      if (question.correctAnswer) {
        answerObj[`Q_id:${question.id}`] = question.correctAnswer;
      }

      // Check if the question has multiple answers
      if (question.answers.length > 0) {
        const correctAnswers = question.answers.filter((a) => a.isCorrect); // Filter correct answers
        console.warn('wweeww', correctAnswers);
        answerObj[`Q_id:${question.id}`] = correctAnswers[0].A_text;
      }
    }
    this.logger.debug(answerObj);
    try {
      await this.redis
        .multi([
          [
            'send_command',
            'JSON.SET',
            `answers:arenaId:${arenaId}`,
            '.',
            JSON.stringify(answerObj),
          ],
          ['expire', `answers:arenaId:${arenaId}`, this.ttl],
        ])
        .exec();
      this.logger.verbose(`Answers stored for arena ID ${arenaId}`);
    } catch (e) {
      this.logger.error(
        `Failed to store answers for arena ID ${arenaId}: ${e}`,
      );
      throw new InternalServerErrorException();
    }
  }

  async getAnswers(arenaId: string): Promise<any> {
    this.logger.log(`Attempting to get Answers for Arena: ${arenaId}`);
    const key = `answers:arenaId:${arenaId}`;
    try {
      // const currentArena: any = await this.redis
      //   .multi([['send_command', 'JSON.GET', key, '.']])
      //   .exec();

      const currentAnswers: any = await this.redis.call('JSON.GET', key, '.');

      this.logger.verbose(currentAnswers);

      // if (currentAnswers?.hasStarted) {
      //   throw new BadRequestException('The Arena has already started');
      // }

      return JSON.parse(currentAnswers);
    } catch (e) {
      this.logger.error(`Failed to get ANSWERS FOR arenaId ${arenaId}`);
      throw new InternalServerErrorException(
        `Failed to get ANSWERS FOR arenaId ${arenaId}`,
      );
    }
  }

  async getArena(arenaId: string): Promise<any> {
    this.logger.log(`Attempting to get Arena with: ${arenaId}`);

    const key = `arenaId:${arenaId}`;

    try {
      // const currentArena: any = await this.redis
      //   .multi([['send_command', 'JSON.GET', key, '.']])
      //   .exec();

      const currentArena: any = await this.redis.call('JSON.GET', key, '.');

      this.logger.verbose(currentArena);

      // if (currentArena?.hasStarted) {
      //   throw new BadRequestException('The Arena has already started');
      // }

      return JSON.parse(currentArena);
    } catch (e) {
      this.logger.error(`Failed to get arenaId ${arenaId}`);
      throw new InternalServerErrorException(
        `Failed to get arenaId ${arenaId}`,
      );
    }
  }

  async addParticipant({
    arenaId,
    userId,
    name,
  }: AddParticipantData): Promise<Arena> {
    this.logger.log(
      `Attempting to add a participant with userId/name: ${userId}/${name} to arenaId: ${arenaId}`,
    );

    const key = `arenaId:${arenaId}`;
    const participantPath = `.participants.${userId}`;

    try {
      await this.redis.call(
        'JSON.SET',
        key,
        participantPath,
        JSON.stringify(name),
      );

      return this.getArena(arenaId);
    } catch (e) {
      this.logger.error(
        `Failed to add a participant with userId/name: ${userId}/${name} to arenaId: ${arenaId}`,
      );
      throw new InternalServerErrorException(
        `Failed to add a participant with userId/name: ${userId}/${name} to arenaId: ${arenaId}`,
      );
    }
  }

  async removeParticipant(arenaId: string, userId: string): Promise<Arena> {
    this.logger.log(`removing userId: ${userId} from poll: ${arenaId}`);

    const key = `arenaId:${arenaId}`;
    const participantPath = `.participants.${userId}`;

    try {
      await this.redis.call('JSON.DEL', key, participantPath);

      return this.getArena(arenaId);
    } catch (e) {
      this.logger.error(
        `Failed to remove userId: ${userId} from poll: ${arenaId}`,
        e,
      );
      throw new InternalServerErrorException('Failed to remove participant');
    }
  }
}
