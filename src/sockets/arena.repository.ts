import { InjectRedis } from '@nestjs-modules/ioredis';
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { CreateArenaDto } from './dto/create-socket.dto';
import {
  AddNominationData,
  AddParticipantData,
  Solver,
  StoredAnswers,
} from './types/types';
import { ArenaGear, Nomination } from 'shared';
import { Arena, CreateArena } from './types/createArena';

@Injectable()
export class ArenaRepository {
  [x: string]: any;
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
      // arenaGear: createArenaDto.arenaGear,
      numOfPlayers: createArenaDto.numOfPlayers,
      adminId: userId,
      hasStarted: createArenaDto.hasStarted,
      roundTime: createArenaDto.roundTime,
      participants: {},
      nominations: {},
      rankings: {},
      results: {},
      totalStages: createArenaDto.arenaGear.length,
      currentStage: 0,
    };
    this.logger.log(
      `Creating new Arena: ${JSON.stringify(initialArena)} with TTL ${
        this.ttl
      }`,
    );

    const key = `arenaId:${arenaId}`;

    await this.storeAnswers(createArenaDto.arenaGear as any, arenaId);
    this.logger.fatal(createArenaDto.arenaGear.length);
    // Clean up createArenaDto.arenaGear
    // Assuming createArenaDto.arenaGear is defined and contains the array of questions

    // Clean up the arenaGear array
    createArenaDto.arenaGear.forEach((question: any) => {
      // Determine the question type based on the presence of correctAnswer
      if (question.correctAnswer) {
        question.type = 'single';
        question.answers = null;
      } else {
        // Modify the answers array
        question.answers = question.answers.map((answer) => ({
          A_text: answer.A_text,
        }));
        question.type = 'multiple';
      }
      // reset the correctAnswer and AnswerExplanation property
      question.correctAnswer = null;
      question.AnswerExplanation = null;
    });
    this.logger.log(`newGear:\n${createArenaDto.arenaGear}`);
    await this.storeGear(createArenaDto.arenaGear, arenaId);
    try {
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

  async storeGear(questions: any[], arenaId: string): Promise<void> {
    this.logger.debug(
      `attempting to store questions to Gears:arenaId:${arenaId}`,
    );
    try {
      const key = `Gears:arenaId:${arenaId}`;
      await this.redis
        .multi([
          ['send_command', 'JSON.SET', key, '.', JSON.stringify(questions)],
          ['expire', key, this.ttl],
        ])
        .exec();
    } catch (e) {
      this.logger.error(
        `Failed to store GEAR ${JSON.stringify(questions)}\n${e}`,
      );
      throw new InternalServerErrorException(
        `Failed to store GEAR ${JSON.stringify(questions)}`,
      );
    }
  }

  async getGear(arenaId: string): Promise<any> {
    try {
      const currentStage = await this.redis.call(
        'JSON.GET',
        `arenaId:${arenaId}`,
        `.currentStage`,
      );
      const totalStages = await this.redis.call(
        'JSON.GET',
        `arenaId:${arenaId}`,
        `.totalStages`,
      );

      if (currentStage < totalStages) {
        this.logger.debug(
          `currentStages:${currentStage} <= totalStages:${totalStages}`,
        );
        await this.redis.call(
          'JSON.NUMINCRBY',
          `arenaId:${arenaId}`,
          `.currentStage`,
          1,
        );
        this.logger.debug(`increment currentStage:${currentStage} by 1`);
        this.logger.debug(
          `attempting to GET question_num:${currentStage} from Gears:arenaId:${arenaId}`,
        );
        return await this.redis.call(
          'JSON.GET',
          `Gears:arenaId:${arenaId}`,
          `.[${currentStage}]`,
        );
      } else {
        this.logger.debug(
          `currentStages:${currentStage} >>> totalStages:${totalStages}`,
        );
        return 'FINSHED';
      }
    } catch (e) {
      this.logger.error(`Failed to GET GEAR \n${e}`);
      throw new InternalServerErrorException(`Failed to GET GEAR\n${e}`);
    }
  }

  async storeAnswers(questions: ArenaGear[], arenaId: string): Promise<void> {
    const answerObj = {}; // Create an object to store each answer
    for (const question of questions) {
      // Check if the question has a correct answer
      if (question.correctAnswer) {
        answerObj[`Q_id:${question.id}`] = {
          text: question.correctAnswer,
          solved: false,
        };
      }

      // Check if the question has multiple answers
      if (question.answers.length > 0) {
        const correctAnswers = question.answers.filter((a) => a.isCorrect); // Filter correct answers
        // console.warn('wweeww', correctAnswers);
        answerObj[`Q_id:${question.id}`] = {
          text: correctAnswers[0].A_text,
          solved: false,
        };
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

  async getAnswers(arenaId: string, Q_id: number): Promise<StoredAnswers> {
    this.logger.log(`Attempting to get Answers for Arena: ${arenaId}`);
    const key = `answers:arenaId:${arenaId}`;
    try {
      // const currentArena: any = await this.redis
      //   .multi([['send_command', 'JSON.GET', key, '.']])
      //   .exec();

      const currentAnswers: any = await this.redis.call(
        'JSON.GET',
        key,
        `.Q_id:${Q_id}`,
      );

      // this.logger.verbose(currentAnswers);

      // if (currentAnswers?.hasStarted) {
      //   throw new BadRequestException('The Arena has already started');
      // }

      return JSON.parse(currentAnswers);
    } catch (e) {
      this.logger.error(`Failed to get ANSWERS FOR arenaId ${arenaId}`, e);
      throw new InternalServerErrorException(
        `Failed to get ANSWERS FOR arenaId ${arenaId} \n${e}`,
      );
    }
  }

  async getArena(arenaId: string): Promise<Arena> {
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
  }: AddParticipantData): Promise<Arena | string> {
    this.logger.log(
      `Attempting to add a participant with userId/name: ${userId}/${name} to arenaId: ${arenaId}`,
    );

    const key = `arenaId:${arenaId}`;
    const participantPath = `.participants.${userId}`;
    try {
      const isParticipant = await this.isParticipant(arenaId, userId, name);

      if (isParticipant === true) {
        return `user with id/name:${userId}/${name} REJIONED`;
      }

      const started = await this.isArenaStarted(arenaId);

      if (started) {
        this.logger.error(started);
        return `started`;
      }
      await this.setRankings(arenaId, userId, name);

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

  async isParticipant(arenaId: string, userId: string, name: string) {
    try {
      this.logger.debug(
        `attemption to cheack if user is participant id/name:${userId}/${name}`,
      );
      const key = `arenaId:${arenaId}`;
      const path = `..${userId}`;
      const x = await this.redis.call('JSON.TYPE', key, path);
      this.logger.log(`user:${userId}//${name} is ${x}`);

      if (x === null) {
        return false;
      } else {
        this.logger.log(`user:${userId}//${name} is REJOINED`);
        return true;
      }
    } catch (e) {}
  }

  async isArenaStarted(arenaId: string): Promise<boolean> {
    this.logger.log(`attempting to cheack is arena STARTED:${arenaId}`);
    try {
      //default value is false
      const state = (await this.redis.call(
        'JSON.GET',
        `arenaId:${arenaId}`,
        `.hasStarted`,
      )) as string;
      this.logger.fatal(`state of start:${state}!!!!!!!!!!`);
      return state === 'true' ? true : false;
      // if (state) {
      //   this.logger.fatal('started!!!!!!!!!!');
      //   return true;
      // } else {
      //   return false;
      // }
    } catch (e) {
      this.logger.error(
        `Failed to to cheack is arena started:${arenaId}\n${e}`,
      );
      throw new InternalServerErrorException(
        `Failed to to chek is arena started:${arenaId}\n${e}`,
      );
    }
  }

  async setRankings(arenaId: string, userId: string, name: string) {
    try {
      this.logger.debug(
        `attempting to set RANKING to arenaId:${arenaId} / userId:${userId}/name:${name}`,
      );

      const key = `arenaId:${arenaId}`;
      const path = `.rankings.${name}`;
      const x = await this.redis.call('JSON.TYPE', key, path);
      // this.logger.fatal(`aaaaaaaaaa ${x}`);
      if (x === null) {
        this.logger.debug(
          `NO intial value attempting to set .rankings.${name} to 0`,
        );
        await this.redis.call('JSON.SET', key, path, 0);
      }
    } catch (e) {
      this.logger.error(
        ` faild in SETTING ranking to arenaId:${arenaId} / userId:${userId} \nERROR:${e}`,
      );
    }
  }

  async removeParticipant(
    arenaId: string,
    userId: string,
  ): Promise<Arena | boolean> {
    const key = `arenaId:${arenaId}`;
    const participantPath = `.participants.${userId}`;

    try {
      const start = await this.isArenaStarted(arenaId);
      if (start === true) {
        return false;
      } else {
        this.logger.debug(`removing userId: ${userId} from poll: ${arenaId}`);
        await this.redis.call('JSON.DEL', key, participantPath);
        return this.getArena(arenaId);
      }
    } catch (e) {
      this.logger.error(
        `Failed to remove userId: ${userId} from poll: ${arenaId}`,
        e,
      );
      throw new InternalServerErrorException('Failed to remove participant');
    }
  }

  async addNomination({
    arenaId,
    nominationId,
    nomination,
  }: AddNominationData) {
    this.logger.log(
      `Attempting to add a nomination with nominationID/nomination: ${nominationId}/${nomination.text} to pollID: ${arenaId}`,
    );
    // if arena did not start you can not nominate
    const isStarted = await this.isArenaStarted(arenaId);
    if (isStarted === true) {
      // if answer is solved we do not have to cheack if is correct or not
      const isSolved = await this.isSolved(arenaId, nomination.Q_id);
      if (isSolved === false) {
        await this.NominationToDB({ arenaId, nominationId, nomination });

        const answer = await this.getAnswers(arenaId, nomination.Q_id);
        if (answer.text === nomination.text) {
          this.logger.warn(answer.text + '  ' + nomination.text);

          // update ranking for user by incr by 1
          await this.updateRankings(nomination.userId, arenaId);

          // return next question because the answer is right to switch question for players
          return await this.saveSolver(
            arenaId,
            nomination,
            nomination.Q_id,
            nominationId,
          );
        }
      }
    } else if (isStarted === false) {
      throw new BadRequestException(
        `you can not send answer becuase arenaId:${arenaId} did not START!!!`,
      );
    }
  }

  async updateRankings(userId: string, arenaId: string) {
    this.logger.log(
      `Attempting to add a rankings with userId/arenaId: ${userId}/${arenaId}`,
    );
    try {
      const key = `arenaId:${arenaId}`;
      const path = `.rankings.${userId}`;

      //increment it by 1
      await this.redis.call('JSON.NUMINCRBY', key, path, 1);
    } catch (e) {
      this.logger.error(
        `Failed to set RANK:with userId/arenaId: ${userId}/${arenaId} ERROR:${e}`,
      );
    }
  }

  async isSolved(arenaId: string, Q_id: number): Promise<boolean> {
    try {
      this.logger.debug(
        ` attempting to cheack if question:${Q_id} already solved`,
      );
      const key = `answers:arenaId:${arenaId}`;
      //set solved to true to make sure only one user submite answer
      const solved = (await this.redis.call(
        'JSON.GET',
        key,
        `Q_id:${Q_id}.solved`,
      )) as string;
      this.logger.fatal(`answer for Q_id:${Q_id} is:${solved}`);
      return solved === 'true' ? true : false;
    } catch (e) {}
  }

  async saveSolver(
    arenaId: string,
    nomination: Nomination,
    Q_id: number,
    nominationId: string,
  ) {
    delete nomination.Q_id;
    delete nomination.text;
    const key = `answers:arenaId:${arenaId}`;
    try {
      //set solved to true to make sure only one user submite answer
      await this.redis.call(
        'JSON.SET',
        key,
        `Q_id:${Q_id}.solved`,
        JSON.stringify(true),
      );
      // add info of iser who sloved the question
      await this.redis.call(
        'JSON.SET',
        key,
        `.Q_id:${Q_id}.${nominationId}`, // [index] is the index element of array of `answers:arenaId:${arenaId}`
        JSON.stringify(nomination),
      );
      return await this.getGear(arenaId);
    } catch (e) {
      this.logger.error(
        `Failed to set SOLVER:${JSON.stringify(nomination, null, 2)} arenaId ${arenaId} ERROR:${e}`,
      );
      throw new InternalServerErrorException(
        `Failed to get arenaId ${arenaId}`,
      );
    }
  }

  async NominationToDB({
    arenaId,
    nominationId,
    nomination,
  }: AddNominationData): Promise<Arena> {
    this.logger.log(
      `Attempting to add a nomination FOR DB with nominationID/nomination: ${nominationId}/${nomination.text} to arenaId: ${arenaId}`,
    );

    const key = `arenaId:${arenaId}`;
    const nominationPath = `.nominations.${nominationId}`;

    try {
      await this.redis.call(
        'JSON.SET',
        key,
        nominationPath,
        JSON.stringify(nomination),
      );

      return this.getArena(arenaId);
    } catch (e) {
      this.logger.error(
        `Failed to add a nomination with nominationID/text: ${nominationId}/${nomination.text} to arenaId: ${arenaId}`,
        e,
      );
      throw new InternalServerErrorException(
        `Failed to add a nomination with nominationID/text: ${nominationId}/${nomination.text} to arenaId: ${arenaId}`,
      );
    }
  }

  async removeNomination(
    arenaId: string,
    nominationId: string,
  ): Promise<Arena> {
    const key = `arenaId:${arenaId}`;
    const nominationPath = `.nominations.${nominationId}`;

    const key2 = `answers:arenaId:${arenaId}`;
    const nominationPath2 = `.*.${nominationId}`;

    try {
      this.logger.log(
        `removing nominationID: ${nominationId} from poll: ${arenaId}`,
      );

      await this.redis.call('JSON.DEL', key, nominationPath);
      await this.redis.call('JSON.DEL', key2, nominationPath2);

      return this.getArena(arenaId);
    } catch (e) {
      this.logger.error(
        `Failed to remove nominationID: ${nominationId} from poll: ${arenaId}`,
        e,
      );

      throw new InternalServerErrorException(
        `Failed to remove nominationID: ${nominationId} from poll: ${arenaId}`,
      );
    }
  }

  async startArena(arenaId: string): Promise<Arena> {
    this.logger.log(`setting hasStarted for arena: ${arenaId}`);

    const key = `arenaId:${arenaId}`;

    try {
      await this.redis.call(
        'JSON.SET',
        key,
        '.hasStarted',
        JSON.stringify(true),
      );

      return this.getGear(arenaId);
    } catch (e) {
      this.logger.error(`Failed set hasStarted for arena: ${arenaId}`, e);
      throw new InternalServerErrorException(
        'The was an error starting the arena',
      );
    }
  }

  async getResult(arenaId: string): Promise<unknown> {
    this.logger.log(`attempting to get RESULT for arena: ${arenaId}`);

    try {
      const arena = await this.getArena(arenaId);
      let temp = [];
      temp = arena.rankings;

      const { key: maxKey, value: maxValue } = Object.entries(temp).reduce(
        (acc, [key, value]) => {
          return value > acc.value ? { key, value } : acc;
        },
        { key: null, value: Number.MIN_SAFE_INTEGER },
      );

      const req = await this.redis.call(
        'JSON.SET',
        `arenaId:${arenaId}`,
        `.results`,
        JSON.stringify({ maxKey: maxKey, maxValue: maxValue }),
      );

      if (req === 'OK') {
        return { maxKey: maxKey, maxValue: maxValue };
      }
    } catch (e) {
      this.logger.error(`Failed getting RESULT for arena: ${arenaId}`, e);
      throw new InternalServerErrorException(
        `Failed getting RESULT for arena: ${arenaId}`,
      );
    }
  }
}
