import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AiService } from './models/openai/ai.service';
import { KimiService } from './models/kimi/kimi.service';
import { ChatCompletionRequestDto } from './models/openai/dto/chat-completion.dto';
import { KimiChatRequestDto, KimiChatResponseDto } from './models/kimi/dto/kimi-chat.dto';
import { MultiTurnChatRequestDto, MultiTurnChatResponseDto } from './models/kimi/dto/multi-turn-chat.dto';
import { UsersService } from '../users/users.service';

@ApiTags('AI Chat')
@Controller('v1')
export class AiController {
  constructor(
    private readonly aiService: AiService,
    private readonly kimiService: KimiService,
    private readonly usersService: UsersService,
  ) {}

  @Post('chat/completions')
  @ApiOperation({ summary: 'Chat Completions (通用)' })
  @ApiResponse({ status: 200, description: 'Success' })
  async chatCompletions(@Body() body: ChatCompletionRequestDto): Promise<unknown> {
    const startTime = Date.now();
    const response = (await this.aiService.proxyChatCompletion(body)) as Record<string, unknown>;
    const elapsedMs = Date.now() - startTime;

    await this.recordChatIfPossible({
      userId: body.userId,
      sessionId: body.sessionId ?? this.toStringValue(response.id),
      userQueryContent: this.extractLastUserMessageContent(body.messages),
      aiReplyContent: this.extractOpenAiReply(response),
      aiModelType: this.toStringValue(response.model) || body.model || 'unknown',
      responseTimeMs: elapsedMs,
    });

    return response;
  }

  @Post('kimi/chat')
  @ApiOperation({ summary: 'Kimi Chat Completions (单次对话)' })
  @ApiResponse({ status: 200, description: 'Success', type: KimiChatResponseDto })
  async kimiChat(@Body() body: KimiChatRequestDto): Promise<KimiChatResponseDto> {
    const startTime = Date.now();
    const response = await this.kimiService.chatCompletion(body);
    const elapsedMs = Date.now() - startTime;

    await this.recordChatIfPossible({
      userId: body.userId,
      sessionId: body.sessionId ?? response.id,
      userQueryContent: this.extractLastUserMessageContent(body.messages),
      aiReplyContent: response.choices?.[0]?.message?.content ?? '',
      aiModelType: response.model || body.model,
      responseTimeMs: elapsedMs,
    });

    return response;
  }

  @Post('kimi/multi-turn-chat')
  @ApiOperation({ summary: 'Kimi Multi-turn Chat (多轮对话)' })
  @ApiResponse({ status: 200, description: 'Success', type: MultiTurnChatResponseDto })
  async kimiMultiTurnChat(@Body() body: MultiTurnChatRequestDto): Promise<MultiTurnChatResponseDto> {
    const startTime = Date.now();
    const { response, updatedHistory } = await this.kimiService.multiTurnChat(
      body.message,
      body.history || [],
      body.model || 'moonshot-v1-8k',
      body.systemPrompt
    );
    const elapsedMs = Date.now() - startTime;

    const result: MultiTurnChatResponseDto = {
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

    await this.recordChatIfPossible({
      userId: body.userId,
      sessionId: body.sessionId ?? response.id,
      userQueryContent: body.message,
      aiReplyContent: result.reply,
      aiModelType: result.model || body.model || 'unknown',
      responseTimeMs: elapsedMs,
    });

    return result;
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

  private async recordChatIfPossible(payload: {
    userId?: number;
    sessionId?: string;
    userQueryContent: string;
    aiReplyContent: string;
    aiModelType: string;
    responseTimeMs: number;
  }): Promise<void> {
    if (!payload.userId) {
      return;
    }

    const sessionId = payload.sessionId?.trim() || `session_${Date.now()}`;
    if (!payload.userQueryContent.trim() || !payload.aiReplyContent.trim()) {
      return;
    }

    await this.usersService.createChatRecord({
      userId: payload.userId,
      sessionId,
      userQueryContent: payload.userQueryContent,
      aiReplyContent: payload.aiReplyContent,
      aiModelType: payload.aiModelType,
      responseTimeMs: payload.responseTimeMs,
    });
  }

  private extractLastUserMessageContent(
    messages: Array<{ role: string; content: unknown }> | undefined,
  ): string {
    if (!messages || messages.length === 0) {
      return '';
    }

    for (let i = messages.length - 1; i >= 0; i -= 1) {
      const message = messages[i];
      if (message.role === 'user') {
        return this.toStringValue(message.content);
      }
    }

    return this.toStringValue(messages[messages.length - 1]?.content);
  }

  private extractOpenAiReply(response: Record<string, unknown>): string {
    const choices = Array.isArray(response.choices) ? response.choices : [];
    const firstChoice = choices[0] as
      | { message?: { content?: unknown } }
      | undefined;
    const content = firstChoice?.message?.content;
    return this.toStringValue(content);
  }

  private toStringValue(value: unknown): string {
    if (typeof value === 'string') {
      return value;
    }
    if (Array.isArray(value)) {
      return value
        .map((item) => {
          if (typeof item === 'string') {
            return item;
          }
          if (item && typeof item === 'object' && 'text' in item) {
            const text = (item as { text?: unknown }).text;
            return typeof text === 'string' ? text : JSON.stringify(item);
          }
          return JSON.stringify(item);
        })
        .join(' ');
    }
    if (value && typeof value === 'object') {
      return JSON.stringify(value);
    }
    if (typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }
    return '';
  }
}
