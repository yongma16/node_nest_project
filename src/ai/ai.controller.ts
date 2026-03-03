import { Body, Controller, Get, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiConsumes } from '@nestjs/swagger';
import { randomUUID } from 'crypto';
import { FileInterceptor } from '@nestjs/platform-express';
import { AiService } from './models/openai/ai.service';
import { KimiService } from './models/kimi/kimi.service';
import { ChatCompletionRequestDto } from './models/openai/dto/chat-completion.dto';
import { StepfunChatRequestDto } from './models/stepfun/dto/stepfun-chat.dto';
import { StepfunImageEditRequestDto } from './models/stepfun/dto/stepfun-image-edit.dto';
import { StepfunImageGenerateRequestDto } from './models/stepfun/dto/stepfun-image-generate.dto';
import { StepfunImageGenerateResponseDto } from './models/stepfun/dto/stepfun-image-generate-response.dto';
import { KimiChatRequestDto, KimiChatResponseDto } from './models/kimi/dto/kimi-chat.dto';
import { MultiTurnChatRequestDto, MultiTurnChatResponseDto } from './models/kimi/dto/multi-turn-chat.dto';
import { KimiImageChatRequestDto } from './models/kimi/dto/kimi-image-chat.dto';
import { KimiImageUrlChatRequestDto } from './models/kimi/dto/kimi-image-url-chat.dto';
import { StepfunService } from './models/stepfun/stepfun.service';
import { UsersService } from '../users/users.service';

@ApiTags('AI Chat')
@Controller('v1')
export class AiController {
  constructor(
    private readonly aiService: AiService,
    private readonly kimiService: KimiService,
    private readonly stepfunService: StepfunService,
    private readonly usersService: UsersService,
  ) {}

  @Post('chat/completions')
  @ApiOperation({ summary: 'Chat Completions (通用)' })
  @ApiResponse({ status: 200, description: 'Success' })
  async chatCompletions(@Body() body: ChatCompletionRequestDto): Promise<unknown> {
    const sessionId = this.resolveSessionId(body.sessionId);
    const startTime = Date.now();
    const response = (await this.aiService.proxyChatCompletion(body)) as Record<string, unknown>;
    const elapsedMs = Date.now() - startTime;

    await this.recordChatIfPossible({
      userId: body.userId,
      sessionId,
      userQueryContent: this.extractLastUserMessageContent(body.messages),
      aiReplyContent: this.extractOpenAiReply(response),
      aiModelType: this.toStringValue(response.model) || body.model || 'unknown',
      responseTimeMs: elapsedMs,
    });

    return {
      ...response,
      sessionId,
    };
  }

  @Post('kimi/chat')
  @ApiOperation({ summary: 'Kimi Chat Completions (单次对话)' })
  @ApiResponse({ status: 200, description: 'Success', type: KimiChatResponseDto })
  async kimiChat(@Body() body: KimiChatRequestDto): Promise<KimiChatResponseDto> {
    const sessionId = this.resolveSessionId(body.sessionId);
    const startTime = Date.now();
    const response = await this.kimiService.chatCompletion(body);
    const elapsedMs = Date.now() - startTime;

    await this.recordChatIfPossible({
      userId: body.userId,
      sessionId,
      userQueryContent: this.extractLastUserMessageContent(body.messages),
      aiReplyContent: response.choices?.[0]?.message?.content ?? '',
      aiModelType: response.model || body.model,
      responseTimeMs: elapsedMs,
    });

    return {
      ...response,
      sessionId,
    };
  }

  @Post('stepfun/chat')
  @ApiOperation({ summary: 'StepFun Chat Completions (阶跃星辰对话)' })
  @ApiResponse({ status: 200, description: 'Success' })
  async stepfunChat(@Body() body: StepfunChatRequestDto): Promise<unknown> {
    const sessionId = this.resolveSessionId(body.sessionId);
    const startTime = Date.now();
    const response = (await this.stepfunService.chatCompletion(body)) as Record<string, unknown>;
    const elapsedMs = Date.now() - startTime;

    await this.recordChatIfPossible({
      userId: body.userId,
      sessionId,
      userQueryContent: this.extractLastUserMessageContent(body.messages),
      aiReplyContent: this.extractOpenAiReply(response),
      aiModelType: this.toStringValue(response.model) || body.model || 'step-1-8k',
      responseTimeMs: elapsedMs,
    });

    return {
      ...response,
      sessionId,
    };
  }

  @Post('stepfun/images/edit')
  @UseInterceptors(FileInterceptor('image'))
  @ApiOperation({ summary: 'StepFun 图片编辑' })
  @ApiResponse({ status: 200, description: 'Success' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['image', 'prompt'],
      properties: {
        image: {
          type: 'string',
          format: 'binary',
          description: '待编辑图片文件',
        },
        userId: {
          type: 'number',
          example: 1,
        },
        sessionId: {
          type: 'string',
          example: 'session_20260303_003',
        },
        model: {
          type: 'string',
          example: 'step-1x-edit',
        },
        prompt: {
          type: 'string',
          example: '变成一只英短猫',
        },
        cfg_scale: {
          type: 'number',
          example: 10,
        },
        steps: {
          type: 'integer',
          example: 20,
        },
        seed: {
          type: 'integer',
          example: 1,
        },
        response_format: {
          type: 'string',
          enum: ['url', 'b64_json'],
          example: 'url',
        },
      },
    },
  })
  async stepfunImageEdit(
    @UploadedFile() image: Express.Multer.File,
    @Body() body: StepfunImageEditRequestDto,
  ): Promise<unknown> {
    const sessionId = this.resolveSessionId(body.sessionId);
    const startTime = Date.now();
    const response = (await this.stepfunService.imageEdit(body, image)) as Record<string, unknown>;
    const elapsedMs = Date.now() - startTime;

    await this.recordChatIfPossible({
      userId: body.userId,
      sessionId,
      userQueryContent: body.prompt || 'image_edit',
      aiReplyContent: this.toStringValue((response as { data?: unknown }).data),
      aiModelType: this.toStringValue(response.model) || body.model || 'step-1x-edit',
      responseTimeMs: elapsedMs,
    });

    return {
      ...response,
      sessionId,
    };
  }

  @Post('stepfun/images/generate')
  @ApiOperation({ summary: 'StepFun 文生图' })
  @ApiResponse({ status: 200, description: 'Success', type: StepfunImageGenerateResponseDto })
  async stepfunImageGenerate(
    @Body() body: StepfunImageGenerateRequestDto,
  ): Promise<StepfunImageGenerateResponseDto> {
    const sessionId = this.resolveSessionId(body.sessionId);
    const startTime = Date.now();
    const response = (await this.stepfunService.imageGenerate(body)) as Record<string, unknown>;
    const elapsedMs = Date.now() - startTime;

    await this.recordChatIfPossible({
      userId: body.userId,
      sessionId,
      userQueryContent: body.prompt || 'image_generate',
      aiReplyContent: this.toStringValue((response as { data?: unknown }).data),
      aiModelType: this.toStringValue(response.model) || body.model || 'step-1x-medium',
      responseTimeMs: elapsedMs,
    });

    return {
      ...response,
      sessionId,
    } as StepfunImageGenerateResponseDto;
  }

  @Post('kimi/multi-turn-chat')
  @ApiOperation({ summary: 'Kimi Multi-turn Chat (多轮对话)' })
  @ApiResponse({ status: 200, description: 'Success', type: MultiTurnChatResponseDto })
  async kimiMultiTurnChat(@Body() body: MultiTurnChatRequestDto): Promise<MultiTurnChatResponseDto> {
    const sessionId = this.resolveSessionId(body.sessionId);
    const startTime = Date.now();
    const { response, updatedHistory } = await this.kimiService.multiTurnChat(
      body.message,
      body.history || [],
      body.model || 'moonshot-v1-8k',
      body.systemPrompt
    );
    const elapsedMs = Date.now() - startTime;

    const result: MultiTurnChatResponseDto = {
      sessionId,
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
      sessionId,
      userQueryContent: body.message,
      aiReplyContent: result.reply,
      aiModelType: result.model || body.model || 'unknown',
      responseTimeMs: elapsedMs,
    });

    return result;
  }

  @Post('kimi/image-chat')
  @ApiOperation({ summary: 'Kimi 图片识别对话' })
  @ApiResponse({ status: 200, description: 'Success', type: KimiChatResponseDto })
  async kimiImageChat(@Body() body: KimiImageChatRequestDto): Promise<KimiChatResponseDto> {
    const sessionId = this.resolveSessionId(body.sessionId);
    const startTime = Date.now();
    const response = await this.kimiService.imageChatCompletion(body);
    const elapsedMs = Date.now() - startTime;

    await this.recordChatIfPossible({
      userId: body.userId,
      sessionId,
      userQueryContent: body.prompt,
      aiReplyContent: response.choices?.[0]?.message?.content ?? '',
      aiModelType: response.model || body.model || 'kimi-k2.5-turbo-preview',
      responseTimeMs: elapsedMs,
    });

    return {
      ...response,
      sessionId,
    };
  }

  @Post('kimi/image-chat-by-url')
  @ApiOperation({ summary: 'Kimi 图片 URL 识别对话（后端自动转 base64）' })
  @ApiResponse({ status: 200, description: 'Success', type: KimiChatResponseDto })
  async kimiImageChatByUrl(@Body() body: KimiImageUrlChatRequestDto): Promise<KimiChatResponseDto> {
    const sessionId = this.resolveSessionId(body.sessionId);
    const startTime = Date.now();
    const response = await this.kimiService.imageUrlChatCompletion(body);
    const elapsedMs = Date.now() - startTime;

    await this.recordChatIfPossible({
      userId: body.userId,
      sessionId,
      userQueryContent: body.prompt,
      aiReplyContent: response.choices?.[0]?.message?.content ?? '',
      aiModelType: response.model || body.model || 'kimi-k2.5-turbo-preview',
      responseTimeMs: elapsedMs,
    });

    return {
      ...response,
      sessionId,
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

  private resolveSessionId(sessionId?: string): string {
    const trimmed = sessionId?.trim();
    if (trimmed) {
      return trimmed;
    }
    return `session_${randomUUID()}`;
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

    const sessionId = payload.sessionId?.trim() || this.resolveSessionId();
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
