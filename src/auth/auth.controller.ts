import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService, AccessTokenResponse } from './auth.service';
import { LoginUserDto } from '../users/dto/login-user.dto';
import { Public } from './decorators/public.decorator';

@ApiTags('Auth')
@Controller('v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @ApiOperation({ summary: '用户登录，返回 JWT token' })
  @ApiResponse({ status: 201, description: '登录成功，返回 access_token 与用户信息' })
  @ApiResponse({ status: 401, description: '邮箱或密码错误' })
  async login(@Body() body: LoginUserDto): Promise<AccessTokenResponse> {
    return this.authService.login(body);
  }
}
