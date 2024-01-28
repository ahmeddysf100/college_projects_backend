// src/storage/dto/storage.dto.ts

import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

// export class CreateAnswerDto {
//   @IsString()
//   A_Text: string;

//   @IsString()
//   isCorrect: string;
// }

export class CreateStorageDto {
  //////////////subject
  @IsString()
  @IsNotEmpty()
  subject_name: string;

  /////////////user
  @IsNotEmpty()
  @IsString()
  email: string;

  //////////quiz
  @IsNotEmpty()
  @IsString()
  level: string;

  @IsString()
  @IsNotEmpty()
  type: string;

  ///////////question
  @IsOptional()
  @IsString()
  Q_text: string;

  @IsOptional()
  @IsString()
  correctAnswer: string;

  ///////////answers
  @IsOptional()
  @IsString()
  answers: string;

  //////////AnswerExplanation
  @IsOptional()
  @IsString()
  explanationText: string;
}
