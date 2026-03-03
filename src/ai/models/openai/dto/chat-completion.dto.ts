import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export type ChatCompletionMessage = {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string | Array<Record<string, unknown>>;
  [key: string]: unknown;
};

export class ChatCompletionRequestDto {
  @ApiPropertyOptional({
    description: '使用的模型名称',
    example: 'gpt-3.5-turbo',
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
        role: 'user',
        content: '你好，请介绍一下你自己',
      },
    ],
  })
  messages!: ChatCompletionMessage[];

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
