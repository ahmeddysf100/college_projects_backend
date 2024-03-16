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
import { RedisModule } from '@nestjs-modules/ioredis';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    RedisModule.forRoot({
      type: 'single',
      url: 'redis://localhost:6379',
      // url: 'redis://172.17.0.2:6379', do not work
    }),
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
