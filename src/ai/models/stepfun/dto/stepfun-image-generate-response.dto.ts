import { ApiProperty } from '@nestjs/swagger';

export class StepfunImageGenerateItemDto {
  @ApiProperty({
    description: '生成图片地址',
    example: 'https://res.stepfun.com/images/xxxx.jpg',
  })
  url!: string;

  @ApiProperty({
    description: '生成结束原因',
    example: 'success',
  })
  finish_reason!: string;

  @ApiProperty({
    description: '随机种子',
    example: 1764275706,
  })
  seed!: number;
}

export class StepfunImageGenerateResponseDto {
  @ApiProperty({
    description: '请求 ID',
    example: '2bc5d605013969a6b79ab05b63934143.efa414e8fd5219a7a28c79d8504a9b81',
  })
  id!: string;

  @ApiProperty({
    description: '创建时间（Unix 时间戳）',
    example: 1723595647,
  })
  created!: number;

  @ApiProperty({
    description: '生成结果',
    type: [StepfunImageGenerateItemDto],
  })
  data!: StepfunImageGenerateItemDto[];

  @ApiProperty({
    description: '会话 ID（后端补充）',
    example: 'session_20260303_004',
  })
  sessionId!: string;
}
