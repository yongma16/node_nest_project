import { ApiProperty } from '@nestjs/swagger';

export class CreateChatRecordDto {
  @ApiProperty({ example: 1, description: '用户 ID' })
  userId!: number;

  @ApiProperty({
    example: 'session_20260303_001',
    description: '会话 ID，与 userId 一起用于多轮对话数据查找与 history 组装',
  })
  sessionId!: string;

  @ApiProperty({ example: '请帮我总结这段文本', description: '用户查询内容' })
  userQueryContent!: string;

  @ApiProperty({ example: '这是该文本的总结...', description: 'AI 回复内容' })
  aiReplyContent!: string;

  @ApiProperty({ example: 'gpt-4o-mini', description: 'AI 模型类型' })
  aiModelType!: string;

  @ApiProperty({ example: 842, description: '响应耗时（毫秒）' })
  responseTimeMs!: number;
}
