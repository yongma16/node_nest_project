import { ApiProperty } from '@nestjs/swagger';

export class GetChatHistoryDto {
  @ApiProperty({ example: '1', description: '用户 ID', type: String })
  userId!: string;

  @ApiProperty({ example: 'session_20260303_001', description: '会话 ID' })
  sessionId!: string;

  @ApiProperty({ example: '1', description: '页码，从 1 开始', required: false, type: String })
  page?: string;

  @ApiProperty({ example: '20', description: '每页条数，最大 100', required: false, type: String })
  pageSize?: string;
}
