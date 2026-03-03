import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { AiController } from './ai.controller';
import { AiService } from './models/openai/ai.service';
import { KimiService } from './models/kimi/kimi.service';
import { StepfunService } from './models/stepfun/stepfun.service';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [HttpModule, ConfigModule, UsersModule],
  controllers: [AiController],
  providers: [AiService, KimiService, StepfunService],
})
export class AiModule {}
