import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export type KimiMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

export class KimiChatRequestDto {
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
    description: 'Kimi 模型名称',
    enum: [
      'moonshot-v1-8k',
      'moonshot-v1-32k',
      'moonshot-v1-128k',
      'kimi-k2-turbo-preview',
      'kimi-k2.5-turbo-preview',
      'kimi-k2.5-pro-preview',
    ],
    example: 'kimi-k2-turbo-preview',
  })
  model: string;

  @ApiProperty({
    description: '聊天消息数组，支持多轮对话',
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
        role: 'system',
        content: '你是 Kimi，由 Moonshot AI 提供的人工智能助手',
      },
      {
        role: 'user',
        content: '你好，请介绍一下你自己',
      },
    ],
  })
  messages: KimiMessage[];

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
  max_tokens?: number;

  @ApiPropertyOptional({
    description: '是否使用流式响应',
    example: false,
  })
  stream?: boolean;

  @ApiPropertyOptional({
    description: 'Top-p 采样参数',
    minimum: 0,
    maximum: 1,
    example: 1,
  })
  top_p?: number;
}

export class KimiChatResponseDto {
  @ApiProperty({ description: '响应 ID' })
  id: string;

  @ApiProperty({ description: '对象类型' })
  object: string;

  @ApiProperty({ description: '创建时间戳' })
  created: number;

  @ApiProperty({ description: '使用的模型' })
  model: string;

  @ApiProperty({
    description: '选择结果',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        index: { type: 'number' },
        message: {
          type: 'object',
          properties: {
            role: { type: 'string' },
            content: { type: 'string' },
          },
        },
        finish_reason: { type: 'string' },
      },
    },
  })
  choices: Array<{
    index: number;
    message: KimiMessage;
    finish_reason: string;
  }>;

  @ApiProperty({
    description: 'Token 使用情况',
    type: 'object',
    properties: {
      prompt_tokens: { type: 'number' },
      completion_tokens: { type: 'number' },
      total_tokens: { type: 'number' },
    },
  })
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}
