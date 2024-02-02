import { Module } from '@nestjs/common';
import { StorageService } from './storage.service';
import { StorageController } from './storage.controller';
import { JwtService } from '@nestjs/jwt';

@Module({
  controllers: [StorageController],
  providers: [StorageService, JwtService],
})
export class StorageModule {}
