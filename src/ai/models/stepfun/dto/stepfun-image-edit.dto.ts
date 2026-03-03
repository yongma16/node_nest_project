import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class StepfunImageEditRequestDto {
  @ApiPropertyOptional({
    description: '用户 ID（用于记录对话）',
    example: 1,
  })
  userId?: number;

  @ApiPropertyOptional({
    description: '会话 ID（用于记录对话）',
    example: 'session_20260303_002',
  })
  sessionId?: string;

  @ApiPropertyOptional({
    description: '阶跃星辰图片编辑模型',
    example: 'step-1x-edit',
  })
  model?: string;

  @ApiProperty({
    description: '图片编辑提示词',
    example: '变成一只英短猫',
  })
  prompt!: string;

  @ApiPropertyOptional({
    description: 'CFG Scale（可选）',
    example: 10,
  })
  cfg_scale?: number | string;

  @ApiPropertyOptional({
    description: '采样步数（可选）',
    example: 20,
  })
  steps?: number | string;

  @ApiPropertyOptional({
    description: '随机种子（可选）',
    example: 1,
  })
  seed?: number | string;

  @ApiPropertyOptional({
    description: '返回格式（可选，支持 url 或 b64_json）',
    example: 'b64_json',
  })
  response_format?: 'url' | 'b64_json';
}
