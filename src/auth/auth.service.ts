import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { LoginUserDto } from '../users/dto/login-user.dto';

export interface JwtPayload {
  sub: number;
  email: string;
}

export interface AccessTokenResponse {
  access_token: string;
  user: {
    id: number;
    name: string;
    email: string;
    createdAt: Date;
    lastLoginAt: Date | null;
  };
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: LoginUserDto): Promise<AccessTokenResponse> {
    const user = await this.usersService.validateUser(dto.email, dto.password);
    if (!user) {
      throw new UnauthorizedException('邮箱或密码错误');
    }
    const payload: JwtPayload = { sub: user.id, email: user.email };
    const access_token = this.jwtService.sign(payload);
    return {
      access_token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
      },
    };
  }

  async validatePayload(payload: JwtPayload): Promise<{ id: number; email: string }> {
    return { id: payload.sub, email: payload.email };
  }
}
