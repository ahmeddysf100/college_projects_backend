import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { UpdateQuizDto } from './dto/update-quiz.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { PrismaClient } from '@prisma/client';
import { take } from 'rxjs';

@Injectable()
export class QuizService {
  constructor(private prisma: PrismaService) {}

  // create(createQuizDto: CreateQuizDto) {
  //   return 'This action adds a new quiz';
  // }

  // findAll() {
  //   return `This action returns all quiz`;
  // }

  async findOne(count: number, difficulty: number) {
    try {
      const find = await this.prisma.question.findMany({
        include: {
          answers: true,
          AnswerExplanation: true,
        },
        where: {
          Quiz: {
            level: difficulty.toString(),
          },
        },
        orderBy: {
          id: 'asc',
        },
      });
      if (find.length === 0) {
        return new HttpException(
          `quistions not found with COUNT: ${count} and DIFFICULTY: ${difficulty}`,
          HttpStatus.NOT_FOUND,
        );
      }

      // Randomize the array using the Fisher-Yates (Knuth) Shuffle algorithm
      function shuffleArray(array: any[]) {
        return array.slice().sort(() => Math.random() - 0.5);
      }

      // Create a new variable with the randomized array
      const randomizedQuestions = shuffleArray(find).slice(0, count);

      return JSON.stringify(randomizedQuestions, null, 2);
    } catch (error) {
      return error;
    }
    // const find = await this.prisma.$queryRaw`SELECT q.*, a.*, ae.*
    // FROM "Question" q
    // JOIN "Answer" a ON "q"."id" = "a"."questionId"
    // JOIN "AnswerExplanation" ae ON "q"."id" = "ae"."questionId"
    // ORDER BY RANDOM()
    // LIMIT ${count}`;
  }

  update(id: number, updateQuizDto: UpdateQuizDto) {
    return `This action updates a #${id} quiz`;
  }

  remove(id: number) {
    return `This action removes a #${id} quiz`;
  }
}
