import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { KimiMessage } from './kimi-chat.dto';

export class MultiTurnChatRequestDto {
  @ApiPropertyOptional({
    description: '用户 ID（用于记录对话）',
    example: 1,
  })
  userId?: number;

  @ApiPropertyOptional({
    description: '会话 ID（用于记录对话）',
    example: 'session_20260303_001',
  })
  sessionId?: string;

  @ApiProperty({
    description: '用户当前消息',
    example: '你好，我想了解一下人工智能的发展历史',
  })
  message: string;

  @ApiPropertyOptional({
    description: '对话历史记录',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        role: {
          type: 'string',
          enum: ['system', 'user', 'assistant'],
          description: '消息角色',
        },
        content: {
          type: 'string',
          description: '消息内容',
        },
      },
    },
    example: [
      {
        role: 'user',
        content: '你是谁？',
      },
      {
        role: 'assistant',
        content: '我是 Kimi，由 Moonshot AI 提供的人工智能助手。',
      },
    ],
  })
  history?: KimiMessage[];

  @ApiPropertyOptional({
    description: 'Kimi 模型名称',
    enum: [
      'moonshot-v1-8k',
      'moonshot-v1-32k',
      'moonshot-v1-128k',
      'kimi-k2-turbo-preview',
      'kimi-k2.5',
      'kimi-k2.5-turbo-preview',
      'kimi-k2.5-pro-preview',
    ],
    example: 'kimi-k2-turbo-preview',
  })
  model?: string;

  @ApiPropertyOptional({
    description: '系统提示词，用于设定 AI 的角色和行为',
    example: '你是一个专业的技术顾问，请用简洁明了的语言回答用户的技术问题。',
  })
  systemPrompt?: string;

  @ApiPropertyOptional({
    description: '温度参数，控制回复的随机性',
    minimum: 0,
    maximum: 1,
    example: 0.3,
  })
  temperature?: number;

  @ApiPropertyOptional({
    description: '最大生成 token 数',
    minimum: 1,
    maximum: 4096,
    example: 1024,
  })
  maxTokens?: number;
}

export class MultiTurnChatResponseDto {
  @ApiProperty({
    description: '会话 ID（未传时由后端自动生成）',
  })
  sessionId: string;

  @ApiProperty({
    description: 'AI 的回复内容',
  })
  reply: string;

  @ApiProperty({
    description: '更新后的对话历史',
    type: 'array',
  })
  history: KimiMessage[];

  @ApiProperty({
    description: 'Token 使用情况',
    type: 'object',
    properties: {
      promptTokens: { type: 'number', description: '输入 tokens' },
      completionTokens: { type: 'number', description: '输出 tokens' },
      totalTokens: { type: 'number', description: '总 tokens' },
    },
  })
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };

  @ApiProperty({
    description: '使用的模型',
  })
  model: string;

  @ApiProperty({
    description: '响应 ID',
  })
  responseId: string;
}
