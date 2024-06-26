import {
  Controller,
  Get,
  Post,
  Body,
  // Patch,
  Param,
  Delete,
  UseInterceptors,
  UploadedFiles,
  Res,
  UseGuards,
  HttpException,
  HttpStatus,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  Req,
} from '@nestjs/common';
import { StorageService } from './storage.service';
import { CreateStorageDto } from './dto/create-storage.dto';
// import { UpdateStorageDto } from './dto/update-storage.dto';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { multerConfig } from 'src/multer/multer.config';
import { Response } from 'express';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';
import { Roles } from 'src/auth/roles/decorator';
import { Role } from 'src/auth/roles/enum';
import { RolesGuard } from 'src/auth/roles/roles.guard';

@Controller('storage')
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Roles(Role.Admin)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post('question')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'image1', maxCount: 1 },
        { name: 'image2', maxCount: 1 },
      ],
      multerConfig,
    ),
  )
  async insertData(
    @UploadedFiles()
    files: {
      image1?: Express.Multer.File[];
      image2?: Express.Multer.File[];
    },
    @Body() data: CreateStorageDto,
  ) {
    console.log({ image1: files.image1, image2: files.image2 });
    console.log(data);
    if (
      data.Q_text === 'null' &&
      data.answers === 'null' &&
      data.explanationText === 'null' &&
      data.correctAnswer === 'null'
    ) {
      throw new HttpException(
        'you can not send empety data',
        HttpStatus.BAD_REQUEST,
      );
    } else {
      //check if images already exist in db
      const image11 = files.image1 ? files.image1[0].filename : null;
      const image22 = files.image2 ? files.image2[0].filename : null;
      const checkImages = await this.storageService.checkImages(
        image11,
        image22,
      );
      checkImages;

      // Use subject, user, quiz, question, and answer as objects
      const created_or_found_subject =
        await this.storageService.findORcreateSubject(data);

      const foundUser = await this.storageService.findUser(data);

      const createQuiz = await this.storageService.createQuiz(
        foundUser.id,
        data,
        created_or_found_subject.id,
      );

      const createdQuestion = await this.storageService.createQuestion(
        data,
        image11,
        created_or_found_subject.id,
        createQuiz.id,
      );

      let createdAnswers = [];
      // console.log(JSON.parse(data.answers));
      if (data.answers && data.answers !== 'null') {
        const answersTostring = JSON.parse(data.answers);
        createdAnswers = await Promise.all(
          answersTostring.map(
            async (answer: { A_Text: string; isCorrect: string }) => {
              return this.storageService.createAnswer(
                createdQuestion.id,
                answer.A_Text,
                image22,
                answer.isCorrect,
              );
            },
          ),
        );
      }

      const answerExplanation = await this.storageService.createExplanation(
        data,
        createdQuestion.id,
        image22,
      );

      return JSON.stringify(
        {
          created_or_found_subject,
          foundUser,
          createQuiz,
          createdQuestion,
          createdAnswers,
          answerExplanation,
        },
        null,
        2,
      );
    }
  }

  // @Roles(Role.Admin)
  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Get('role')
  // async fi(@Req() req: any, @Res() res: any) {
  //   return await res.status(HttpStatus.OK).json(req.user);
  // }

  @Get('questions')
  async findAll() {
    return await this.storageService.findAll();
  }

  @Roles(Role.Admin)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('getBySubject/:id')
  findOne(@Param('id') id: string) {
    return this.storageService.findBySubject(id);
  }

  @Roles(Role.Admin)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('getOneQuesion/:id')
  findOneQuestion(@Param('id') id: string) {
    return this.storageService.findOneQuestion(+id);
  }

  // @Roles(Role.User)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('getImage/:imagePath')
  async getImage(@Param('imagePath') filename: string, @Res() res: Response) {
    try {
      return res.sendFile(filename, { root: 'uploads' });
    } catch (error) {
      console.error('Error sending file:', error);
      // Handle the error and send an appropriate response
      return res.status(500).send('Internal Server Error');
    }
  }

  // @Roles(Role.Admin)
  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Patch(':id')
  // @UseGuards(JwtAuthGuard)
  // update(@Param('id') id: string, @Body() updateStorageDto: UpdateStorageDto) {
  //   return this.storageService.update(+id, updateStorageDto);
  // }

  @Roles(Role.Admin)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string) {
    return this.storageService.remove(+id);
  }
}
