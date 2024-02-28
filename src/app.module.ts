import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { StorageModule } from './storage/storage.module';
import { AuthModule } from './auth/auth.module';
import { APP_GUARD } from '@nestjs/core';
import { RolesGuard } from './auth/roles/roles.guard';
import { JwtService } from '@nestjs/jwt';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { JwtAuthGuard } from './auth/guard/jwt-auth.guard';
import { QuizModule } from './quiz/quiz.module';
import { SocketsModule } from './sockets/sockets.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    UsersModule,
    StorageModule,
    AuthModule,
    QuizModule,
    SocketsModule,
  ],
  providers: [
    {
      // make all endpoints in all app @UseGuards(RolesGuard)
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    // make all endpoints in all app @UseGuards(JwtAuthGuard)
    // {
    //   provide: APP_GUARD,
    //   useClass: JwtAuthGuard,
    // },
    JwtService,
  ],
})
export class AppModule {}
