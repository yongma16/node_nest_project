import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { AiController } from './ai.controller';
import { AiService } from './models/openai/ai.service';
import { KimiService } from './models/kimi/kimi.service';

@Module({
  imports: [HttpModule, ConfigModule],
  controllers: [AiController],
  providers: [AiService, KimiService],
})
export class AiModule {}
