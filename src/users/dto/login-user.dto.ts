import { ApiProperty } from '@nestjs/swagger';

export class LoginUserDto {
  @ApiProperty({ example: 'alice@example.com' })
  email!: string;

  @ApiProperty({ example: 'strong_password_123' })
  password!: string;
}
