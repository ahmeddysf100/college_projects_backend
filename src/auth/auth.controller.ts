//src/auth/auth.controller.ts

import { Body, Controller, Post, UseInterceptors } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { NoFilesInterceptor } from '@nestjs/platform-express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @UseInterceptors(NoFilesInterceptor()) //ahmeeeed you should use interceptors to accept form-data inputs
  async login(@Body() logindto: LoginDto) {
    console.log(logindto);
    return await this.authService.login(logindto);
  }
}
