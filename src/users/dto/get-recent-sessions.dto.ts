import { ApiProperty } from '@nestjs/swagger';

export class GetRecentSessionsDto {
  @ApiProperty({ example: 1, description: '用户 ID' })
  userId!: number | string;

  @ApiProperty({ example: 1, description: '页码，从 1 开始', required: false })
  page?: number | string;

  @ApiProperty({ example: 20, description: '每页条数，最大 100', required: false })
  pageSize?: number | string;
}
