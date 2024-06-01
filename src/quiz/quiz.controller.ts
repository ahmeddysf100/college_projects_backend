import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { QuizService } from './quiz.service';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { UpdateQuizDto } from './dto/update-quiz.dto';

@Controller('quiz')
export class QuizController {
  constructor(private readonly quizService: QuizService) {}

  // @Post()
  // create(@Body() createQuizDto: CreateQuizDto) {
  //   return this.quizService.create(createQuizDto);
  // }

  // @Get()
  // findAll() {
  //   return this.quizService.findAll();
  // }

  @Get('/:count/:difficulty/:subject')
  async findOne(
    @Param('count') count: string,
    @Param('difficulty') difficulty: string,
    @Param('subject') subject: string,
  ) {
    console.log('quiz', { count, difficulty, subject });
    return await this.quizService.findOne(+count, +difficulty, subject);
  }

  // @Patch(':id')
  // update(@Param('id') id: string, @Body() updateQuizDto: UpdateQuizDto) {
  //   return this.quizService.update(+id, updateQuizDto);
  // }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.quizService.remove(+id);
  }
}
