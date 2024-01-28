import {
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { CreateStorageDto } from './dto/create-storage.dto';
// import { UpdateStorageDto } from './dto/update-storage.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import * as fs from 'fs/promises';

@Injectable()
export class StorageService {
  constructor(private prisma: PrismaService) {}

  async checkImages(Q_imageUrl: string, A_imageUrl: string) {
    try {
      // Check if the Q_imageUrl already exists in the database
      let existingQuestion = null;
      if (Q_imageUrl) {
        existingQuestion = await this.prisma.question.findFirst({
          where: {
            Q_imageUrl: Q_imageUrl,
          },
        });
      }

      let existingAnswer = null;
      if (A_imageUrl) {
        existingAnswer = await this.prisma.answerExplanation.findFirst({
          where: {
            A_imageUrl: A_imageUrl,
          },
        });
      }
      console.log({ q: existingQuestion, a: existingAnswer });

      if (existingQuestion && existingAnswer) {
        // If the Q_imageUrl already exists, throw an error
        throw new HttpException(
          `The image with name ${Q_imageUrl} AND ${A_imageUrl}  already exists in the database.`,
          HttpStatus.CONFLICT, // You can choose an appropriate status code
        );
      } else if (existingQuestion) {
        throw new HttpException(
          `The image with name ${Q_imageUrl}  already exists in the database.`,
          HttpStatus.CONFLICT, // You can choose an appropriate status code
        );
      } else if (existingAnswer) {
        throw new HttpException(
          `The image with name ${A_imageUrl}  already exists in the database.`,
          HttpStatus.CONFLICT, // You can choose an appropriate status code
        );
      }
    } catch (error) {
      // Handle other errors
      throw new HttpException(
        `Error creating question: ${error.message}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async findORcreateSubject(createStorageDto: CreateStorageDto) {
    try {
      const find = await this.prisma.subject.findUnique({
        where: {
          subject_name: createStorageDto.subject_name,
        },
      });

      if (!find) {
        // throw new HttpException(
        //   `Subject ${createStorageDto.subject_name} not found`,
        //   HttpStatus.NOT_FOUND,
        // );
        return await this.prisma.subject.create({
          data: {
            subject_name: createStorageDto.subject_name,
          },
        });
      }

      return find;
    } catch (error) {
      throw new HttpException(
        `Error finding subject: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findUser(createStorageDto: CreateStorageDto) {
    try {
      const find = await this.prisma.user.findUnique({
        where: {
          email: createStorageDto.email,
        },
      });

      if (!find) {
        throw new HttpException(
          `user with email: ${createStorageDto.email} not found`,
          HttpStatus.NOT_FOUND,
        );
      }
      delete find.password;
      return find;
    } catch (error) {
      throw new HttpException(
        `Error finding user: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async createQuiz(
    userID: number,
    createStorageDto: CreateStorageDto,
    subjectID: number,
  ) {
    try {
      const found = await this.prisma.quiz.findFirst({
        where: {
          level: createStorageDto.level,
          type: createStorageDto.type,
        },
      });
      if (!found) {
        return await this.prisma.quiz.create({
          data: {
            level: createStorageDto.level,
            type: createStorageDto.type,
            userId: userID,
            subjectId: subjectID,
          },
        });
      }
      return found;
    } catch (error) {
      throw new HttpException(
        `Error finding quiz: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async createQuestion(
    createStorageDto: CreateStorageDto,
    Q_imageUrl: string,
    subId: number,
    quizId: number,
  ) {
    try {
      let Q_textV2 = createStorageDto.Q_text;
      if (createStorageDto.explanationText === 'null') {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        Q_textV2 = null;
      }

      // Insert the question if the Q_imageUrl is unique
      const createdQuestion = await this.prisma.question.create({
        data: {
          Q_imageUrl: Q_imageUrl,
          Q_text: Q_textV2,
          correctAnswer: createStorageDto.correctAnswer,
          subjectId: subId,
          quizId: quizId,
        },
      });

      return createdQuestion;
    } catch (error) {
      // Handle other errors
      throw new HttpException(
        `Error creating question: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async createAnswer(
    quesId: number,
    answer_text: string,
    imageUrl: string,
    isCorrect: string,
  ) {
    if (isCorrect === 'true') {
      isCorrect = 'true';
    } else {
      isCorrect = '';
    }
    if (!answer_text) {
      answer_text = ' ';
    }
    try {
      const find = await this.prisma.answer.create({
        data: {
          A_text: answer_text,
          isCorrect: Boolean(isCorrect),
          questionId: quesId,
        },
      });

      if (!find) {
        throw new HttpException(
          `image with name: ${imageUrl} did not upload`,
          HttpStatus.NOT_FOUND,
        );
      }

      return find;
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          //p is capital
          throw new ForbiddenException(
            `this ${imageUrl} belong to another columm`,
          );
        }
      }
      throw error;
    }
  }

  async createExplanation(
    createStorageDto: CreateStorageDto,
    quesId: number,
    A_imageUrl: string,
  ) {
    let explanationTextV2 = createStorageDto.explanationText;
    if (createStorageDto.explanationText === 'null') {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      explanationTextV2 = null;
    }
    try {
      const create = await this.prisma.answerExplanation.create({
        data: {
          explanationText: explanationTextV2,
          A_imageUrl: A_imageUrl,
          questionId: quesId,
        },
      });
      return create;
    } catch (error) {
      throw new HttpException(
        `Error finding answerExplanation: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findAll() {
    try {
      const find = await this.prisma.question.findMany({
        include: {
          answers: true,
          AnswerExplanation: true,
        },
        orderBy: {
          id: 'asc',
        },
      });
      if (find.length === 0) {
        return new HttpException('quistions not found', HttpStatus.NOT_FOUND);
      }
      return find;
    } catch (error) {
      return error;
    }
  }

  async findBySubject(id: string) {
    try {
      const findOne = await this.prisma.subject.findUnique({
        where: {
          subject_name: id,
        },
        include: {
          questions: {
            include: {
              answers: true,
              AnswerExplanation: true,
            },
          },
        },
      });
      return findOne;
    } catch (error) {
      return new HttpException(`this ${id} not found`, HttpStatus.NOT_FOUND);
    }
  }

  // update(id: number, updateStorageDto: UpdateStorageDto) {
  //   return `This action updates a #${id} storage`;
  // }

  async remove(id: number) {
    try {
      // Fetch question data with related records
      const find = await this.prisma.question.findUnique({
        where: {
          id: id,
        },
        include: {
          answers: true,
          AnswerExplanation: true,
        },
      });

      if (!find) {
        throw new HttpException(
          `Error: Question with id ${id} not found`,
          HttpStatus.NOT_FOUND,
        );
      }

      // Delete related files
      const qImageDeleteMessage = await this.deleteFile(
        `uploads/${find.Q_imageUrl}`,
      );
      let aImageDeleteMessage = '';

      if (find.AnswerExplanation && find.AnswerExplanation[0]) {
        aImageDeleteMessage = await this.deleteFile(
          `uploads/${find.AnswerExplanation[0].A_imageUrl}`,
        );
      }

      // Delete records from related tables
      await this.prisma.answer.deleteMany({
        where: {
          questionId: id,
        },
      });

      await this.prisma.answerExplanation.deleteMany({
        where: {
          questionId: id,
        },
      });

      // Delete the question
      const deleteQuestion = await this.prisma.question.delete({
        where: {
          id: id,
        },
      });

      return {
        deletedQuestion: deleteQuestion,
        qImageDeleteMessage,
        aImageDeleteMessage,
      };
    } catch (error) {
      throw new HttpException(
        `Error: Deleting question with id ${id}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async deleteFile(filePath: string): Promise<string> {
    try {
      await fs.unlink(filePath);
      console.log(`File deleted successfully: ${filePath}`);
      return `File deleted successfully: ${filePath}`;
    } catch (error) {
      const errorMessage = `Error deleting file ${filePath}: ${error.message}`;
      console.error(errorMessage);
      return errorMessage;
    }
  }

  async findOneQuestion(id: number) {
    try {
      const find = await this.prisma.question.findUnique({
        where: {
          id: id,
        },
        include: {
          answers: true,
          AnswerExplanation: true,
          Subject: true,
          Quiz: true,
        },
      });
      if (!find) {
        return new HttpException(
          `this question ${id} not found`,
          HttpStatus.NOT_FOUND,
        );
      }

      return JSON.stringify(find, null, 2);
    } catch (error) {
      return new HttpException(
        `error in findOneQuestion in backend server`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
