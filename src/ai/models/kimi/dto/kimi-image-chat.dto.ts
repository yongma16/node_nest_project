import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class KimiImageChatRequestDto {
  @ApiPropertyOptional({
    description: '用户 ID（用于记录对话）',
    example: 1,
  })
  userId?: number;

  @ApiPropertyOptional({
    description: '会话 ID（首次不传会由后端生成）',
    example: 'session_20260303_001',
  })
  sessionId?: string;

  @ApiPropertyOptional({
    description: 'Kimi 模型名称，默认 kimi-k2.5-turbo-preview',
    enum: ['kimi-k2-turbo-preview', 'kimi-k2.5', 'kimi-k2.5-turbo-preview', 'kimi-k2.5-pro-preview'],
    example: 'kimi-k2.5-turbo-preview',
  })
  model?: string;

  @ApiPropertyOptional({
    description: '系统提示词',
    example: '你是 Kimi。',
  })
  systemPrompt?: string;

  @ApiProperty({
    description: '图片的 base64 内容（不包含 data:image 前缀）',
    example: 'iVBORw0KGgoAAAANSUhEUgAA...',
  })
  imageBase64!: string;

  @ApiPropertyOptional({
    description: '图片 MIME 类型',
    example: 'image/png',
    default: 'image/png',
  })
  imageMimeType?: string;

  @ApiProperty({
    description: '文本指令',
    example: '请描述图片的内容。',
  })
  prompt!: string;

  @ApiPropertyOptional({
    description: '温度参数，控制回复随机性',
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
    description: 'Top-p 采样参数',
    minimum: 0,
    maximum: 1,
    example: 1,
  })
  top_p?: number;
}
