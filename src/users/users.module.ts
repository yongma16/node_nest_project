import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiUser } from './ai-user.entity';
import { AiChatRecord } from './ai-chat-record.entity';
import { SystemPromptConfig } from './system-prompt-config.entity';
import { DatabaseValidationService } from './database-validation.service';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { SystemPromptConfigService } from './system-prompt-config.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([AiUser, AiChatRecord, SystemPromptConfig]),
  ],
  controllers: [UsersController],
  providers: [UsersService, DatabaseValidationService, SystemPromptConfigService],
  exports: [UsersService, SystemPromptConfigService],
})
export class UsersModule {}
