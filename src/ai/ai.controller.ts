import { Body, Controller, Post, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AiService } from './models/openai/ai.service';
import { KimiService } from './models/kimi/kimi.service';
import { ChatCompletionRequestDto } from './models/openai/dto/chat-completion.dto';
import { KimiChatRequestDto, KimiChatResponseDto } from './models/kimi/dto/kimi-chat.dto';
import { MultiTurnChatRequestDto, MultiTurnChatResponseDto } from './models/kimi/dto/multi-turn-chat.dto';

@ApiTags('AI Chat')
@Controller('v1')
export class AiController {
  constructor(
    private readonly aiService: AiService,
    private readonly kimiService: KimiService,
  ) {}

  @Post('chat/completions')
  @ApiOperation({ summary: 'Chat Completions (通用)' })
  @ApiResponse({ status: 200, description: 'Success' })
  async chatCompletions(@Body() body: ChatCompletionRequestDto): Promise<unknown> {
    return this.aiService.proxyChatCompletion(body);
  }

  @Post('kimi/chat')
  @ApiOperation({ summary: 'Kimi Chat Completions (单次对话)' })
  @ApiResponse({ status: 200, description: 'Success', type: KimiChatResponseDto })
  async kimiChat(@Body() body: KimiChatRequestDto): Promise<KimiChatResponseDto> {
    return this.kimiService.chatCompletion(body);
  }

  @Post('kimi/multi-turn-chat')
  @ApiOperation({ summary: 'Kimi Multi-turn Chat (多轮对话)' })
  @ApiResponse({ status: 200, description: 'Success', type: MultiTurnChatResponseDto })
  async kimiMultiTurnChat(@Body() body: MultiTurnChatRequestDto): Promise<MultiTurnChatResponseDto> {
    const { response, updatedHistory } = await this.kimiService.multiTurnChat(
      body.message,
      body.history || [],
      body.model || 'moonshot-v1-8k',
      body.systemPrompt
    );

    return {
      reply: response.choices[0]?.message?.content || '',
      history: updatedHistory,
      usage: {
        promptTokens: response.usage.prompt_tokens,
        completionTokens: response.usage.completion_tokens,
        totalTokens: response.usage.total_tokens,
      },
      model: response.model,
      responseId: response.id,
    };
  }

  @Get('kimi/models')
  @ApiOperation({ summary: '获取可用的 Kimi 模型列表' })
  @ApiResponse({ 
    status: 200, 
    description: 'Success',
    schema: {
      type: 'object',
      properties: {
        models: {
          type: 'array',
          items: { type: 'string' }
        }
      }
    }
  })
  getKimiModels(): { models: string[] } {
    return {
      models: this.kimiService.getAvailableModels()
    };
  }
}
