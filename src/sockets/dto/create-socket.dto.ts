import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsString,
  Length,
} from 'class-validator';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Question } from '../types/arena.type';
import { JsonArray } from '@prisma/client/runtime/library';

export class CreateSocketDto {
  @IsString()
  @IsNotEmpty()
  message: string;
}

export class CreateArenaDto {
  @IsNotEmpty()
  arenaQear: JsonArray;

  @IsNumber()
  @IsNotEmpty()
  roundTime: number;

  @IsNumber()
  @IsNotEmpty()
  numOfPlayers: number;

  @IsString()
  @IsNotEmpty()
  author: string;

  @IsBoolean()
  @IsNotEmpty()
  isOpen: boolean;
}

export class JoinArenaDto {
  @IsString()
  @Length(6, 6)
  arenaId: string;

  @IsString()
  @Length(1, 25)
  name: string;
}
