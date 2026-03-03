import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class StepfunImageGenerateRequestDto {
  @ApiPropertyOptional({
    description: '用户 ID（用于记录对话）',
    example: 1,
  })
  userId?: number;

  @ApiPropertyOptional({
    description: '会话 ID（用于记录对话）',
    example: 'session_20260303_004',
  })
  sessionId?: string;

  @ApiPropertyOptional({
    description: '阶跃星辰文生图模型',
    example: 'step-1x-medium',
  })
  model?: string;

  @ApiProperty({
    description: '文生图提示词',
    example: '采菊东篱下，悠然见南山',
  })
  prompt!: string;

  @ApiPropertyOptional({
    description: '返回格式（可选，支持 url 或 b64_json）',
    example: 'url',
  })
  response_format?: 'url' | 'b64_json';

  @ApiPropertyOptional({
    description: '图像尺寸',
    example: '1024x1024',
  })
  size?: string;

  @ApiPropertyOptional({
    description: '生成图片数量',
    example: 1,
  })
  n?: number | string;

  @ApiPropertyOptional({
    description: '采样步数（可选）',
    example: 100,
  })
  steps?: number | string;

  @ApiPropertyOptional({
    description: '随机种子（可选）',
    example: 0,
  })
  seed?: number | string;

  @ApiPropertyOptional({
    description: 'CFG Scale（可选）',
    example: 7.5,
  })
  cfg_scale?: number | string;

  @ApiPropertyOptional({
    description: 'StepFun 扩展参数（可选）',
    example: {
      steps: 100,
      seed: 0,
      cfg_scale: 7.5,
    },
  })
  extra_body?: Record<string, unknown>;
}
