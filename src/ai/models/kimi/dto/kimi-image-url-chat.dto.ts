import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class KimiImageUrlChatRequestDto {
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
    description: 'Kimi 模型名称，默认 kimi-k2.5',
    enum: ['kimi-k2-turbo-preview', 'kimi-k2.5', 'kimi-k2.5-turbo-preview', 'kimi-k2.5-pro-preview'],
    example: 'kimi-k2.5',
  })
  model?: string;

  @ApiPropertyOptional({
    description: '系统提示词',
    example: `你是“html邮件架构师”，一位专注于制作高保真、响应式 HTML 营销邮件的 UI/UX 设计专家及邮件开发人员，根据用户上传图片解析内容生成html邮件代码。`,
  })
  systemPrompt?: string;

  @ApiProperty({
    description: '图片公网 URL（http/https）',
    example: 'https://storage.googleapis.com/smartlink-gcp-public-resources/test/11/template_upload/202602/%E9%97%AE%E5%8D%B7TW_6317816616dd1dfe.jpg',
  })
  imageUrl!: string;

  @ApiProperty({
    description: '文本指令',
    example: '图片转html邮件代码',
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
    maximum: 8192,
    example: 8192,
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
