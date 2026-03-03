import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { AiChatRecord } from './ai-chat-record.entity';
import { AiUser } from './ai-user.entity';

@Injectable()
export class DatabaseValidationService implements OnApplicationBootstrap {
  private readonly logger = new Logger(DatabaseValidationService.name);

  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(AiUser)
    private readonly aiUserRepository: Repository<AiUser>,
    @InjectRepository(AiChatRecord)
    private readonly aiChatRecordRepository: Repository<AiChatRecord>,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    try {
      await this.dataSource.query('SELECT 1');
      const usersCount = await this.aiUserRepository.count();
      const chatCount = await this.aiChatRecordRepository.count();
      this.logger.log(
        `MySQL connection is ready. ai_user table is available (rows: ${usersCount}).`,
      );
      this.logger.log(
        `MySQL connection is ready. ai_chat_record table is available (rows: ${chatCount}).`,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`MySQL validation failed: ${message}`);
      throw error;
    }
  }
}
