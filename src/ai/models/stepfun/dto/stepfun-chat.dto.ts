import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export type StepfunChatMessage = {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string | Array<Record<string, unknown>>;
  [key: string]: unknown;
};

export class StepfunChatRequestDto {
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

  @ApiPropertyOptional({
    description: '阶跃星辰模型名称',
    example: 'step-1-8k',
  })
  model?: string;

  @ApiProperty({
    description: '聊天消息数组',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        role: {
          type: 'string',
          enum: ['system', 'user', 'assistant', 'tool'],
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
        content: '你是由阶跃星辰提供的AI聊天助手。',
      },
      {
        role: 'user',
        content: '你好，请介绍一下阶跃星辰的人工智能!',
      },
    ],
  })
  messages!: StepfunChatMessage[];

  @ApiPropertyOptional({
    description: '温度参数，控制回复的随机性',
    minimum: 0,
    maximum: 2,
    example: 0.7,
  })
  temperature?: number;

  @ApiPropertyOptional({
    description: '是否使用流式响应',
    example: false,
  })
  stream?: boolean;

  [key: string]: unknown;
}
