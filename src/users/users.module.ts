import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiUser } from './ai-user.entity';
import { AiChatRecord } from './ai-chat-record.entity';
import { DatabaseValidationService } from './database-validation.service';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [TypeOrmModule.forFeature([AiUser, AiChatRecord])],
  controllers: [UsersController],
  providers: [UsersService, DatabaseValidationService],
  exports: [UsersService],
})
export class UsersModule {}
