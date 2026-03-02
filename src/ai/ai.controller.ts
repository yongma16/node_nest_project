import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AiService } from './ai.service';
import { ChatCompletionRequestDto } from './dto/chat-completion.dto';

@ApiTags('AI Chat')
@Controller('v1')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('chat/completions')
  @ApiOperation({ summary: 'Chat Completions' })
  @ApiResponse({ status: 200, description: 'Success' })
  async chatCompletions(@Body() body: ChatCompletionRequestDto): Promise<unknown> {
    return this.aiService.proxyChatCompletion(body);
  }
}
